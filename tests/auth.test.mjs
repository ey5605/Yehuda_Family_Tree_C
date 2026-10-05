import {test} from 'node:test';
import assert from 'node:assert/strict';
import {passwordHash,verifyPassword,issueSession,verifySession} from '../lib/password-auth.mjs';
test('passwords, tampering, roles, expiry and rotation',async()=>{
 const config={SESSION_SECRET:'test-key-only-not-for-production-123456789',VIEW_PASSWORD_HASH:await passwordHash('viewer-password'),EDIT_PASSWORD_HASH:await passwordHash('editor-password')};
 assert.equal(await verifyPassword('viewer-password',config.VIEW_PASSWORD_HASH),true);
 assert.equal(await verifyPassword('wrong',config.VIEW_PASSWORD_HASH),false);
 assert.equal(await verifyPassword('viewer-password',config.EDIT_PASSWORD_HASH),false);
 const now=Date.now(),token=await issueSession('viewer',config,now);
 assert.equal(await verifySession(token,config,now),'viewer');
 assert.equal(await verifySession(token+'x',config,now),null);
 assert.equal(await verifySession(token,config,now+43200001),null);
 assert.equal(await verifySession(token,{...config,VIEW_PASSWORD_HASH:await passwordHash('changed')},now),null);
 assert.equal(await verifySession(token,{},now),null);
 assert.equal(await verifySession(await issueSession('editor',config,now),config,now),'editor');
});
