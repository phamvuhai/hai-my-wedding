import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../invitation.js', import.meta.url), 'utf8');

function element() {
  const flags = new Set();
  const listeners = new Map();
  return {
    classList:{
      add(...values) { values.forEach(v => flags.add(v)); },
      remove(...values) { values.forEach(v => flags.delete(v)); },
      contains(value) { return flags.has(value); }
    },
    style:{}, disabled:false, setAttribute() {},
    addEventListener(name, callback) {
      const list = listeners.get(name) || [];
      list.push(callback);
      listeners.set(name,list);
    },
    fire(name, event) {
      for (const callback of listeners.get(name) || []) callback(event);
    }
  };
}

async function runScenario({ pathname='/', reduced=false, keyboard=false }) {
  const intro=element(),button=element(),stage=element(),hero=element(),body=element();
  const elements={invitationIntro:intro,openInvitation:button,home:hero};
  intro.querySelector = selector => selector === '.invite-v2-stage' ? stage : null;
  const events=[];
  const document={
    body,readyState:'complete',fonts:{ready:Promise.resolve()},
    getElementById:id=>elements[id]||null,
    querySelector:selector=>selector==='#home'?hero:null,
    addEventListener(){},
    dispatchEvent:event=>events.push(event.type)
  };
  let navigatedTo='',musicStart=0;
  const window={
    WeddingHeroReady:true,
    WeddingI18n:{language:'vi',publicCode:()=> 'vi'},
    WeddingMusic:{start:()=>{musicStart+=1;}},
    scrollTo(){}
  };
  const timers=[];
  const location={pathname,hash:'',search:''};
  const history={
    state:null,scrollRestoration:'auto',
    replaceState(_state,_title,url){navigatedTo=url;}
  };
  const context={
    document,window,location,history,URLSearchParams,
    requestAnimationFrame(callback){callback();return 1;},
    setTimeout(callback,ms){timers.push({callback,ms});return timers.length;},
    addEventListener(){},
    matchMedia:()=>({matches:reduced}),
    CustomEvent:class { constructor(type){this.type=type;} }
  };
  runInNewContext(source, context);
  await Promise.resolve();
  const event={preventDefault(){},stopPropagation(){},key:'Enter'};
  if(keyboard)stage.fire('keydown',event);
  else button.fire('click',event);

  assert(intro.classList.contains('is-opening'), 'Opening did not start');
  assert(button.disabled,'Opening button was not disabled');
  assert.equal(musicStart,1,'Music gesture was not initiated');
  for(const timer of timers.sort((a,b)=>a.ms-b.ms))timer.callback();
  for(let i=0;i<14;i+=1)await Promise.resolve();
  assert(intro.classList.contains('is-opened'),'Cover did not close');
  assert(!body.classList.contains('invitation-locked'),'Site remained locked');
  assert.equal(navigatedTo,pathname.includes('invite')?'/vi/invite/test':'/vi');
  return {events};
}

test('button opens cover and enters localized home',async()=>{await runScenario({});});
test('keyboard Enter opens cover',async()=>{await runScenario({keyboard:true});});
test('reduced motion still completes opening',async()=>{await runScenario({reduced:true});});
test('personal invitation preserves token route',async()=>{await runScenario({pathname:'/vi/invite/test'});});
