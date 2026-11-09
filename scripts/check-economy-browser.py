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
browser_log = None
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
        browser_log = (OUTPUT / 'anthive-firefox.log').open('w')
        browser = subprocess.Popen(['firefox', '--headless', '--no-remote', '--marionette', '--profile', profile],
                                   stdout=browser_log, stderr=subprocess.STDOUT)
        for _ in range(120):
            try:
                connection = socket.create_connection(('127.0.0.1', browser_port), timeout=1)
                break
            except OSError:
                time.sleep(0.1)
        else:
            raise RuntimeError('Firefox automation did not start; see node_modules/.cache/anthive-firefox.log')
        connection.settimeout(75)  # Allow WebDriver's60s script timeout to report a structured error first.

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
              const menuRoot=document.querySelector('#colony-menu');
              if(menuRoot){
                const form=document.querySelector('#new-colony-form');
                if(form){form.querySelector('input').value='Browserprüfung';form.requestSubmit();}
                else document.querySelector('#new-colony')?.click();
                return false;
              }
              const url = performance.getEntriesByType('resource').filter(e => e.name.includes('/deps/phaser.js')).at(-1).name;
              const phaser = (await import(url)).default;
              const parents = phaser.Display.Canvas.CanvasPool.pool.map(entry => entry.parent);
              const found = parents.find(parent => parent?.scene?.gathering)?.scene
                || parents.find(parent => parent?.scene?.getScene)?.scene.getScene('WorldScene');
              if(window.__anthiveErrors?.length)throw Error(window.__anthiveErrors.join(" | "));
              if (!found?.economyHud || !found.sys.isActive()) return false;
              window.__anthiveTestScene = found;
              return true;
            '''):
                    return True
                time.sleep(0.1)
            diagnostic=command('WebDriver:ExecuteScript', {'script':'return {errors:window.__anthiveErrors,body:document.body.innerText.slice(0,1200)};','args':[]})
            raise RuntimeError('HUD did not finish scene creation: '+json.dumps(diagnostic))

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

        def finish_focused():
            global browser
            command('Marionette:Quit', {'flags': ['eForceQuit']})
            browser.wait(timeout=10)
            browser = None

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
        if '--menu-only' not in sys.argv and '--import-ui-only' not in sys.argv:
            hook()
        if '--performance-only' in sys.argv:
            profile_workers=int(next((arg.split('=',1)[1] for arg in sys.argv if arg.startswith('--performance-workers=')),'47'))
            result=page("""
              await scene.persistenceReady;scene.gathering.clock.setPaused(true);
              const g=scene.gathering,engines=g.exportWorkforceState();
              for(let i=g.getWorkers().length;i<PROFILE_WORKERS;i++){
                const id=`profile-${i}`;const collectors=PROFILE_WORKERS>=150?Math.min(200,Math.floor(PROFILE_WORKERS*.4)):PROFILE_WORKERS;
                const kind=i<collectors?'gathering':i<collectors+20?'care':i<collectors+40?'building':'combat';g.workforce.addWorker(id,kind);
                engines.states.set(id,{engine:'parked',position:{...scene.saveSession.world.landmarks.nestChamberCenter}});
              }
              g.restoreWorkforceState(engines);g.clock.setPaused(false);
              const start=performance.now();for(let i=0;i<60;i++)g.advance(1/60);
              const simulationMs=(performance.now()-start)/60;g.clock.setPaused(true);scene.update(0,16);scene.updateEconomyHud();
              const graphics=scene.children.list.filter(o=>Array.isArray(o.commandBuffer));
              const largest=graphics.reduce((a,b)=>a.commandBuffer.length>b.commandBuffer.length?a:b);
              const samples=[];
              for(const zoom of [1,2])for(const hidden of [false,true]){
                scene.setWorldZoom(zoom);largest.setVisible(!hidden);
                const renderer=scene.game.renderer;
                const times=[];for(let i=0;i<12;i++){
                  const t=performance.now();renderer.preRender();scene.sys.render(renderer);renderer.postRender();
                  times.push(performance.now()-t);
                }
                times.sort((a,b)=>a-b);samples.push({zoom,hideLargest:hidden,medianMs:times[6],
                  terrainCommands:graphics.filter(o=>o.depth===0&&o.willRender(scene.cameras.main)).reduce((n,o)=>n+o.commandBuffer.length,0)});
              }
              largest.setVisible(true);
              const camera=scene.cameras.main,origin={x:camera.scrollX,y:camera.scrollY},visits=[];
              for(const point of [{x:scene.saveSession.world.dimensions.columns*24-640,y:scene.saveSession.world.dimensions.rows*24-360},origin]){
                camera.setScroll(point.x,point.y);camera.preRender();
                const renderer=scene.game.renderer;renderer.preRender();scene.sys.render(renderer);renderer.postRender();
                visits.push(graphics.filter(o=>o.depth===0&&o.willRender(camera)).reduce((n,o)=>n+o.commandBuffer.length,0));
              }
              return {workers:g.getWorkers().length,antBodyCount:scene.ants.length,antCommands:scene.ants.reduce((n,a)=>n+(a.body.list[0]?.commandBuffer?.length??0),0),renderer:scene.game.renderer.type,simulationMs,
                graphics:graphics.map(o=>({commands:o.commandBuffer.length,depth:o.depth})).sort((a,b)=>b.commands-a.commands).slice(0,4),samples,visits};
            """.replace('PROFILE_WORKERS',str(profile_workers)))
            print('Performance:',json.dumps(result))
            screenshot('anthive-performance-zoom.png')
            if '--ant-cache-regression' in sys.argv:
                assert result['antBodyCount'] >= profile_workers-40, 'Workers disappeared instead of being rendered'
                assert result['antCommands'] < 1000, 'Identical ant vector bodies still replay thousands of commands per frame'
            if '--performance-regression' in sys.argv:
                near=next(s for s in result['samples'] if s['zoom']==2 and not s['hideLargest'])
                assert near['terrainCommands'] < 50000, 'Offscreen terrain still replays the entire world at close zoom'
                assert all(0 < n < 50000 for n in result['visits']), 'Terrain must render when visiting distant chunks and returning'
            finish_focused()
            raise SystemExit(0)
        if '--menu-only' in sys.argv:
            def menu_ready():
                for _ in range(160):
                    if command('WebDriver:ExecuteScript', {'script':'return document.querySelector("#colony-menu")?.dataset.ready==="true";', 'args':[]})['value']:
                        return
                    time.sleep(.1)
                raise RuntimeError('Main menu did not appear')
            menu_ready()
            assert page('return !document.querySelector("#continue-colony") || document.querySelector("#continue-colony").disabled;')
            native_click('#new-colony')
            page('document.querySelector("#colony-name").value="Alpha";document.querySelector("#new-colony-form").requestSubmit();return true;')
            hook()
            saved=page("""
              await scene.persistenceReady;scene.gathering.clock.setPaused(true);
              scene.gathering.resources.depositInStore('water-store',{resource:'water',amount:7});
              scene.gathering.restoreProgression({highestPopulation:150});scene.saveSession.syncConstruction();scene.diggingGrade=2;scene.updateUpgradeLabel();
              await scene.persistence.manual();
              const s=scene.saveSession;
              const expected={id:s.id,count:s.simulation.getWorkers().length,water:s.simulation.resources.getStore('water-store').amount};
              sessionStorage.setItem('anthive-menu-expected',JSON.stringify(expected));return expected;
            """)
            click(120,19)
            menu_ready()
            command('WebDriver:Refresh', {})
            menu_ready()
            assert page('return !document.querySelector("#continue-colony").disabled && document.querySelector("#colony-menu").textContent.includes("Alpha");')
            native_click('#continue-colony')
            hook()
            resumed=page("""
              await scene.persistenceReady;
              const e=JSON.parse(sessionStorage.getItem('anthive-menu-expected'));
              if(scene.saveSession.id!==e.id||scene.gathering.getWorkers().length!==e.count||scene.gathering.resources.getStore('water-store').amount!==e.water)throw Error('resume changed colony');
              if(scene.diggingGrade!==2||!scene.upgradeButton.text.endsWith('Lehm'))throw Error('loaded digging grade label incorrect');
              return {id:scene.saveSession.id,count:scene.gathering.getWorkers().length};
            """)
            click(120,19)
            menu_ready()
            native_click('#manage-colonies')
            screenshot('anthive-d1-colony-menu.png')
            def wait_dom(script):
                for _ in range(120):
                    if command('WebDriver:ExecuteScript', {'script':script,'args':[]})['value']:
                        return
                    time.sleep(.1)
                raise RuntimeError('Menu condition failed: '+script)
            alpha=saved['id']
            row=f'[data-colony-id="{alpha}"]'
            native_click(row+' .colony-actions button:nth-child(2)')
            page('document.querySelector("#rename-colony-form input").value="Alpha Neu";document.querySelector("#rename-colony-form").requestSubmit();return true;')
            wait_dom('return document.querySelector(".colony-choice strong")?.textContent==="Alpha Neu";')
            native_click('#colony-menu .colony-menu-content > button')
            native_click('#new-colony')
            page('window.__anthiveErrors=[];window.addEventListener("error",e=>window.__anthiveErrors.push(e.message));document.querySelector("#colony-name").value="Beta";document.querySelector("#new-colony-form").requestSubmit();return true;')
            hook()
            beta=page('await scene.persistenceReady;scene.gathering.clock.setPaused(true);return scene.saveSession.id;')
            assert beta!=alpha
            click(120,19)
            menu_ready()
            native_click('#manage-colonies')
            assert page('return [...document.querySelectorAll(".colony-choice strong")].map(x=>x.textContent);')==['Beta','Alpha Neu']
            screenshot('anthive-d1-colonies-desktop.png')
            native_click(row+' .colony-actions button:nth-child(5)')
            assert page('return document.querySelector("#delete-colony-panel").dataset.stage;')=='offer'
            native_click('#delete-colony-panel button:last-child')
            assert page('return document.querySelectorAll(".colony-row").length;')==2
            native_click(row+' .colony-actions button:nth-child(5)')
            page('window.__anchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__exportName=this.download;window.__exportPayload=fetch(this.href).then(r=>r.text());};return true;')
            native_click('#delete-colony-panel button:first-of-type')
            wait_dom('return document.querySelector("#delete-colony-panel").dataset.stage==="confirm";')
            assert page("""
              HTMLAnchorElement.prototype.click=window.__anchorClick;
              const {parseColony}=await import('/src/game/persistence/colonySession.ts');
              const save=parseColony(await window.__exportPayload);
              return save.name==='Alpha Neu'&&save.id==="""+json.dumps(alpha)+"""&&window.__exportName.endsWith('.anthive.json');
            """)
            native_click('#delete-colony-panel button:last-child')
            assert page('return document.querySelectorAll(".colony-row").length;')==2
            native_click(row+' .colony-actions button:nth-child(5)')
            page('window.__originalObjectURL=URL.createObjectURL;URL.createObjectURL=()=>{throw Error("Exporttest fehlgeschlagen");};return true;')
            native_click('#delete-colony-panel button:first-of-type')
            wait_dom('return document.querySelector(".colony-menu-status").textContent.includes("Exporttest");')
            assert page('return document.querySelector("#delete-colony-panel").dataset.stage;')=='offer'
            page('URL.createObjectURL=window.__originalObjectURL;return true;')
            native_click('#delete-colony-panel button:last-child')
            native_click(row+' .colony-actions button:nth-child(5)')
            native_click('#delete-colony-panel button:nth-of-type(2)')
            assert page('return document.querySelector("#delete-colony-panel").dataset.stage;')=='confirm'
            native_click('#delete-colony-panel button:last-child')
            assert page('return document.querySelectorAll(".colony-row").length;')==2
            native_click(row+' .colony-actions button:nth-child(5)')
            native_click('#delete-colony-panel button:nth-of-type(2)')
            native_click('#delete-colony-panel button:first-of-type')
            wait_dom('return document.querySelectorAll(".colony-row").length===1;')
            assert page('return document.querySelector(".colony-choice strong").textContent;')=='Beta'
            command('WebDriver:SetWindowRect', {'width':800,'height':500})
            screenshot('anthive-d1-colonies-small.png')
            # Corrupt the remaining main save. Menu must offer no silent restart.
            page("""
              const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('anthive-colonies-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
              const id="""+json.dumps(beta)+""";
              await new Promise((resolve,reject)=>{const tx=db.transaction('colonies','readwrite'),store=tx.objectStore('colonies'),r=store.get(id);r.onsuccess=()=>{const row=r.result;row.payload='broken';store.put(row);};tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();return true;
            """)
            command('WebDriver:Refresh', {})
            menu_ready()
            assert page('return document.querySelector("#continue-colony").disabled && document.querySelector(".colony-menu-status").textContent.includes("nicht nutzbar");')
            native_click('#manage-colonies')
            native_click('.colony-row .colony-actions button:nth-child(5)')
            native_click('#delete-colony-panel button:nth-of-type(2)')
            native_click('#delete-colony-panel button:first-of-type')
            wait_dom('return !document.querySelector(".colony-row");')
            native_click('#colony-menu .colony-menu-content > button')
            assert page('return document.querySelector("#continue-colony").disabled;')
            print('D1 menu:',saved,resumed,{'rename':True,'twoColonies':True,'deleteCancel':True,'exportFailure':True,'confirmedDelete':True,'corruptSave':True})
            finish_focused()
            raise SystemExit(0)
        if '--import-ui-only' in sys.argv:
            def wait_ui(script):
                for _ in range(150):
                    if command('WebDriver:ExecuteScript', {'script':script,'args':[]})['value']:
                        return
                    time.sleep(.1)
                raise RuntimeError('Import UI condition failed: '+script)
            wait_ui('return document.querySelector("#colony-menu")?.dataset.ready==="true";')
            page("""
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {createColonySession,serializeColony}=await import('/src/game/persistence/colonySession.ts');
              const repo=new ColonyRepository();
              const a=createColonySession({id:'ui-target',name:'Alpha'});a.simulation.advance(10);a.persistenceTiming.activeSeconds=900;await repo.save(a,{backupSlot:1});
              sessionStorage.setItem('anthive-ui-import',serializeColony(await repo.readBackup(a.id,1)));
              a.simulation.advance(20);a.persistenceTiming.activeSeconds=1200;await repo.save(a);await repo.markPlayed(a.id);
              const b=createColonySession({id:'ui-other',name:'Beta'});b.simulation.advance(70);await repo.save(b,{backupSlot:2});
              await repo.close();return true;
            """)
            command('WebDriver:Refresh', {})
            wait_ui('return document.querySelector("#colony-menu")?.dataset.ready==="true";')
            native_click('#import-colony')
            page("""
              const input=document.querySelector('#colony-import-file'),dt=new DataTransfer();dt.items.add(new File(['{broken'],'kaputt.json',{type:'application/json'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true;
            """)
            wait_ui('return document.querySelector(".colony-menu-status").classList.contains("error");')
            assert not page('return !!document.querySelector("#import-colony-form");')
            native_click('#import-file-panel button:last-child')
            def upload():
                native_click('#import-colony')
                page("""
                  const input=document.querySelector('#colony-import-file'),dt=new DataTransfer();dt.items.add(new File([sessionStorage.getItem('anthive-ui-import')],'Alpha.anthive.json',{type:'application/json'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true;
                """)
                wait_ui('return !!document.querySelector("#import-colony-form");')
            upload()
            assert page('return document.querySelector("[name=importMode][value=new]").checked && document.querySelector("#import-colony-form [name=name]").value==="Alpha (Import)";')
            page('document.querySelector("#import-colony-form").requestSubmit();return true;')
            wait_ui('return document.querySelectorAll(".colony-row").length===3;')
            target='[data-colony-id="ui-target"]'
            native_click(target+' .colony-actions button:nth-child(4)')
            wait_ui('return !!document.querySelector("#colony-backups");')
            native_click('[data-backup-slot="1"] button:first-of-type')
            wait_ui('return !!document.querySelector("#restore-colony-panel");')
            assert page("const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');const r=new ColonyRepository();const s=await r.load('ui-target');await r.close();return s.simulation.clock.exportState().elapsedSeconds===30;")
            native_click('#restore-colony-panel button:last-child')
            wait_ui('return !!document.querySelector("#colony-backups");')
            native_click('[data-backup-slot="1"] button:first-of-type')
            wait_ui('return !!document.querySelector("#restore-colony-panel");')
            native_click('#restore-colony-panel button:first-of-type')
            wait_ui('return document.querySelectorAll(".colony-row").length===3;')
            assert page("const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');const r=new ColonyRepository();const s=await r.load('ui-target'),copies=await r.listRecoveryCopies('ui-target');await r.close();return s.simulation.clock.exportState().elapsedSeconds===10&&copies.length===1;")
            native_click(target+' .colony-actions button:nth-child(4)')
            wait_ui('return !!document.querySelector("[data-recovery-id]");')
            native_click('[data-recovery-id] button:first-of-type')
            wait_ui('return !!document.querySelector("#restore-colony-panel");')
            native_click('#restore-colony-panel button:first-of-type')
            wait_ui('return document.querySelectorAll(".colony-row").length===3;')
            native_click('#colony-menu .colony-menu-content > button')
            upload()
            native_click('[name=importMode][value=replace]')
            page('const f=document.querySelector("#import-colony-form");f.elements.target.value="ui-other";f.requestSubmit();return true;')
            wait_ui('return !!document.querySelector("#replace-colony-panel");')
            native_click('#replace-colony-panel button:last-child')
            assert page('return document.querySelector("[name=importMode][value=new]").checked;')
            native_click('[name=importMode][value=replace]')
            page('const f=document.querySelector("#import-colony-form");f.elements.target.value="ui-other";f.requestSubmit();return true;')
            wait_ui('return !!document.querySelector("#replace-colony-panel");')
            page("window.__idbAdd=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(...args){const r=window.__idbAdd.apply(this,args);if(this.name==='recoveryCopies')this.transaction.abort();return r;};return true;")
            native_click('#replace-colony-panel button:nth-of-type(2)')
            wait_ui('return !!document.querySelector("[data-storage-actions]");')
            assert page("IDBObjectStore.prototype.add=window.__idbAdd;const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');const r=new ColonyRepository();const s=await r.load('ui-other');await r.close();return s.name==='Beta'&&s.simulation.clock.exportState().elapsedSeconds===70;")
            native_click('#replace-colony-panel button:nth-of-type(2)')
            wait_ui('return document.querySelectorAll(".colony-row").length===3;')
            assert page("const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');const r=new ColonyRepository();const s=await r.load('ui-other'),copies=await r.listRecoveryCopies('ui-other'),backups=await r.listBackups('ui-other');await r.close();return s.name==='Alpha'&&s.simulation.clock.exportState().elapsedSeconds===10&&copies.length===1&&backups.length===0;")
            native_click('[data-colony-id="ui-other"] .colony-actions button:nth-child(4)')
            wait_ui('return !!document.querySelector("[data-recovery-id]");')
            screenshot('anthive-d1-restore-copies.png')
            print('D1 import UI:',{'invalidFile':True,'newImport':True,'nameConflict':True,'restoreCancel':True,'restore':True,'protectionRestore':True,'replaceCancel':True,'copyFailure':True,'explicitReplace':True})
            finish_focused()
            raise SystemExit(0)
        if '--save-failure-only' in sys.argv:
            result=page("""
              await scene.persistenceReady;scene.gathering.clock.setPaused(true);
              scene.gathering.resources.depositInStore('water-store',{resource:'water',amount:7});
              const put=IDBObjectStore.prototype.put;
              IDBObjectStore.prototype.put=function(...args){const r=put.apply(this,args);if(this.name==='metadata')this.transaction.abort();return r;};
              try{await scene.persistence.manual();}catch{}finally{IDBObjectStore.prototype.put=put;}
              if(!document.querySelector('#save-error-dialog')?.open)throw Error('current unsaved state has no export action');
              window.__anchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__emergencyPayload=fetch(this.href).then(r=>r.text());};
              return true;
            """)
            native_click('#save-error-dialog [data-action="export-current"]')
            exported=page("""
              HTMLAnchorElement.prototype.click=window.__anchorClick;
              const {parseColony}=await import('/src/game/persistence/colonySession.ts');
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const save=parseColony(await window.__emergencyPayload),repo=new ColonyRepository();
              const before=await repo.load(scene.saveSession.id);await repo.close();
              if(save.state.resources.stores.get('water-store').amount!==scene.gathering.resources.getStore('water-store').amount||before.simulation.resources.getStore('water-store').amount===save.state.resources.stores.get('water-store').amount)throw Error('emergency export did not include unsaved progress');
              return {currentExported:true,oldMainPreserved:true};
            """)
            native_click('#save-error-dialog [data-action="retry-save"]')
            for _ in range(100):
                if page('return !document.querySelector("#save-error-dialog").open;'):
                    break
                time.sleep(.1)
            else:
                raise RuntimeError('Save retry did not succeed')
            print('D1 save failure:',exported,{'retry':True})
            finish_focused()
            raise SystemExit(0)
        if '--royal-only' in sys.argv or '--royal-lifecycle-only' in sys.argv:
            print('Royal: scene hooked',flush=True)
            page("await Promise.race([scene.persistenceReady,new Promise((_,reject)=>setTimeout(()=>reject(Error('persistence readiness timed out')),5000))]);return true;")
            print('Royal: persistence ready',flush=True)
            ready=page("""
              await scene.persistenceReady;scene.gathering.clock.setPaused(true);scene.updateConstruction();scene.constructionPanel.open();
              const type=document.querySelector('[name=chamberType]');if(!type.querySelector('[value=queen]').disabled)throw Error('queen option unlocked too soon');
              scene.gathering.restoreProgression({highestPopulation:50});scene.update(0,0);scene.updateConstruction();
              if(type.querySelector('[value=queen]').disabled)throw Error('queen option did not unlock');
              type.value='queen';type.dispatchEvent(new Event('change',{bubbles:true}));const size=document.querySelector('[name=chamberSize]');
              size.value='small';size.dispatchEvent(new Event('change',{bubbles:true}));
              if(!size.selectedOptions[0].textContent.includes('11×4')||!size.querySelector('[value=medium]').disabled)throw Error('queen template options incorrect');
              const {squareTemplate}=await import('/src/game/simulation/constructionPlanning.ts');let cells;
              for(const column of [100,80,60,40,200,220]){const candidate=squareTemplate('queen','small',{column,row:28});if(scene.excavation.validateOrder(candidate,'queen').valid){cells=candidate;break;}}
              if(!cells)throw Error('queen test site missing');window.__royalCells=cells;
              document.querySelector('#construction-panel form').requestSubmit();scene.setWorldZoom(1);
              scene.cameras.main.centerOn((cells[0].column+.5)*24,(cells[0].row+.5)*24);scene.cameras.main.preRender();return true;
            """)
            click(320,180)
            assert page('return scene.draftCells.length===44;')
            native_click('[data-action=confirm-plan]')
            result=page("""
              const a=scene.saveSession,e=a.excavation,w=a.world,cells=window.__royalCells;
              if(e.getConstructionOrders().length!==1||e.getConstructionOrders()[0].type!=='queen'||e.queenSlotsAvailable!==0)throw Error('queen plan did not reserve slot');
              a.syncConstruction();if(a.royal.getEggs().length)throw Error('egg before furnishing');
              let col=Math.floor(w.landmarks.nestChamberCenter.x/24),row=Math.floor(w.landmarks.nestChamberCenter.y/24);
              while(col!==cells[0].column){w.tiles[row][col].state='open';col+=Math.sign(cells[0].column-col);}while(row!==cells[0].row){w.tiles[row][col].state='open';row+=Math.sign(cells[0].row-row);}
              for(const c of cells)w.tiles[c.row][c.column].state='open';a.simulation.traffic.invalidateTopology();
              const pile=e.materials.produce(w.landmarks.buildingMaterialStoreCenter,132);
              while(e.materials.getGround().some(p=>p.id===pile)){e.materials.pickUp(pile,'builder-0',5);e.materials.deposit('builder-0','building-material-store');}
              for(let n=0;n<20000&&e.getConstructionOrders()[0].status!=='furnished';n++)e.advance(.25);
              if(e.getConstructionOrders()[0].status!=='furnished'||e.materials.balance.consumed!==132)throw Error('queen room was not physically furnished');
              a.syncConstruction();if(a.royal.getEggs().length!==1)throw Error('special egg missing/duplicated');
              for(let n=0;n<2000&&!a.simulation.broodSupply.getNurses().some(n=>n.eggId?.startsWith('royal-'));n++)a.simulation.broodSupply.advanceWorkers(.05);
              if(!a.simulation.broodSupply.getNurses().some(n=>n.eggId?.startsWith('royal-')))throw Error('nurse never picked up royal egg');
              scene.update(0,0); // Flush construction notices exactly as the normal frame loop does before the checkpoint.
              await scene.persistence.manual();const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');const repo=new ColonyRepository(),b=await repo.load(a.id);
              const left=JSON.parse(serializeColony(captureColony(a))),right=JSON.parse(serializeColony(captureColony(b)));
              const diff=(a,b,path='')=>{if(Object.is(a,b))return null;if(!a||!b||typeof a!=='object'||typeof b!=='object')return path;for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const d=diff(a[k],b[k],path+'.'+k);if(d)return d;}return null;};
              const mismatch=diff(left,right);if(mismatch)throw Error('royal carrier changed after load: '+mismatch);
              for(let n=0;n<4000&&!b.royal.getEggs()[0].arrived;n++)b.simulation.broodSupply.advanceWorkers(.05);
              if(!b.royal.getEggs()[0].arrived)throw Error('royal delivery did not resume');
              for(let n=0;n<4000&&!a.royal.getEggs()[0].arrived;n++)a.simulation.broodSupply.advanceWorkers(.05);
              scene.renderBrood(100);scene.updateConstruction();scene.constructionPanel.open();scene.constructionPanel.selectOrder(e.getConstructionOrders()[0].id);
              await scene.persistence.manual();const last=await repo.load(a.id);if(last.royal.getEggs().length!==1||!last.royal.getEggs()[0].arrived)throw Error('royal egg duplicated after arrival reload');
              await repo.close();return {unlock:true,template44:true,slotReserved:true,material132:true,sourceEgg:true,realCarrier:true,activeReload:true,arrivalReload:true};
            """)
            if '--royal-lifecycle-only' in sys.argv:
                lifecycle=page("""
                  const a=scene.saveSession,g=a.simulation,q=g.queen,b=g.broodSupply;
                  for(const k of ['food','water'])g.resources.depositInStore(`${k}-store`,{resource:k,amount:100});
                  const advance=days=>{q.advance(days,0,q.snapshot.chambers,1,d=>{for(const loss of b.consume(d,q.getLarvalRooms()))q.loseLarvae(loss.roomId,loss.count);},b);b.syncRooms(q.getLarvalRooms());};
                  advance(.2);if(a.royal.getEggs()[0].stage!=='larva')throw Error('royal egg did not develop after2min');
                  for(let i=0;i<5000;i++)b.advanceWorkers(.1);
                  const r=b.getRooms().find(r=>r.royal);if(!r||r.food.amount<.6||r.water.amount<.6)throw Error('no real royal larval deliveries');
                  advance(.6);if(a.royal.getEggs()[0].stage!=='pupa')throw Error('royal larva did not develop after6min');
                  advance(.4);if(q.queenCount!==2||g.getProgression().population!==g.workforce.size+2)throw Error('new adult queen missing/not counted');
                  a.syncConstruction();for(let i=0;i<5000;i++)b.advanceWorkers(.1);
                  q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(.2,1,q.snapshot.chambers,1);
                  const egg=q.snapshot.eggs.find(e=>e.sourceQueenId!=='queen-1');
                  if(!egg||JSON.stringify(egg.origin)!==JSON.stringify(a.royal.getEggs()[0].position))throw Error('new queen did not lay in own chamber');
                  for(let i=0;i<10000&&!q.snapshot.eggs.find(e=>e.id===egg.id).arrived;i++)b.advanceWorkers(.1);
                  if(!q.snapshot.eggs.find(e=>e.id===egg.id).arrived)throw Error('new queen normal egg not physically delivered');
                  scene.renderBrood(100);scene.updateConstruction();scene.updateEconomyHud();scene.update(0,0);
                  if(!document.querySelector('[data-role=queen-summary]').textContent.includes('Königinnen: 2'))throw Error('queen summary missing');
                  const labels=scene.broodRenderer.queenLabels;
                  if(labels.size!==2)throw Error('missing per-queen countdown labels');
                  for(const queen of q.snapshot.queens){const label=labels.get(queen.id);if(!label||!label.text.startsWith('Nächstes Ei ')||label.x!==queen.position.x-108||label.y!==queen.position.y+28)throw Error('queen countdown not at own chamber');}

                  const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
                  const {captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');
                  await scene.persistence.manual();const repo=new ColonyRepository(),loaded=await repo.load(a.id);
                  if(loaded.simulation.queen.queenCount!==2||loaded.royal.getEggs()[0].stage!=='adult')throw Error('adult queen reload lost');
                  const check=JSON.parse(serializeColony(captureColony(loaded))),live=JSON.parse(serializeColony(captureColony(a)));
                  if(JSON.stringify(check)!==JSON.stringify(live))throw Error('adult queen continuation checkpoint changed');
                  await repo.close();return {phases2_6_4:true,realLarvalDelivery:true,adultCount:true,ownSource:true,normalEggTransport:true,adultReload:true,queenHud:true,individualCountdowns:true};
                """)
                print('D2 royal lifecycle:',lifecycle,flush=True)
            screenshot('anthive-d2-royal-room.png')
            print('D2 royal:',result)
            finish_focused()
            raise SystemExit(0)
        if '--care-only' in sys.argv:
            result=page("""
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');
              await scene.persistenceReady;const a=scene.saveSession,g=a.simulation;g.clock.setPaused(true);
              g.restoreProgression({highestPopulation:500});scene.update(0,0);scene.updateEconomyHud();scene.workforcePanel.open();
              const summary=document.querySelector('[data-role=workforce-summary]').textContent,queenSummary=document.querySelector('[data-role=queen-summary]').textContent;
              if(!summary.includes('Brutversorgung: 12 Einheiten · 78 px/s')||!queenSummary.includes('Pflegerin: 15 Plätze')||!queenSummary.includes('fachfremde Hilfe: 7,5 Plätze'))throw Error('developed care values missing');
              scene.workforcePanel.dialog.close();
              const state=g.queen.exportState(),room=[...state.rooms.values()].find(r=>r.specialization==='gathering');
              state.eggs=Array.from({length:18},(_,i)=>({id:`egg-${i+1}`,sourceQueenId:'queen-1',targetSpecialization:'gathering',chamberId:room.id,stage:'larva',stageProgressDays:0,arrived:true,carrierId:null,carried:false,origin:{...a.world.landmarks.queenChamberCenter}}));
              g.queen.restoreState(state);g.broodSupply.syncRooms(g.queen.getLarvalRooms());
              for(const resource of ['food','water'])g.resources.depositInStore(`${resource}-store`,{resource,amount:100});
              g.clock.setPaused(false);for(let i=0;i<2000&&!g.broodSupply.getNurses().some(n=>(n.load?.amount??0)>5);i++)g.advance(.05);g.clock.setPaused(true);
              if(!g.broodSupply.getNurses().some(n=>(n.load?.amount??0)>5)||g.queen.snapshot.careCapacity!==15)throw Error('care transport or capacity incorrect');
              g.moveWorkers('building','building','care',1);g.clock.setPaused(false);g.advance(.01);g.clock.setPaused(true);
              if(g.queen.snapshot.careCapacity!==22.5)throw Error('foreign care was not half performance');
              await scene.persistence.manual();const repo=new ColonyRepository(),b=await repo.load(a.id);
              if(serializeColony(captureColony(a))!==serializeColony(captureColony(b)))throw Error('active care changed on reload');
              a.simulation.clock.setPaused(false);b.simulation.clock.setPaused(false);a.simulation.advance(.25);b.simulation.advance(.25);a.simulation.clock.setPaused(true);b.simulation.clock.setPaused(true);
              if(serializeColony(captureColony(a))!==serializeColony(captureColony(b)))throw Error('care diverged after reload');
              const profile=captureColony(a).state.queen;
              if(JSON.stringify(profile.broodConfig.stageDays)!==JSON.stringify({egg:.1,larva:.3,pupa:.2})||profile.config.eggsPerGameDay!==5)throw Error('brood/laying duration changed');
              await repo.close();return {careStats:true,realCargo:true,noExtraCredit:true,foreignHalf:true,activeReload:true,identicalContinuation:true,broodUnchanged:true};
            """)
            print('D2 care:',result)
            finish_focused()
            raise SystemExit(0)
        if '--collectors-only' in sys.argv:
            result=page("""
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');
              await scene.persistenceReady;const a=scene.saveSession,g=a.simulation;g.clock.setPaused(true);
              g.restoreProgression({highestPopulation:500});scene.update(0,0);scene.updateEconomyHud();scene.workforcePanel.open();
              if(!document.querySelector('[data-role=workforce-summary]').textContent.includes('Sammlerinnen: 15 Einheiten · 105 px/s'))throw Error('collector stats missing');
              scene.workforcePanel.dialog.close();g.clock.setPaused(false);
              for(let n=0;n<2000&&!g.gathering.getCollectors().some(w=>(w.load?.amount??0)>5);n++)g.advance(.05);
              g.clock.setPaused(true);if(!g.gathering.getCollectors().some(w=>(w.load?.amount??0)>5))throw Error('no developed live cargo');
              g.moveWorkers('building','building','gathering',1);g.clock.setPaused(false);g.advance(.01);g.clock.setPaused(true);
              const foreign=[...g.gathering.exportState().workers.values()].find(w=>w.id.startsWith('builder'));
              if(!foreign||foreign.efficiency!==.5||g.gathering.carryCapacity!==15)throw Error('foreign collector penalty incorrect');
              await scene.persistence.manual();const repo=new ColonyRepository(),b=await repo.load(a.id);
              if(serializeColony(captureColony(a))!==serializeColony(captureColony(b)))throw Error('developed cargo changed on reload');
              a.simulation.clock.setPaused(false);b.simulation.clock.setPaused(false);a.simulation.advance(.25);b.simulation.advance(.25);
              a.simulation.clock.setPaused(true);b.simulation.clock.setPaused(true);
              if(serializeColony(captureColony(a))!==serializeColony(captureColony(b)))throw Error('developed transport diverged after reload');
              await repo.close();return {statsVisible:true,developedCargo:true,foreignHalf:true,activeReload:true,identicalContinuation:true};
            """)
            print('D2 collectors:',result)
            finish_focused()
            raise SystemExit(0)
        if '--builders-only' in sys.argv:
            result=page("""
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');
              await scene.persistenceReady;scene.gathering.clock.setPaused(true);
              if(scene.diggingGrade!==0||!scene.upgradeButton.text.endsWith('Oberboden')||scene.upgradeButton.input)throw Error('prototype grade switch remains');
              const a=scene.saveSession,w=a.world,q=w.landmarks.queenChamberCenter,col=Math.floor(q.x/24),row=Math.floor(q.y/24);let target;
              for(let r=row-5;r<=row+5&&!target;r++)for(let c=col-7;c<=col+7;c++){
                const t=w.tiles[r]?.[c];if(t?.terrain==='topsoil'&&t.state!=='open'&&[[c-1,r],[c+1,r],[c,r-1],[c,r+1]].some(([x,y])=>w.tiles[y]?.[x]?.state==='open')){target={column:c,row:r};break;}
              }
              if(!target)throw Error('test site missing');w.tiles[target.row][target.column].terrain='compactEarth';scene.excavation.addOrder([target]);scene.excavation.advance(1);
              if(scene.excavation.getConstructionOrders()[0].blockReason!=='hardness')throw Error('locked terrain was dug');
              scene.gathering.restoreProgression({highestPopulation:50});scene.update(0,0);
              if(!scene.upgradeButton.text.endsWith('Kompakte Erde'))throw Error('stage label did not update');
              for(let n=0;n<1000&&!scene.excavation.getBuilders().some(b=>b.job?.phase==='digging'&&b.job.progress>0);n++)scene.excavation.advance(.02);
              const progress=scene.excavation.getConstructionOrders()[0].partialDigSeconds;if(!(progress>0))throw Error('unlocked work did not start');
              scene.gathering.restoreProgression({highestPopulation:150});scene.update(0,0);
              if(scene.excavation.getConstructionOrders()[0].partialDigSeconds!==progress||!scene.upgradeButton.text.endsWith('Lehm'))throw Error('upgrade lost running work');
              await scene.persistence.manual();const repo=new ColonyRepository(),b=await repo.load(a.id);
              if(serializeColony(captureColony(b))!==serializeColony(captureColony(a)))throw Error('running work changed on reload');
              a.excavation.advance(.5);b.excavation.advance(.5);
              if(serializeColony(captureColony(b))!==serializeColony(captureColony(a)))throw Error('running work diverged after reload');
              scene.gathering.restoreProgression({highestPopulation:500});scene.update(0,0);await scene.persistence.manual();
              const last=await repo.load(a.id);if(last.excavation.diggingGrade!==4||!scene.upgradeButton.text.endsWith('Tiefengestein'))throw Error('deep rock stage lost');
              await repo.close();return {terrainLocked:true,automaticStages:true,partialWorkKept:true,activeJobReload:true,deepRockSaved:true,noTestSwitch:true};
            """)
            print('D2 builders:',result)
            finish_focused()
            raise SystemExit(0)
        if '--progression-only' in sys.argv:
            result=page("""
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {createColonySession,captureColony}=await import('/src/game/persistence/colonySession.ts');
              function population(session,count){
                const s=session.simulation,e=s.exportWorkforceState();
                for(const w of s.workforce.getWorkers())if(w.id.startsWith('progress-')){s.workforce.removeWorker(w.id);e.states.delete(w.id);}
                for(let i=s.workforce.size;i<count;i++){
                  const id=`progress-${i}`;s.workforce.addWorker(id,'combat');e.states.set(id,{engine:'parked',position:{...session.world.landmarks.nestChamberCenter}});
                }
                s.restoreWorkforceState(e);
              }
              await scene.persistenceReady;scene.gathering.clock.setPaused(true);
              population(scene.saveSession,49);scene.updateEconomyHud();scene.workforcePanel.open();
              const text=document.querySelector('[data-role=workforce-summary]').textContent;
              if(!text.includes('Kolonie 50 (inkl. Königin)')||!text.includes('Höchststand 50')||!text.includes('Entwicklungsstufe 1/4'))throw Error('progress UI missing: '+text);
              await scene.persistence.manual();scene.workforcePanel.dialog.close();
              const liveRepo=new ColonyRepository(),reloaded=await liveRepo.load(scene.saveSession.id);
              if(reloaded.simulation.getProgression().highestPopulation!==50)throw Error('live save lost milestone');await liveRepo.close();
              const repo=new ColonyRepository('anthive-progress-test'),a=createColonySession({id:'progress-a',name:'A'});
              await repo.save(a,{backupSlot:1});const early=await repo.readBackup(a.id,1);
              population(a,49);a.simulation.getProgression();population(a,10);await repo.save(a);
              await repo.restoreBackup(a.id,1,a.revision,()=>true);
              let loaded=await repo.load(a.id);if(loaded.simulation.getProgression().highestPopulation!==50)throw Error('backup lost peak');
              const raw=await new Promise((resolve,reject)=>{const r=indexedDB.open('anthive-progress-test');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
              const row=await repo.readRow(a.id);
              await new Promise((resolve,reject)=>{const tx=raw.transaction('colonies','readwrite');tx.objectStore('colonies').put({...row,payload:'broken'});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});raw.close();
              await repo.restoreBackup(a.id,1,loaded.revision,()=>true);loaded=await repo.load(a.id);
              if(loaded.simulation.getProgression().highestPopulation!==50)throw Error('corrupt main restore lost durable peak');
              const imported=await repo.importNew(early,'Imported');
              if((await repo.load(imported.id)).simulation.getProgression().highestPopulation!==11)throw Error('import inherited unrelated peak');
              await repo.replaceImported(a.id,early,loaded.revision,()=>true);
              if((await repo.load(a.id)).simulation.getProgression().highestPopulation!==11)throw Error('replacement did not take source history');
              await repo.close();return {ui:true,liveReload:true,backupKeepsPeak:true,corruptMainKeepsPeak:true,importIsolated:true,replacementUsesSource:true};
            """)
            print('D2 progression:',result)
            finish_focused()
            raise SystemExit(0)
        if '--migration-only' in sys.argv:
            migration_code="""
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {createColonySession,captureColony}=await import('/src/game/persistence/colonySession.ts');
              const results=[];for(const oldSchema of SCHEMA_VERSIONS){
              const databaseName='anthive-migration-test-'+oldSchema;
              const a=createColonySession({id:'legacy',name:'Alter Stand'});a.simulation.advance(130);
              const {withoutQueenFeeding}=await import('/tests/helpers/legacyQueenSupply.mjs');const old=withoutQueenFeeding(captureColony(a));old.schemaVersion=oldSchema;if(oldSchema<7){delete old.state.royal;delete old.state.construction.minimumAreas.queen;}if(oldSchema<8){delete old.state.queen.additionalQueens;for(const e of [...old.state.queen.eggs,...old.state.queen.buffer])delete e.sourceQueenId;}if(oldSchema<8)for(const r of old.state.broodSupply.rooms.values())delete r.royal;
              if(oldSchema<6){delete old.state.queen.developmentLevel;delete old.state.broodSupply.developmentLevel;}else{old.state.queen.developmentLevel=4;old.state.broodSupply.developmentLevel=4;}
              if(oldSchema<5)delete old.state.gathering.developmentLevel;else old.state.gathering.developmentLevel=4;
              if(oldSchema<4)delete old.state.construction.developmentLevel;
              if(old.schemaVersion<3)delete old.state.progression;else{old.state.progression.highestPopulation=500;old.state.construction.grade=oldSchema>=4?4:3;if(oldSchema>=4)old.state.construction.developmentLevel=4;}
              if(old.schemaVersion===1)delete old.encoding;old.revision=1;
              const payload=JSON.stringify(old,(_k,v)=>v instanceof Map?{$map:[...v]}:v instanceof Set?{$set:[...v]}:v);
              const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)),checksum=[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
              const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(databaseName,1);r.onupgradeneeded=()=>r.result.createObjectStore('colonies',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
              const savedAt=new Date().toISOString();
              await new Promise((resolve,reject)=>{const tx=db.transaction('colonies','readwrite');tx.objectStore('colonies').put({id:'legacy',name:'Alter Stand',revision:1,savedAt,gameDay:0,antCount:10,payload,checksum,backups:{1:{slot:1,payload,checksum,revision:1,savedAt}}});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
              const repo=new ColonyRepository(databaseName),loaded=await repo.load('legacy');
              if(captureColony(loaded).schemaVersion!==9||(await repo.readRow('legacy')).payload!==payload)throw Error('load changed original');
              if(old.schemaVersion>=3&&(loaded.simulation.getProgression().highestPopulation!==500||loaded.excavation.diggingGrade!==4||loaded.simulation.gathering.carryCapacity!==15))throw Error('legacy progress/development lost');
              const add=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(...args){const r=add.apply(this,args);if(this.name==='recoveryCopies')this.transaction.abort();return r;};
              let failed=false;try{await repo.save(loaded);}catch{failed=true;}finally{IDBObjectStore.prototype.add=add;}
              if(!failed||(await repo.readRow('legacy')).payload!==payload||(await repo.listRecoveryCopies('legacy')).length)throw Error('failed migration replaced original');
              await repo.save(loaded);const copies=await repo.listRecoveryCopies('legacy'),row=await repo.readRow('legacy');
              if(JSON.parse(row.payload).schemaVersion!==9||copies.length!==1||copies[0].reason!=='migration'||row.backups[1].payload!==payload)throw Error('migration publication/protection');
              const check=await repo.readRecoveryCopy('legacy',copies[0].id);
              if(check.schemaVersion!==9||check.state.clock.elapsedSeconds!==old.state.clock.elapsedSeconds)throw Error('old protection unreadable');
              const row2=await repo.readRow('legacy'),future=JSON.parse(row2.payload);future.encoding='future-codec';
              const futurePayload=JSON.stringify(future),futureBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(futurePayload));
              const futureHash=[...new Uint8Array(futureBytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
              const raw=await new Promise((resolve,reject)=>{const r=indexedDB.open(databaseName);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
              await new Promise((resolve,reject)=>{const tx=raw.transaction('colonies','readwrite');tx.objectStore('colonies').put({...row2,payload:futurePayload,checksum:futureHash});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});raw.close();
              let futureRefused=false;try{await repo.save(loaded);}catch{futureRefused=true;}
              if(!futureRefused||(await repo.readRow('legacy')).payload!==futurePayload)throw Error('future codec overwritten');
              let futureRestoreRefused=false;try{await repo.restoreBackup('legacy',1,loaded.revision,()=>true);}catch{futureRestoreRefused=true;}
              if(!futureRestoreRefused||(await repo.readRow('legacy')).payload!==futurePayload)throw Error('restore overwrote unsupported original');
              await repo.close();results.push({schema:oldSchema,readOnlyMigration:true,abortPreserved:true,originalProtected:true,backupUnchanged:true,futureRefused:true});
              }return results;
            """
            schemas=range(1,9) if '--all-save-schemas' in sys.argv else [8 if '--schema8-migration' in sys.argv else 7 if '--schema7-migration' in sys.argv else 6 if '--schema6-migration' in sys.argv else 5 if '--schema5-migration' in sys.argv else 4 if '--schema4-migration' in sys.argv else 3 if '--schema3-migration' in sys.argv else 2 if '--schema2-migration' in sys.argv else 1]
            result=[]
            for version in schemas:
                result.extend(page(migration_code.replace('SCHEMA_VERSIONS',json.dumps([version]))))
                print('Migration schema passed:',version,flush=True)
            print('D1 migration:',result)
            finish_focused()
            raise SystemExit(0)
        if '--transfer-only' in sys.argv:
            result=page("""
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {createColonySession,captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');
              const repo=new ColonyRepository('anthive-transfer-test');
              const a=createColonySession({id:'alpha',name:'Alpha'});a.simulation.advance(60);a.persistenceTiming.activeSeconds=900;
              await repo.save(a,{backupSlot:1});const old=await repo.readBackup('alpha',1);
              a.simulation.advance(20);a.name='Heute';a.persistenceTiming.activeSeconds=1200;await repo.save(a);
              const beforeSlots=JSON.stringify(await repo.listBackups('alpha'));
              const b=createColonySession({id:'beta',name:'Beta'});await repo.save(b,{backupSlot:2});
              const damaged=createColonySession({id:'damaged',name:'Defekt'});await repo.save(damaged,{backupSlot:3});damaged.simulation.advance(1);await repo.save(damaged);
              await repo.restoreBackup('alpha',1,2,()=>true);
              let current=await repo.load('alpha');
              if(current.name!=='Heute'||current.revision!==3||current.simulation.clock.exportState().elapsedSeconds!==old.state.clock.elapsedSeconds||current.persistenceTiming.activeSeconds!==1200)throw Error('restore identity/timer/state');
              if(JSON.stringify(await repo.listBackups('alpha'))!==beforeSlots)throw Error('restore rotated backups');
              let copies=await repo.listRecoveryCopies('alpha');if(copies.length!==1||(await repo.readRecoveryCopy('alpha',copies[0].id)).state.clock.elapsedSeconds<=old.state.clock.elapsedSeconds)throw Error('protection copy');
              const protectedBefore=serializeColony(captureColony(current)),add=IDBObjectStore.prototype.add;
              IDBObjectStore.prototype.add=function(...args){const r=add.apply(this,args);if(this.name==='recoveryCopies')this.transaction.abort();return r;};
              let failed=false;try{await repo.restoreBackup('alpha',1,3,()=>true);}catch{failed=true;}finally{IDBObjectStore.prototype.add=add;}
              if(!failed||serializeColony(captureColony(await repo.load('alpha')))!==protectedBefore||(await repo.listRecoveryCopies('alpha')).length!==1)throw Error('copy failure changed main');
              await repo.restoreRecoveryCopy('alpha',copies[0].id,3,()=>true);
              if((await repo.listRecoveryCopies('alpha')).length!==2||(await repo.load('alpha')).simulation.clock.exportState().elapsedSeconds<=old.state.clock.elapsedSeconds)throw Error('protection restore');
              const imported=await repo.importNew(old,'Importiert');if(imported.id==='alpha'||imported.persistenceTiming.activeSeconds!==0||imported.simulation.clock.exportState().elapsedSeconds!==old.state.clock.elapsedSeconds)throw Error('new import identity');
              await repo.replaceImported('beta',old,1,()=>true);
              if((await repo.load('beta')).name!=='Alpha'||(await repo.listBackups('beta')).length||(await repo.listRecoveryCopies('beta')).length!==1)throw Error('replacement');
              let stale=false;try{await repo.restoreBackup('alpha',1,2,()=>true);}catch{stale=true;}if(!stale)throw Error('stale restore accepted');
              let cross=false;try{await repo.readRecoveryCopy('beta',copies[0].id);}catch{cross=true;}if(!cross)throw Error('foreign protection accepted');
              const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('anthive-transfer-test');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
              await new Promise((resolve,reject)=>{const tx=db.transaction('colonies','readwrite'),store=tx.objectStore('colonies'),r=store.get('alpha');r.onsuccess=()=>{const row=r.result;row.payload='broken';store.put(row);};const other=store.get('damaged');other.onsuccess=()=>{const row=other.result;row.payload='broken';store.put(row);};tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
              let refusedCorrupt=false;try{await repo.replaceImported('damaged',old,2,()=>true);}catch{refusedCorrupt=true;}
              if(!refusedCorrupt||(await repo.listBackups('damaged')).length!==1)throw Error('replacement of corrupt main destroyed valid backups');
              await repo.restoreBackup('alpha',1,4,()=>true);
              if((await repo.load('alpha')).revision!==5||(await repo.listRecoveryCopies('alpha')).length!==2||JSON.stringify(await repo.listBackups('alpha'))!==beforeSlots)throw Error('corrupt main restore');
              let invalid=false;try{await repo.replaceImported('beta',{schemaVersion:99},2,()=>true);}catch{invalid=true;}if(!invalid||(await repo.load('beta')).revision!==2)throw Error('invalid replacement');
              await repo.remove('beta',2,()=>true);if((await repo.listRecoveryCopies('beta')).length||(await repo.listRecoveryCopies('alpha')).length!==2)throw Error('recovery delete isolation');
              const fresh=new ColonyRepository('anthive-transfer-fresh');
              const importedFresh=await fresh.importNew(old,'Frisch'),loadedFresh=await fresh.load(importedFresh.id);
              const expected=structuredClone(old);expected.id=importedFresh.id;expected.name='Frisch';expected.revision=1;expected.persistenceTiming=importedFresh.persistenceTiming;
              if((await fresh.list()).length!==1||serializeColony(captureColony(loadedFresh))!==serializeColony(expected))throw Error('fresh database file transfer changed state');
              await fresh.close();
              await repo.close();return {newImport:true,freshDatabase:true,restore:true,copyFailureAtomic:true,protectionRestore:true,replace:true,stale:true,corruptMain:true,isolation:true};
            """)
            print('D1 transfer:',result)
            finish_focused()
            raise SystemExit(0)
        if '--catalog-only' in sys.argv:
            result=page("""
              const {createColonySession,captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const session=createColonySession({id:'legacy',name:'Alter Stand'}),snapshot=captureColony(session);snapshot.revision=1;
              const payload=serializeColony(snapshot),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
              const checksum=[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
              const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('anthive-catalog-migration',1);r.onupgradeneeded=()=>r.result.createObjectStore('colonies',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
              await new Promise((resolve,reject)=>{const tx=db.transaction('colonies','readwrite');tx.objectStore('colonies').put({id:'legacy',name:'Alter Stand',revision:1,savedAt:new Date().toISOString(),gameDay:0,antCount:10,payload,checksum});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
              const repo=new ColonyRepository('anthive-catalog-migration');
              if((await repo.list()).length!==1)throw Error('legacy metadata migration');
              const a=await repo.load('legacy');await repo.save(a,{backupSlot:1});await repo.markPlayed('legacy');
              const b=createColonySession({id:'other',name:'Andere'});await repo.save(b);await repo.markPlayed('other');
              await repo.rename('legacy','Umbenannt',()=>true);
              const rows=await repo.list(),renamed=rows.find(r=>r.id==='legacy');
              if(rows[0].id!=='other'||renamed.name!=='Umbenannt'||(await repo.load('legacy')).name!=='Umbenannt')throw Error('rename identity/order');
              const put=IDBObjectStore.prototype.put;
              IDBObjectStore.prototype.put=function(...args){const r=put.apply(this,args);if(this.name==='metadata')this.transaction.abort();return r;};
              let aborted=false;try{await repo.rename('other','Darf nicht bleiben',()=>true);}catch{aborted=true;}finally{IDBObjectStore.prototype.put=put;}
              if(!aborted||(await repo.load('other')).name!=='Andere'||(await repo.list()).find(r=>r.id==='other').name!=='Andere')throw Error('metadata atomicity');
              let stale=false;try{await repo.remove('legacy',renamed.revision-1,()=>true);}catch{stale=true;}
              if(!stale||(await repo.listBackups('legacy')).length!==1)throw Error('stale delete');
              await repo.remove('legacy',renamed.revision,()=>true);
              if((await repo.list()).length!==1||(await repo.listBackups('legacy')).length!==0||(await repo.lastPlayedId())!=='other')throw Error('delete isolation');
              await repo.remove('other',(await repo.list())[0].revision,()=>true);
              if((await repo.list()).length||await repo.lastPlayedId()!==null)throw Error('deleted last selection');
              await repo.close();return {migration:true,rename:true,metadataAtomic:true,staleDelete:true,isolation:true};
            """)
            print('D1 catalog:',result)
            finish_focused()
            raise SystemExit(0)
        if '--autosave-only' in sys.argv:
            result = page("""
              const {createColonySession}=await import('/src/game/persistence/colonySession.ts');
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const {PersistenceController}=await import('/src/game/persistence/persistenceController.ts');
              const {BrowserColonyWriteLock}=await import('/src/game/persistence/colonyWriteLock.ts');
              const repo=new ColonyRepository('anthive-d1-autosave');
              const s=createColonySession({id:'timed',name:'Zeitprüfung'});
              const lock=new BrowserColonyWriteLock(),c=new PersistenceController(s,repo,lock,()=>{});
              await c.start();const other=new BrowserColonyWriteLock();
              if(await other.acquire('timed'))throw Error('second writer acquired lock');
              for(const minute of [5,10,15,175,180,185,190]){s.simulation.advance(1);c.tick(minute*60000,false);await c.flush();}
              const slots=await repo.listBackups('timed');
              if(slots.length!==3||new Set(slots.map(x=>x.revision)).size!==3)throw Error('backups not staggered');
              const times=[];for(const slot of [1,2,3])times.push((await repo.readBackup('timed',slot)).persistenceTiming.activeSeconds);
              if(JSON.stringify(times)!==JSON.stringify([190*60,185*60,180*60]))throw Error('wrong backup schedule '+times);
              await c.manual();if(JSON.stringify(slots)!==JSON.stringify(await repo.listBackups('timed')))throw Error('manual rotated backups');
              let refused=false;try{await repo.save(s,{backupSlot:1,canWrite:()=>false});}catch{refused=true;}
              if(!refused||JSON.stringify(slots)!==JSON.stringify(await repo.listBackups('timed')))throw Error('lost lock changed backups');
              await c.close();const replacement=new BrowserColonyWriteLock();if(!await replacement.acquire('timed'))throw Error('lock not released');replacement.release();
              const saved=await repo.load('timed');if(saved.persistenceTiming.activeSeconds!==190*60)throw Error('timers lost');
              sessionStorage.setItem('anthive-autosave-times',JSON.stringify(times));
              await repo.close();
              await scene.persistence.manual();
              if(scene.saveSession.revision<1)throw Error('HUD model not saved');
              window.__d1CrossLock=new BrowserColonyWriteLock();if(!await window.__d1CrossLock.acquire('cross-tab'))throw Error('cross-tab lock setup');
              return {backups:times,sceneSaved:true,exclusive:true};
            """)
            command('WebDriver:Refresh', {})
            hook()
            check = page("""
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const repo=new ColonyRepository('anthive-d1-autosave');
              const s=await repo.load('timed');if(s.persistenceTiming.activeSeconds!==11400)throw Error('reload timer reset');
              if((await repo.listBackups('timed')).length!==3)throw Error('reload backups lost');
              await repo.close();return {reload:true,activeSeconds:s.persistenceTiming.activeSeconds};
            """)
            original = command('WebDriver:GetWindowHandle', {})['value']
            opened = command('WebDriver:NewWindow', {'type':'tab'})
            other = opened.get('value', opened)['handle']
            command('WebDriver:SwitchToWindow', {'handle':other})
            command('WebDriver:Navigate', {'url':f'http://127.0.0.1:{vite_port}/'})
            hook()
            # The original page was reloaded above, so acquire its new cross-tab lock first.
            command('WebDriver:SwitchToWindow', {'handle':original})
            page("""
              const {BrowserColonyWriteLock}=await import('/src/game/persistence/colonyWriteLock.ts');
              window.__d1CrossLock=new BrowserColonyWriteLock();await window.__d1CrossLock.acquire('cross-tab');return true;
            """)
            command('WebDriver:SwitchToWindow', {'handle':other})
            cross = page("""
              const {BrowserColonyWriteLock}=await import('/src/game/persistence/colonyWriteLock.ts');
              const lock=new BrowserColonyWriteLock();const acquired=await lock.acquire('cross-tab');await lock.release();
              if(acquired)throw Error('second tab acquired write lock');return {secondTabReadOnly:true};
            """)
            command('WebDriver:CloseWindow', {})
            command('WebDriver:SwitchToWindow', {'handle':original})
            page('await window.__d1CrossLock.release();return true;')
            click(48,19)
            assert page('await scene.persistence.flush();return scene.saveSession.revision>=1;')
            print('D1 autosave:',result,check,cross)
            finish_focused()
            raise SystemExit(0)
        if '--persistence-only' in sys.argv:
            first = page("""
              const {createColonySession,captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const repo=new ColonyRepository('anthive-d1-browser');
              const a=createColonySession({id:'alpha',name:'Alpha'}), b=createColonySession({id:'beta',name:'Beta'});
              a.simulation.advance(181.37);await repo.save(a);await repo.save(b);
              const stale=await repo.load('alpha');a.simulation.advance(1);await repo.save(a);
              let conflict=false;try{await repo.save(stale);}catch{conflict=true;}
              if(!conflict)throw Error('stale writer accepted');
              const before=serializeColony(captureColony(await repo.load('alpha')));
              const put=IDBObjectStore.prototype.put;
              IDBObjectStore.prototype.put=function(...args){const r=put.apply(this,args);this.transaction.abort();return r;};
              let aborted=false;try{await repo.save(a);}catch{aborted=true;}finally{IDBObjectStore.prototype.put=put;}
              if(!aborted || before!==serializeColony(captureColony(await repo.load('alpha'))))throw Error('abort replaced main save');
              sessionStorage.setItem('anthive-d1-before',before);
              if((await repo.list()).length!==2)throw Error('colony isolation');
              const {startingWorld}=await import('/src/game/world/worldGenerator.ts');
              scene.gathering.clock.setPaused(true);
              const live={id:'live',name:'Aktuelle Szene',revision:0,world:scene.saveSession.world,simulation:scene.gathering,excavation:scene.excavation,persistenceTiming:scene.saveSession.persistenceTiming};
              await repo.save(live);
              if(serializeColony(captureColony(await repo.load('live')))!==serializeColony(captureColony(live)))throw Error('live scene roundtrip');
              scene.gathering.clock.setPaused(false);
              const raw=await new Promise((resolve,reject)=>{const r=indexedDB.open('anthive-d1-browser');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
              await new Promise((resolve,reject)=>{const tx=raw.transaction('colonies','readwrite'),store=tx.objectStore('colonies'),r=store.get('beta');r.onsuccess=()=>{const row=r.result;row.payload=row.payload.replace('Beta','Xeta');store.put(row);};tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
              let corrupt=false;try{await repo.load('beta');}catch{corrupt=true;}
              raw.close();if(!corrupt)throw Error('corrupt payload accepted');
              // A broken foreign colony must not prevent loading Alpha.

              await repo.close();return {conflict,aborted,count:2};
            """)
            command('WebDriver:Refresh', {})
            hook()
            second = page("""
              const {captureColony,serializeColony}=await import('/src/game/persistence/colonySession.ts');
              const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const repo=new ColonyRepository('anthive-d1-browser');
              const a=await repo.load('alpha');
              if(serializeColony(captureColony(a))!==sessionStorage.getItem('anthive-d1-before'))throw Error('reload changed state');
              if((await repo.list()).length!==3)throw Error('foreign colony lost');
              const before=a.simulation.clock.totalGameDays;a.simulation.advance(1);
              if(a.simulation.clock.totalGameDays<=before)throw Error('restored model does not run');
              await repo.close();return {reload:true,continued:true,ants:a.simulation.getWorkers().length};
            """)
            print('D1 persistence:', first, second)
            finish_focused()
            raise SystemExit(0)
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
            coordinates=page("const cells="+json.dumps([start,end])+"; const camera=scene.cameras.main; let points=cells.map(([column,row])=>[(column+.5)*24-camera.scrollX,(row+.5)*24-camera.scrollY]); const ys=points.map(p=>p[1]); if(Math.max(...ys)-Math.min(...ys)<=120){if(Math.min(...ys)<150)camera.scrollY-=150-Math.min(...ys);else if(Math.max(...ys)>270)camera.scrollY+=Math.max(...ys)-270;camera.preRender();} return cells.map(([column,row])=>[(column+.5)*24-camera.scrollX,(row+.5)*24-camera.scrollY]);")
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
            draw_cells([154,37],[157,39],'rectangle', touch=True)
            assert page('return scene.draftCells.length;') == 12
            assert page('return scene.input.manager.activePointer.wasTouch;')
            native_click('[data-action="confirm-plan"]')
            assert page("const plans=scene.excavation.getConstructionOrders(); return plans.length===window.__b3TouchCount+1 && plans.at(-1).type==='water';")
            page("const dialog=document.querySelector('#construction-panel'); dialog.scrollTop=dialog.scrollHeight; return true;")
            screenshot('anthive-b3-mobile-details.png')
            native_click('[data-action="cancel-order"]')
            native_click('[data-action="close-construction"]')
            print('PASS: B3 real touch rectangle, confirmation, scrollable details and cancellation')

        if '--pinch-only' in sys.argv:
            command('WebDriver:SetWindowRect', {'width':844,'height':480})
            page("scene.setWorldZoom(1);scene.gathering.clock.setPaused(true);return true;")
            start_plan('tunnel',touch=True)
            bounds=page("const r=scene.game.canvas.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};")
            def touch_move(x,y):
                return {'type':'pointerMove','duration':200,'origin':'viewport','x':round(bounds['x']+x*bounds['w']/640),'y':round(bounds['y']+y*bounds['h']/360)}
            actions=[]
            for name,start,end in [('left',270,220),('right',370,420)]:
                actions.append({'type':'pointer','id':name,'parameters':{'pointerType':'touch'},'actions':[
                    touch_move(start,200),{'type':'pointerDown','button':0},touch_move(end,200),
                    {'type':'pause','duration':100},{'type':'pointerUp','button':0}]})
            command('WebDriver:PerformActions',{'actions':actions})
            command('WebDriver:ReleaseActions',{})
            assert page("return scene.cameras.main.zoom===2&&scene.draftCells.length===0&&scene.previewCells.length===0&&!scene.pinchZoom.blocked;"), 'Pinch must zoom without drawing'
            for action,start,end in zip(actions,[220,420],[270,370]):
                action['actions'][0]=touch_move(start,200)
                action['actions'][2]=touch_move(end,200)
            command('WebDriver:PerformActions',{'actions':actions})
            command('WebDriver:ReleaseActions',{})
            assert page("return scene.cameras.main.zoom===1&&scene.draftCells.length===0;"), 'Reverse pinch must zoom out'
            page("scene.discardDraft();return true;")
            click(609,293,touch=True)
            assert page("return scene.cameras.main.zoom===2;"), 'Zoom buttons must still work'
            print('PASS: native two-finger zoom in/out, no accidental construction, buttons preserved')
            finish_focused()
            raise SystemExit(0)

        if '--d2-mobile-only' in sys.argv:
            page("await scene.persistenceReady;scene.gathering.clock.setPaused(true);return true;")
            command('WebDriver:SetWindowRect', {'width':844,'height':480})
            time.sleep(.2)
            assert page("const r=document.querySelector('#game canvas').getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;"), 'Game must fit inside the visible viewport'
            click(586,20,touch=True)
            assert page("return document.querySelector('#workforce-panel').open&&scene.input.manager.activePointer.wasTouch;")
            assert page("const r=document.querySelector('#workforce-panel').getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;")
            if '--mobile-scroll-regression' in sys.argv:
                bounds=page("const d=document.querySelector('#workforce-panel'),r=d.getBoundingClientRect();d.scrollTop=0;return {x:r.left+r.width/2,y:r.top+r.height/2,range:d.scrollHeight-d.clientHeight};")
                assert bounds['range']>0, 'Mobile dialog must exercise actual overflowing content'
                # Native wheel scrolling is supported by headless Firefox. Its
                # synthetic touch drags do not reliably implement default panning.
                command('WebDriver:PerformActions', {'actions':[{'type':'wheel','id':'dialog-wheel','actions':[
                    {'type':'scroll','duration':200,'origin':'viewport','x':round(bounds['x']),'y':round(bounds['y']),'deltaX':0,'deltaY':240}]}]})
                command('WebDriver:ReleaseActions', {})
                time.sleep(.3)
                assert page("return document.querySelector('#workforce-panel').scrollTop>0&&window.scrollY===0;"), 'Dialog must scroll without moving the document'
            native_click('[data-action="close-workforce"]')
            check_construction_touch()
            click(524,293,touch=True)
            assert page("return scene.cameras.main.zoom===.5&&scene.hudCamera.zoom===1;")
            click(54,20,touch=True)
            result=page("""
              await scene.persistence.flush();const {ColonyRepository}=await import('/src/game/persistence/colonyRepository.ts');
              const repo=new ColonyRepository(),saved=await repo.load(scene.saveSession.id);await repo.close();
              if(saved.revision!==scene.saveSession.revision||saved.simulation.queen.queenCount!==1)throw Error('mobile save/reload mismatch');
              return {touchGroups:true,dialogFits:true,touchConstruction:true,zoom:true,saveReadback:true,id:saved.id,revision:saved.revision};
            """)
            command('WebDriver:Refresh', {})
            for _ in range(150):
                if page("return !!document.querySelector('#continue-colony')&&!document.querySelector('#continue-colony').disabled;"): break
                time.sleep(.1)
            else: raise AssertionError('Mobile saved colony not resumable after refresh')
            native_click('#continue-colony')
            for _ in range(150):
                if page("return !document.querySelector('#colony-menu');"): break
                time.sleep(.1)
            else: raise AssertionError('Mobile continue action did not leave menu')
            hook()
            assert page("await scene.persistenceReady;return scene.saveSession.id==="+json.dumps(result['id'])+"&&scene.saveSession.revision==="+str(result['revision'])+";")
            result['sceneReload']=True
            if '--mobile-scroll-regression' in sys.argv: result['dialogScrollInput']='native wheel'
            screenshot('anthive-d27-mobile.png')
            print('D2.7 mobile:',result)
            finish_focused()
            raise SystemExit(0)

        if '--food-network-only' in sys.argv:
            result=page("""
              const s=scene.gathering,e=scene.excavation,w=e.world;
              const food=s.resources.listSources().filter(r=>r.resource==='food');
              if(food.length!==12||food.reduce((sum,r)=>sum+r.regenerationPerDay,0)!==720)throw Error('Food network missing');
              const reachable=food.filter(source=>s.navigation.sourceAccessPoints(source).some(point=>s.navigation.findPath(w.landmarks.nestChamberCenter,point)));
              const available=reachable.reduce((sum,r)=>sum+r.regenerationPerDay,0);
              if(available<=401)throw Error('Insufficient initially reachable network');
              if([scene.foodStockLabel,scene.waterStockLabel,scene.materialStockLabel].some(label=>label.depth<7))throw Error('Starting store labels hidden below room surfaces');
              const brood=scene.children.list.filter(o=>typeof o.text==='string'&&o.text.startsWith('BRUTKAMMER'));
              if(brood.length!==4||brood.some(label=>label.depth<7))throw Error('Starting brood labels hidden');
              s.moveWorkers('gathering','gathering','building',2);
              for(let i=0;i<2000&&e.getBuilders().length<4;i++)s.advance(.1);
              if(e.getBuilders().length!==4)throw Error('Actual builder reassignment failed');
              const room=w.chamberFootprints[0],top=Math.min(...room.map(c=>c.row));
              const targets=room.filter(c=>c.row===top).map(c=>({column:c.column,row:c.row-1})).filter(c=>e.validateOrder([c],'tunnel').valid&&w.tiles[c.row][c.column].state!=='open').slice(0,4);
              if(targets.length!==4)throw Error('Four front fixture missing');
              const ids=targets.map(c=>e.addOrder([c],'tunnel'));s.advance(.1);
              const jobs=e.getBuilders().map(b=>b.job).filter(j=>j&&ids.includes(j.orderId));
              if(new Set(jobs.map(j=>j.orderId)).size!==4)throw Error('Idle builders did not start four independent orders');
              scene.update(0,0);scene.updateConstruction();scene.economyHud.setCollapsed(true);scene.setWorldZoom(.5);scene.cameras.main.centerOn(160*24,28*24);
              return {foodSources:food.length,reachableFoodSources:reachable.length,reachableRegeneration:available,parallelOrders:jobs.length};
            """)
            print(json.dumps(result));screenshot('anthive-food-network-start-labels.png')
            print('PASS: live food deposits and reachable supply, start room labels, four actual parallel construction orders')
            finish_focused();raise SystemExit(0)

        if '--room-edges-only' in sys.argv:
            page("""
              scene.updateConstruction();
              const source=scene.gathering.resources.getSource('surface-food-source');
              if(source.capacity!==1000||source.regenerationPerDay!==60)throw Error('Playable food balance not active');
              const {getTileArtInstruction,getTilemapAtlasFrame}=await import('/src/game/world/worldTileArtLayout.ts');
              const w=scene.excavation.world,keys=new Set(scene.startingFurnishings.flatMap(room=>room.cells.map(c=>`${c.column},${c.row}`)));
              const layer=scene.children.list.find(o=>o.name==='anthive-world-tile-art');
              for(const room of scene.startingFurnishings)for(const c of room.cells)for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
                const x=c.column+dx,y=c.row+dy;
                const expected=getTilemapAtlasFrame(getTileArtInstruction(w.tiles,x,y,keys));
                if((layer.getTileAt(x,y)?.index??-1)!==expected)throw Error('Room edge retains old curved gap');
              }
              scene.economyHud.setCollapsed(true);scene.setWorldZoom(.5);scene.cameras.main.centerOn(160*24,28*24);return true;
            """)
            screenshot('anthive-muted-flush-rooms.png')
            print('PASS: actual start-room tile edges meet muted room surfaces without old tunnel lips')
            if '--post-c5-only' not in sys.argv:
                finish_focused()
                raise SystemExit(0)
            page('scene.economyHud.setCollapsed(false);scene.setWorldZoom(1);return true;')

        if '--planning-colors-only' in sys.argv:
            page("scene.gathering.clock.setPaused(true);scene.cameras.main.centerOn(190*24,40*24);return true;")
            def long_draw(tool, touch=False):
                start_plan('tunnel',touch=touch)
                page("const tool=document.querySelector('[name=draftTool]');tool.value="+json.dumps(tool)+";tool.dispatchEvent(new Event('change'));return true;")
                bounds=command('WebDriver:ExecuteScript', {'script':"const r=document.querySelector('#game canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};",'args':[]})['value']
                def point(x,y):
                    return {'type':'pointerMove','duration':150,'origin':'viewport','x':round(bounds['x']+x*bounds['w']/640),'y':round(bounds['y']+y*bounds['h']/360)}
                before=page('return scene.cameras.main.scrollX;')
                actions=[point(150,220),{'type':'pointerDown','button':0},point(635,220),{'type':'pause','duration':1800},{'type':'pointerUp','button':0}]
                command('WebDriver:PerformActions',{'actions':[{'type':'pointer','id':'long-plan','parameters':{'pointerType':'touch' if touch else 'mouse'},'actions':actions}]})
                command('WebDriver:ReleaseActions',{})
                result=page("return {scroll:scene.cameras.main.scrollX,cells:scene.draftCells.length,rows:new Set(scene.draftCells.map(c=>c.row)).size,valid:scene.excavation.validateOrder(scene.draftCells,'tunnel').valid};")
                assert result['scroll']>before+100,result
                assert result['cells']>27 and result['rows']==1 and result['valid'],result
                screenshot('anthive-long-'+tool+'.png')
                native_click('[data-action=discard-plan]')
                print(json.dumps(result))
            long_draw('brush')
            long_draw('rectangle',touch=True)
            page("scene.cameras.main.centerOn(160*24,28*24);scene.setWorldZoom(.5);scene.updateConstruction();return true;")
            screenshot('anthive-colored-start-rooms.png')
            assert page("return scene.startingFurnishings.length===8 && scene.startingFurnishings.every(r=>r.installedByCell.length===r.cells.length);")
            print('PASS: continuous mouse brush and touch rectangle beyond viewport; themed existing rooms')
            if '--post-c5-only' not in sys.argv:
                finish_focused()
                raise SystemExit(0)
            page('scene.setWorldZoom(1);return true;')

        if '--hud-art-only' in sys.argv:
            page("""
              const layer=scene.children.list.find(o=>o.name==='anthive-world-tile-art');
              const tileset=layer.tileset[0];
              if(tileset.tileMargin!==2||tileset.tileSpacing!==4)throw Error('Missing texture frame gutters');
              const canvas=scene.textures.get('anthive-world-tile-art-atlas').getSourceImage(),ctx=canvas.getContext('2d');
              const columns=canvas.width/28;
              for(let frame=0;frame<137;frame++){
                const x=(frame%columns)*28+2,y=Math.floor(frame/columns)*28+2;
                const pixel=(px,py)=>Array.from(ctx.getImageData(px,py,1,1).data).join(',');
                for(let i=0;i<24;i++)for(const offset of [1,2]){
                  if(pixel(x+i,y)!==pixel(x+i,y-offset)||pixel(x+i,y+23)!==pixel(x+i,y+23+offset))throw Error('Vertical edge extrusion mismatch');
                  if(pixel(x,y+i)!==pixel(x-offset,y+i)||pixel(x+23,y+i)!==pixel(x+23+offset,y+i))throw Error('Horizontal edge extrusion mismatch');
                }
              }
              return true;
            """)
            click(616,20)
            assert page("return scene.economyHud.collapsed&&!scene.economyHud.food.visible&&scene.economyHud.background.height===28;")
            before=page("return scene.cameras.main.scrollX;")
            click(200,70,move=(240,70))
            assert page("return scene.cameras.main.scrollX;") != before
            click(510,20);assert page("return document.querySelector('#construction-panel').open;")
            native_click('[data-action=close-construction]')
            for level in [.5,.25,2]:
                page('scene.setWorldZoom('+str(level)+');return true;')
                screenshot('anthive-hud-atlas-'+str(level)+'.png')
            click(616,20)
            assert page("return !scene.economyHud.collapsed&&scene.economyHud.food.visible&&scene.economyHud.background.height===104;")
            command('WebDriver:SetWindowRect', {'width':844,'height':480});time.sleep(.3)
            click(616,20,touch=True)
            assert page("return scene.economyHud.collapsed;")
            screenshot('anthive-hud-mobile-collapsed.png')
            print('PASS: all atlas gutters, fixed zoom levels, collapse/expand, map interaction in freed area and touch')
            finish_focused()
            raise SystemExit(0)

        if '--pond-shore-only' in sys.argv:
            result=page("""
              const s=scene.gathering,w=scene.excavation.world;s.clock.setPaused(true);
              const pond=w.decorations.find(d=>d.kind==='pond');
              const {createPondProfile}=await import('/src/game/world/pondProfile.ts');
              const profile=createPondProfile(pond.position.x,24,pond.scale??1,c=>w.tiles.findIndex(row=>row[c]?.terrain!=='air'));
              const right=profile.columns.at(-1).x+profile.columns.at(-1).width;
              const column=Math.floor(right/24),row=Math.floor(profile.waterY/24),store=w.landmarks.waterStoreCenter;
              const storeColumn=Math.floor(store.x/24),storeRow=Math.floor(store.y/24);
              for(let c=column;c<=storeColumn;c++){w.tiles[row][c].state='open';scene.renderExcavatedTiles({column:c,row});}
              for(let r=Math.min(row,storeRow);r<=Math.max(row,storeRow);r++){w.tiles[r][storeColumn].state='open';scene.renderExcavatedTiles({column:storeColumn,row:r});}
              s.traffic.invalidateTopology();s.gathering.setPriority('water');
              const testId=s.gathering.getCollectors().find(a=>!a.load).id;s.gathering.retireCollector(testId);s.gathering.addCollector(testId,store);s.clock.setPaused(false);
              let carrier;
              for(let i=0;i<10000&&!carrier;i++){s.advance(.05);carrier=s.gathering.getCollectors().find(a=>a.id===testId&&a.sourceId===pond.id&&a.phase==='pickup'&&a.position.x>=right);}
              if(!carrier || carrier.position.x-right>1 || carrier.position.y<profile.waterY || carrier.position.y>profile.waterY+24)throw Error('No actual shoreline pickup');
              scene.update(0,0);scene.cameras.main.centerOn(right,profile.waterY+24);
              window.__shoreCarrier=carrier.id;return {position:carrier.position,waterY:profile.waterY,right};
            """)
            print(json.dumps(result));screenshot('anthive-pond-shore-pickup.png')
            page("""
              const s=scene.gathering,before=s.resources.getStore('water-store').amount;
              for(let i=0;i<10000&&s.resources.getStore('water-store').amount<=before;i++)s.advance(.05);
              if(s.resources.getStore('water-store').amount<=before)throw Error('Actual water delivery missing');
              return true;
            """)
            print('PASS: actual visible-shore pickup via new tunnel and real water-store delivery')
            finish_focused()
            raise SystemExit(0)

        if '--zoom-exits-only' in sys.argv:
            before=page("return scene.economyHud.header.getBounds();")
            click(524,293)
            assert page("return Math.abs(scene.cameras.main.zoom-.5)<.001 && scene.hudCamera.zoom===1;")
            assert page("return scene.economyHud.header.getBounds();") == before
            # World planning must still resolve pointer cells under zoom.
            page("scene.cameras.main.centerOn(200*24,34*24);return true;")
            start_plan('tunnel')
            point=page("const c=scene.cameras.main;c.preRender();return [((200+.5)*24-c.worldView.x)*c.zoom,((34+.5)*24-c.worldView.y)*c.zoom];")
            click(*point)
            assert page("return scene.draftCells.length===1 && scene.draftCells[0].column===200 && scene.draftCells[0].row===34;")
            native_click('[data-action=discard-plan]')
            # Wheel zoom retains the ground under the cursor and leaves HUD alone.
            point_before=page("return scene.cameras.main.getWorldPoint(320,210);")
            page("scene.input.emit('wheel',{x:320,y:210},[],0,100);return true;")
            assert page("const p=scene.cameras.main.getWorldPoint(320,210),a="+json.dumps(point_before)+";return Math.abs(p.x-a.x)*scene.cameras.main.zoom<=1&&Math.abs(p.y-a.y)*scene.cameras.main.zoom<=1;")
            result=page("""
              const e=scene.excavation,s=scene.gathering;
              const {surfaceRow}=await import('/src/game/world/worldGenerator.ts');
              const column=157,top=surfaceRow(column),bottom=e.world.tiles.findIndex((row,i)=>i>top&&row[column].state==='open'),cells=[];
              if(bottom<0)throw Error('Exit fixture has no underground origin');
              for(let row=bottom;row>=top;row--)cells.push({column,row});
              const id=e.addOrder(cells,'tunnel');
              for(let i=0;i<15000&&e.getConstructionOrders().find(o=>o.id===id).status!=='completed';i++)s.advance(.1);
              if(e.getConstructionOrders().find(o=>o.id===id).status!=='completed')throw Error('Surface exit not completed');
              if(!s.navigation.findPath({x:(column+.5)*24,y:(bottom+.5)*24},{x:(column+.5)*24,y:(top-.5)*24}))throw Error('Exit not walkable');
              for(const c of e.drainChangedCells())scene.renderExcavatedTiles(c);
              scene.cameras.main.centerOn(column*24,(top+2)*24);scene.updateConstruction();
              return {zoom:scene.cameras.main.zoom,surfaceOpen:e.world.tiles[top][column].state};
            """)
            print(json.dumps(result))
            screenshot('anthive-zoom-surface-exit.png')
            click(566,293)
            assert page("return scene.cameras.main.zoom===1;")
            command('WebDriver:SetWindowRect', {'width':844,'height':480});time.sleep(.3)
            click(524,293,touch=True)
            assert page("return scene.cameras.main.zoom===.5 && scene.foodStockLabel.scaleX===1 && scene.materialStockLabel.x===scene.excavation.world.landmarks.buildingMaterialStoreCenter.x && scene.materialStockLabel.y===scene.excavation.world.landmarks.buildingMaterialStoreCenter.y;")
            screenshot('anthive-zoom-mobile.png')
            print('PASS: mouse/touch zoom, fixed HUD, cursor anchoring, zoomed tile selection and real surface exit')
            finish_focused()
            raise SystemExit(0)

        if '--playable-only' in sys.argv:
            result=page("""
              const s=scene.gathering;s.clock.setPaused(true);
              const workers=s.getWorkers();if(workers.length!==10 || workers.filter(w=>w.specialization==='care').length!==1)throw Error('Missing additional starting nurse');
              for(const resource of ['food','water'])s.resources.depositInStore(`${resource}-store`,{resource,amount:540});
              s.clock.setPaused(false);s.advance(119);if(s.queen.snapshot.laidEggs!==0)throw Error('Egg laid too early');
              s.advance(1.1);if(s.queen.snapshot.laidEggs!==1)throw Error('Two minute egg missing');
              for(let i=0;i<1500&&!s.queen.snapshot.eggs[0].arrived;i++)s.advance(.1);
              if(!s.queen.snapshot.eggs[0].arrived)throw Error('Starting nurse did not deliver egg');
              s.advance(359);if(s.queen.snapshot.eggs[0].stage==='adult')throw Error('Premature birth');
              s.advance(2);if(s.queen.snapshot.eggs[0].stage!=='adult')throw Error('Six minute development missing');
              scene.update(0,0);scene.updateEconomyHud();
              if(!document.querySelector('[data-role=queen-summary]').textContent.includes('Pflegekapazität'))throw Error('Capacity explanation missing');
              return {workers:s.getWorkers().length,laid:s.queen.snapshot.laidEggs,born:s.queen.snapshot.bornCount,careCapacity:s.queen.snapshot.careCapacity};
            """)
            print(json.dumps(result))
            page("""
              const e=scene.excavation,s=scene.gathering;
              const {lineSelection,rectangleSelection}=await import('/src/game/simulation/constructionPlanning.ts');
              const cells=rectangleSelection({column:200,row:34},{column:203,row:36});
              const builder=e.getBuilders()[0],home={column:Math.floor(builder.position.x/24),row:Math.floor(builder.position.y/24)};
              for(const c of [...lineSelection(home,cells[0]),...cells]){e.world.tiles[c.row][c.column].state='open';scene.renderExcavatedTiles(c);}
              s.traffic.invalidateTopology();const id=e.addOrder(cells,'food');
              for(let i=0;i<12000&&!e.getConstructionOrders().find(o=>o.id===id).operational;i++)s.advance(.1);
              if(!e.getConstructionOrders().find(o=>o.id===id).operational)throw Error('Room not complete');
              scene.updateConstruction();
              if(!scene.constructionLabels.get(id).text.startsWith('NAHRUNGSLAGER') || scene.constructionLabels.get(id).style.backgroundColor!==scene.foodStockLabel.style.backgroundColor)throw Error('Finished map label is not room name');
              const store=e.chambers.getChambers().find(r=>r.id===id).storeId;s.resources.depositInStore(store,{resource:'food',amount:12});scene.updateConstruction();if(!scene.constructionLabels.get(id).text.includes('12.0 / 120'))throw Error('Individual live stock label missing');
              const button=document.querySelector(`[data-order-id="${id}"]`);if(button.textContent!=='Nahrungslager')throw Error('Finished list label is not room name');
              if(!scene.materialStockLabel.text.includes('BAUSTOFFLAGER:') || scene.materialStockLabel.style.backgroundColor!==scene.foodStockLabel.style.backgroundColor)throw Error('Material store label missing');
              scene.cameras.main.centerOn(202*24,35*24);return true;
            """)
            screenshot('anthive-playable-room-label.png')
            print('PASS: native starting nurse, 2-minute eggs, 6-minute brood, care explanation and finished room labels')
            finish_focused()
            raise SystemExit(0)

        if '--post-c5-only' in sys.argv:
            page("scene.gathering.clock.setPaused(true); scene.cameras.main.centerOn(204*24,35*24); return true;")
            def template(kind, size, anchor, touch=False):
                click(510, 20, touch=touch)
                page("const type=document.querySelector('[name=chamberType]');type.value="+json.dumps(kind)+";type.dispatchEvent(new Event('change'));const size=document.querySelector('[name=chamberSize]');size.value="+json.dumps(size)+";return true;")
                native_click('[data-action=draw-plan]')
                point=page("const [x,y]="+json.dumps(anchor)+";return [(x+.5)*24-scene.cameras.main.scrollX,(y+.5)*24-scene.cameras.main.scrollY];")
                click(*point, touch=touch)
            template('food','small',[200,34])
            assert page("return scene.draftCells.length===16 && scene.excavation.getConstructionOrders().length===0 && !document.querySelector('[data-action=confirm-plan]').disabled;")
            screenshot('anthive-post-c5-template.png')
            native_click('[data-action=confirm-plan]')
            assert page("return scene.excavation.getConstructionOrders().at(-1).total===16;")
            native_click('[data-action=close-construction]')
            template('water','small',[205,34])
            assert page("return document.querySelector('[data-action=confirm-plan]').disabled && document.querySelector('[data-role=draft-status]').textContent.includes('2 Kacheln Abstand');")
            screenshot('anthive-post-c5-distance-warning.png')
            native_click('[data-action=discard-plan]')
            template('water','small',[206,34],touch=True)
            assert page("return scene.input.manager.activePointer.wasTouch && !document.querySelector('[data-action=confirm-plan]').disabled;")
            native_click('[data-action=confirm-plan]')
            native_click('[data-action=cancel-order]')
            native_click('[data-action=close-construction]')
            # A dedicated real build fixture: open a connected tunnel and room,
            # then transport and install real material with existing builders.
            page("""
              const e=scene.excavation,s=scene.gathering;
              s.clock.setPaused(false);e.cancelOrder(1);
              const home={column:Math.floor(s.getWorkers().find(w=>w.id==='builder-0').position.x/24),row:Math.floor(s.getWorkers().find(w=>w.id==='builder-0').position.y/24)};
              const {lineSelection,rectangleSelection}=await import('/src/game/simulation/constructionPlanning.ts');
              const cells=rectangleSelection({column:200,row:34},{column:203,row:37});
              for(const c of [...lineSelection(home,cells[0]),...cells]) {scene.excavation.world.tiles[c.row][c.column].state='open';scene.renderExcavatedTiles(c);}
              s.traffic.invalidateTopology();
              window.__postRoom=e.addOrder(cells,'rest');
              const pile=e.materials.produce(scene.gathering.getWorkers().find(w=>w.id==='builder-0').position,64);
              for(let i=0;i<10000 && e.getConstructionOrders().at(-1).materialUsed<3;i++)s.advance(.1);
              const o=e.getConstructionOrders().at(-1);scene.updateConstruction();
              if(o.materialUsed<3 || o.materialUsed>=o.materialRequired)throw Error('Partial real furnishing missing');
              if(o.installedByCell.reduce((n,c)=>n+c.amount,0)!==o.materialUsed)throw Error('Installed-cell balance');
              e.pauseOrder(o.id);s.advance(20);const before=JSON.stringify(e.getConstructionOrders().at(-1).installedByCell);s.advance(20);scene.updateConstruction();
              if(JSON.stringify(e.getConstructionOrders().at(-1).installedByCell)!==before)throw Error('Paused furnishings advanced');
              scene.cameras.main.centerOn(202*24,36*24);return true;
            """)
            screenshot('anthive-post-c5-partial-furnishing.png')
            page("""
              const e=scene.excavation,s=scene.gathering;e.resumeOrder(window.__postRoom);
              for(let i=0;i<10000 && !e.getConstructionOrders().at(-1).operational;i++)s.advance(.1);
              const o=e.getConstructionOrders().at(-1);if(!o.operational || o.capacity!==32)throw Error('Rest room not completed');
              for(let i=0;i<2000&&!s.getWorkers().some(w=>w.rest?.occupied);i++)s.advance(.1);
              if(!s.getWorkers().some(w=>w.rest?.occupied))throw Error('No actual occupied resting place');
              scene.update(0,0);scene.updateConstruction();return s.getWorkers().filter(w=>w.rest).map(w=>({id:w.id,rest:w.rest,position:w.position}));
            """)
            screenshot('anthive-post-c5-furnished-rest.png')
            command('WebDriver:SetWindowRect', {'width':844,'height':480})
            time.sleep(.3)
            template('food','small',[206,34],touch=True)
            assert page("return scene.draftCells.length===16 && !document.querySelector('[data-action=confirm-plan]').disabled;")
            screenshot('anthive-post-c5-mobile-template.png')
            native_click('[data-action=discard-plan]')
            page("""
              const e=scene.excavation,s=scene.gathering;
              const {lineSelection,rectangleSelection}=await import('/src/game/simulation/constructionPlanning.ts');
              const cells=rectangleSelection({column:206,row:34},{column:209,row:37});
              for(const c of [...lineSelection({column:203,row:34},cells[0]),...cells]){e.world.tiles[c.row][c.column].state='open';scene.renderExcavatedTiles(c);}
              s.traffic.invalidateTopology();const id=e.addOrder(cells,'food');
              for(let i=0;i<15000&&!e.getConstructionOrders().find(o=>o.id===id).operational;i++)s.advance(.1);
              const room=e.chambers.getChambers().find(r=>r.id===id);if(!room?.operational)throw Error('Store completion missing');
              s.resources.depositInStore(room.storeId,{resource:'food',amount:16});
              scene.update(0,0);scene.updateConstruction();
              const {chamberFurnishingLayout}=await import('/src/game/world/chamberFurnishingLayout.ts');
              const order=e.getConstructionOrders().find(o=>o.id===id);
              const marks=chamberFurnishingLayout({...order,stock:s.resources.getStore(room.storeId)},24);
              if(!marks.every(m=>m.stockFraction>0 && m.stockFraction<=.1))throw Error('Rendered inventory is not actual stock');
              scene.cameras.main.centerOn(205*24,36*24);return true;
            """)
            screenshot('anthive-post-c5-actual-stock.png')
            print('PASS: post-C5 native templates, spacing warning, touch, actual partial furnishing, pause, completion and occupied rest room')
            finish_focused()
            raise SystemExit(0)

        if '--visible-brood-only' in sys.argv:
            page("scene.gathering.resources.depositInStore('food-store',{resource:'food',amount:540});scene.gathering.resources.depositInStore('water-store',{resource:'water',amount:540});scene.cameras.main.centerOn(160*24,24*24);return true;")
            assert page('return scene.broodRenderer.queen.visible && scene.gathering.queen.snapshot.laidEggs===0;')
            screenshot('anthive-visible-queen.png')
            page("scene.update(0,120000);scene.renderBrood(100);const q=scene.gathering.queen.snapshot;if(q.bufferCount!==1 || q.assignedCount!==0 || q.eggs[0].stageProgressDays!==0 || !scene.broodRenderer.bodies.has('egg-1'))throw Error('Real egg is not visibly waiting at queen');return true;")
            screenshot('anthive-visible-laid-egg.png')
            assign_group('gathering','gathering','care',1)
            native_click('[data-action="close-workforce"]')
            print(json.dumps({'eggPickup':page("""
              const s=scene.gathering;
              for(let i=0;i<5000&&!s.getWorkers().some(w=>w.eggId==='egg-1');i++)scene.update(0,100);
              const carrier=s.getWorkers().find(w=>w.eggId==='egg-1');scene.renderBrood(100);
              if(!carrier || !scene.ants.find(w=>w.id===carrier.id)?.load.visible || scene.broodRenderer.bodies.has('egg-1'))throw Error('Egg carrier/visibility is incorrect');
              if(s.queen.snapshot.eggs[0].stageProgressDays!==0)throw Error('Egg developed before arrival');
              scene.cameras.main.centerOn(carrier.position.x,carrier.position.y);return {id:carrier.id,position:carrier.position};
            """)}))
            screenshot('anthive-visible-egg-carried.png')
            page("for(let i=0;i<5000&&!scene.gathering.queen.snapshot.eggs[0].arrived;i++)scene.update(0,100);scene.renderBrood(100);const e=scene.gathering.queen.snapshot.eggs[0];if(!e.arrived || !scene.broodRenderer.bodies.has(e.id) || e.stageProgressDays>.001)throw Error('Egg arrival did not start actual brood at zero');return true;")
            assign_group('gathering','gathering','care',6)
            native_click('[data-action="close-workforce"]')
            assign_group('building','building','care',2)
            native_click('[data-action="close-workforce"]')
            print(json.dumps({'feeding':page("""
              scene.update(0,600000);const s=scene.gathering;
              for(let i=0;i<2000&&!(s.broodSupply.balance.food.consumed>0&&s.broodSupply.balance.water.consumed>0);i++)scene.update(0,100);
              scene.renderBrood(100);const e=s.queen.snapshot.eggs[0],visual=scene.broodRenderer.bodies.get(e.id);
              if(e.stage!=='larva' || visual?.stage!=='larva' || s.broodSupply.balance.food.consumed<=0 || s.broodSupply.balance.water.consumed<=0)throw Error('Visible larva is not really supplied');
              scene.cameras.main.centerOn(149.5*24,33*24);return {stage:e.stage,balance:s.broodSupply.balance};
            """)}))
            screenshot('anthive-visible-larvae-fed.png')
            page("scene.update(0,1800000);scene.renderBrood(100);if(scene.gathering.queen.snapshot.eggs[0].stage!=='pupa' || scene.broodRenderer.bodies.get('egg-1')?.stage!=='pupa')throw Error('Pupal drawing does not match real brood');return true;")
            screenshot('anthive-visible-pupae.png')
            check_layout()
            command('WebDriver:Navigate', {'url':f'http://127.0.0.1:{vite_port}/?view=pond'})
            hook();check_layout();screenshot('anthive-visible-pond.png')
            command('Marionette:Quit', {'flags':['eForceQuit']});browser.wait(timeout=10);browser=None
            print('PASS: visible queen, real laid/waiting egg, actual nurse pickup and arrival, no development in transit, visible supplied larva and pupa, pond intact')
            sys.exit(0)

        # Older phase checks seed a precise assigned cohort; the visible-brood
        # check below exercises actual pickup and delivery instead of this setup.
        page("window.__placeFixtureEggs=q=>{for(const r of q.getEggRequests()){q.claimEgg(r.eggId,'fixture');q.pickUpEgg(r.eggId,'fixture');q.deliverEgg(r.eggId,'fixture');}};return true;")

        if '--c4-only' in sys.argv:
            page("scene.gathering.clock.setPaused(true);return true;")
            click(586,20)
            page("const i=document.querySelector('[name=eggQuota-combat]');i.value='0';i.dispatchEvent(new Event('input',{bubbles:true}));const values=[...document.querySelectorAll('[data-role=egg-quotas] input')].map(i=>i.valueAsNumber);if(values[3]!==0 || Math.abs(values.reduce((a,b)=>a+b,0)-100)>1e-9 || values.slice(0,3).some(v=>v<33.33||v>33.34))throw Error('Automatic quota redistribution failed');return true;")
            native_click('[data-action="apply-egg-quotas"]')
            assert page('return scene.gathering.queen.snapshot.quotas.combat;') == 0
            page("const i=document.querySelector('[name=eggQuota-gathering]');i.value='50';i.dispatchEvent(new Event('input',{bubbles:true}));if(document.querySelector('[name=eggQuota-combat]').valueAsNumber!==0)throw Error('Disabled quota re-enabled');return true;")
            native_click('[data-action="apply-egg-quotas"]')
            screenshot('anthive-c4-quotas.png')
            native_click('[data-action="close-workforce"]')
            print(json.dumps({'c4':page("""
              const s=scene.gathering,q=s.queen,rooms=q.snapshot.chambers;
              q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(4,1,[]);q.advance(0,0,rooms,100);window.__placeFixtureEggs(q);q.advance(1,0,rooms,100);
              s.broodSupply.syncRooms(q.getLarvalRooms());
              const advance=days=>q.advance(days,0,rooms,100,d=>{for(const l of s.broodSupply.consume(d,q.getLarvalRooms()))q.loseLarvae(l.roomId,l.count);},s.broodSupply);
              advance(1);if(q.snapshot.stageCounts.larva!==20 || q.snapshot.lostCount!==0)throw Error('Warning day failed');
              advance(5);if(q.snapshot.lostCount!==0)throw Error('Premature loss');advance(1);
              s.broodSupply.syncRooms(q.getLarvalRooms());scene.renderBrood(100);scene.updateEconomyHud();
              if(q.snapshot.lostCount!==1 || q.snapshot.stageCounts.larva!==19 || scene.broodRenderer.bodies.has('egg-1'))throw Error('Loss/renderer integration failed');
              const stock=s.broodSupply.getRooms().find(r=>r.specialization==='gathering');
              if(stock.shortage.factor!==.25 || stock.shortage.losses!==1)throw Error('Resource shortage state failed');
              scene.cameras.main.centerOn(rooms[0].position.x,rooms[0].position.y);
              return {larvae:q.snapshot.stageCounts.larva,lost:q.snapshot.lostCount,factor:stock.shortage.factor};
            """)}))
            click(586,20)
            assert 'Larvenverluste 1' in page('return document.querySelector("[data-role=brood-rooms]").textContent;')
            assert 'Ressourcen 25 %' in page('return document.querySelector("[data-role=brood-rooms]").textContent;')
            screenshot('anthive-c4-shortage.png')
            command('WebDriver:SetWindowRect', {'width':844,'height':480})
            time.sleep(.3)
            check_layout();screenshot('anthive-c4-mobile.png')
            native_click('[data-action="close-workforce"]')
            command('WebDriver:Navigate', {'url':f'http://127.0.0.1:{vite_port}/?view=pond'})
            hook();check_layout();screenshot('anthive-c4-pond.png')
            command('Marionette:Quit', {'flags':['eForceQuit']});browser.wait(timeout=10);browser=None
            print('PASS: automatic quotas, preserved zero group, C4 warning/slowing/loss, renderer, mobile UI and pond')
            sys.exit(0)

        if '--larvae-only' in sys.argv:
            page("scene.gathering.resources.depositInStore('food-store',{resource:'food',amount:540});scene.gathering.resources.depositInStore('water-store',{resource:'water',amount:540});return true;")
            assign_group('gathering','gathering','care',7)
            native_click('[data-action="close-workforce"]')
            print(json.dumps({'c3Pickup':page("""
              scene.update(0,1000);const s=scene.gathering,rooms=s.queen.snapshot.chambers;
              s.queen.setQuotas({gathering:100,building:0,care:0,combat:0});s.queen.advance(.2,1,[]);s.queen.advance(0,0,rooms,100);window.__placeFixtureEggs(s.queen);s.queen.advance(1,0,rooms,100);
              for(let i=0;i<5000&&!s.getWorkers().some(w=>w.load?.amount>0);i++)scene.update(0,100);
              const carrier=s.getWorkers().find(w=>w.load?.amount>0);
              if(!carrier || carrier.actualWork!=='care' || carrier.load.amount>5 || !scene.ants.find(a=>a.id===carrier.id)?.load.visible)throw Error('No real visible nurse cargo');
              const b=s.broodSupply.balance[carrier.load.resource];
              if(b.withdrawn<=0 || b.carried<=0)throw Error('Cargo was not withdrawn from a real store');
              scene.cameras.main.centerOn(carrier.position.x,carrier.position.y);return {id:carrier.id,load:carrier.load,position:carrier.position};
            """)}))
            screenshot('anthive-c3-nurse-cargo.png')
            print(json.dumps({'c3Supply':page("""
              const s=scene.gathering;
              for(let i=0;i<5000&&!(s.broodSupply.balance.food.consumed>0 && s.broodSupply.balance.water.consumed>0);i++)scene.update(0,100);
              const balances=s.broodSupply.balance;
              for(const kind of ['food','water']){const b=balances[kind];if(b.consumed<=0 || Math.abs(b.withdrawn-b.atChambers-b.carried-b.consumed-b.dropped-b.returned)>1e-8)throw Error('C3 real supply/conservation failed: '+kind);}
              const room=s.broodSupply.getRooms().find(r=>r.larvae>0);
              if(!room || room.food.target!==room.larvae || room.water.target!==room.larvae || room.food.amount<=0 || room.water.amount<=0)throw Error('Private larval reservoirs failed');
              if(s.getWorkers().length!==9 || new Set([...scene.ants,...scene.builderWorkers].map(w=>w.id)).size!==9)throw Error('Worker identities/visibility changed');
              scene.updateEconomyHud();return {balances,larvae:room.larvae,food:room.food,water:room.water};
            """)}))
            click(586,20)
            page('const d=document.querySelector("#workforce-panel");d.scrollTop=d.scrollHeight;return true;')
            assert 'Larvenvorrat' in page('return document.querySelector("[data-role=brood-rooms]").textContent;')
            screenshot('anthive-c3-reservoirs.png')
            native_click('[data-action="close-workforce"]')
            command('WebDriver:SetWindowRect', {'width':844,'height':480})
            for _ in range(50):
                if page('const r=scene.game.canvas.getBoundingClientRect();return innerWidth<=844 && r.right<=844 && Math.abs(scene.scale.canvasBounds.width-r.width)<1;'):
                    break
                time.sleep(.1)
            else:
                raise AssertionError('Canvas resize did not settle')
            click(586,20)
            page('const d=document.querySelector("#workforce-panel");d.scrollTop=d.scrollHeight;return true;')
            screenshot('anthive-c3-mobile.png')
            native_click('[data-action="close-workforce"]')
            check_layout()
            command('WebDriver:Navigate', {'url':f'http://127.0.0.1:{vite_port}/?view=pond'})
            hook();check_layout();screenshot('anthive-c3-pond.png')
            command('Marionette:Quit', {'flags':['eForceQuit']});browser.wait(timeout=10);browser=None
            print('PASS: C3 native nurse assignment, visible cargo, real pickup/delivery, separate reservoirs, larval consumption, exact balance, mobile UI and pond')
            sys.exit(0)

        if '--brood-only' in sys.argv:
            page("scene.gathering.resources.depositInStore('food-store',{resource:'food',amount:540});scene.gathering.resources.depositInStore('water-store',{resource:'water',amount:540});return true;")
            assign_group('gathering','gathering','care',7)
            native_click('[data-action="close-workforce"]')
            assign_group('building','building','care',2)
            native_click('[data-action="close-workforce"]')
            print(json.dumps({'c2Care':page("""
              scene.update(0,1000);const s=scene.gathering,rooms=s.queen.snapshot.chambers;
              s.queen.advance(.8,1,[]);s.queen.advance(0,0,rooms,100);window.__placeFixtureEggs(s.queen);
              scene.update(0,600000);const q=s.queen.snapshot;
              if(q.stageCounts.larva!==4 || q.careCapacity!==45 || q.careFactor!==1 || s.getWorkers().filter(w=>w.actualWork==='care').length!==9)throw Error('Native care assignment or larval transition failed');
              return {capacity:q.careCapacity,factor:q.careFactor,stages:q.stageCounts};
            """)}))
            click(586,20)
            page('const d=document.querySelector("#workforce-panel");d.scrollTop=d.scrollHeight;return true;')
            screenshot('anthive-c2-larvae.png')
            native_click('[data-action="close-workforce"]')
            page("scene.update(0,1800000);if(scene.gathering.queen.snapshot.stageCounts.pupa!==4)throw Error('Three-day larval phase failed');return true;")
            print(json.dumps({'c2Births':page("""
              scene.update(0,1200000);const s=scene.gathering,q=s.queen.snapshot,born=s.getWorkers().filter(w=>w.id.startsWith('born-'));
              if(q.bornCount!==4 || born.length!==4 || s.getWorkers().length!==13 || new Set(born.map(w=>w.specialization)).size!==4)throw Error('Birth/native workforce integration failed');
              const visible=[...scene.ants,...scene.builderWorkers];
              if(visible.length!==13 || visible.some(w=>!w.body.visible))throw Error('A newborn worker is not individually visible');
              if(q.laidEggs!==q.bufferCount+q.assignedCount+q.bornCount)throw Error('Brood conservation failed');
              scene.update(0,100);if(s.getWorkers().length!==13)throw Error('Duplicate birth');scene.updateEconomyHud();
              return {born:q.bornCount,workers:s.getWorkers().length,visible:visible.length,stages:q.stageCounts};
            """)}))
            command('WebDriver:SetWindowRect', {'width':844,'height':480})
            for _ in range(50):
                if page('const r=scene.game.canvas.getBoundingClientRect();return innerWidth<=844 && r.right<=844 && Math.abs(scene.scale.canvasBounds.width-r.width)<1;'):
                    break
                time.sleep(.1)
            else:
                raise AssertionError('Canvas resize did not settle')
            click(586,20)
            page('const d=document.querySelector("#workforce-panel");d.scrollTop=d.scrollHeight;return true;')
            assert 'geschlüpft 4' in page('return document.querySelector("[data-role=queen-summary]").textContent;')
            screenshot('anthive-c2-mobile.png')
            native_click('[data-action="close-workforce"]')
            check_layout()
            command('WebDriver:Navigate', {'url':f'http://127.0.0.1:{vite_port}/?view=pond'})
            hook();check_layout();screenshot('anthive-c2-pond.png')
            command('Marionette:Quit', {'flags':['eForceQuit']});browser.wait(timeout=10);browser=None
            print('PASS: C2 native foreign care, real 1/3/2 stages, four births, 13 visible native workers, brood balance, mobile UI and pond')
            sys.exit(0)

        if '--queen-only' in sys.argv:
            page("scene.gathering.resources.depositInStore('food-store',{resource:'food',amount:540});scene.gathering.resources.depositInStore('water-store',{resource:'water',amount:540});return true;")
            assign_group('gathering','gathering','care',7)
            native_click('[data-action=\"close-workforce\"]')
            assign_group('building','building','care',2)
            native_click('[data-action=\"close-workforce\"]')
            check_layout()
            click(586,20)
            assert page('return document.querySelector("#workforce-panel").open;')
            assert page('return document.querySelectorAll("[data-role=egg-quotas] input").length;') == 4
            page("document.querySelector('[name=eggQuota-gathering]').value='24';return true;")
            native_click('[data-action="apply-egg-quotas"]')
            assert '100' in page('return document.querySelector("[data-role=egg-quota-feedback]").textContent;')
            assert page('return scene.gathering.queen.snapshot.quotas.gathering;') == 25
            page("document.querySelector('[name=eggQuota-gathering]').value='25';return true;")
            native_click('[data-action="apply-egg-quotas"]')
            native_click('[data-action="close-workforce"]')
            print(json.dumps({'c1':page("""
              scene.update(0,600000);scene.update(0,30000);scene.updateEconomyHud();const s=scene.gathering.queen.snapshot;
              if(s.laidEggs!==5 || s.assignedCount!==5 || s.chambers.length!==4 || s.chambers.some(c=>c.capacity!==48 || !c.operational))throw Error('Queen/start room integration failed');
              if(scene.gathering.getWorkers().length!==9 || s.eggs.some(e=>e.stage!=='egg'))throw Error('Premature brood growth');
              scene.gathering.clock.setPaused(true);scene.update(0,600000);
              if(scene.gathering.queen.snapshot.laidEggs!==5)throw Error('Paused clock produced eggs');
              scene.gathering.clock.setPaused(false);
              return {laid:s.laidEggs,assigned:s.assignedCount,buffer:s.bufferCount,rooms:s.chambers.map(r=>({kind:r.specialization,occupied:r.occupied,capacity:r.capacity}))};
            """)}))
            click(586,20)
            page("for(const [kind,value] of Object.entries({gathering:100,building:0,care:0,combat:0}))document.querySelector('[name=eggQuota-'+kind+']').value=value;return true;")
            native_click('[data-action="apply-egg-quotas"]')
            page('const d=document.querySelector("#workforce-panel");d.scrollTop=d.scrollHeight;return true;')
            screenshot('anthive-c1-queen-desktop.png')
            native_click('[data-action="close-workforce"]')
            page("scene.update(0,600000);scene.update(0,30000);scene.updateEconomyHud();const s=scene.gathering.queen.snapshot;if(s.laidEggs!==10 || s.chambers.find(c=>c.specialization==='gathering').occupied!==7)throw Error('Native quota change did not affect actual new eggs');return true;")
            print(json.dumps({'buffer':page("const {QueenSystem}=await import('/src/game/simulation/queenSystem.ts');const q=new QueenSystem();q.advance(1000,1,[]);const s=q.snapshot;if(s.bufferCount!==50 || s.laidEggs!==50 || s.effectiveEggsPerDay!==0 || s.eggs.some(e=>e.developmentProgress!==0))throw Error('Queen buffer overflow/development');return {laid:s.laidEggs,buffer:s.bufferCount,rate:s.effectiveEggsPerDay};")}))
            command('WebDriver:SetWindowRect', {'width':844,'height':480})
            for _ in range(50):
                if page('const r=scene.game.canvas.getBoundingClientRect();return innerWidth<=844 && r.right<=844 && Math.abs(scene.scale.canvasBounds.width-r.width)<1;'):
                    break
                time.sleep(.1)
            else:
                raise AssertionError('Canvas resize did not settle')
            click(586,20)
            page('const d=document.querySelector("#workforce-panel");d.scrollTop=d.scrollHeight;return true;')
            assert 'zugewiesen: 10' in page('return document.querySelector("[data-role=queen-summary]").textContent;')
            screenshot('anthive-c1-queen-mobile.png')
            native_click('[data-action="close-workforce"]')
            check_layout()
            command('WebDriver:Navigate', {'url':f'http://127.0.0.1:{vite_port}/?view=pond'})
            hook();check_layout();screenshot('anthive-c1-pond.png')
            command('Marionette:Quit', {'flags':['eForceQuit']});browser.wait(timeout=10);browser=None
            print('PASS: C1 native quotas/validation, real egg laying, start rooms, pause, buffer limit, no C2 workers, mobile UI and pond')
            sys.exit(0)

        if '--furnishing-only' in sys.argv or '--chambers-only' in sys.argv or '--traffic-only' in sys.argv:
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
            screenshot('anthive-b5-partial-furnishing.png')
            native_click('[data-action="resume-order"]')
            native_click('[data-action="close-construction"]')
            balance=page("""
              for(let i=0;i<4000 && scene.excavation.getConstructionOrders()[0].status!=='furnished';i++)scene.update(0,100);
              for(let i=0;i<200;i++)scene.update(0,100);
              const o=scene.excavation.getConstructionOrders()[0],b=scene.excavation.materials.balance;
              if(o.status!=='furnished'||o.materialUsed!==24||b.consumed!==24)throw Error('Furnishing did not complete with real consumption');
              if(Math.abs(b.initial+b.produced-b.stored-b.ground-b.carried-b.atSites-b.consumed)>1e-8)throw Error('B4 conservation failed');
              if(scene.gathering.resources.getStoreTotals('food').capacity!==660 || scene.gathering.getWorkers().length!==9)throw Error('Unexpected capacity or worker change');
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
            screenshot('anthive-b5-complete-mobile.png')
            native_click('[data-action="close-construction"]')
            if '--traffic-only' in sys.argv:
                print(json.dumps({'b6':page("""
                  const traffic=scene.gathering.traffic;
                  if(scene.excavation.traffic!==traffic || traffic.stats.agents!==9)throw Error('Traffic is not shared by all nine workers');
                  const visible=[...scene.ants,...scene.builderWorkers];
                  if(visible.length!==9 || visible.some(w=>!w.body.visible))throw Error('Individual worker visibility lost');
                  const {createStartingWorld}=await import('/src/game/world/worldGenerator.ts');
                  const {CollectorNavigation}=await import('/src/game/world/collectorNavigation.ts');
                  const {TunnelTrafficSystem}=await import('/src/game/simulation/tunnelTrafficSystem.ts');
                  const {ResourceSystem}=await import('/src/game/simulation/resourceSystem.ts');
                  const {GatheringSystem}=await import('/src/game/simulation/gatheringSystem.ts');
                  const w=createStartingWorld(),p=c=>({x:(c+.5)*24,y:84});
                  w.dimensions={columns:16,rows:8,tileSize:24};w.decorations=[];
                  w.tiles=Array.from({length:8},()=>Array.from({length:16},()=>({terrain:'topsoil',state:'discovered'})));
                  for(let c=1;c<14;c++)w.tiles[3][c].state='open';
                  const t=new TunnelTrafficSystem(w),r=new ResourceSystem();
                  r.addSource({id:'source',resource:'food',kind:'finite',position:p(12),capacity:5000,amount:5000,regenerationPerDay:0,recoveryDays:2});
                  r.addStore({id:'store',resource:'food',position:p(1),capacity:5000,amount:0,status:'operational',reachable:true});
                  const g=new GatheringSystem(r,new CollectorNavigation(w,t));
                  for(let i=0;i<500;i++)g.addCollector('stress-'+i,p(1+i%12));
                  const before=performance.now();
                  for(let i=0;i<100;i++){t.advance(.1,g.getCollectors().map(a=>a.position));g.advance(.1);}
                  const elapsedMs=performance.now()-before,ants=g.getCollectors(),stored=r.getStore('store').amount;
                  const conserved=r.getSource('source').amount+stored+ants.reduce((s,a)=>s+(a.load?.amount??0),0);
                  if(ants.length!==500 || new Set(ants.map(a=>a.id)).size!==500 || conserved!==5000 || stored===0)throw Error('500-worker transport/conservation failed');
                  return {liveVisible:visible.length,stressWorkers:ants.length,simulationSeconds:10,elapsedMs:Math.round(elapsedMs),stored,traffic:t.stats};
                """)}))
            command('WebDriver:Navigate', {'url':f'http://127.0.0.1:{vite_port}/?view=pond'})
            hook();check_layout();screenshot('anthive-b5-pond.png')
            command('Marionette:Quit', {'flags':['eForceQuit']});browser.wait(timeout=10);browser=None
            print('PASS: B5 initial24, parallel front, real furnishing, active +120 capacity, pause/resume, conserved material, mobile details and pond')
            if '--traffic-only' in sys.argv:
                print('PASS: B6 shared traffic, every live worker visible, 500 individual collectors, actual delivery and conservation')
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
          if(plans[0].excavated<1 || plans[1].status!=='completed')throw Error('B3 actual tunnel did not unlock earlier chamber '+JSON.stringify({plans,workers:scene.excavation.getBuilders(),clock:scene.gathering.clock.exportState(),leaving:scene.leaving}));
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
    if browser_log is not None:
        browser_log.close()
