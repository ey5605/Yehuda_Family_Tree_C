import fs from 'node:fs';
import path from 'node:path';
const file='dist/server/wrangler.json',config=JSON.parse(fs.readFileSync(file,'utf8'));
config.d1_databases[0].migrations_dir=path.resolve('drizzle');
fs.writeFileSync(file,JSON.stringify(config,null,2));
if(fs.existsSync('.dev.vars'))fs.copyFileSync('.dev.vars','dist/server/.dev.vars');
console.log('Local configuration prepared. Apply local migrations, then npm start.');
