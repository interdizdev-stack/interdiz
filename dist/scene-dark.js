import * as THREE from './vendor/three.module.js';

// A segmented trefoil sculpture: a single geometric language, three scroll states.
export function createScene(container, reduced = false) {
  let mobile = matchMedia('(max-width: 700px)').matches;
  const compactLayout = matchMedia('(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.65));
  renderer.setClearColor(0x101210, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .88;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0, 12);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#414a35');
  const roomMaterial = new THREE.MeshBasicMaterial({ color: 0x171b13, side: THREE.BackSide });
  const room = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), roomMaterial);
  studio.add(room);
  const panels = [
    [0, 8, 0, 9, 1, 6, 0xffffff, 2.5],
    [-7, 1, 4, 1, 7, 3, 0xf0ffd2, 2],
    [7, 2, 2, 1, 8, 5, 0xffffff, 3],
    [0, -5, -3, 8, 1, 5, 0x92b84d, 1],
    [0, 0, 8, 1, 9, 1, 0xffffff, 2]
  ];
  panels.forEach(([x,y,z,w,h,d,color,intensity]) => {
    const m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    m.color.multiplyScalar(intensity);
    const p = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
    p.position.set(x,y,z); studio.add(p);
  });
  const env = pmrem.fromScene(studio, 0.03);
  scene.environment = env.texture;
  studio.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  pmrem.dispose();
  scene.add(new THREE.AmbientLight(0xffffff, .55));
  const key = new THREE.DirectionalLight(0xf5ffe3, 2.2);
  key.position.set(-3, 7, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc2ff43, 2);
  rim.position.set(4, -2, -4); scene.add(rim);

  const limeMaterial = new THREE.MeshPhysicalMaterial({ color:0x9beb12, metalness:0.24, roughness:0.27, clearcoat:1, clearcoatRoughness:0.12, envMapIntensity:.85 });
  const chromeMaterial = new THREE.MeshPhysicalMaterial({ color:0xd9e2cf, metalness:1, roughness:0.16, clearcoat:0.8, envMapIntensity:1.4 });
  const darkMaterial = new THREE.MeshPhysicalMaterial({ color:0x3b472c, metalness:0.8, roughness:0.24 });
  const sculpture = new THREE.Group();
  const world = new THREE.Group();
  world.add(sculpture); scene.add(world);

  class KnotSection extends THREE.Curve {
    constructor(start, end) { super(); this.start = start; this.end = end; }
    getPoint(t, target = new THREE.Vector3()) {
      const u = (this.start + (this.end - this.start) * t) * Math.PI * 2;
      const r = 1.22 * (2 + Math.cos(3*u)) * .55;
      return target.set(r*Math.cos(2*u), r*Math.sin(2*u), Math.sin(3*u)*.75);
    }
  }
  const segments = [];
  const count = mobile ? 45 : 60;
  for (let i=0; i<count; i++) {
    const curve = new KnotSection(i/count, (i + .955)/count);
    const geometry = new THREE.TubeGeometry(curve, mobile ? 5 : 8, .35, mobile ? 12 : 20, false);
    const center = curve.getPoint(.5);
    geometry.translate(-center.x, -center.y, -center.z);
    const material = i > count*.64 && i < count*.89 ? chromeMaterial : limeMaterial;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    const outward = center.clone().normalize();
    segments.push({ mesh, center, outward, phase:i*.42 });
    sculpture.add(mesh);
  }

  const satelliteGroup = new THREE.Group();
  const satelliteGeometry = new THREE.IcosahedronGeometry(.095, 0);
  const satellites = [];
  for(let i=0;i<14;i++) {
    const mesh = new THREE.Mesh(satelliteGeometry, i%3 === 0 ? chromeMaterial : darkMaterial);
    const a = i*2.39996;
    mesh.position.set(Math.cos(a)*(2.7+i*.055),Math.sin(a)*(2.4+i*.055),Math.sin(i*1.9)*1.5-1);
    mesh.rotation.set(i*.4,i*.8,i*.2);
    const s = .5+(i%4)*.35; mesh.scale.setScalar(s);
    satellites.push(mesh); satelliteGroup.add(mesh);
  }
  world.add(satelliteGroup);

  const portal = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({ color:0xc2ff43, transparent:true, opacity:0, wireframe:true });
  for(let i=0;i<9;i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.35+i*.13, .009, 3, mobile?60:100), ringMaterial);
    ring.position.z = -i*1.5; ring.rotation.z=i*.15; portal.add(ring);
  }
  scene.add(portal);
  const state = { explosion:0, rotation:0, zoom:0, portal:0, opacity:1 };
  const pointer = { x:0, y:0 };
  const smoothed = { x:0, y:0 };
  let active = true, disposed = false, raf = 0, last = 0, aliveTime = 0;
  let staticMotion = reduced;
  let width = 1, height = 1;

  function resize() {
    width=container.clientWidth; height=container.clientHeight;
    mobile=width<=700;
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.65));
    renderer.setSize(width,height,false);
    camera.aspect=width/height; camera.updateProjectionMatrix();
    render(performance.now());
  }
  function pointerMove(e) { pointer.x = (e.clientX/innerWidth-.5)*2; pointer.y = (e.clientY/innerHeight-.5)*2; requestRender(); }
  function render(now) {
    if(disposed) return;
    const dt = Math.min((now-last)/1000 || .016,.05); last=now;
    if(!staticMotion) aliveTime += dt;
    smoothed.x=THREE.MathUtils.damp(smoothed.x,pointer.x,3,dt);
    smoothed.y=THREE.MathUtils.damp(smoothed.y,pointer.y,3,dt);
    const p = state.explosion;
    const idle = staticMotion?0:aliveTime*.09;
    world.position.set(compactLayout.matches ? 0 : 1.7, compactLayout.matches ? 0 : .1, 0);
    world.scale.setScalar(compactLayout.matches ? 1.55 : 1.27);
    world.rotation.set(.32 + (staticMotion?0:smoothed.y*.1), .2 + (staticMotion?0:smoothed.x*.14), -.34);
    sculpture.rotation.set(.25+state.rotation*.35, idle+state.rotation*1.65, -.1+state.rotation*.28);
    sculpture.position.y = staticMotion ? 0 : Math.sin(aliveTime*.6)*.075;
    segments.forEach(({mesh,center,outward,phase}, i) => {
      mesh.position.copy(center).addScaledVector(outward, p*(1.25+Math.sin(phase)*.45));
      mesh.position.z += p*Math.sin(phase)*1.35;
      mesh.rotation.set(p*Math.sin(phase)*.65, p*Math.cos(phase)*.7, p*Math.sin(phase*.7)*.4);
      const size = 1-Math.min(state.zoom*.42,.55); mesh.scale.setScalar(size);
    });
    satelliteGroup.rotation.z = -idle*.7+state.rotation*.2;
    satelliteGroup.scale.setScalar(1+p*.3);
    satellites.forEach((s,i)=>{s.rotation.x=aliveTime*.1+i;s.rotation.y=aliveTime*.15+i;});
    camera.position.z=12-state.zoom*8.2;
    camera.position.x = state.zoom*(mobile?.1:1.7);
    camera.lookAt(state.zoom*(mobile?.1:1.7),0,0);
    ringMaterial.opacity=state.portal*.23;
    portal.rotation.z=state.rotation*.1;
    portal.position.x=mobile?.1:1.7;
    container.style.opacity=state.opacity;
    renderer.render(scene,camera);
  }
  function loop(now) {
    raf=0;
    if(!active || document.hidden || disposed) return;
    render(now);
    if(!staticMotion) raf=requestAnimationFrame(loop);
  }
  function requestRender() { if(!raf&&!disposed&&active&&!document.hidden) raf=requestAnimationFrame(loop); }
  const observer = new IntersectionObserver(entries=>{ active=entries[0].isIntersecting; requestRender(); },{rootMargin:'100px'});
  observer.observe(container);
  const resizeObserver=new ResizeObserver(resize); resizeObserver.observe(container);
  const visibility=()=>requestRender();
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('pointermove',pointerMove,{passive:true});
  const lost=e=>{e.preventDefault();container.classList.add('context-lost');cancelAnimationFrame(raf);raf=0;};
  const restored=()=>{container.classList.remove('context-lost');requestRender();};
  renderer.domElement.addEventListener('webglcontextlost',lost);
  renderer.domElement.addEventListener('webglcontextrestored',restored);
  resize(); requestRender();
  return {
    state,
    refresh:requestRender,
    setReduced(value){ staticMotion=value; if(value){cancelAnimationFrame(raf);raf=0;}requestRender(); },
    dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();window.removeEventListener('pointermove',pointerMove);document.removeEventListener('visibilitychange',visibility);scene.traverse(o=>o.geometry?.dispose());[limeMaterial,chromeMaterial,darkMaterial,ringMaterial].forEach(m=>m.dispose());env.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}
