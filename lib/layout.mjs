import {name,parentEdges,topological,dateBounds,dateText} from './model.mjs';
export function wrapText(s,max=20){
 const units=c=>/[ilI.,' :]/.test(c)?.6:/[MW@]/.test(c)?1.8:/[\u0590-\u05ff]/.test(c)?1.4:c.codePointAt(0)>65535?2.2:1.2;
 const size=v=>Array.from(v).reduce((n,c)=>n+units(c),0),out=[];let line='';
 for(const word of String(s).split(/\s+/)){if(size(line+' '+word)>max&&line){out.push(line);line=''}for(const c of Array.from(word)){if(size(line+c)>max&&line){out.push(line);line=''}line+=c}if(line)line+=' '}
 if(line.trim())out.push(line.trim());return out.length?out:['?'];
}
export function card(p,view){const lines=wrapText(name(p),22);return {id:p.id,p,lines,w:244,h:(view==='detail'?106:28)+lines.length*24+(view==='detail'&&p.birthDate?22:0)+(view==='detail'&&p.deathDate?22:0)}}
export function layoutTree(t,view='detail',collapsed=[]){
 const g=topological(t),ps=new Map(t.persons.map(p=>[p.id,p])),blocked=new Set(collapsed),hidden=new Set(),parents=new Map(t.persons.map(p=>[p.id,[]]));
 for(const r of parentEdges(t))parents.get(r.childId)?.push(r.parentId);
 for(const id of g.order){const pars=parents.get(id);if(pars.length&&pars.every(x=>blocked.has(x)||hidden.has(x)))hidden.add(id)}
 const layers=[];for(const id of g.order){if(hidden.has(id))continue;const r=g.rank.get(id)||0;(layers[r]??=[]).push(id)}
 const sibling=new Map();for(const p of t.persons){const kids=[...(p.childOrder||[]),...(g.children.get(p.id)||[]).filter(id=>!p.childOrder?.includes(id)).sort((a,b)=>{let aa,bb;try{aa=dateBounds(ps.get(a)?.birthDate)?.[0];bb=dateBounds(ps.get(b)?.birthDate)?.[0]}catch{}return (aa??Infinity)-(bb??Infinity)})];kids.forEach((id,i)=>{if(!sibling.has(id))sibling.set(id,i)})}
 let index=new Map();const refresh=()=>layers.forEach(row=>row?.forEach((id,i)=>index.set(id,i)));refresh();
 for(let pass=0;pass<4;pass++){for(let r=1;r<layers.length;r++){layers[r]?.sort((a,b)=>{const score=id=>{const pp=parents.get(id).filter(x=>index.has(x));return pp.length?pp.reduce((s,p)=>s+index.get(p),0)/pp.length:index.get(id)};return score(a)-score(b)||(sibling.get(a)??0)-(sibling.get(b)??0)||index.get(a)-index.get(b)});layers[r]?.forEach((id,i)=>index.set(id,i))}}
 const nodes=[],byId=new Map();let depth=56;const horizontal=view==='horizontal';let maxAcross=0;
 const sizes=new Map(t.persons.map(p=>[p.id,card(p,view)]));const across=layers.map(row=>(row||[]).reduce((s,id)=>s+(horizontal?sizes.get(id).h:sizes.get(id).w)+36,0));maxAcross=across.reduce((a,b)=>Math.max(a,b),0);
 layers.forEach((row,r)=>{if(!row?.length)return;let pos=56+(maxAcross-across[r])/2;let rowDepth=0;for(const id of row){const n={...sizes.get(id),x:horizontal?depth:pos,y:horizontal?pos:depth,rank:r};nodes.push(n);byId.set(id,n);pos+=(horizontal?n.h:n.w)+36;rowDepth=Math.max(rowDepth,horizontal?n.w:n.h)}depth+=rowDepth+112});
 let width=horizontal?depth+56:maxAcross+112,height=horizontal?maxAcross+112:depth+56;
 if(horizontal)for(const n of nodes)n.x=width-n.x-n.w;
 const edges=[];let lane=0;
 const route=(a,b,type,id)=>{const dashed=type==='partner';let pts;
  if(horizontal){const sx=a.x,sy=a.y+a.h/2,tx=b.x+b.w,ty=b.y+b.h/2;if(a.rank+1===b.rank){const m=(sx+tx)/2;pts=[[sx,sy],[m,sy],[m,ty],[tx,ty]]}else {const y=Math.max(a.y+a.h,b.y+b.h)+22+(lane++%4)*7;pts=[[a.x+a.w/2,a.y+a.h],[a.x+a.w/2,y],[b.x+b.w/2,y],[b.x+b.w/2,b.y+b.h]]}}
  else if(a.rank===b.rank){const left=a.x<b.x?a:b,right=left===a?b:a;const y=Math.min(left.y,right.y)-22-(lane++%5)*6;pts=[[left.x+left.w/2,left.y],[left.x+left.w/2,y],[right.x+right.w/2,y],[right.x+right.w/2,right.y]]}
  else if(b.rank===a.rank+1){const sy=a.y+a.h,ty=b.y,m=sy+(ty-sy)*.5;pts=[[a.x+a.w/2,sy],[a.x+a.w/2,m],[b.x+b.w/2,m],[b.x+b.w/2,ty]]}
  else{const x=20+(lane++%4)*7;pts=[[a.x,a.y+a.h/2],[x,a.y+a.h/2],[x,b.y+b.h/2],[b.x,b.y+b.h/2]]}
  edges.push({id,type,from:a.id,to:b.id,pts,dashed,minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minY:Math.min(...pts.map(p=>p[1])),maxY:Math.max(...pts.map(p=>p[1]))});
 };
 for(const r of parentEdges(t)){const a=byId.get(r.parentId),b=byId.get(r.childId);if(a&&b)route(a,b,'parent',r.id)}
 const seen=new Set();for(const f of t.families)for(let i=0;i<f.partnerIds.length;i++)for(let j=i+1;j<f.partnerIds.length;j++){const a=byId.get(f.partnerIds[i]),b=byId.get(f.partnerIds[j]),k=[f.partnerIds[i],f.partnerIds[j]].sort().join('|');if(a&&b&&!seen.has(k)){route(a,b,'partner',f.id);seen.add(k)}}
 return {nodes,edges,width:Math.max(400,width),height:Math.max(250,height),generations:layers.filter(r=>r?.length).length,view};
}
// Dedicated one-column-width pagination. Cards remain whole; the relationship index
// uses matching person markers and both page numbers for every continuing edge.
export function printPages(t,view='detail',orientation='portrait'){
 const width=orientation==='landscape'?1123:794,height=orientation==='landscape'?794:1123;
 const order=topological(t),ps=new Map(t.persons.map(p=>[p.id,p]));const pages=[];let page;const next=()=>{page={width,height,nodes:[],edges:[],view,number:pages.length+1,kind:'tree',links:[]};pages.push(page);return page};next();let y=74;
 const refs=new Map(order.order.map((id,i)=>[id,`P${i+1}`]));const pageFor=new Map();
 for(const id of order.order){let n=card(ps.get(id),view);n={...n,w:width-200,x:150,y,rank:order.rank.get(id),marker:refs.get(id),lines:wrapText(name(ps.get(id)),Math.floor((width-232)/13))};n.h=(view==='detail'?106:28)+n.lines.length*24+(view==='detail'&&n.p.birthDate?22:0)+(view==='detail'&&n.p.deathDate?22:0)+32;n.scale=Math.min(1,(height-150)/n.h);n.h*=n.scale;if(y+n.h>height-65&&page.nodes.length){next();y=74}n.y=y;page.nodes.push(n);pageFor.set(id,page.number);y+=n.h+35;
 }
 const links=[];for(const r of parentEdges(t))links.push({id:r.id,from:r.parentId,to:r.childId,type:'הורות'});for(const f of t.families)for(let i=0;i<f.partnerIds.length;i++)for(let j=i+1;j<f.partnerIds.length;j++)links.push({id:f.id,from:f.partnerIds[i],to:f.partnerIds[j],type:'זוגיות'});
 const refsFor=new Map(t.persons.map(p=>[p.id,[]]));links.forEach((r,i)=>{r.marker=`K${i+1}`;r.fromPage=pageFor.get(r.from);r.toPage=pageFor.get(r.to);refsFor.get(r.from)?.push(r);refsFor.get(r.to)?.push(r)});
 for(const pg of pages){for(const n of pg.nodes){const others=[...new Set(refsFor.get(n.id).flatMap(r=>[r.fromPage,r.toPage]).filter(p=>p!==pg.number))];n.continuation=others.length?`המשך קשרים: עמ׳ ${others.join(', ')} · מפתח ${n.marker}`:`מפתח קשרים ${n.marker}`;if(n.continuation.length>95)n.continuation=`המשך קשרים במפתח הקשרים · ${n.marker}`;}
  const by=new Map(pg.nodes.map(n=>[n.id,n]));for(const r of links){const a=by.get(r.from),b=by.get(r.to);if(a&&b){const x=55+(pg.edges.length%7)*11;pg.edges.push({id:r.id,type:r.type==='זוגיות'?'partner':'parent',pts:[[a.x,a.y+a.h/2],[x,a.y+a.h/2],[x,b.y+b.h/2],[b.x,b.y+b.h/2]]})}}}
 if(links.length){let lp=null,ly=0;for(const r of links){const text=`${r.marker} · ${r.type}: ${name(ps.get(r.from))} (${refs.get(r.from)}, עמ׳ ${r.fromPage}) — ${name(ps.get(r.to))} (${refs.get(r.to)}, עמ׳ ${r.toPage})`;const lines=wrapText(text,Math.floor((width-90)/10));const h=lines.length*22+18;if(!lp||ly+h>height-60){lp={width,height,nodes:[],edges:[],links:[],view,kind:'index',number:pages.length+1};pages.push(lp);ly=105}lp.links.push({...r,lines,y:ly});ly+=h}}
 return pages;
}
export function photoURL(p){const q=p.photo;if(!q)return null;if(typeof q==='string')return /^(https?:\/\/|\/api\/photos\/|data:image\/(png|jpeg|webp);base64,)/.test(q)?q:null;return q.data||q.url||(q.id?`/api/photos/${encodeURIComponent(q.id)}`:null)}

