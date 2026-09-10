(()=>{
function loadCss(){if(document.querySelector('link[data-h3-rich-css]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='rich-text.css?v=2';l.dataset.h3RichCss='1';document.head.appendChild(l)}
function loadCore(){if(window.H3RichText)return Promise.resolve(window.H3RichText);if(window.H3RichTextReady)return window.H3RichTextReady;window.H3RichTextReady=new Promise((resolve,reject)=>{const existing=document.querySelector('script[data-h3-rich-core]');if(existing){if(window.H3RichText)return resolve(window.H3RichText);existing.addEventListener('load',()=>resolve(window.H3RichText),{once:true});existing.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src='rich-text.js?v=4';s.dataset.h3RichCore='1';s.onload=()=>resolve(window.H3RichText);s.onerror=reject;document.head.appendChild(s)});return window.H3RichTextReady}
const selector='#newNewsBody,.news-body,#adminOtherEditor textarea[data-field="body"]';
function enhanceNode(node){if(!window.H3RichText||!node||node.nodeType!==1)return;if(node.matches?.(selector))window.H3RichText.enhanceTextarea(node);node.querySelectorAll?.(selector).forEach(x=>window.H3RichText.enhanceTextarea(x))}
function initial(){document.querySelectorAll(selector).forEach(x=>window.H3RichText.enhanceTextarea(x))}
let observer=null;
loadCss();loadCore().then(()=>{initial();const root=document.getElementById('dashboard')||document.body;observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)enhanceNode(n)});observer.observe(root,{childList:true,subtree:true})}).catch(e=>console.warn('Rich text admin failed',e));
window.addEventListener('pagehide',()=>observer?.disconnect(),{once:true});
})();
