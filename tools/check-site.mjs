#!/usr/bin/env node
/**
 * Zero-dependency static regression gate.
 * Run: node tools/check-site.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { Script } from 'node:vm';

const root = process.cwd();
const load = name => readFileSync(join(root, name), 'utf8');
const source = load('index.html');
const admin = load('admin/index.html');
const login = load('admin/login/index.html');
const manifest = JSON.parse(load('css/manifest.json'));
const vercel = JSON.parse(load('vercel.json'));

function checksum(source) {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

const cssFiles = manifest.order;
assert.equal(cssFiles.length, 9, 'Expected the original nine cascade segments');
const combined = cssFiles.map(load).join('');
assert.equal(combined.length, manifest.originalLength, 'CSS content length changed');
assert.equal(checksum(combined), manifest.fnv1a32, 'CSS cascade changed; intentionally update manifest after review');
for (const [index, file] of cssFiles.entries()) {
  assert.equal(load(file).length, manifest.lengths[index], file + ' length changed');
  assert(source.includes('href="/' + file + '?v='), 'Missing ordered CSS link: ' + file);
}
const actualLinks = [...source.matchAll(/href="\/(css\/site-\d+\.css)(?:\?[^"]*)?"/g)].map(match => match[1]);
assert.deepEqual(actualLinks, cssFiles, 'CSS cascade order differs from manifest');
assert(!/\\.invite-v2[\\w-]*\\b|\\.invite-canvas-fx\\b/.test(combined), 'Obsolete invitation-v2 / canvas selectors reintroduced');
assert(source.includes('class="couture-stage"'), 'Active invitation stage is missing');
assert(load('invitation.js').includes("querySelector('.couture-stage')"), 'Invitation controller references an obsolete stage');

for (const legacy of ['Physical Invitation V3','Invitation UX V4','Invitation Cover V5','Cover stability V6']) {
  assert(!combined.includes(legacy), 'Dead invitation CSS was reintroduced: ' + legacy);
}
for (const animation of ["introFadeUp","introCardIn","introBotanicalLeft","introBotanicalRight","introSealHint","introPhotoHint","introArrowHint","introOpenCardV20","scheduleStatusSwap","scheduleCurrentEnter","envelopeBreathe","sealPulse","buttonShimmer","sealRing","sealBreak","sparkBurst","flapOpen","envelopeLeftOpen","envelopeRightOpen","copyLift","upperCopyLift","paperGlow","atmosphereBloom","stageDepth","photoLiftMobile","cardPortalMobile","envelopeFrontDrop","innerLetterRevealMobile","innerLetterRevealCompact","coverDissolveV39","coverAtmosphereFadeV39","innerLetterRevealV39Mobile","canvasControlsOut","canvasHeadingOut","canvasSceneExit"]) {
  assert(!new RegExp('@keyframes\\s+' + animation + '\\b').test(combined), 'Unused keyframe reintroduced: ' + animation);
}
for (const unused of ['invitation-canvas.js','invitation-config.js','invitation-assets.js','invitation-simple.css']) {
  assert(!existsSync(resolve(root,unused)), 'Unused invitation implementation still present: ' + unused);
}

function findJsFiles(directory = root) {
  return readdirSync(directory, { withFileTypes:true }).flatMap(entry => {
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    const full = join(directory, entry.name);
    if (entry.isDirectory()) return findJsFiles(full);
    return extname(entry.name) === '.js' ? [full] : [];
  });
}
for (const file of findJsFiles()) {
  const text = readFileSync(file, 'utf8');
  new Script(text, { filename:file });
}

for (const [pageName, html] of [['public',source], ['admin',admin], ['login',login]]) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, pageName + ' has duplicate IDs');
  for (const match of html.matchAll(/(?:src|href)="(\/[^"]+\.(?:css|js)(?:\?[^"]*)?)"/g)) {
    const file = decodeURIComponent(match[1].split('?')[0]).slice(1);
    assert(existsSync(resolve(root,file)), pageName + ' references missing asset ' + file);
  }
}

const cursorIndex = source.indexOf('src="/motion/cursor.js');
const motionIndex = source.indexOf('src="/motion.js');
const countdownIndex = source.indexOf('src="/public/countdown.js');
const appIndex = source.indexOf('src="/app.js');
assert(cursorIndex >= 0 && cursorIndex < motionIndex, 'Cursor must load before motion');
assert(countdownIndex >= 0 && countdownIndex < appIndex, 'Countdown must load before app');
assert(source.includes('src="/invitation.js'), 'Opening controller missing');
assert(source.includes('id="personalInvitePrivate"'), 'Personalized guest hook missing');
assert(source.includes('id="openInvitation"'), 'Invitation open control missing');
assert(source.includes('PHẠM VŨ HẢI') && source.includes('NGUYỄN THỊ MỸ'), 'Wedding names missing');
const adminUtilsIndex = admin.indexOf('src="/admin/utils.js');
const adminStateIndex = admin.indexOf('src="/admin/state.js');
const adminEditorIndex = admin.indexOf('src="/admin/editor.js');
const adminRsvpIndex = admin.indexOf('src="/admin/rsvp.js');
const adminGuestsIndex = admin.indexOf('src="/admin/guests.js');
const adminLibraryIndex = admin.indexOf('src="/admin/library.js');
assert(adminStateIndex >= 0 && adminStateIndex < adminUtilsIndex, 'Admin state must load before shared utilities');
for (const index of [adminEditorIndex,adminRsvpIndex,adminGuestsIndex,adminLibraryIndex]) {
  assert(index > adminUtilsIndex, 'Admin shared utilities must load before dependent screens');
}

for (const route of ['/vi','/en','/jp','/admin','/admin/login']) {
  assert(vercel.rewrites.some(entry => entry.source === route), 'Missing rewrite ' + route);
}
for (const path of ['/css/:path*','/motion/cursor.js','/public/countdown.js']) {
  const rule = vercel.headers.find(entry => entry.source === path);
  assert(rule && rule.headers.some(entry => entry.key === 'Cache-Control' && entry.value.includes('no-store')), 'Cache control missing: ' + path);
}

console.log('PASS — JS syntax, local assets, routes, unique IDs, cache headers, CSS parity and load order');
