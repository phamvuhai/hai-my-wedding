#!/usr/bin/env node
/* Full-photo Promise regression across screen classes, with actual site styles.
 * Uses test-only synthetic image content and offline WebKit.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webkit} from 'playwright';

const stylePaths=['assets/css/site.css','assets/css/compact-wedding.css','assets/css/luxury-v26-1.css'];
const styles=stylePaths.map(file=>readFileSync(file,'utf8'));
const html=readFileSync('index.html','utf8');
assert.ok(html.includes('id="forever"')&&html.includes('id="ourPromisePhoto"'),'Production Promise markup retained');
assert.ok(!styles[1].includes('aspect-ratio:5/4!important'),'Old cropped Promise ratio removed');
assert.ok(styles[2].includes('max-width:1023px'),'Tablet breakpoint defined');

const browser=await webkit.launch({headless:true});
const tests=[
  {width:320,height:640,columns:1},
  {width:390,height:844,columns:1},
  {width:600,height:900,columns:1},
  {width:768,height:1024,columns:1},
  {width:900,height:1180,columns:1},
  {width:1024,height:768,columns:2},
  {width:1440,height:900,columns:2},
  {width:1728,height:970,columns:2},
  {width:844,height:390,columns:1},
];
function svg(width,height){
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+
    '" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#dccbb3"/>'+
    '<rect x="8" y="8" width="'+(width-16)+'" height="'+(height-16)+
    '" fill="none" stroke="#7d4558" stroke-width="16"/></svg>');
}
try{
  for(const {width,height,columns} of tests){
    for(const [naturalW,naturalH] of [[800,1200],[1200,800]]){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',deviceScaleFactor:1});
      const page=await context.newPage();
      const data=svg(naturalW,naturalH);
      await page.setContent(`<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main>
      <section class="our-promise chapter-member" id="forever" aria-labelledby="promiseTitle">
        <div class="container our-promise-layout">
          <figure class="our-promise-visual">
            <div class="our-promise-photo-shell is-photo-loaded">
              <img id="ourPromisePhoto" class="our-promise-photo" src="${data}" alt="test image" />
              <div class="our-promise-fallback" hidden><span>H</span><span>♡</span><span>M</span></div>
            </div>
            <figcaption>MỘT LỜI HẸN · MỘT MÁI NHÀ</figcaption>
          </figure>
          <div class="our-promise-letter">
            <p class="our-promise-kicker">LỜI HẸN CỦA CHÚNG MÌNH</p>
            <h2 id="promiseTitle">Và rồi, mình chọn một đời có nhau.</h2>
            <span class="our-promise-divider" aria-hidden="true">✦</span>
            <p>Không cần ngày nào cũng hoàn hảo, chỉ mong có nhau để sẻ chia những chuyện nhỏ mỗi ngày.</p>
            <p>Hải và Mỹ chọn cùng xây một mái nhà, nơi yêu thương được gìn giữ bằng sự dịu dàng và thấu hiểu.</p>
            <p class="our-promise-signature">Hải ♡ Mỹ</p>
          </div>
        </div>
      </section></main></body></html>`);
      for(const css of styles)await page.addStyleTag({content:css});
      await page.waitForFunction(()=>document.querySelector('#ourPromisePhoto').complete&&document.querySelector('#ourPromisePhoto').naturalWidth>0);
      const result=await page.evaluate(()=>{
        const pick=sel=>document.querySelector(sel);
        const rect=sel=>{const r=pick(sel).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
        const img=pick('#ourPromisePhoto');
        const layout=pick('#forever .our-promise-layout');
        const shell=pick('#forever .our-promise-photo-shell');
        return {
          section:rect('#forever'),layout:rect('#forever .our-promise-layout'),
          figure:rect('#forever .our-promise-visual'),shell:rect('#forever .our-promise-photo-shell'),
          photo:rect('#ourPromisePhoto'),caption:rect('#forever figcaption'),
          letter:rect('#forever .our-promise-letter'),
          overflow:document.documentElement.scrollWidth>innerWidth+2,
          imageFit:getComputedStyle(img).objectFit,
          imagePosition:getComputedStyle(img).position,
          shellMax:getComputedStyle(shell).maxHeight,
          columns:getComputedStyle(layout).gridTemplateColumns,
          natural:{w:img.naturalWidth,h:img.naturalHeight},
          photoVisible:getComputedStyle(img).display!=='none'
        };
      });
      const tag=width+'x'+height+' photo '+naturalW+'/'+naturalH;
      assert.equal(result.overflow,false,tag+' has horizontal overflow');
      assert.equal(result.imageFit,'contain',tag+' uncropped photo');
      assert.equal(result.imagePosition,'relative',tag+' image participates in document flow');
      assert.equal(result.photoVisible,true,tag+' visible');
      assert.equal(result.shellMax,'none',tag+' no old max-height crop');
      assert.ok(result.photo.width>0&&result.photo.height>0,tag+' image must have dimensions');
      const expectedH=result.photo.width*naturalH/naturalW;
      assert.ok(Math.abs(result.photo.height-expectedH)<3,tag+' preserves original aspect ratio');
      assert.ok(Math.abs(result.shell.height-result.photo.height)<4,tag+' shell follows full image height');
      assert.ok(result.caption.top>=result.photo.bottom-2,tag+' caption below full photo');
      assert.ok(result.letter.left>=0&&result.letter.right<=width+2,tag+' text fits viewport');
      assert.ok(result.figure.left>=0&&result.figure.right<=width+2,tag+' figure fits viewport');
      if(columns===1){
        assert.ok(result.letter.top>=result.caption.bottom-3,tag+' stacked text follows caption');
        assert.ok(result.figure.width<=430,tag+' photo has controlled mobile/tablet width');
      }else{
        assert.ok(result.letter.left>=result.figure.right-5,tag+' desktop has side-by-side copy');
        assert.ok(result.figure.width<=457,tag+' portrait stays editorial-sized');
      }
      assert.ok(result.figure.top-result.section.top<125,tag+' no excessive blank top gap');
      await context.close();
    }
  }
  console.log('PASS Promise: uncropped portrait/landscape, 9 viewports, balanced desktop/tablet/mobile, no horizontal overflow');
}finally{await browser.close();}
