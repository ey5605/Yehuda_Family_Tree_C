// Isolated test adapter. Not imported by the application or deployment.
import {passwordHash} from '../lib/password-auth.mjs';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
fs.mkdirSync('work',{recursive:true});
const db=new DatabaseSync('work/integration.sqlite');
if(!db.prepare("SELECT name FROM sqlite_master WHERE name='tree_state'").get()) db.exec(fs.readFileSync('drizzle/0000_family_storage.sql','utf8'));
if(!db.prepare("SELECT name FROM sqlite_master WHERE name='login_attempts'").get()) db.exec(fs.readFileSync('drizzle/0001_password_auth.sql','utf8'));
const root=path.resolve('work/integration-objects');
export const env={DB:{prepare(sql){let args=[];const q={bind(...v){args=v;return q},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes)}}}};return q}},BUCKET:{async put(key,data,opts){const p=path.join(root,key);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof data==='string'?data:Buffer.from(data));fs.writeFileSync(p+'.meta',JSON.stringify(opts||{}))},async get(key){const p=path.join(root,key);if(!fs.existsSync(p))return null;const b=fs.readFileSync(p);return {body:new Blob([b]).stream(),json:async()=>JSON.parse(b.toString()),text:async()=>b.toString(),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}}}};

env.SESSION_SECRET='isolated-local-acceptance-secret-only-2026';env.VIEW_PASSWORD_HASH=await passwordHash('test-view-only',new Uint8Array(16).fill(1));env.EDIT_PASSWORD_HASH=await passwordHash('test-edit-only',new Uint8Array(16).fill(2));
