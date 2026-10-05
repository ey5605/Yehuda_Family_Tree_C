import readline from 'node:readline/promises';
import {Writable} from 'node:stream';
import fs from 'node:fs';
import {passwordHash} from '../lib/password-auth.mjs';
// Passwords are never printed, passed as command arguments, or written to disk.
const muted=new Writable({write(_chunk,_encoding,callback){callback()}});
const rl=readline.createInterface({input:process.stdin,output:muted,terminal:true});
async function ask(label){process.stdout.write(label);const value=await rl.question('');process.stdout.write('\n');return value}
try{
 const view=await ask('Viewing password (12+ characters): '),view2=await ask('Repeat viewing password: ');
 const edit=await ask('Editing password (12+ characters): '),edit2=await ask('Repeat editing password: ');
 if(view.length<12||edit.length<12||view.length>512||edit.length>512||view!==view2||edit!==edit2||view===edit)throw Error('Use two different passwords, 12–512 characters, with matching confirmations.');
 const secrets={VIEW_PASSWORD_HASH:await passwordHash(view),EDIT_PASSWORD_HASH:await passwordHash(edit),SESSION_SECRET:Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString('base64url')};
 fs.writeFileSync('.secrets.generated.json',JSON.stringify(secrets,null,2),{mode:0o600});
 fs.writeFileSync('.dev.vars',Object.entries(secrets).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n',{mode:0o600});
 console.log('Created ignored .dev.vars for local development and .secrets.generated.json for Cloudflare/GitHub secrets. Never commit either file. Changing secrets ends previous sessions.');
}finally{rl.close()}
