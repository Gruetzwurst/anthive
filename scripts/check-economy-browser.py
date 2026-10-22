"""A4/B1/B2 browser regression. Requires Firefox, Python 3 and installed npm packages.
Run: python3 scripts/check-economy-browser.py
Starts its own local Vite server; screenshots go to node_modules/.cache/.
"""
import base64
import json
import socket
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
        Path(profile, 'user.js').write_text(f'user_pref("marionette.port", {browser_port});\n')
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
        click(536, 80, touch=True)
        assert check_layout()['priority'] == 'water'
        screenshot('anthive-a4-mobile-landscape.png')
        click(586, 20, touch=True)
        assert page('return document.querySelector("#workforce-panel").open;')
        screenshot('anthive-b1-mobile-groups.png')
        native_click('[data-action="close-workforce"]')
        command('WebDriver:Navigate', {'url': f'http://127.0.0.1:{vite_port}/?view=pond'})
        hook()
        check_layout()
        screenshot('anthive-a4-pond.png')
        command('Marionette:Quit', {'flags': ['eForceQuit']})
        browser.wait(timeout=10)
        browser = None
        print('PASS: A4/B1/B2 priorities, groups, physical transfer, 50% digging, full-store continuation, ground cleanup, conserved material, rest, warnings, pond')
finally:
    if browser is not None:
        browser.terminate()
        browser.wait(timeout=10)
    server.terminate()
    server.wait(timeout=10)
