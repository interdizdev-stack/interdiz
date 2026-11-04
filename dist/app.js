// Content and links are usable without animation or WebGL.
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let userReduced = null;
try { const saved=sessionStorage.getItem('interdiz-reduced'); if(saved!==null) userReduced=saved==='true'; } catch {}
let reduced = userReduced ?? motionPreference.matches;
let scene, animationContext;
let galleryTween, heroTrigger;
const updateProgress = () => {
  const distance = document.documentElement.scrollHeight-innerHeight;
  $('.scroll-progress span').style.transform=`scaleX(${distance>0?scrollY/distance:0})`;
};
addEventListener('scroll',updateProgress,{passive:true});

const projects={
  mama:{title:'Я — мама',description:'Лендинг и ASO-креативы для приложения. Мягкий визуальный язык, который передаёт заботу и чувство уверенности.',image:'./assets/mama.webp',link:'https://interdiz.ru/portfolio.html'},
  poplavok:{title:'Поплавок',description:'Новая digital-глава ресторана у воды в Астрахани. Веб-дизайн, UX/UI, разработка на WordPress и интеграция Telegram / MAX.',image:'./assets/poplavok.webp',link:'https://interdiz.ru/portfolio.html'},
  health:{title:'Health Culture',description:'Фирменный стиль с ощущением чистоты. Логотип и брендбук, которые превращают идею культуры здоровья в цельный визуальный язык.',image:'./assets/health-culture.webp',link:'https://www.behance.net/gallery/248062171/Health-Culture-design-with-a-sense-of-purity'}
};
const dialog=$('.project-dialog');
let dialogOpener;
$$('[data-open-project]').forEach(button=>button.addEventListener('click',()=>{
  const project=projects[button.dataset.openProject];
  dialogOpener=button;
  $('#dialog-title').textContent=project.title;
  $('.dialog-description').textContent=project.description;
  $('.dialog-image').src=project.image;
  $('.dialog-image').alt=`Проект ${project.title}`;
  $('.dialog-link').href=project.link;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}));
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');dialogOpener?.focus({preventScroll:true});});

// Native details keep the service list keyboard accessible and work without JS.
$$('.service').forEach(service=>service.addEventListener('toggle',()=>{
  if(service.open)$$('.service').forEach(other=>{if(other!==service)other.open=false;});
  window.ScrollTrigger?.refresh();
}));

function updateMotionButton(){
  $('.motion-toggle').setAttribute('aria-pressed',String(reduced));
  $('.motion-toggle').setAttribute('aria-label',reduced?'Включить анимации':'Уменьшить движение');
  $('.motion-icon').textContent=reduced?'▷':'Ⅱ';
  $('.motion-label').textContent=reduced?'Включить анимации':'Меньше движения';
  document.documentElement.classList.toggle('reduced-motion',reduced);
}
updateMotionButton();

function setupAnimations(){
  if(!window.gsap||!window.ScrollTrigger)return;
  const {gsap,ScrollTrigger}=window;
  animationContext?.revert();
  galleryTween=null;heroTrigger=null;
  scene?.setReduced(reduced);
  if(scene)Object.assign(scene.state,{explosion:0,rotation:0,zoom:0,portal:0,opacity:1});
  document.documentElement.classList.toggle('motion-enabled',!reduced);
  updateMotionButton();
  if(reduced){scene?.refresh();ScrollTrigger.refresh();return;}
  gsap.registerPlugin(ScrollTrigger);
  animationContext=gsap.context(()=>{
    const media=gsap.matchMedia();
    media.add({desktop:'(min-width: 901px)',mobile:'(max-width: 900px)'},context=>{
      const mobile=context.conditions.mobile;
      galleryTween=null;
      heroTrigger=null;
      const heroTimeline=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{id:'hero-scene',trigger:'.hero',start:'top top',end:()=>`+=${innerHeight*(mobile?1.65:2.3)}`,pin:true,scrub:.85,anticipatePin:1,invalidateOnRefresh:true,onUpdate:self=>{
        const index=self.progress<.3?0:self.progress<.69?1:2;
        $$('.scene-stages>span').forEach((el,i)=>el.classList.toggle('active',index===i));
        if(scene)scene.refresh();
      }}});
      heroTrigger=heroTimeline.scrollTrigger;
      heroTimeline.to('.hero-line:first-child',{xPercent:-18,y:-110,opacity:0,duration:.34},0)
        .to('.hero-line.outline',{xPercent:22,y:70,opacity:0,duration:.34},0)
        .to('.hero-bottom, .hero-object-label, .hero-topline, .hero-subtitle',{autoAlpha:0,y:-30,duration:.22},0)
        .fromTo('.hero-chapter',{autoAlpha:0,y:80},{autoAlpha:1,y:0,duration:.2},.26)
        .to('.hero-chapter',{autoAlpha:0,y:-60,duration:.16},.57)
        .fromTo('.hero-end',{autoAlpha:0,scale:.85},{autoAlpha:1,scale:1,duration:.17},.74)
        .to('.hero-end',{scale:1.1,duration:.09},.91);
      if(scene){
        heroTimeline.to(scene.state,{explosion:1.4,rotation:1.35,duration:.44},.07)
          .to(scene.state,{explosion:.16,rotation:2.75,portal:1,duration:.25},.51)
          .to(scene.state,{zoom:1,rotation:3.1,opacity:.1,duration:.25},.75);
      }
      gsap.from('.hero h1',{y:45,opacity:0,duration:1.3,ease:'power3.out',clearProps:'opacity'});
      gsap.from('.hero-bottom',{y:25,opacity:0,duration:1,delay:.2,ease:'power2.out'});

      const manifesto=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.manifesto',start:mobile?'top 70%':'top 80%',end:'bottom 40%',scrub:.65}});
      manifesto.from('.manifesto-line',{x:(i)=>i%2?100:-100,opacity:.12,stagger:.2,duration:.55},0)
        .from('.manifesto p',{y:55,opacity:0,duration:.4},.6)
        .from('.manifesto-orbit',{rotate:-45,scale:.8,duration:.9},0);

      if(!mobile){
        const track=$('.project-track');
        const cards=$$('.project-card');
        const distance=()=>track.scrollWidth-$('.gallery-window').clientWidth;
        galleryTween=gsap.to(track,{x:()=>-distance(),ease:'none',scrollTrigger:{id:'gallery',trigger:'.projects',start:'top top',end:()=>`+=${distance()*1.35}`,pin:true,scrub:.8,anticipatePin:1,invalidateOnRefresh:true,onUpdate:self=>{
          const index=Math.min(3,Math.floor(self.progress*2.85)+1);
          $('.gallery-counter').innerHTML=`0${index} <span>/ 03</span>`;
          $('.gallery-progress>span').style.transform=`scaleX(${.12+self.progress*.88})`;
        }}});
        cards.forEach((card,i)=>{
          if(i>0)gsap.fromTo(card,{rotateY:16,rotateZ:3,z:-160,opacity:.55},{rotateY:0,rotateZ:0,z:0,opacity:1,ease:'none',scrollTrigger:{trigger:card,containerAnimation:galleryTween,start:'left right',end:'center center',scrub:true}});
          gsap.fromTo($('.project-image img',card),{xPercent:-5,scale:1.15},{xPercent:5,scale:1.05,ease:'none',scrollTrigger:{trigger:card,containerAnimation:galleryTween,start:'left right',end:'right left',scrub:true}});
        });
      }else{
        $$('.project-card').forEach(card=>{
          gsap.from(card,{y:55,rotationX:8,opacity:.25,transformPerspective:900,scrollTrigger:{trigger:card,start:'top 92%',end:'top 35%',scrub:.5}});
          gsap.fromTo($('.project-image img',card),{yPercent:-5,scale:1.12},{yPercent:5,scale:1.12,scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:.5}});
        });
      }
      gsap.fromTo('.marquee>div',{xPercent:-7},{xPercent:-35,ease:'none',scrollTrigger:{trigger:'.marquee',start:'top bottom',end:'bottom top',scrub:1}});
      $$('.service').forEach((service,i)=>{
        gsap.from(service,{y:65,rotationX:-18,opacity:.2,transformOrigin:'center top',transformPerspective:900,scrollTrigger:{trigger:service,start:'top 96%',end:'top 65%',scrub:.5}});
      });
      gsap.from('.expertise h2',{y:70,opacity:.2,scrollTrigger:{trigger:'.expertise',start:'top 80%',end:'top 25%',scrub:.6}});
      gsap.from('.contact h2',{y:100,rotateX:12,transformPerspective:1200,opacity:.15,scrollTrigger:{trigger:'.contact',start:'top 85%',end:'top 15%',scrub:.75}});
      gsap.from('.contact-links a',{y:30,opacity:0,stagger:.12,duration:.7,scrollTrigger:{trigger:'.contact-links',start:'top 95%'}});
    });
  });
  ScrollTrigger.refresh();
}

$('.motion-toggle').addEventListener('click',()=>{
  const previousSection=[...$$('main>section'),$('.contact')].findLast(el=>el.getBoundingClientRect().top<innerHeight*.5);
  reduced=!reduced;userReduced=reduced;
  try{sessionStorage.setItem('interdiz-reduced',String(reduced));}catch{}
  setupAnimations();
  if(previousSection)scrollTo({top:previousSection.getBoundingClientRect().top+scrollY,behavior:'instant'});
  updateProgress();
});
motionPreference.addEventListener('change',e=>{if(userReduced===null){reduced=e.matches;setupAnimations();}});

// Native links remain useful in the non-script version; account for pinned sections here.
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const target=$(link.getAttribute('href'));if(!target)return;
  event.preventDefault();
  let top=target.getBoundingClientRect().top+scrollY;
  if(target.id==='top'&&heroTrigger)top=heroTrigger.start;
  if(target.id==='projects'&&galleryTween?.scrollTrigger)top=galleryTween.scrollTrigger.start;
  history.replaceState(null,'',link.getAttribute('href'));
  scrollTo({top:Math.max(0,top),behavior:reduced?'instant':'smooth'});
  if(target.id==='main')target.focus({preventScroll:true});
}));

$$('[data-open-project]').forEach(button=>button.addEventListener('focus',()=>{
  if(!button.matches(':focus-visible')||!galleryTween?.scrollTrigger)return;
  const card=button.closest('.project-card');
  const distance=$('.project-track').scrollWidth-$('.gallery-window').clientWidth;
  const progress=Math.min(1,Math.max(0,card.offsetLeft/distance));
  const trigger=galleryTween.scrollTrigger;
  $('.projects').scrollLeft=0;
  scrollTo({top:trigger.start+(trigger.end-trigger.start)*progress,behavior:'instant'});
  window.ScrollTrigger.update();
  galleryTween.progress(progress);
}));

// Import failure or lack of WebGL never hides the page or its links.
async function init(){
  try{
    const {createScene}=await import('./scene.js');
    scene=createScene($('#webgl'),reduced);
    document.documentElement.classList.add('webgl-ready');
  }catch(error){
    document.documentElement.classList.add('webgl-unavailable');
    console.warn('3D unavailable; the complete static page remains available.',error.message);
  }
  setupAnimations();
  await document.fonts.ready;
  window.ScrollTrigger?.refresh();
  updateProgress();
  $$('img').forEach(img=>{if(!img.complete)img.addEventListener('load',()=>window.ScrollTrigger?.refresh(),{once:true});});
}
if(document.readyState==='complete')init();else addEventListener('load',init,{once:true});
addEventListener('pagehide',e=>{if(!e.persisted){scene?.dispose();animationContext?.revert();}});
