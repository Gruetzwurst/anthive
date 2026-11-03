import assert from 'node:assert/strict';
import {test} from 'node:test';
import {colonyExportFilename,deleteConfirmation,sortColonies} from '../src/game/persistence/colonyCatalog.ts';
test('catalog sorts by actual last play rather than renaming or later save time',()=>{
 const rows=[{id:'a',lastPlayedAt:'2026-01-01',savedAt:'2026-04-01'},{id:'b',lastPlayedAt:'2026-02-01',savedAt:'2026-02-01'}];
 assert.deepEqual(sortColonies(rows).map(x=>x.id),['b','a']);assert.equal(rows[0].id,'a');
});
test('delete requires export choice and a separate final confirmation',()=>{
 assert.equal(deleteConfirmation('offer','cancel'),'cancelled');
 assert.equal(deleteConfirmation('offer','export'),'exporting');
 assert.equal(deleteConfirmation('exporting','exportFailed'),'offer');
 assert.equal(deleteConfirmation('exporting','exportSucceeded'),'confirm');
 assert.equal(deleteConfirmation('offer','withoutExport'),'confirm');
 assert.equal(deleteConfirmation('offer','confirm'),'offer');
 assert.equal(deleteConfirmation('confirm','confirm'),'delete');
});
test('export filenames retain readable names and remove unsafe path characters',()=>{
 const name=colonyExportFilename('Meine / Kolonie: A','2026-10-28T08:00:00Z');
 assert.ok(name.endsWith('.anthive.json'));assert.ok(!/[/:\\]/.test(name));assert.match(name,/Meine/);
});
