(()=>{
const createBtn=document.getElementById('createNewsPost');if(!createBtn)return;
const wrap=document.createElement('label');wrap.className='switch-row';wrap.style.marginTop='4px';wrap.innerHTML='<div><strong>Wyślij powiadomienie push</strong><small>Po opublikowaniu wpisu powiadom zapisane urządzenia.</small></div><input id="newNewsPush" type="checkbox"><span class="switch"></span>';
createBtn.parentNode.insertBefore(wrap,createBtn);
})();