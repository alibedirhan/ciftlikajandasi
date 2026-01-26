
(function(){
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');
  const toast = document.getElementById('toast');

  // Year helper (optional)
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = String(new Date().getFullYear());

  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.setAttribute('aria-hidden','false');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.setAttribute('aria-hidden','true'), 2200);
  }

  // Theme: default dark, toggle + persist
  const saved = localStorage.getItem('ca_theme');
  if(saved === 'light') root.setAttribute('data-theme','light');

  function toggleTheme(){
    const isLight = root.getAttribute('data-theme') === 'light';
    if(isLight){ root.removeAttribute('data-theme'); localStorage.removeItem('ca_theme'); }
    else { root.setAttribute('data-theme','light'); localStorage.setItem('ca_theme','light'); }
  }
  if(themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Disable play buttons (no store link yet)
  function bindPlay(btnId){
    const btn = document.getElementById(btnId);
    if(!btn) return;
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      showToast('Uygulama test aşamasında. Google Play linki henüz ekli değil.');
    });
  }
  bindPlay('playBtn');
  bindPlay('playBtn2');

  // Gallery modal
  const modal = document.getElementById('galleryModal');
  const openGallery = document.getElementById('openGallery');
  function openModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }
  if(openGallery) openGallery.addEventListener('click', openModal);
  if(modal){
    modal.addEventListener('click', (e)=>{
      const t = e.target;
      if(t && t.getAttribute && t.getAttribute('data-close')==='1') closeModal();
    });
    window.addEventListener('keydown', (e)=>{
      if(e.key==='Escape' && modal.getAttribute('aria-hidden')==='false') closeModal();
    });
  }

  // Lightbox for screenshots
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const prevBtn = lb ? lb.querySelector('.prev') : null;
  const nextBtn = lb ? lb.querySelector('.next') : null;
  const closeBtn = lb ? lb.querySelector('.lbClose') : null;

  const shotButtons = Array.from(document.querySelectorAll('[data-full]'));
  const shots = shotButtons
    .filter(b=>b.classList.contains('shot') || b.classList.contains('shotGridItem'))
    .map(b=>b.getAttribute('data-full'));

  let idx = 0;

  function openLb(src){
    if(!lb || !lbImg) return;
    idx = Math.max(0, shots.indexOf(src));
    lbImg.src = src;
    lb.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeLb(){
    if(!lb) return;
    lb.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }
  function step(dir){
    if(!shots.length) return;
    idx = (idx + dir + shots.length) % shots.length;
    lbImg.src = shots[idx];
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest && e.target.closest('[data-full]');
    if(!btn) return;
    const src = btn.getAttribute('data-full');
    if(!src) return;
    // If clicked in modal, keep modal open but show lightbox
    openLb(src);
  });

  if(prevBtn) prevBtn.addEventListener('click', ()=>step(-1));
  if(nextBtn) nextBtn.addEventListener('click', ()=>step(1));
  if(closeBtn) closeBtn.addEventListener('click', closeLb);
  if(lb){
    lb.addEventListener('click', (e)=>{
      if(e.target === lb) closeLb();
    });
    window.addEventListener('keydown', (e)=>{
      if(lb.getAttribute('aria-hidden')==='false'){
        if(e.key==='Escape') closeLb();
        if(e.key==='ArrowLeft') step(-1);
        if(e.key==='ArrowRight') step(1);
      }
    });
  }

  
  
  // Mascot (canvas): premium goat + two grass patches (back + front).
  // Behavior:
  // - Pointer idle > 1s  => chew + look down to the front grass
  // - Pointer moving     => stop chewing + look towards pointer (smooth)
  // Notes: file:// safe (no fetch/modules). Respects prefers-reduced-motion.
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    const canvas = document.getElementById('mascotCanvas');
    if(canvas && canvas.getContext){
      const ctx = canvas.getContext('2d', { alpha: true });

      // roundRect polyfill (older browsers)
      if(!ctx.roundRect){
        ctx.roundRect = function(x,y,w,h,r){
          const rr = Math.min(r, w/2, h/2);
          this.beginPath();
          this.moveTo(x+rr, y);
          this.arcTo(x+w, y, x+w, y+h, rr);
          this.arcTo(x+w, y+h, x, y+h, rr);
          this.arcTo(x, y+h, x, y, rr);
          this.arcTo(x, y, x+w, y, rr);
          this.closePath();
          return this;
        };
      }

      const LOGICAL_W = canvas.getAttribute('width') ? parseInt(canvas.getAttribute('width'),10) : 560;
      const LOGICAL_H = canvas.getAttribute('height') ? parseInt(canvas.getAttribute('height'),10) : 300;

      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      function setupScale(){
        canvas.width = Math.floor(LOGICAL_W * dpr);
        canvas.height = Math.floor(LOGICAL_H * dpr);
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      setupScale();
      window.addEventListener('resize', setupScale, {passive:true});

      // Pointer tracking (window-level so user doesn't need to hover exactly)
      let px = LOGICAL_W * 0.40;
      let py = LOGICAL_H * 0.55;
      let lastMoveAt = Date.now();

      function updatePointer(clientX, clientY){
        const r = canvas.getBoundingClientRect();
        if(!r.width || !r.height) return;
        const x = ((clientX - r.left) / r.width) * LOGICAL_W;
        const y = ((clientY - r.top) / r.height) * LOGICAL_H;
        px = Math.max(0, Math.min(LOGICAL_W, x));
        py = Math.max(0, Math.min(LOGICAL_H, y));
        lastMoveAt = Date.now();
      }

      const onMove = (e)=>updatePointer(e.clientX, e.clientY);
      window.addEventListener('mousemove', onMove, {passive:true});
      window.addEventListener('touchmove', (e)=>{
        const t = e.touches && e.touches[0];
        if(t) updatePointer(t.clientX, t.clientY);
      }, {passive:true});

      const clamp = (n,a,b)=>Math.max(a, Math.min(b,n));
      const lerp = (a,b,t)=>a+(b-a)*t;

      // --- Procedural textures (tiny, reused; keeps it "real" without images)
      const tex = {
        fur: null,
        grass: null,
      };

      function makeFurTexture(){
        const c = document.createElement('canvas');
        c.width = 180; c.height = 120;
        const g = c.getContext('2d');
        g.clearRect(0,0,c.width,c.height);
        // warm fur base noise
        for(let i=0;i<1100;i++){
          const x = Math.random()*c.width;
          const y = Math.random()*c.height;
          const l = 4 + Math.random()*8;
          const a = 0.03 + Math.random()*0.06;
          g.strokeStyle = `rgba(40,26,18,${a})`;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x,y);
          g.lineTo(x + (Math.random()*l - l/2), y + (Math.random()*l - l/2));
          g.stroke();
        }
        // subtle highlights
        for(let i=0;i<700;i++){
          const x = Math.random()*c.width;
          const y = Math.random()*c.height;
          const a = 0.02 + Math.random()*0.05;
          g.fillStyle = `rgba(255,255,255,${a})`;
          g.fillRect(x,y,1,1);
        }
        return c;
      }

      function makeGrassTexture(){
        const c = document.createElement('canvas');
        c.width = 220; c.height = 90;
        const g = c.getContext('2d');
        g.clearRect(0,0,c.width,c.height);

        // ground
        const grd = g.createLinearGradient(0,0,0,c.height);
        grd.addColorStop(0,'rgba(40,120,70,.65)');
        grd.addColorStop(1,'rgba(10,40,25,.65)');
        g.fillStyle = grd;
        g.beginPath();
        if(g.roundRect){
          g.roundRect(8, 46, c.width-16, 34, 14);
        } else {
          const x=8,y=46,w=c.width-16,h=34,r=14;
          g.moveTo(x+r,y);
          g.arcTo(x+w,y,x+w,y+h,r);
          g.arcTo(x+w,y+h,x,y+h,r);
          g.arcTo(x,y+h,x,y,r);
          g.arcTo(x,y,x+w,y,r);
          g.closePath();
        }
        g.fill();

        // small random blades (static texture)
        for(let i=0;i<220;i++){
          const bx = 10 + Math.random()*(c.width-20);
          const by = 60 + Math.random()*12;
          const h = 10 + Math.random()*20;
          const lean = (Math.random()*10 - 5);
          const alpha = 0.20 + Math.random()*0.35;
          g.strokeStyle = `rgba(120,205,150,${alpha})`;
          g.lineWidth = 1 + Math.random()*1.2;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(bx, by);
          g.quadraticCurveTo(bx + lean*0.5, by - h*0.55, bx + lean, by - h);
          g.stroke();
        }

        // highlights
        g.strokeStyle = 'rgba(190,240,205,.25)';
        g.lineWidth = 1;
        for(let i=0;i<16;i++){
          const x = 18 + Math.random()*(c.width-36);
          g.beginPath();
          g.moveTo(x, 54);
          g.lineTo(x+6, 50);
          g.stroke();
        }
        return c;
      }

      tex.fur = makeFurTexture();
      tex.grass = makeGrassTexture();

      // --- Scene elements
      const grassBack = { x: 88, y: 232, w: 210, h: 44, density: 34, bladeH: 28, z: 0 };
      const grassFront = { x: 330, y: 240, w: 190, h: 46, density: 42, bladeH: 36, z: 2 };

      const goat = {
        body: { x: 345, y: 178, rx: 102, ry: 62 },
        neck: { x: 398, y: 158 },
        head: { x: 448, y: 136 },
        look: { cur: -10, target: -10 }, // degrees
        chew: { phase: 0, on: true },
        blink: { t: 0, next: 600 + Math.random()*2200 },
      };

      function computeLookTarget(){
        const idle = (Date.now() - lastMoveAt) > 1000;
        if(idle){
          goat.chew.on = true;
          // look slightly down to the front grass patch
          return -14;
        }
        goat.chew.on = false;

        const hx = goat.head.x;
        const hy = goat.head.y;
        const dx = px - hx;
        const dy = py - hy;
        // focus on horizontal; soft vertical influence
        const ang = (dx / 10) + (dy / 90);
        return clamp(ang, -26, 26);
      }

      function drawGrassPatch(p, t, isFront){
        // soft shadow on ground (adds depth)
        ctx.fillStyle = isFront ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.12)';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w*0.55, p.y+10, p.w*0.55, 10, 0, 0, Math.PI*2);
        ctx.fill();

        // textured clump
        ctx.save();
        ctx.globalAlpha = isFront ? 0.95 : 0.85;
        ctx.drawImage(tex.grass, p.x-12, p.y-30, p.w+24, p.h+30);
        ctx.restore();

        // animated blades
        const baseY = p.y;
        const left = p.x;
        const width = p.w;
        const wind = Math.sin(t*0.00045) * 1.0; // global slow wind

        for(let i=0;i<p.density;i++){
          const u = i/(p.density-1);
          const bx = left + u*width;
          const h = (p.bladeH * (0.65 + 0.55*Math.sin(u*Math.PI))) + (i%7)*1.6;
          const phase = (bx*0.05) + t*0.0011;
          const sway = (Math.sin(phase) * (6 + (i%4))) + wind*4;

          const c1 = isFront ? 'rgba(170, 235, 190, .62)' : 'rgba(150, 220, 172, .52)';
          const c2 = isFront ? 'rgba(90, 180, 120, .78)' : 'rgba(80, 160, 108, .64)';
          ctx.strokeStyle = i%3===0 ? c1 : c2;
          ctx.lineWidth = isFront ? (i%4===0 ? 2.6 : 2.1) : (i%4===0 ? 2.2 : 1.8);
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(bx, baseY);
          ctx.quadraticCurveTo(bx + sway*0.35, baseY - h*0.55, bx + sway, baseY - h);
          ctx.stroke();
        }
      }

      function drawGoat(t){
        // --- Shadow
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.beginPath();
        ctx.ellipse(goat.body.x+12, goat.body.y+74, 108, 18, 0, 0, Math.PI*2);
        ctx.fill();

        // --- Body base
        const bodyGrad = ctx.createLinearGradient(
          goat.body.x - goat.body.rx, goat.body.y - goat.body.ry,
          goat.body.x + goat.body.rx, goat.body.y + goat.body.ry
        );
        bodyGrad.addColorStop(0, 'rgba(255, 250, 242, .98)');
        bodyGrad.addColorStop(1, 'rgba(205, 197, 180, .98)');

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(goat.body.x, goat.body.y, goat.body.rx, goat.body.ry, -0.10, 0, Math.PI*2);
        ctx.clip();

        ctx.fillStyle = bodyGrad;
        ctx.fillRect(goat.body.x-goat.body.rx-10, goat.body.y-goat.body.ry-10, goat.body.rx*2+20, goat.body.ry*2+20);

        // fur texture overlay
        ctx.globalAlpha = 0.75;
        ctx.drawImage(tex.fur, goat.body.x-goat.body.rx-20, goat.body.y-goat.body.ry-18, goat.body.rx*2+40, goat.body.ry*2+36);
        ctx.globalAlpha = 1;

        // subtle belly shadow
        const belly = ctx.createRadialGradient(goat.body.x+30, goat.body.y+30, 10, goat.body.x+20, goat.body.y+30, 160);
        belly.addColorStop(0,'rgba(0,0,0,.10)');
        belly.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = belly;
        ctx.fillRect(goat.body.x-goat.body.rx-10, goat.body.y-goat.body.ry-10, goat.body.rx*2+20, goat.body.ry*2+20);

        ctx.restore();

        // body stroke
        ctx.strokeStyle = 'rgba(18, 35, 29, .20)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(goat.body.x, goat.body.y, goat.body.rx, goat.body.ry, -0.10, 0, Math.PI*2);
        ctx.stroke();

        // Tail
        ctx.strokeStyle = 'rgba(235,230,220,.88)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(goat.body.x - goat.body.rx + 18, goat.body.y+2);
        ctx.quadraticCurveTo(goat.body.x - goat.body.rx - 6, goat.body.y+10, goat.body.x - goat.body.rx + 6, goat.body.y+22);
        ctx.stroke();

        // Legs (with hooves)
        const legXs = [goat.body.x-62, goat.body.x-24, goat.body.x+22, goat.body.x+64];
        for(let i=0;i<4;i++){
          ctx.strokeStyle = 'rgba(245, 241, 232, .92)';
          ctx.lineWidth = 10;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(legXs[i], goat.body.y+36);
          ctx.lineTo(legXs[i] + (i<2?-3:3), goat.body.y+94);
          ctx.stroke();

          // knee hint
          ctx.strokeStyle = 'rgba(18, 35, 29, .10)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(legXs[i]-2, goat.body.y+64);
          ctx.lineTo(legXs[i]+6, goat.body.y+64);
          ctx.stroke();

          // hoof
          ctx.strokeStyle = 'rgba(18, 35, 29, .35)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(legXs[i]-4, goat.body.y+96);
          ctx.lineTo(legXs[i]+7, goat.body.y+96);
          ctx.stroke();
        }

        // Neck (furred)
        const neckGrad = ctx.createLinearGradient(goat.neck.x-30, goat.neck.y-30, goat.neck.x+30, goat.neck.y+70);
        neckGrad.addColorStop(0,'rgba(250,245,236,.98)');
        neckGrad.addColorStop(1,'rgba(210,200,182,.98)');
        ctx.fillStyle = neckGrad;
        ctx.strokeStyle = 'rgba(18,35,29,.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(goat.neck.x-20, goat.neck.y-28, 50, 84, 22);
        ctx.fill();
        ctx.stroke();

        // --- Head group (rotated around neck pivot)
        const ang = goat.look.cur * Math.PI/180;
        const pivotX = goat.neck.x + 8;
        const pivotY = goat.neck.y + 12;

        // pupil direction (subtle)
        const dx = px - goat.head.x;
        const dy = py - goat.head.y;
        const pupilX = clamp(dx/60, -2.2, 2.2);
        const pupilY = clamp(dy/80, -1.6, 1.6);

        // blink (rare, quick)
        goat.blink.t += 16;
        if(goat.blink.t > goat.blink.next){
          goat.blink.t = 0;
          goat.blink.next = 900 + Math.random()*2400;
          goat.blink._phase = 0;
        }
        goat.blink._phase = (goat.blink._phase ?? 999);
        const blink = (goat.blink._phase < 220) ? (Math.sin((goat.blink._phase/220)*Math.PI)) : 0;
        if(goat.blink._phase < 220) goat.blink._phase += 16;

        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(ang);
        ctx.translate(-pivotX, -pivotY);

        // Horns (more goat-like, layered)
        const hornGrad = ctx.createLinearGradient(goat.head.x-40, goat.head.y-60, goat.head.x+10, goat.head.y-10);
        hornGrad.addColorStop(0,'rgba(205,195,170,.96)');
        hornGrad.addColorStop(1,'rgba(140,128,110,.96)');
        ctx.strokeStyle = hornGrad;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(goat.head.x-18, goat.head.y-34);
        ctx.quadraticCurveTo(goat.head.x-38, goat.head.y-52, goat.head.x-14, goat.head.y-62);
        ctx.quadraticCurveTo(goat.head.x+6, goat.head.y-66, goat.head.x-2, goat.head.y-46);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(goat.head.x+4, goat.head.y-36);
        ctx.quadraticCurveTo(goat.head.x-8, goat.head.y-56, goat.head.x+14, goat.head.y-64);
        ctx.quadraticCurveTo(goat.head.x+32, goat.head.y-66, goat.head.x+16, goat.head.y-46);
        ctx.stroke();

        // Head base
        const headGrad = ctx.createRadialGradient(goat.head.x-12, goat.head.y-10, 10, goat.head.x, goat.head.y, 70);
        headGrad.addColorStop(0,'rgba(255,252,246,.99)');
        headGrad.addColorStop(1,'rgba(200,190,172,.99)');
        ctx.fillStyle = headGrad;
        ctx.strokeStyle = 'rgba(18,35,29,.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(goat.head.x, goat.head.y, 48, 38, 0.10, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // Ear
        ctx.fillStyle = 'rgba(210,200,182,.90)';
        ctx.beginPath();
        ctx.ellipse(goat.head.x-44, goat.head.y-4, 16, 12, -0.5, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(18,35,29,.12)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Snout
        const snoutGrad = ctx.createLinearGradient(goat.head.x+10, goat.head.y+4, goat.head.x+56, goat.head.y+34);
        snoutGrad.addColorStop(0,'rgba(240,234,222,.96)');
        snoutGrad.addColorStop(1,'rgba(210,200,184,.96)');
        ctx.fillStyle = snoutGrad;
        ctx.beginPath();
        ctx.ellipse(goat.head.x+34, goat.head.y+14, 24, 18, 0.12, 0, Math.PI*2);
        ctx.fill();

        // Nostrils
        ctx.fillStyle = 'rgba(18,35,29,.30)';
        ctx.beginPath();
        ctx.ellipse(goat.head.x+42, goat.head.y+16, 3.2, 2.2, 0, 0, Math.PI*2);
        ctx.ellipse(goat.head.x+34, goat.head.y+20, 3.0, 2.0, 0, 0, Math.PI*2);
        ctx.fill();

        // Eye (with pupil tracking + blink)
        const eyeH = 6.4 * (1 - 0.90*blink);
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.beginPath();
        ctx.ellipse(goat.head.x+10, goat.head.y-6, 7.6, eyeH, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = 'rgba(18,35,29,.95)';
        ctx.beginPath();
        ctx.ellipse(goat.head.x+12 + pupilX, goat.head.y-6 + pupilY, 2.7, 3.2*(1 - 0.80*blink), 0, 0, Math.PI*2);
        ctx.fill();

        // Jaw / chewing
        const chew = goat.chew.on ? (Math.sin(goat.chew.phase) * 0.5 + 0.5) : 0;
        const jawDrop = chew * 3.6;

        ctx.fillStyle = 'rgba(228, 221, 206, .98)';
        ctx.strokeStyle = 'rgba(18,35,29,.16)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(goat.head.x+14, goat.head.y+16 + jawDrop, 34, 22, 10);
        ctx.fill();
        ctx.stroke();

        // Beard
        ctx.strokeStyle = 'rgba(18,35,29,.22)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(goat.head.x+18, goat.head.y+36 + jawDrop);
        ctx.quadraticCurveTo(goat.head.x+20, goat.head.y+56 + jawDrop, goat.head.x+6, goat.head.y+58 + jawDrop);
        ctx.stroke();

        ctx.restore();

        // body highlight
        ctx.strokeStyle = 'rgba(255,255,255,.14)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(goat.body.x-10, goat.body.y-16, 72, Math.PI*1.12, Math.PI*1.78);
        ctx.stroke();
      }

      function render(t){
        goat.look.target = computeLookTarget();
        goat.look.cur = lerp(goat.look.cur, goat.look.target, 0.085);
        goat.chew.phase += 0.14;

        ctx.clearRect(0,0,LOGICAL_W,LOGICAL_H);

        // ORDER: back grass -> goat -> front grass (logic + depth)
        drawGrassPatch(grassBack, t, false);
        drawGoat(t);
        drawGrassPatch(grassFront, t, true);

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    }
  }


})();