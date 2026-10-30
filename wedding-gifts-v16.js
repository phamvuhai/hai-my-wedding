/* Wedding gifts V16 — public bank-gift cards.  The default TPBank VietQR
   modules were recreated from the decoded QR supplied by the couple;
   no external QR service is called and the payment payload is unchanged. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=$('weddingGifts');
if(!root)return;
const db=window.WEDDING_CONFIG?.supabaseUrl && window.supabase
  ?window.supabase.createClient(window.WEDDING_CONFIG.supabaseUrl,window.WEDDING_CONFIG.supabaseAnonKey):null;
const QR65='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/jsUaA2jP4BBK9iqNiyQQC6EgZ4tNsugF0Bq1MiwJdALrVcX7hVS6AQRDfcbglEEA/qqqqqqqv4AASHAx/kTAAAznxi+xy5oAGRkqbxfllkAFbP7r6SNeKALKXt2lVB1YAvsgTeuGvl4AqgpX2VyIbQDjhl1AS3jHAHp2YsD4EWkAOr/qFGqTB6AMKnJtnL7bYA50CAaEsh9gBm5AmfOT4RQDSceoodzIhAH6RjdwasFDABaJsP09VEmAaKyv9ALI10A2scufDt3IgBGSgHUHaGKABf58u/ENn5AHxu3dEIZ8VAHrYZuuE0qyAZEVNEbHJRIAv77Ifvml+wBkw1t8GSQHgC7pfOrMpLfgDqspbTSGS1AO9LVFFkyBSANv0iJwfdVIA8oOBXJVPkgAObeSJtJhRQAeAsGOTJvEgAx1mf2QyUmAGakh7kOSzSAEMkD9FpyvAAMlctbOUlq4BYzq1E4S6WQDKToczwTqgAFy/qoLZ52kAKe2ChooQbqAfFoDtYlO1cAA7ojfqJM/oAAStQR9qRGQD+/RsrnJqtAEEdQnG2A0TALoXKL6gd/qAXUz0NHJF1IAuo/b0H9kDgBBOVUVyxfxwD+G0RXIzIpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
const defaults={enabled:true,visibility:'public',
 groom:{enabled:true,bank:'TPBank',holder:'PHAM VU HAI',account:'04480062888',qrPath:''},
 bride:{enabled:false,bank:'',holder:'NGUYEN THI MY',account:'',qrPath:''}};
let config=structuredClone(defaults),currentLang='vi';
const dict={
 vi:{eyebrow:'WITH LOVE & GRATITUDE',title:'Thông tin mừng cưới',lead:'Sự hiện diện và những lời chúc của bạn là niềm hạnh phúc của chúng mình. Nếu muốn gửi chút yêu thương từ xa, bạn có thể tham khảo thông tin dưới đây.',groom:'NHÀ TRAI',bride:'NHÀ GÁI',bank:'Ngân hàng',holder:'Chủ tài khoản',account:'Số tài khoản',copy:'Sao chép số tài khoản',copied:'Đã sao chép!',missing:'Thông tin đang được cập nhật',scan:'Quét mã VietQR để chuyển khoản',footer:'Cảm ơn bạn vì những tình cảm dành cho Hải & Mỹ ♡',unavailable:'QR chưa được cung cấp'},
 en:{eyebrow:'WITH LOVE & GRATITUDE',title:'Wedding Gift Information',lead:'Your presence and warm wishes mean the world to us. If you would like to send your love from afar, here are our bank details.',groom:'GROOM',bride:'BRIDE',bank:'Bank',holder:'Account holder',account:'Account number',copy:'Copy account number',copied:'Copied!',missing:'Details coming soon',scan:'Scan this VietQR to transfer',footer:'Thank you for your love and kind wishes ♡',unavailable:'QR not available'},
 ja:{eyebrow:'感謝を込めて',title:'お祝いのご案内',lead:'皆さまのお気持ちとお祝いの言葉が、私たちにとって何よりの贈り物です。遠方からお祝いをお送りいただく場合は、以下の口座情報をご参照ください。',groom:'新郎',bride:'新婦',bank:'銀行名',holder:'口座名義',account:'口座番号',copy:'口座番号をコピー',copied:'コピーしました',missing:'口座情報は準備中です',scan:'VietQR を読み取ってお振り込みください',footer:'温かいお心遣いに感謝いたします ♡',unavailable:'QRコードは準備中です'}
};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function lang(){
 const v=window.WeddingI18n?.language||document.documentElement.lang||'vi';
 return v==='jp'?'ja':v==='ja'?'ja':v==='en'?'en':'vi';
}
function normalize(saved){
 if(!saved||typeof saved!=='object')return structuredClone(defaults);
 const out={...defaults,enabled:saved.enabled!==false,visibility:saved.visibility==='private'?'private':'public'};
 for(const side of ['groom','bride']){
  const orig=defaults[side],data=saved[side]&&typeof saved[side]==='object'?saved[side]:{};
  out[side]={enabled:data.enabled===undefined?orig.enabled:data.enabled===true,
   bank:String(data.bank??orig.bank).slice(0,100),holder:String(data.holder??orig.holder).slice(0,120),
   account:String(data.account??orig.account).slice(0,45),qrPath:String(data.qrPath||'').slice(0,350)};
 }
 return out;
}
function privateInvite(){
 return /^\/(?:vi|en|jp)\/invite\/[a-zA-Z0-9_-]+(?:\/|$)/.test(location.pathname);
}
function makeQr(){
 try{
  const bytes=atob(QR65);
  if(bytes.length!==529)throw Error('Invalid QR size');
  const canvas=document.createElement('canvas'),cell=6,dim=65;
  canvas.width=canvas.height=cell*dim;
  const ctx=canvas.getContext('2d');
  if(!ctx)return null;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#111';
  for(let y=0;y<dim;y++)for(let x=0;x<dim;x++){
    const n=y*dim+x;if((bytes.charCodeAt(n>>3)>>(7-(n&7)))&1)ctx.fillRect(x*cell,y*cell,cell,cell);
  }
  return canvas.toDataURL('image/png');
 }catch(err){console.error('Gift QR initialization:',err);return null;}
}
let defaultQr=null;
function qrSource(side){
 if(side.qrPath){
  if(/^wedding-gifts\/[\w./-]+\.(png|jpe?g|webp)$/i.test(side.qrPath))
    return db?.storage.from('wedding-gallery').getPublicUrl(side.qrPath)?.data?.publicUrl||'';
  return '';
 }
 return side===config.groom?(defaultQr??(defaultQr=makeQr())):'';
}
function card(side,id,t){
 const name=id==='groom'?t.groom:t.bride;
 const valid=side.enabled&&side.bank.trim()&&side.holder.trim()&&side.account.trim();
 if(!valid)return '<article class="wedding-gift-card wedding-gift-unavailable" data-gift-side="'+id+'"><div class="wedding-gift-card-top"><span class="wedding-gift-role">'+name+'</span><span class="wedding-gift-icon" aria-hidden="true">♡</span></div><span class="wedding-gift-person">'+(id==='groom'?'Hải':'Mỹ')+'</span><div class="wedding-gift-pending"><span aria-hidden="true">✧</span><p>'+t.missing+'</p></div></article>';
 const qr=qrSource(side);
 return '<article class="wedding-gift-card" data-gift-side="'+id+'"><div class="wedding-gift-card-top"><span class="wedding-gift-role">'+name+'</span><span class="wedding-gift-icon" aria-hidden="true">♡</span></div><span class="wedding-gift-person">'+(id==='groom'?'Hải':'Mỹ')+'</span>'+
 '<div class="wedding-gift-qr">'+(qr?'<img src="'+escapeHtml(qr)+'" loading="lazy" decoding="async" alt="'+escapeHtml(t.scan)+'">':'<span class="wedding-gift-no-qr">'+t.unavailable+'</span>')+'</div>'+
 '<p class="wedding-gift-bank">'+escapeHtml(side.bank)+'</p>'+
 '<div class="wedding-gift-fields"><div><span>'+t.holder+'</span><strong>'+escapeHtml(side.holder)+'</strong></div><div><span>'+t.account+'</span><strong class="wedding-gift-number">'+escapeHtml(side.account)+'</strong></div></div>'+
 '<button type="button" class="wedding-gift-copy" data-gift-copy="'+id+'"><span aria-hidden="true">⧉</span> '+t.copy+'</button></article>';
}
function render(){
 currentLang=lang();const t=dict[currentLang];
 if(!config.enabled||(config.visibility==='private'&&!privateInvite())){root.hidden=true;root.innerHTML='';return;}
 root.hidden=false;
 root.innerHTML='<div class="wedding-gift-inner"><header class="wedding-gift-heading"><span class="wedding-gift-eyebrow">'+t.eyebrow+'</span><h2>'+t.title+'</h2><p>'+t.lead+'</p></header>'+
 '<div class="wedding-gift-grid">'+card(config.groom,'groom',t)+card(config.bride,'bride',t)+'</div>'+
 '<p class="wedding-gift-footer">'+t.footer+'</p></div>';
}
root.addEventListener('click',async event=>{
 const btn=event.target.closest('[data-gift-copy]');if(!btn)return;
 const side=config[btn.dataset.giftCopy];if(!side?.account)return;
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(side.account);
  else {
   const field=document.createElement('textarea');field.value=side.account;field.style.position='fixed';field.style.opacity='0';
   document.body.appendChild(field);field.select();
   if(!document.execCommand('copy'))throw Error('Copy not supported');
   field.remove();
  }
  btn.textContent=dict[lang()].copied;
  btn.classList.add('is-copied');
  btn.blur();
 }catch(error){console.warn('Copy account failed:',error);btn.textContent=side.account;}
});
document.addEventListener('wedding:language',render);
document.addEventListener('wedding:invite-loaded',render);
render();
if(db)db.from('site_content').select('value_vi').eq('key','wedding_gifts_v1').maybeSingle()
 .then(({data,error})=>{if(error){console.warn('Gift config:',error.message);return;}
  if(data?.value_vi){try{config=normalize(JSON.parse(data.value_vi))}catch(err){console.warn('Gift config parse:',err)}}
  render();
 }).catch(error=>console.warn('Gift settings unavailable:',error));
})();