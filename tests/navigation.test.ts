import assert from 'node:assert/strict';
import {currentAlbumId,openAlbumInClient} from '../plugins/Example/src/navigation.ts';
assert.equal(currentAlbumId({router:{currentParams:{albumId:'200566137'}}}),'200566137');
assert.equal(currentAlbumId({router:{currentParams:{artistId:'7'}}}),undefined);
const actions:unknown[]=[];
openAlbumInClient(a=>actions.push(a),55130733);
assert.deepEqual(actions,[{type:'router/PUSH',payload:'/album/55130733'}]);
assert.throws(()=>openAlbumInClient(a=>actions.push(a),'https://tidal.com/album/1'));
console.log('PASS: validated album routes use the client router.');
