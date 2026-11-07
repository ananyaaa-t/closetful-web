export function buildBookmarklet(origin: string): string {
  return `(function(){
    var amazon=/(^|\\.)amazon\\.(com|ca|co\\.uk|de|fr|it|es|co\\.jp|in|com\\.au)$/.test(location.hostname);
    var main=document.querySelector('#landingImage, #imgBlkFront');
    var name=document.querySelector('#productTitle');
    var img=main&&main.getAttribute('data-old-hires');
    if(!img&&main){
      try{var dynamic=JSON.parse(main.getAttribute('data-a-dynamic-image')||'{}');img=Object.keys(dynamic)[0];}
      catch(e){console.warn('Closetful could not read the main photo metadata.');}
      img=img||main.currentSrc||main.src;
    }
    if(!amazon){
      var meta=document.querySelector('meta[property="og:image"]');
      img=meta&&meta.content;
      name=document.querySelector('h1');
    }
    var params=new URLSearchParams({url:location.href});
    if(name&&name.textContent.trim())params.set('name',name.textContent.trim().slice(0,500));
    if(img){try{var imageUrl=new URL(img,location.href);if(/^https?:$/.test(imageUrl.protocol))params.set('image_url',imageUrl.href);}
      catch(e){console.warn('Closetful could not read this photo URL.');}}
    var price=document.querySelector(amazon?'#corePrice_feature_div .a-offscreen':'meta[property="product:price:amount"]');
    if(price)params.set('price',(price.content||price.textContent).trim().slice(0,40));
    window.open(${JSON.stringify(`${origin}/save?`)}+params.toString(),'closetful_save','width=460,height=700');
  })();`.replace(/\n\s*/g, "");
}
