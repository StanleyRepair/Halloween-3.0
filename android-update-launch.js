(()=>{
const META_URL='https://raw.githubusercontent.com/StanleyRepair/Halloween-3.0/main/downloads/android-version.json';
const PACKAGE='pl.stanleyrepair.halloween3';
const MIN_NATIVE_CODE=9;
let meta=null;

function installed(){
  try{
    const code=Number(localStorage.getItem('h3_apk_version_code')||0);
    const apk=localStorage.getItem('h3_android_apk')==='1';
    return {code,apk};
  }catch{return {code:0,apk:false}}
}

async function refreshMeta(){
  try{
    const r=await fetch(`${META_URL}?t=${Date.now()}`,{cache:'no-store'});
    if(!r.ok)return;
    const m=await r.json();
    if(m&&m.version&&m.apkUrl&&Number(m.versionCode)>0)meta=m;
  }catch{}
}

refreshMeta();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshMeta()});

document.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-app-update]');
  if(!button||button.disabled)return;
  const cur=installed();
  if(!cur.apk||cur.code<MIN_NATIVE_CODE||!meta)return;
  const latest=Number(meta.versionCode)||0;
  if(latest<=cur.code)return;

  // Keep the external-app launch inside the original tap. Awaiting a network
  // request here loses Chrome's transient user activation and can produce the
  // misleading "Ta strona chce otworzyć aplikację" confirmation.
  e.preventDefault();
  e.stopImmediatePropagation();
  button.disabled=true;

  const q=`url=${encodeURIComponent(meta.apkUrl)}&version=${encodeURIComponent(meta.version)}`;
  const intent=`intent://update?${q}#Intent;scheme=halloween3;package=${PACKAGE};end`;
  location.href=intent;
},true);
})();
