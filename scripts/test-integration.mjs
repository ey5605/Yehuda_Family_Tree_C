import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['tests/server-adapter.mjs'],{stdio:'inherit'});
try{
 let ready=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:5189/login');if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
 if(!ready)throw Error('Integration server did not start');
 const test=spawn(process.execPath,['--test','--test-isolation=none','tests/api.integration.mjs'],{stdio:'inherit'});
 const code=await new Promise((resolve,reject)=>{test.on('error',reject);test.on('exit',resolve)});process.exitCode=Number(code)||0;
}finally{server.kill()}
