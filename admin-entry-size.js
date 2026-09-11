(()=>{
  if(!document.querySelector('script[data-photo-source-picker]')){
    const s=document.createElement('script');
    s.src='photo-source-picker.js?v=1';
    s.dataset.photoSourcePicker='1';
    document.body.appendChild(s);
  }

  if(typeof renderDashboard!=='function')return;

  function formatFileSize(bytes){
    const n=Number(bytes);
    if(!Number.isFinite(n)||n<0)return 'brak danych';
    if(n>=1024*1024)return `${(n/(1024*1024)).toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})} MB`;
    if(n>=1024)return `${(n/1024).toLocaleString('pl-PL',{minimumFractionDigits:1,maximumFractionDigits:1})} KB`;
    return `${Math.round(n)} B`;
  }

  const originalRenderDashboard=renderDashboard;
  renderDashboard=function(data){
    originalRenderDashboard(data);
    const entries=data?.entries||[];
    const rows=entriesEl?.querySelectorAll('.entry-row')||[];
    rows.forEach((row,index)=>{
      const info=row.querySelector('.entry-info');
      const vote=row.querySelector('.vote-pill');
      if(!info||info.querySelector('.entry-file-size'))return;
      const size=document.createElement('span');
      size.className='admin-meta entry-file-size';
      size.textContent=` • zdjęcie: ${formatFileSize(entries[index]?.file_size_bytes)}`;
      if(vote)vote.insertAdjacentElement('afterend',size);
      else info.appendChild(size);
    });
  };

  if(typeof dashboard!=='undefined'&&!dashboard.hidden&&typeof loadDashboard==='function')loadDashboard();
})();