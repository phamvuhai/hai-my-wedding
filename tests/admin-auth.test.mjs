import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../admin/auth.js',import.meta.url),'utf8');
async function scenario(valid) {
 const visible=new Set(['hidden']);
 const userEmail={textContent:''};
 const route=[],events=[];
 let loaded=0,signOut=0;
 const adminEmail='owner@example.test';
 const user=valid?{email:adminEmail}:{email:'another-account@example.test'};
 const db={auth:{
  async getUser(){return {data:{user},error:null};},
  async getSession(){return {data:{session:{user}}};},
  async signOut(){signOut+=1;},
  onAuthStateChange(callback){db.callback=callback;}
 }};
 const A={
  db,ADMIN_EMAIL:adminEmail,
  async loadData(){loaded+=1;}
 };
 const nodes={
  cmsView:{classList:{remove:x=>visible.delete(x),contains:x=>visible.has(x)}},
  userEmail,
  logoutBtn:{addEventListener(){}},
  overviewTab:{classList:{toggle(){}}},
  contentTab:{classList:{toggle(){}}},
  rsvpTab:{classList:{toggle(){}}},
  guestsTab:{classList:{toggle(){}}},
  albumTab:{classList:{toggle(){}}},
  pageTitle:{textContent:''}
 };
 const mock={
  window:{AdminApp:A},
  document:{
   getElementById:key=>nodes[key]||null,
   querySelectorAll:()=>[],
   dispatchEvent:event=>events.push(event.type)
  },
  Event:class {constructor(type){this.type=type;}},
  location:{replace:path=>route.push(path)},
  console
 };
 runInNewContext(source,mock);
 for(let i=0;i<10;i++)await Promise.resolve();
 return {route,events,visible,loaded,signOut,userEmail};
}
test('authenticated owner can load Admin and dashboard',async()=>{
 const r=await scenario(true);
 assert.equal(r.loaded,1);
 assert.equal(r.signOut,0);
 assert.equal(r.userEmail.textContent,'owner@example.test');
 assert.equal(r.visible.has('hidden'),false);
 assert(r.events.includes('admin:overview'));
 assert.deepEqual(r.route,[]);
});
test('non-owner session is signed out and blocked before data loading',async()=>{
 const r=await scenario(false);
 assert.equal(r.loaded,0);
 assert.equal(r.signOut,1);
 assert.equal(r.visible.has('hidden'),true);
 assert.deepEqual(r.route,['/admin/login/']);
});
