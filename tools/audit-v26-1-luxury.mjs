// V26.1 source-level regression: all sections and wedding details remain.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8');
const css=readFileSync('assets/css/luxury-v26-1.css','utf8');
const source=readFileSync('assets/js/site/app.js','utf8');
const essentials=[
 'id="invitationIntro"','id="findMeCanvas"','id="home"','id="story"',
 'class="section countdown-section','id="countdown"','id="events"',
 'id="forever"','id="weddingMagic"','id="homeGallery"',
 'id="rsvp"','id="rsvpForm"','id="weddingGifts"','id="albumOverlay"',
 'id="openInvitation"','id="ourPromisePhoto"','id="v3Farewell"',
 '/assets/css/luxury-v26-1.css','/assets/js/site/find-me-intro.js'
];
for(const item of essentials)assert.ok(html.includes(item),'Required existing feature: '+item);
const bride=html.match(/data-event-day="bride"([\s\S]*?)data-event-day="groom"/)?.[1];
const groom=html.match(/data-event-day="groom"([\s\S]*?)<\/section>/)?.[1];
assert.ok(bride&&groom,'Both date panels');
const times=s=>[...s.matchAll(/v3-event-time"><strong>(\d\d:\d\d)<\/strong>/g)].map(m=>m[1]);
assert.deepEqual(times(bride),['09:00','18:00'],'Bride: home ceremony 09:00; Gold Palace 18:00');
assert.deepEqual(times(groom),['09:00','11:00'],'Groom: 09:00 and 11:00');
assert.ok(bride.includes('Gold Palace'),'Gold Palace venue retained');
assert.ok(bride.includes('v3-event-map')&&groom.includes('v3-event-map'),'Map links retained');
assert.ok(source.includes('function renderHomeGallery()'),'Gallery logic remains');
for(const sel of [
 '.hero.hero-v5', '#story.editorial-story.section',
 'section.countdown-section.countdown-compact.countdown-v15',
 '#events.v3-events.section','#forever.our-promise',
 '#weddingMagic.hm-forever-scene',
 '.gallery-section #homeGallery.home-gallery',
 '#rsvp.rsvp-section.section','#weddingGifts.wedding-gifts',
 '@media(max-width:760px)','@media(prefers-reduced-motion:reduce)'
])assert.ok(css.includes(sel),'Luxury refinement missing: '+sel);
assert.ok(!css.includes('display:none!important}\n#forever'),'Do not hide the promise');
console.log('PASS V26.1 Luxury: all full-content sections, two family schedules, Gold Palace 18:00, gallery and responsive CSS');
