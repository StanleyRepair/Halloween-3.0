(()=>{
const dashboard=document.getElementById('dashboard'),identity=document.getElementById('identity');if(!dashboard||!identity||document.getElementById('shareAppButton'))return;
const wrap=document.createElement('div');wrap.className='admin-share-strip';wrap.innerHTML='<button id="shareAppButton" class="secondary admin-share-app" type="button">📤 Udostępnij aplikację</button>';
identity.insertAdjacentElement('afterend',wrap);
const btn=wrap.querySelector('#shareAppButton');
const shareUrl='https://stanleyrepair.github.io/Halloween-3.0/install/';
async function copyLink(){try{await navigator.clipboard.writeText(shareUrl)}catch{const t=document.createElement('textarea');t.value=shareUrl;t.style.cssText='position:fixed;opacity:0;pointer-events:none';document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}if(typeof msg==='function')msg('Link instalacyjny skopiowany ✓')}
btn.addEventListener('click',async()=>{btn.disabled=true;try{if(navigator.share){await navigator.share({title:'Halloween 3.0 🎃',text:'Zainstaluj aplikację Halloween 3.0',url:shareUrl})}else await copyLink()}catch(e){if(e?.name!=='AbortError'){console.warn(e);await copyLink()}}finally{btn.disabled=false}});
})();