(() => {
 'use strict';
 const $ = selector => document.querySelector(selector);
 const media = matchMedia('(prefers-reduced-motion: reduce)');
 if ('IntersectionObserver' in window && !media.matches) {
  document.body.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
   if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
  }), {threshold:.08});
  document.querySelectorAll('.reveal').forEach(node=>observer.observe(node));
 }
 const flavors = ['strawberry','mango','pistachio','blueberry','chocolate','coconut'];
 const names = ['Клубничный моти','Манговый моти','Фисташковый моти','Черничный моти','Шоколадный моти','Кокосовый моти'];
 function showBox(size) {
  const tray=$('#sample-tray');
  tray.dataset.size=String(size);
  tray.setAttribute('aria-label',`Пример бокса на ${size} моти`);
  tray.replaceChildren(...Array.from({length:size},(_,index)=>{
   const slot=document.createElement('div'),picture=document.createElement('img');
   picture.src=`assets/images/${flavors[index%flavors.length]}.webp`;
   picture.alt=names[index%names.length];picture.width=1254;picture.height=1254;
   slot.append(picture);return slot;
  }));
  document.querySelectorAll('.size-tabs button').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.size)===size)));
  $('#sample-label').textContent=({4:'Четыре маленьких радости',6:'Шесть маленьких радостей',9:'Девять маленьких радостей'})[size];
 }
 document.querySelectorAll('.size-tabs button').forEach(button=>button.addEventListener('click',()=>showBox(Number(button.dataset.size))));
 showBox(6);
 const slider=$('#motion-range'),mochi=$('#motion-mochi');
 function paintMotion() {
  const progress=Number(slider.value)/100,eased=progress*progress*(3-2*progress);
  const stage=$('.motion-demo'),distance=stage.clientWidth*.95;
  mochi.style.transform=`translate(calc(-50% + ${distance*eased}px),calc(-50% - ${eased*50}px)) rotate(${eased*24}deg) scale(${1-eased*.25})`;
  mochi.style.opacity=String(1-Math.max(0,(progress-.65)/.35));
 }
 slider.addEventListener('input',paintMotion);window.addEventListener('resize',paintMotion);paintMotion();
 const scrollImage=$('#site-scroll-image'),preview=$('#site-scroll-preview'),replay=$('#scroll-replay');
 if(scrollImage && preview && replay){
  let started=false,playCount=0;
  function playScroll(){started=true;scrollImage.src=scrollImage.dataset.scrollSrc+(playCount++?'?replay='+playCount:'');}
  replay.addEventListener('click',playScroll);
  if(!media.matches){
   if('IntersectionObserver' in window){
    const scrollObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.3)){if(!started)playScroll();scrollObserver.disconnect();}},{threshold:.3});
    scrollObserver.observe(preview);
   }else{playScroll();}
  }
 }
})();
