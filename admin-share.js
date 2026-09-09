(()=>{
const dashboard=document.getElementById('dashboard'),identity=document.getElementById('identity');if(!dashboard||!identity||document.getElementById('shareAppButton'))return;
const wrap=document.createElement('div');wrap.className='admin-share-strip';wrap.innerHTML='<button id="shareAppButton" class="secondary admin-share-app" type="button">📤 Udostępnij aplikację</button><div class="admin-share-caption">Wybierz sposób udostępniania</div><div class="admin-share-options"><button id="shareAppWithText" class="secondary admin-share-option" type="button">📝 Z opisem</button><button id="shareAppLinkOnly" class="secondary admin-share-option" type="button">🔗 Sam link</button></div>';
identity.insertAdjacentElement('afterend',wrap);
const mainBtn=wrap.querySelector('#shareAppButton'),withTextBtn=wrap.querySelector('#shareAppWithText'),linkOnlyBtn=wrap.querySelector('#shareAppLinkOnly');
const shareUrl='https://stanleyrepair.github.io/Halloween-3.0/install/';
const shareTitle='Halloween 3.0 🎃';
const shareText='🎃 Halloween 3.0\nZainstaluj aplikację imprezy Halloween 3.0. Znajdziesz w niej aktualności, konkurs, zdjęcia i wszystkie najważniejsze informacje.';
async function copy(value,message){try{await navigator.clipboard.writeText(value)}catch{const t=document.createElement('textarea');t.value=value;t.style.cssText='position:fixed;opacity:0;pointer-events:none';document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}if(typeof msg==='function')msg(message)}
async function share(mode,button){button.disabled=true;try{if(navigator.share){if(mode==='link')await navigator.share({url:shareUrl});else await navigator.share({title:shareTitle,text:shareText,url:shareUrl})}else{if(mode==='link')await copy(shareUrl,'Link instalacyjny skopiowany ✓');else await copy(`${shareText}\n\n${shareUrl}`,'Opis z linkiem skopiowany ✓')}}catch(e){if(e?.name!=='AbortError'){console.warn(e);if(mode==='link')await copy(shareUrl,'Link instalacyjny skopiowany ✓');else await copy(`${shareText}\n\n${shareUrl}`,'Opis z linkiem skopiowany ✓')}}finally{button.disabled=false}}
mainBtn.addEventListener('click',()=>share('text',mainBtn));
withTextBtn.addEventListener('click',()=>share('text',withTextBtn));
linkOnlyBtn.addEventListener('click',()=>share('link',linkOnlyBtn));
})();