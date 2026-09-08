(()=>{
const list=document.getElementById('adminDevices');
if(!list)return;
let decorating=false;

try{
  const previousRecover=recoverWithCode;
  recoverWithCode=async function(code){
    try{
      const{data,error}=await sb.rpc('admin_recover_access',{p_device_token:adminDevice,p_recovery_code:code});
      if(error)throw error;
      persistAdminToken(adminDevice);
      return data;
    }catch(generalError){
      return previousRecover(code);
    }
  };
}catch(e){console.warn('Recovery activation hook failed',e)}

function decorate(){
  if(decorating)return;
  decorating=true;
  try{
    list.querySelectorAll('[data-remove-admin]').forEach(remove=>{
      if(remove.dataset.recoveryDecorated==='1')return;
      remove.dataset.recoveryDecorated='1';
      const adminId=remove.dataset.removeAdmin;
      const row=remove.closest('.admin-row');
      if(!row)return;
      const actions=document.createElement('div');
      actions.className='admin-device-actions';
      remove.parentNode.insertBefore(actions,remove);
      actions.appendChild(remove);
      const recover=document.createElement('button');
      recover.type='button';
      recover.className='recovery-button';
      recover.textContent='Odzyskaj';
      recover.dataset.recoverAdmin=adminId;
      actions.appendChild(recover);
    });
  }finally{decorating=false}
}

async function createRecovery(button){
  const adminId=button.dataset.recoverAdmin;
  const row=button.closest('.admin-row');
  if(!adminId||!row)return;
  button.disabled=true;
  try{
    const{data,error}=await sb.rpc('admin_create_recovery_code',{p_device_token:adminDevice,p_admin_id:adminId});
    if(error)throw error;
    row.querySelector('.admin-recovery-code')?.remove();
    const box=document.createElement('div');
    box.className='admin-recovery-code';
    box.innerHTML=`<strong>Jednorazowy kod odzyskiwania</strong><code>${esc(data)}</code><button type="button" class="admin-recovery-copy">Kopiuj kod</button>`;
    row.querySelector('.admin-device-actions')?.appendChild(box);
    box.querySelector('.admin-recovery-copy').onclick=async()=>{
      try{await navigator.clipboard.writeText(data);msg('Kod skopiowany ✓')}catch{msg('Nie udało się skopiować kodu.',true)}
    };
    msg('Wygenerowano jednorazowy kod odzyskiwania ✓');
  }catch(e){msg(e.message||'Nie udało się utworzyć kodu odzyskiwania.',true)}
  finally{button.disabled=false}
}

list.addEventListener('click',e=>{
  const button=e.target.closest('[data-recover-admin]');
  if(button)createRecovery(button);
});

new MutationObserver(decorate).observe(list,{childList:true,subtree:true});
decorate();

const audit=document.getElementById('auditLogs');
if(audit){
  const relabel=()=>audit.querySelectorAll('.audit-row>strong').forEach(el=>{
    if(el.textContent==='admin_recovery_code_created')el.textContent='Utworzono kod odzyskiwania administratora';
    if(el.textContent==='admin_access_recovered')el.textContent='Odzyskano dostęp administratora';
  });
  new MutationObserver(relabel).observe(audit,{childList:true,subtree:true});
  relabel();
}
})();