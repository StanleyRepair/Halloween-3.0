(()=>{
if(typeof sb==='undefined'||sb.__h3AdminMediaStorageBridge)return;
const originalRpc=sb.rpc.bind(sb);
function has(o,k){return Object.prototype.hasOwnProperty.call(o||{},k)}
async function invoke(body){
  const{data,error}=await sb.functions.invoke('media-storage',{body});
  if(error||data?.error)return{data:null,error:error||new Error(data.error)};
  if(data?.cleanup_warning)console.warn('Operacja zapisana, ale sprzątanie pliku zgłosiło problem:',data.cleanup_warning);
  if(Array.isArray(data?.warnings)&&data.warnings.length)console.warn('Sprzątanie plików:',data.warnings);
  return{data:data?.data??null,error:null};
}
sb.rpc=async function(name,args={},options){
  const token=String(args?.p_device_token||'');
  if(name==='admin_add_gallery_photo')return invoke({action:'gallery_add_photo',device_token:token,tile_id:String(args?.p_tile_id||''),image_path:String(args?.p_image_path||''),caption:String(args?.p_caption||'')});
  if(name==='admin_delete_gallery_photo')return invoke({action:'gallery_delete_photo',device_token:token,photo_id:String(args?.p_photo_id||'')});
  if(name==='admin_delete_gallery_folder')return invoke({action:'gallery_delete_folder',device_token:token,tile_id:String(args?.p_tile_id||'')});
  if(name==='admin_create_news'&&has(args,'p_image_path'))return invoke({action:'news_create',device_token:token,title:String(args?.p_title||''),body:String(args?.p_body||''),icon:String(args?.p_icon||'🎃'),badge:String(args?.p_badge||''),image_path:String(args?.p_image_path||'')});
  if(name==='admin_update_news'&&has(args,'p_image_path'))return invoke({action:'news_update',device_token:token,news_id:String(args?.p_news_id||''),title:String(args?.p_title||''),body:String(args?.p_body||''),icon:String(args?.p_icon||'🎃'),badge:String(args?.p_badge||''),active:args?.p_active!==false,image_path:String(args?.p_image_path||'')});
  if(name==='admin_delete_news')return invoke({action:'news_delete',device_token:token,news_id:String(args?.p_news_id||'')});
  if(name==='admin_update_other_tile')return invoke({action:'other_update',device_token:token,tile_id:String(args?.p_tile_id||''),title:String(args?.p_title||''),icon:String(args?.p_icon||''),body:String(args?.p_body||''),active:args?.p_active!==false,image_path:String(args?.p_image_path||'')});
  if(name==='admin_delete_other_tile')return invoke({action:'other_delete',device_token:token,tile_id:String(args?.p_tile_id||'')});
  return originalRpc(name,args,options);
};
sb.__h3AdminMediaStorageBridge=true;
})();