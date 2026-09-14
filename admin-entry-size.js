(()=>{
  if(!document.querySelector('script[data-photo-source-picker]')){
    const s=document.createElement('script');
    s.src='photo-source-picker.js?v=1';
    s.dataset.photoSourcePicker='1';
    document.body.appendChild(s);
  }

  if(typeof renderDashboard!=='function')return;

  const EMPTY_PIXEL='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

  function formatFileSize(bytes){
    const n=Number(bytes);
    if(!Number.isFinite(n)||n<0)return 'brak danych';
    if(n>=1024*1024)return `${(n/(1024*1024)).toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})} MB`;
    if(n>=1024)return `${(n/1024).toLocaleString('pl-PL',{minimumFractionDigits:1,maximumFractionDigits:1})} KB`;
    return `${Math.round(n)} B`;
  }

  function isPanelActive(key){
    const panel=document.querySelector(`.admin-function-panel[data-admin-panel="${key}"]`);
    if(panel)return panel.classList.contains('active');
    return location.hash===`#admin-${key}`;
  }

  function prepareDeferredImages(images,urls){
    [...images].forEach((img,index)=>{
      const url=urls[index];
      if(!img||!url)return;
      img.loading='lazy';
      img.decoding='async';
      try{img.fetchPriority='low'}catch{}
      img.dataset.h3DeferredSrc=url;
      if(img.getAttribute('src')!==EMPTY_PIXEL)img.src=EMPTY_PIXEL;
    });
  }

  function activateDeferredImages(root){
    if(!root)return;
    root.querySelectorAll('img[data-h3-deferred-src]').forEach(img=>{
      const url=img.dataset.h3DeferredSrc;
      if(url&&img.getAttribute('src')!==url)img.src=url;
    });
  }

  function releaseDeferredImages(root){
    if(!root)return;
    root.querySelectorAll('img[data-h3-deferred-src]').forEach(img=>{
      if(img.getAttribute('src')!==EMPTY_PIXEL)img.src=EMPTY_PIXEL;
    });
  }

  function syncDeferredImages(){
    if(typeof entriesEl!=='undefined'){
      if(isPanelActive('contest'))activateDeferredImages(entriesEl);
      else releaseDeferredImages(entriesEl);
    }
    if(typeof galleryTiles!=='undefined'){
      if(isPanelActive('photos'))activateDeferredImages(galleryTiles);
      else releaseDeferredImages(galleryTiles);
    }
  }

  const originalPhoto=typeof photo==='function'?photo:null;
  const originalRenderDashboard=renderDashboard;
  renderDashboard=function(data){
    const entries=data?.entries||[];
    const entryUrls=originalPhoto?entries.map(entry=>originalPhoto(entry?.image_path)):[];
    let currentPhoto=null;
    if(originalPhoto){
      currentPhoto=photo;
      photo=()=>EMPTY_PIXEL;
    }
    try{
      originalRenderDashboard(data);
    }finally{
      if(originalPhoto)photo=currentPhoto;
    }

    if(typeof entryCount!=='undefined'&&data?.entry_count!=null){
      entryCount.textContent=String(Number(data.entry_count)||0);
    }

    const rows=entriesEl?.querySelectorAll('.entry-row')||[];
    prepareDeferredImages(entriesEl?.querySelectorAll('.entry-row img')||[],entryUrls);
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
    if(isPanelActive('contest'))activateDeferredImages(entriesEl);
  };

  if(typeof renderGallery==='function'&&typeof galleryPhoto==='function'){
    const originalGalleryPhoto=galleryPhoto;
    const originalRenderGallery=renderGallery;
    renderGallery=function(tiles){
      const list=Array.isArray(tiles)?tiles:[];
      const galleryUrls=[];
      list.forEach(tile=>{
        if(tile?.type!=='folder')return;
        (tile.photos||[]).forEach(item=>galleryUrls.push(originalGalleryPhoto(item?.image_path)));
      });
      const currentGalleryPhoto=galleryPhoto;
      galleryPhoto=()=>EMPTY_PIXEL;
      try{
        originalRenderGallery(tiles);
      }finally{
        galleryPhoto=currentGalleryPhoto;
      }
      prepareDeferredImages(galleryTiles?.querySelectorAll('.gallery-thumb img')||[],galleryUrls);
      if(isPanelActive('photos'))activateDeferredImages(galleryTiles);
    };
  }

  document.addEventListener('click',event=>{
    const open=event.target.closest?.('[data-admin-open]');
    if(open){
      const key=open.dataset.adminOpen;
      requestAnimationFrame(()=>{
        if(typeof entriesEl!=='undefined'){
          if(key==='contest')activateDeferredImages(entriesEl);
          else releaseDeferredImages(entriesEl);
        }
        if(typeof galleryTiles!=='undefined'){
          if(key==='photos')activateDeferredImages(galleryTiles);
          else releaseDeferredImages(galleryTiles);
        }
      });
      return;
    }
    if(event.target.closest?.('.admin-function-back'))requestAnimationFrame(syncDeferredImages);
  },true);

  window.addEventListener('hashchange',()=>requestAnimationFrame(syncDeferredImages));
  window.addEventListener('popstate',()=>requestAnimationFrame(syncDeferredImages));
  window.addEventListener('pageshow',()=>requestAnimationFrame(syncDeferredImages));
  window.addEventListener('pagehide',()=>{
    if(typeof entriesEl!=='undefined')releaseDeferredImages(entriesEl);
    if(typeof galleryTiles!=='undefined')releaseDeferredImages(galleryTiles);
  });

  setTimeout(syncDeferredImages,1200);
})();
