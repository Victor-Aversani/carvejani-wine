import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import {validateAvatar} from '../image-validation.mjs';
import {createApp} from '../server.mjs';
const listen=s=>new Promise(r=>s.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+s.address().port)));
test('Backend: validação, sessão, isolamento do recovery, revogação e proteção de origem (provedor isolado de teste)',async()=>{
 const tokens=new Map(),used=new Set();let calls=0,confirm=true,storagePath='';
 const user={id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid',email_confirmed_at:new Date().toISOString()};
 const session=()=>{let token='header.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature'+(++calls);tokens.set(token,user);return{access_token:token,refresh_token:'refresh',expires_in:3600,user}};
 const fake=http.createServer(async(req,res)=>{let body='';for await(const c of req)body+=c;let b=req.headers['content-type']?.startsWith('image/')?{}:body?JSON.parse(body):{};if(req.url.startsWith('/storage/v1/object/customer-avatars/'))storagePath=req.url;let p=req.url,d={},status=200;
 if(p==='/auth/v1/signup')d=confirm?{user}:session();
 else if(p==='/auth/v1/token?grant_type=password'){if(b.password!=='ValidPassword123')status=400;else d=session()}
 else if(p==='/auth/v1/token?grant_type=refresh_token')d=session();
 else if(p==='/auth/v1/verify'){if(used.has(b.token_hash)||b.token_hash==='invalid-token-00000000')status=400;else{used.add(b.token_hash);d=session()}}
 else if(p==='/auth/v1/user'&&req.method==='GET'){d=tokens.get(req.headers.authorization?.slice(7));if(!d)status=401}
 else if(p.startsWith('/rest/v1/customer_profiles'))d=[{id:user.id,full_name:'Cliente Teste'}];
 else if(p==='/auth/v1/recover')status=b.email==='absent@example.invalid'?400:200;
 res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(d||{}));});
 const provider=await listen(fake);const app=createApp({NODE_ENV:'test',SESSION_STORE:'sqlite',APP_ORIGIN:'http://localhost:3000',SUPABASE_URL:provider,SUPABASE_PUBLISHABLE_KEY:'test-key',SESSION_ENCRYPTION_KEY:'11'.repeat(32),DB_PATH:':memory:'});const url=await listen(app.server);
 const post=async(path,body,cookie='',origin='http://localhost:3000')=>fetch(url+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Carvejani-Request':'1',Cookie:cookie},body:JSON.stringify(body)});
 const get=(path,cookie='')=>fetch(url+path,{headers:{Cookie:cookie}});
 try{
 assert.equal((await get('/api/auth/me')).status,401);
 let implicit=session();let cb=await post('/api/auth/callback',{type:'recovery',access_token:implicit.access_token,refresh_token:implicit.refresh_token});assert.equal(cb.status,200);let rc=cb.headers.get('set-cookie').split(';')[0];assert.equal((await get('/api/auth/me',rc)).status,401);assert.equal((await get('/api/auth/recovery-status',rc)).status,200);assert.equal((await post('/api/auth/callback',{type:'recovery',access_token:implicit.access_token,refresh_token:implicit.refresh_token})).status,400);
 assert.equal((await post('/api/auth/login',{},'','https://evil.invalid')).status,403);
 assert.equal((await post('/api/auth/signup',{name:'A',email:'bad',password:'short',confirm:'different'})).status,422);
 let r=await post('/api/auth/login',{email:user.email,password:'ValidPassword123',remember:true});assert.equal(r.status,200);let set=r.headers.get('set-cookie');assert.match(set,/HttpOnly/);assert.match(set,/SameSite=Strict/);assert.match(set,/Max-Age=2592000/);let cookie=set.split(';')[0];assert.equal((await get('/api/auth/me',cookie)).status,200);
 assert.equal((await post('/api/checkout/authorize',{},cookie)).status,200);
 assert.equal((await post('/api/avatar/upload',{image:'not-a-photo'},cookie)).status,422);
 const photo=fs.readFileSync(new URL('../public/assets/off-3536650501002.jpg',import.meta.url));validateAvatar(photo.toString('base64'));assert.throws(()=>validateAvatar(Buffer.from('<svg></svg>').toString('base64')));assert.throws(()=>validateAvatar('A'.repeat(350004)));
 assert.equal((await post('/api/avatar/upload',{image:photo.toString('base64'),userId:'forged-other-user'},cookie)).status,200);assert.equal(storagePath,'/storage/v1/object/customer-avatars/'+user.id+'/avatar.jpg');
 assert.equal((await post('/api/avatar/remove',{},cookie)).status,200);
 assert.equal((await get('/api/avatar')).status,401);
 assert.equal((await post('/api/auth/logout',{},cookie)).status,200);assert.equal((await get('/api/auth/me',cookie)).status,401);
 let forgot1=await post('/api/auth/forgot',{email:'test@example.invalid'}),forgot2=await post('/api/auth/forgot',{email:'absent@example.invalid'});assert.deepEqual(await forgot1.json(),await forgot2.json());
 r=await post('/api/auth/verify',{type:'recovery',token_hash:'valid-recovery-token-00000000'});cookie=r.headers.get('set-cookie').split(';')[0];assert.equal((await get('/api/auth/me',cookie)).status,401);assert.equal((await post('/api/checkout/authorize',{},cookie)).status,401);assert.equal((await get('/api/auth/recovery-status',cookie)).status,200);
 assert.equal((await post('/api/auth/verify',{type:'recovery',token_hash:'valid-recovery-token-00000000'})).status,400);
 assert.equal((await post('/api/auth/reset',{password:'NewPassword123',confirm:'different'},cookie)).status,422);
 assert.equal((await post('/api/auth/reset',{password:'NewPassword123',confirm:'NewPassword123'},cookie)).status,200);assert.equal((await get('/api/auth/recovery-status',cookie)).status,401);
 r=await post('/api/auth/signup',{name:'Cliente',email:'new@example.invalid',password:'ValidPassword123',confirm:'ValidPassword123'});assert.equal(r.status,200);assert.equal(r.headers.get('set-cookie'),null);
 confirm=false;r=await post('/api/auth/signup',{name:'Cliente',email:'other@example.invalid',password:'ValidPassword123',confirm:'ValidPassword123'});assert.equal(r.status,503);
 for(let i=0;i<13;i++)r=await post('/api/auth/login',{email:'rate@example.invalid',password:'invalid'});assert.equal(r.status,429);
 }finally{app.server.close();fake.close();app.close()}
});
