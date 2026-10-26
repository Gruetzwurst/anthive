"""A4/B1/B2 browser regression. Requires Firefox, Python 3 and installed npm packages.
Run: python3 scripts/check-economy-browser.py
Starts its own local Vite server; screenshots go to node_modules/.cache/.
"""
import base64
import json
import socket
import sys
import subprocess
import tempfile
import time
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'node_modules/.cache'
OUTPUT.mkdir(parents=True, exist_ok=True)


def free_port():
    with socket.socket() as connection:
        connection.bind(('127.0.0.1', 0))
        return connection.getsockname()[1]


vite_port, browser_port = free_port(), free_port()
server = subprocess.Popen([str(ROOT / 'node_modules/.bin/vite'), '--host', '127.0.0.1',
                           '--port', str(vite_port), '--strictPort'], cwd=ROOT,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
browser = None
try:
    with tempfile.TemporaryDirectory(prefix='anthive-a4-firefox-', dir=OUTPUT) as profile:
        # Expose touch hardware before Phaser performs its boot-time detection.
        Path(profile, 'user.js').write_text(
            f'user_pref("marionette.port", {browser_port});\n'
            'user_pref("dom.w3c_touch_events.enabled", 1);\n'
            'user_pref("dom.maxtouchpoints.testing.value", 1);\n')
        for _ in range(120):
            try:
                urlopen(f'http://127.0.0.1:{vite_port}/', timeout=1).close()
                break
            except OSError:
                time.sleep(0.1)
        else:
            raise RuntimeError('Local Vite server did not start')
        browser = subprocess.Popen(['firefox', '--headless', '--no-remote', '--marionette', '--profile', profile],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(120):
            try:
                connection = socket.create_connection(('127.0.0.1', browser_port), timeout=1)
                break
            except OSError:
                time.sleep(0.1)
        else:
            raise RuntimeError('Firefox automation did not start')
        connection.settimeout(60)

        def receive():
            size = b''
            while (part := connection.recv(1)) != b':':
                if not part:
                    raise RuntimeError('Firefox connection closed')
                size += part
            payload = b''
            while len(payload) < int(size):
                part = connection.recv(int(size) - len(payload))
                if not part:
                    raise RuntimeError('Firefox connection closed')
                payload += part
            return json.loads(payload)

        receive()
        request_id = 0

        def command(name, parameters):
            global request_id
            request_id += 1
            payload = json.dumps([0, request_id, name, parameters]).encode()
            connection.sendall(str(len(payload)).encode() + b':' + payload)
            response = receive()
            if response[2]:
                raise RuntimeError(response[2])
            return response[3]

        def page(code):
            # Execute in the actual page module context, not WebDriver's isolated
            # sandbox (which would import a different Phaser module instance).
            result = command('WebDriver:ExecuteAsyncScript', {'script': '''
              const done = arguments[arguments.length - 1];
              document.documentElement.removeAttribute('data-economy-test');
              const script = document.createElement('script');
              script.type = 'module';
              script.textContent = '(async () => { const scene = window.__anthiveTestScene; ' + arguments[0] +
                '\\n})().then(value => document.documentElement.setAttribute("data-economy-test", JSON.stringify({value})))' +
                '.catch(error => document.documentElement.setAttribute("data-economy-test", JSON.stringify({error:String(error)})));';
              document.head.append(script);
              const timer = setInterval(() => {
                const value = document.documentElement.getAttribute('data-economy-test');
                if (value) { clearInterval(timer); script.remove(); done(JSON.parse(value)); }
              }, 25);
            ''', 'args': [code], 'newSandbox': False, 'sandbox': 'default'})['value']
            if 'error' in result:
                raise RuntimeError(result['error'])
            return result.get('value')

        def hook():
            for _ in range(120):
                ready = command('WebDriver:ExecuteScript', {'script': "return performance.getEntriesByType('resource').some(e => e.name.includes('/deps/phaser.js')) && document.querySelectorAll('canvas').length > 0;", 'args': []})['value']
                if ready:
                    break
                time.sleep(0.1)
            else:
                diagnostic = command('WebDriver:ExecuteScript', {'script': 'return {url:location.href,canvas:document.querySelectorAll("canvas").length,phaser:performance.getEntriesByType("resource").filter(e=>e.name.includes("phaser")).map(e=>e.name),body:document.body.innerText.slice(0,2000)};', 'args': []})
                raise RuntimeError('Game did not load: ' + json.dumps(diagnostic))
            for _ in range(120):
                if page('''
              const url = performance.getEntriesByType('resource').filter(e => e.name.includes('/deps/phaser.js')).at(-1).name;
              const phaser = (await import(url)).default;
              const parents = phaser.Display.Canvas.CanvasPool.pool.map(entry => entry.parent);
              const found = parents.find(parent => parent?.scene?.gathering)?.scene
                || parents.find(parent => parent?.scene?.getScene)?.scene.getScene('WorldScene');
              if (!found?.economyHud) return false;
              window.__anthiveTestScene = found;
              return true;
            '''):
                    return True
                time.sleep(0.1)
            raise RuntimeError('HUD did not finish scene creation')

        def click(x, y, move=None, touch=False):
            bounds = command('WebDriver:ExecuteScript', {'script': "const r = document.querySelector('#game canvas').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height};", 'args': []})['value']
            def point(px, py):
                return {'type': 'pointerMove', 'duration': 0, 'origin': 'viewport',
                        'x': round(bounds['x'] + px * bounds['w'] / 640),
                        'y': round(bounds['y'] + py * bounds['h'] / 360)}
            actions = [point(x, y), {'type': 'pointerDown', 'button': 0}]
            if move:
                actions.append(point(*move))
            actions.append({'type': 'pointerUp', 'button': 0})
            command('WebDriver:PerformActions', {'actions': [{'type': 'pointer', 'id': 'test-pointer',
                    'parameters': {'pointerType': 'touch' if touch else 'mouse'}, 'actions': actions}]})
            command('WebDriver:ReleaseActions', {})

        def native_click(selector):
            result = command('WebDriver:FindElement', {'using': 'css selector', 'value': selector})['value']
            element_id = result.get('element-6066-11e4-a52e-4f735466cecf') or result['ELEMENT']
            command('WebDriver:ElementClick', {'id': element_id})

        def assign_group(specialization, source, target, count):
            click(586, 20)
            assert page('return document.querySelector("#workforce-panel").open;')
            page("""
              const form = document.querySelector('#workforce-panel form');
              for (const [name,value] of Object.entries(""" + json.dumps({'specialization': specialization, 'from': source, 'to': target, 'count': str(count)}) + """)) {
                form.elements.namedItem(name).value = value;
                form.elements.namedItem(name).dispatchEvent(new Event('change', {bubbles:true}));
              }
              return true;
            """)
            native_click('#workforce-panel button[type="submit"]')

        def screenshot(name):
            result = command('WebDriver:TakeScreenshot', {'full': False})
            path = OUTPUT / name
            path.write_bytes(base64.b64decode(result['value']))
            print(path)

        def check_layout():
            return page('''
              scene.updateEconomyHud();
              const hud = scene.economyHud;
              for (const object of [hud.header, hud.food, hud.water, hud.material, hud.foodSource, hud.waterSource, hud.warning]) {
                const rect = object.getBounds();
                if (rect.x < 8 || rect.right > 632 || rect.y < 6 || rect.bottom > 110) throw Error('HUD overflow: ' + object.text);
              }
              return {priority:scene.gathering.gathering.priority, drag:scene.dragMode,
                camera:[scene.cameras.main.scrollX,scene.cameras.main.scrollY], orders:scene.excavation.getOrders().length};
            ''')

        command('WebDriver:NewSession', {})
        command('WebDriver:SetTimeouts', {'script': 60000})
        command('WebDriver:SetWindowRect', {'width': 1280, 'height': 800})
        command('WebDriver:Navigate', {'url': f'http://127.0.0.1:{vite_port}/'})
        hook()
        assert page('return !!document.querySelector("#construction-panel");'), 'B3 construction controls missing'
        # B3: real controls, combined rectangle/brush, explicit confirmation,
        # remote planning, pause/resume, map details and a later connecting tunnel.
        def start_plan(kind, touch=False):
            click(510, 20, touch=touch)
            assert page('return document.querySelector("#construction-panel").open;')
            page("document.querySelector('#construction-panel [name=chamberType]').value=" + json.dumps(kind) + "; return true;")
            native_click('[data-action="draw-plan"]')
            assert page('return !document.querySelector("#construction-draft").hidden;')

        def draw_cells(start, end, tool, touch=False):
            page("const el=document.querySelector('[name=draftTool]'); el.value=" + json.dumps(tool) + "; el.dispatchEvent(new Event('change',{bubbles:true})); return true;")
            coordinates=page("const cells="+json.dumps([start,end])+"; return cells.map(([column,row])=>[(column+.5)*24-scene.cameras.main.scrollX,(row+.5)*24-scene.cameras.main.scrollY]);")
            click(*coordinates[0], move=coordinates[1], touch=touch)

        def pointer_path(points, touch=False):
            bounds=command('WebDriver:ExecuteScript', {'script': "const r=document.querySelector('#game canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};", 'args': []})['value']
            def point(value):
                x,y=value
                return {'type':'pointerMove','duration':25,'origin':'viewport','x':round(bounds['x']+x*bounds['w']/640),'y':round(bounds['y']+y*bounds['h']/360)}
            actions=[point(points[0]),{'type':'pointerDown','button':0},*[point(value) for value in points[1:]],{'type':'pointerUp','button':0}]
            command('WebDriver:PerformActions', {'actions':[{'type':'pointer','id':'test-pointer','parameters':{'pointerType':'touch' if touch else 'mouse'},'actions':actions}]})
            command('WebDriver:ReleaseActions', {})

        def check_construction_touch():
            command('WebDriver:SetWindowRect', {'width': 844, 'height': 480})
            page('scene.cameras.main.centerOn(155*24,38*24); window.__b3TouchCount=scene.excavation.getConstructionOrders().length; return true;')
            time.sleep(.2)
            start_plan('water', touch=True)
            draw_cells([154,37],[156,38],'rectangle', touch=True)
            assert page('return scene.draftCells.length;') == 6
            assert page('return scene.input.manager.activePointer.wasTouch;')
            native_click('[data-action="confirm-plan"]')
            assert page("const plans=scene.excavation.getConstructionOrders(); return plans.length===window.__b3TouchCount+1 && plans.at(-1).type==='water';")
            page("const dialog=document.querySelector('#construction-panel'); dialog.scrollTop=dialog.scrollHeight; return true;")
            screenshot('anthive-b3-mobile-details.png')
            native_click('[data-action="cancel-order"]')
            native_click('[data-action="close-construction"]')
            print('PASS: B3 real touch rectangle, confirmation, scrollable details and cancellation')

        if '--furnishing-only' in sys.argv:
            assert page("return scene.excavation.materials.balance.initial===24 && scene.gathering.resources.getStore('building-material-store').amount===24;")
            page('scene.cameras.main.centerOn(150*24,28*24); return true;')
            time.sleep(.1)
            start_plan('food')
            draw_cells([148,27],[151,29],'rectangle')
            native_click('[data-action="confirm-plan"]')
            native_click('[data-action="close-construction"]')
            progress=page("""
              for(let i=0;i<2000 && scene.excavation.getBuilders().filter(w=>w.job?.kind==='dig').length<2;i++)scene.update(0,100);
              const workers=scene.excavation.getBuilders().filter(w=>w.job?.kind==='dig');
              if(workers.length!==2 || new Set(workers.map(w=>JSON.stringify(w.job.target))).size!==2)throw Error('Parallel front reservation failed');
              for(let i=0;i<3000 && scene.excavation.getConstructionOrders()[0].materialUsed===0;i++)scene.update(0,100);
              scene.updateEconomyHud();
              if(scene.excavation.getConstructionOrders()[0].materialUsed===0)throw Error('No real furnishing');
              return {parallelBuilders:workers.length,used:scene.excavation.getConstructionOrders()[0].materialUsed};
            """)
            click(510,20)
            native_click('[data-action="pause-order"]')
            page('for(let i=0;i<50;i++)scene.update(0,100);window.__b4Paused=scene.excavation.getConstructionOrders()[0].materialUsed;for(let i=0;i<100;i++)scene.update(0,100);return true;')
            assert page('return scene.excavation.getConstructionOrders()[0].materialUsed===window.__b4Paused;')
            screenshot('anthive-b4-partial-furnishing.png')
            native_click('[data-action="resume-order"]')
            native_click('[data-action="close-construction"]')
            balance=page("""
              for(let i=0;i<4000 && scene.excavation.getConstructionOrders()[0].status!=='furnished';i++)scene.update(0,100);
              for(let i=0;i<200;i++)scene.update(0,100);
              const o=scene.excavation.getConstructionOrders()[0],b=scene.excavation.materials.balance;
              if(o.status!=='furnished'||o.materialUsed!==24||b.consumed!==24)throw Error('Furnishing did not complete with real consumption');
              if(Math.abs(b.initial+b.produced-b.stored-b.ground-b.carried-b.atSites-b.consumed)>1e-8)throw Error('B4 conservation failed');
              if(scene.gathering.resources.getStoreTotals('food').capacity!==540 || scene.gathering.getWorkers().length!==9)throw Error('Unexpected capacity or worker change');
              scene.updateEconomyHud();return b;
            """)
            print(json.dumps({'b4':progress,'balance':balance}))
            command('WebDriver:SetWindowRect', {'width':844,'height':480})
            for _ in range(50):
                if page('const r=scene.game.canvas.getBoundingClientRect();return innerWidth<=844 && r.right<=844 && Math.abs(scene.scale.canvasBounds.width-r.width)<1;'):
                    break
                time.sleep(.1)
            else:
                raise AssertionError('Canvas resize did not settle')
            click(510,20)
            page("const d=document.querySelector('#construction-panel');d.scrollTop=d.scrollHeight;return true;")
            assert '24 / 24' in page("return document.querySelector('[data-role=construction-detail]').textContent;")
            screenshot('anthive-b4-complete-mobile.png')
            native_click('[data-action="close-construction"]')
            command('WebDriver:Navigate', {'url':f'http://127.0.0.1:{vite_port}/?view=pond'})
            hook();check_layout();screenshot('anthive-b4-pond.png')
            command('Marionette:Quit', {'flags':['eForceQuit']});browser.wait(timeout=10);browser=None
            print('PASS: B4 initial24, parallel front, real furnishing, pause/resume, conserved material, mobile details and pond')
            sys.exit(0)

        page("window.__b3Camera=[scene.cameras.main.scrollX,scene.cameras.main.scrollY]; scene.cameras.main.centerOn(150*24,38*24); return true;")
        time.sleep(.1)
        start_plan('tunnel')
        backtrack_points=page('return [[150,38],[153,38],[150,38],[150,41]].map(([column,row])=>[(column+.5)*24-scene.cameras.main.scrollX,(row+.5)*24-scene.cameras.main.scrollY]);')
        pointer_path(backtrack_points)
        brush_correct=page("const expected=['150,38','151,38','152,38','153,38','150,39','150,40','150,41'].sort();const actual=scene.draftCells.map(c=>`${c.column},${c.row}`).sort();return JSON.stringify(actual)===JSON.stringify(expected);")
        native_click('[data-action="discard-plan"]')
        start_plan('food')
        draw_cells([148,37],[150,39],'rectangle')
        draw_cells([150,39],[153,39],'brush')
        assert page('return scene.draftCells.length;') == 12
        assert page('return scene.excavation.getConstructionOrders().length;') == 0
        native_click('[data-action="confirm-plan"]')
        assert page("const o=scene.excavation.getConstructionOrders()[0]; window.__b3First=o.id; return o.type==='food' && o.total===12 && o.status==='blocked' && o.materialRequired===24;")
        assert '24 benötigt' in page("return document.querySelector('[data-role=construction-detail]').textContent;")
        native_click('[data-action="pause-order"]')
        assert page('return scene.excavation.getConstructionOrders()[0].paused;')
        native_click('[data-action="resume-order"]')
        assert not page('return scene.excavation.getConstructionOrders()[0].paused;')
        screenshot('anthive-b3-plan-details.png')
        native_click('[data-action="close-construction"]')
        coordinates=page('return [(149.5)*24-scene.cameras.main.scrollX,(38.5)*24-scene.cameras.main.scrollY];')
        click(*coordinates)
        assert page('return document.querySelector("#construction-panel").open;')
        native_click('[data-action="close-construction"]')
        pan_origin=page('return {x:scene.cameras.main.scrollX,y:scene.cameras.main.scrollY};')
        pointer_path([[coordinates[0]+step,coordinates[1]] for step in range(25)])
        pan_correct=not page('return document.querySelector("#construction-panel").open;')
        assert page('return scene.cameras.main.scrollX;') != pan_origin['x'], 'Slow pan fixture must actually move camera'
        if not pan_correct:
            native_click('[data-action="close-construction"]')
        page('scene.cameras.main.setScroll('+str(pan_origin['x'])+','+str(pan_origin['y'])+'); return true;')
        if not brush_correct or not pan_correct:
            raise AssertionError(json.dumps({'backtrackingBrushCorrect':brush_correct,'slowPanWithoutDialog':pan_correct}))
        start_plan('tunnel')
        draw_cells([148,35],[148,36],'brush')
        native_click('[data-action="confirm-plan"]')
        native_click('[data-action="close-construction"]')
        print(json.dumps({'b3':page("""
          for(let i=0;i<2400 && scene.excavation.getConstructionOrders()[0].excavated<1;i++)scene.update(0,100);
          const plans=scene.excavation.getConstructionOrders();
          if(plans[0].excavated<1 || plans[1].status!=='completed')throw Error('B3 actual tunnel did not unlock earlier chamber');
          if(scene.gathering.resources.getStoreTotals('food').capacity!==540)throw Error('Unfurnished chamber granted capacity');
          scene.updateEconomyHud();return plans.map(o=>({id:o.id,type:o.type,status:o.status,excavated:o.excavated}));
        """)}))
        click(*coordinates)
        native_click('[data-action="cancel-order"]')
        assert page('return scene.excavation.getConstructionOrders()[0].status;') == 'cancelled'
        screenshot('anthive-b3-cancelled.png')
        native_click('[data-action="close-construction"]')
        start_plan('tunnel')
        draw_cells([151,37],[152,37],'brush')
        native_click('[data-action="discard-plan"]')
        assert page('return scene.excavation.getConstructionOrders().length;') == 2
        page('scene.cameras.main.setScroll(...window.__b3Camera); return true;')
        time.sleep(.1)
        if '--construction-only' in sys.argv:
            check_construction_touch()
            command('Marionette:Quit', {'flags': ['eForceQuit']})
            browser.wait(timeout=10)
            browser = None
            print('PASS: focused B3 desktop and touch planning')
            sys.exit(0)
        before = check_layout()
        for priority, x in [('water', 536), ('food', 214), ('balanced', 375)]:
            click(x, 80)
            after = check_layout()
            assert after['priority'] == priority, after
            assert after['drag'] == 'none' and after['orders'] == before['orders']
            assert after['camera'] == before['camera']
            assert page(f"return scene.economyHud.buttons.find(button => button.priority === '{priority}').body.fillColor;") == 0xb99d65
        click(20, 20, move=(90, 28))
        assert check_layout()['camera'] == before['camera']
        values = page('''
          for (let frame = 0; frame < 2400; frame++) scene.update(0, 50);
          const food = scene.gathering.resources.getStoreTotals('food').amount;
          const water = scene.gathering.resources.getStoreTotals('water').amount;
          if (!(food > 0 && water > 0)) throw Error('Missing actual deliveries');
          scene.previewCells = [{column:150,row:26},{column:150,row:27}];
          scene.commitDigOrder();
          for (let frame = 0; frame < 500; frame++) scene.update(0,50);
          if (scene.gathering.resources.getStoreTotals('buildingMaterial').amount < 1) throw Error('Existing digging/delivery failed');
          scene.updateEconomyHud();
          if (!scene.economyHud.material.text.includes(String(scene.gathering.resources.getStoreTotals('buildingMaterial').amount))) throw Error('Stale material HUD');
          return {food,water,material:scene.gathering.resources.getStoreTotals('buildingMaterial').amount};
        ''')
        print(json.dumps(values))
        check_layout()
        screenshot('anthive-a4-desktop.png')
        # B1: actual UI submission, cargo-safe reassignment, identity and speed.
        page("""
          for (let frame = 0; frame < 2400 && !scene.gathering.gathering.getCollectors().find(worker => worker.id === 'collector-0' && worker.load); frame++) scene.update(0,50);
          if (!scene.gathering.gathering.getCollectors().find(worker => worker.id === 'collector-0' && worker.load)) throw Error('Carrier setup failed');
          return true;
        """)
        assign_group('gathering', 'gathering', 'building', 1)
        assert page("return scene.gathering.getWorkers().find(worker => worker.id === 'collector-0').pending;")
        screenshot('anthive-b1-group-transfer.png')
        native_click('[data-action="close-workforce"]')
        page("""
          for (let frame = 0; frame < 2400; frame++) scene.update(0,50);
          const moved = scene.gathering.getWorkers().find(worker => worker.id === 'collector-0');
          if (moved.specialization !== 'gathering' || moved.actualWork !== 'building' || moved.pending) throw Error('Group transfer failed');
          const ids = [...scene.ants.map(worker=>worker.id), ...scene.builderWorkers.map(worker=>worker.id)];
          if (ids.length !== 9 || new Set(ids).size !== 9) throw Error('Missing/duplicated visible workers');
          return true;
        """)
        assign_group('building', 'building', 'rest', 2)
        native_click('[data-action="close-workforce"]')
        for _ in range(3):
            click(560, 339)
        progress = page("""
          scene.previewCells = [{column:150,row:27},{column:150,row:28}]; scene.commitDigOrder();
          for (let frame = 0; frame < 2000 && scene.excavation.getBuilders().find(worker=>worker.id==='collector-0')?.job?.phase !== 'digging'; frame++) scene.update(0,50);
          const worker = scene.excavation.getBuilders().find(worker=>worker.id==='collector-0');
          if (!worker?.job || worker.job.phase !== 'digging' || scene.builderWorkers.length !== 1) throw Error('Foreign dig setup failed');
          const before = worker.job.progress; scene.update(0,100);
          const progress = (scene.excavation.getBuilders().find(worker=>worker.id==='collector-0').job.progress - before) * 1000;
          if (Math.abs(progress - 50) > .001) throw Error('Foreign builder must work at 50%, got ' + progress);
          for (let frame = 0; frame < 2000 && scene.excavation.getBuilders().find(worker=>worker.id==='collector-0')?.job; frame++) scene.update(0,50);
          if (scene.excavation.getBuilders().find(worker=>worker.id==='collector-0')?.job || scene.gathering.resources.getStoreTotals('buildingMaterial').amount < 2) throw Error('Foreign builder did not deliver existing material');
          return {foreignDigProgress:progress,material:scene.gathering.resources.getStoreTotals('buildingMaterial').amount};
        """)
        print(json.dumps(progress))
        assign_group('gathering', 'building', 'care', 1)
        assert page("return scene.gathering.getWorkers().find(worker=>worker.id==='collector-0').resting;")
        screenshot('anthive-b1-groups-rest.png')
        native_click('[data-action="close-workforce"]')
        assign_group('gathering', 'care', 'gathering', 1)
        native_click('[data-action="close-workforce"]')
        assign_group('building', 'rest', 'building', 2)
        native_click('[data-action="close-workforce"]')
        assert page('return scene.gathering.workforce.getWorkers().length;') == 9
        material_balance = page("""
          const resources = scene.gathering.resources;
          const store = resources.stores.get('building-material-store');
          const capacity = store.capacity;
          store.capacity = store.amount;
          if (!(store.capacity > 0)) throw Error('Full-store test setup has no real stock');
          const before = scene.excavation.materials.balance;
          scene.previewCells = [{column:150,row:28},{column:149,row:28},{column:148,row:28},{column:147,row:28}];
          scene.commitDigOrder();
          if (!scene.excavation.getOrders().length) throw Error('Full-store fixture must target solid earth');
          for (let frame=0; frame<2400 && scene.excavation.materials.balance.produced < before.produced+3; frame++) scene.update(0,50);
          let balance = scene.excavation.materials.balance;
          if (balance.produced < before.produced+3 || balance.ground < 3 || store.amount !== store.capacity) throw Error('Full store incorrectly stopped digging or lost ground material: ' + JSON.stringify({before,balance,store,builders:scene.excavation.getBuilders(),orders:scene.excavation.getOrders(),workers:scene.gathering.getWorkers()}));
          window.__anthiveFullStoreCapacity = capacity;
          return balance;
        """)
        print(json.dumps({'fullStoreBalance': material_balance}))
        screenshot('anthive-b2-full-store-ground.png')
        material_balance = page("""
          const store = scene.gathering.resources.stores.get('building-material-store');
          scene.excavation.materials.consumeFromStore(store.id, store.amount);
          store.capacity = window.__anthiveFullStoreCapacity;
          for(let frame=0;frame<2400 && (scene.excavation.materials.balance.ground>0 || scene.excavation.materials.balance.carried>0);frame++) scene.update(0,50);
          const b=scene.excavation.materials.balance;
          if(b.ground>0 || b.carried>0 || Math.abs(b.initial+b.produced-b.stored-b.consumed)>1e-8) throw Error('Material cleanup/conservation failed');
          scene.updateEconomyHud();
          return b;
        """)
        print(json.dumps({'afterCleanupBalance': material_balance}))


        page('''
          for (const store of scene.gathering.resources.listStores()) if (store.resource !== 'buildingMaterial') scene.gathering.resources.takeFromStore(store.id, store.amount);
          scene.gathering.supply.advance(6.1, {activeWorkers:9,restingWorkers:0,queens:1});
          scene.updateEconomyHud();
          if (!scene.economyHud.warning.text.includes('Verlustrisiko')) throw Error('Missing late shortage warning');
          return true;
        ''')
        check_layout()
        command('WebDriver:SetWindowRect', {'width': 844, 'height': 480})
        time.sleep(0.2)
        assert page('return scene.game.device.input.touch && scene.input.manager.touch?.enabled;'), 'Firefox must emulate touch hardware before game boot'
        click(536, 80, touch=True)
        assert check_layout()['priority'] == 'water'
        assert page('return scene.input.manager.activePointer.wasTouch;'), 'Touch must reach Phaser directly'
        screenshot('anthive-a4-mobile-landscape.png')
        click(586, 20, touch=True)
        # Wait for the observable dialog state after synthetic touch dispatch.
        for _ in range(50):
            if page('return document.querySelector("#workforce-panel").open;'):
                break
            time.sleep(0.1)
        else:
            raise AssertionError('Touch did not open the workforce dialog')
        screenshot('anthive-b1-mobile-groups.png')
        native_click('[data-action="close-workforce"]')
        check_construction_touch()
        command('WebDriver:Navigate', {'url': f'http://127.0.0.1:{vite_port}/?view=pond'})
        hook()
        check_layout()
        screenshot('anthive-a4-pond.png')
        command('Marionette:Quit', {'flags': ['eForceQuit']})
        browser.wait(timeout=10)
        browser = None
        print('PASS: B3 real combined tools, confirmation, pause/resume, FIFO connection, details, cancellation, discard; A4/B1/B2 priorities, groups, physical transfer, 50% digging, full-store continuation, ground cleanup, conserved material, rest, warnings, pond')
finally:
    if browser is not None:
        browser.terminate()
        browser.wait(timeout=10)
    server.terminate()
    server.wait(timeout=10)
