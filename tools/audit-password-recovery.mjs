// Mock-only tests: never send recovery mail or use production Supabase credentials.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const loginCode = readFileSync(resolve(root,'assets/js/admin/login.js'),'utf8');
const resetCode = readFileSync(resolve(root,'assets/js/admin/reset-password.js'),'utf8');
const html = readFileSync(resolve(root,'index.html'),'utf8');
const route = '/admin/reset-password/';

function element() {
  const handlers = {};
  const classes = new Set(['hidden']);
  return {
    value: '', type:'password', textContent:'', disabled:false, className:'',
    handlers, classList:{
      add: (...x) => x.forEach(v=>classes.add(v)),
      remove: (...x) => x.forEach(v=>classes.delete(v)),
      contains: v=>classes.has(v)
    },
    addEventListener: (name, cb)=>{handlers[name]=cb},
    focus() { this.focused = true }
  };
}
function fixture({path='/admin/login/',search='',hash='',user='phamvuhai23@gmail.com',tokenError=null}={}) {
  const ids={};
  for(const id of ['status','resetStatus','loginForm','email','password','togglePassword',
    'forgotBtn','resetForm','toggleNewPassword','newPassword','confirmPassword','savePassword'])
    ids[id]=element();
  const subtitle=element();
  const calls={email:[],setSession:[],updateUser:[],signOut:0,redirects:[],cleared:false};
  const auth={
    async resetPasswordForEmail(email,opts){calls.email.push({email,opts});return {error:null}},
    async signInWithPassword(){return {error:null}},
    async getSession(){return {data:{session:null}}},
    async setSession(params){calls.setSession.push(params);return {error:tokenError}},
    async exchangeCodeForSession(){return {error:tokenError}},
    async verifyOtp(){return {error:tokenError}},
    async getUser(){return {data:{user:{email:user}},error:null}},
    async updateUser(data){calls.updateUser.push(data);return {error:null}},
    async signOut(){calls.signOut++;return {error:null}}
  };
  const location={origin:'https://hai-my-wedding-gamma.vercel.app',pathname:path,
    search,hash,replace(url){calls.redirects.push(url)}};
  const context={
    window:{WEDDING_CONFIG:{supabaseUrl:'https://example.supabase.co',supabaseAnonKey:'public'},
      supabase:{createClient:()=>({auth})}},
    document:{
      getElementById:id=>ids[id]||null,
      querySelector:()=>subtitle
    },
    history:{state:null,replaceState(){calls.cleared=true}},
    location, URL, URLSearchParams, setTimeout:()=>{},
    console
  };
  return {context,ids,subtitle,calls};
}
function run(script,opts) {
  const f=fixture(opts);
  runInNewContext(script,f.context);
  return f;
}
const flush=async()=>{await new Promise(resolve=>setImmediate(resolve))};
function check(name,fn) {
  return Promise.resolve().then(fn).then(
    ()=>console.log('PASS:',name),
    err=>{console.error('FAIL:',name,err);process.exitCode=1}
  );
}
await check('Forgot password emails point only to Admin reset page',async()=>{
  const f=run(loginCode);
  f.ids.email.value='phamvuhai23@gmail.com';
  await f.ids.forgotBtn.handlers.click();
  assert.equal(f.calls.email.length,1);
  assert.equal(f.calls.email[0].opts.redirectTo, f.context.location.origin+route);
});
await check('Existing login recovery callbacks preserve tokens',async()=>{
  const f=run(loginCode,{path:'/admin/login/',hash:'#access_token=one&refresh_token=two&type=recovery'});
  assert.equal(f.calls.redirects[0],route+'#access_token=one&refresh_token=two&type=recovery');
});
await check('Reset page rejects direct visit without verified email link',async()=>{
  const f=run(resetCode,{path:route});await flush();
  assert.equal(f.ids.resetForm.classList.contains('hidden'),true);
  assert.equal(f.calls.updateUser.length,0);
});
await check('Valid recovery token unlocks form and changes password',async()=>{
  const f=run(resetCode,{path:route,hash:'#access_token=abc&refresh_token=def&type=recovery'});await flush();
  assert.equal(f.calls.cleared,true);
  assert.equal(f.calls.setSession.length,1);
  assert.equal(f.ids.resetForm.classList.contains('hidden'),false);
  f.ids.newPassword.value='new-secure-password';
  f.ids.confirmPassword.value='new-secure-password';
  await f.ids.resetForm.handlers.submit({preventDefault(){}});
  assert.equal(f.calls.updateUser[0].password,'new-secure-password');
  assert.equal(f.calls.signOut,1);
  assert.equal(f.calls.redirects.at(-1),'/admin/login/?reset=success');
});
await check('A non-admin recovery identity cannot change password',async()=>{
  const f=run(resetCode,{path:route,hash:'#access_token=abc&refresh_token=def&type=recovery',user:'guest@example.com'});await flush();
  assert.equal(f.ids.resetForm.classList.contains('hidden'),true);
  assert.equal(f.calls.updateUser.length,0);
});
await check('Expired recovery token is rejected',async()=>{
  const f=run(resetCode,{path:route,hash:'#access_token=abc&refresh_token=def&type=recovery',tokenError:{message:'expired'}});await flush();
  assert.equal(f.ids.resetForm.classList.contains('hidden'),true);
  assert.equal(f.calls.updateUser.length,0);
});
await check('Wedding page guards Supabase recovery callbacks',async()=>{
  assert.match(html,/Supabase recovery callback must never render the public wedding page/);
  assert.match(html,/location\.replace\('\/admin\/reset-password\/'/);
});
if (process.exitCode) process.exit(process.exitCode);
