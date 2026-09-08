(()=>{
const logo='<svg class="google-photos-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M12 2a5 5 0 0 1 5 5v5h-5a5 5 0 0 1 0-10z"/><path fill="#34A853" d="M22 12a5 5 0 0 1-5 5h-5v-5a5 5 0 0 1 10 0z"/><path fill="#FBBC04" d="M12 22a5 5 0 0 1-5-5v-5h5a5 5 0 0 1 0 10z"/><path fill="#EA4335" d="M2 12a5 5 0 0 1 5-5h5v5a5 5 0 0 1-10 0z"/></svg>';
function patchLabel(label){if(!label||label.dataset.googlePhotosStyled)return;label.dataset.googlePhotosStyled='1';const input=label.querySelector('input');label.innerHTML=logo+'<span>Google Photos</span>';if(input)label.appendChild(input)}
function patch(){document.querySelectorAll('[data-google-photos-admin],[data-google-photos-contest]').forEach(patchLabel)}
patch();new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
})();