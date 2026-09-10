(()=>{
async function detectUltraHdr(file){
  if(!file||!/^image\/jpe?g$/i.test(file.type||''))return false;
  try{
    const buf=await file.slice(0,Math.min(file.size,768*1024)).arrayBuffer();
    const txt=new TextDecoder('latin1').decode(buf);
    return txt.includes('hdrgm:Version')||txt.includes('hdr-gain-map/1.0')||txt.includes('Item:Semantic="GainMap"')||txt.includes("Item:Semantic='GainMap'");
  }catch{return false}
}
function canvasToJpeg(canvas,quality){
  return new Promise((resolve,reject)=>canvas.toBlob(
    b=>b?resolve(b):reject(new Error('Nie udało się skompresować zdjęcia')),
    'image/jpeg',
    quality
  ));
}
async function compress(file){
  const ultraHdr=await detectUltraHdr(file);
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();
    img.decoding='async';
    img.src=url;
    if(img.decode){
      try{await img.decode()}
      catch{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject})}
    }else{
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
    }

    const targetBytes=1000*1024;
    const sides=[2880,2560,2304,2048];
    let lastBlob=null,lastInfo=null;
    for(const maxSide of sides){
      const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      let ctx=null,ctxMode='srgb-unorm8';
      try{
        ctx=canvas.getContext('2d',{alpha:false,colorSpace:'display-p3',colorType:'float16'});
        if(ctx)ctxMode='display-p3-float16';
      }catch{}
      if(!ctx){
        try{
          ctx=canvas.getContext('2d',{alpha:false,colorSpace:'display-p3'});
          if(ctx)ctxMode='display-p3-unorm8';
        }catch{}
      }
      if(!ctx){
        ctx=canvas.getContext('2d',{alpha:false});
        ctxMode='srgb-unorm8';
      }
      if(!ctx)throw new Error('Brak obsługi Canvas 2D');
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.fillStyle='#fff';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const brightness=ultraHdr?1.10:1.04;
      if(brightness!==1)ctx.filter=`brightness(${brightness})`;
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      ctx.filter='none';

      let blob=await canvasToJpeg(canvas,0.98),quality=0.98;
      if(blob.size>targetBytes){
        let lo=0.84,hi=0.98,best=null,bestQ=lo;
        for(let i=0;i<8;i++){
          const q=(lo+hi)/2;
          const candidate=await canvasToJpeg(canvas,q);
          if(candidate.size<=targetBytes){
            best=candidate;
            bestQ=q;
            lo=q;
          }else{
            hi=q;
          }
        }
        if(best){
          blob=best;
          quality=bestQ;
        }else{
          blob=await canvasToJpeg(canvas,0.84);
          quality=0.84;
        }
      }
      lastBlob=blob;
      lastInfo={maxSide,quality,bytes:blob.size,ultraHdr,ctxMode,brightness};
      if(blob.size<=targetBytes){
        window.H3ContestCompression.last=lastInfo;
        console.info('H3 photo compression',lastInfo);
        return blob;
      }
    }
    window.H3ContestCompression.last=lastInfo;
    console.info('H3 photo compression',lastInfo);
    return lastBlob;
  }finally{
    URL.revokeObjectURL(url);
  }
}
window.H3ContestCompression={
  version:6,
  maxSide:2880,
  targetBytes:1000*1024,
  maxJpegQuality:0.98,
  minJpegQuality:0.84,
  normalBrightness:1.04,
  ultraHdrBrightness:1.10,
  colorSpace:'display-p3-float16-with-fallback',
  last:null
};
window.H3ContestCompress=compress;
})();