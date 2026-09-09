(()=>{
let port=null;
window.H3NativeBridge={
  ready:()=>!!port,
  update:(url,version)=>{
    if(!port)return false;
    try{port.postMessage(`H3_UPDATE\n${url}\n${version}`);return true}catch{return false}
  }
};
window.addEventListener('message',e=>{
  if(typeof e.origin!=='string'||!e.origin.startsWith('android://'))return;
  if(e.data!=='H3_NATIVE_BRIDGE_READY'||!e.ports?.[0])return;
  port=e.ports[0];
  try{port.start?.()}catch{}
  window.dispatchEvent(new Event('h3-native-bridge-ready'));
});
})();
