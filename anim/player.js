/* 动画播放器 · 共用逻辑
   页面约定：
     <body class="lesson" data-steps="N">
     元素加 data-in="3"   → 第 3 步及之后可见
     元素加 data-out="5"  → 第 5 步及之后隐藏
     元素加 data-on="4"   → 仅第 4 步加 .is-on（配合页面自己的 CSS 做强调）
     <script type="application/json" id="script">[{"t":"标题","say":"说明","pause":true}]</script>
     pause（可选）：自动播放走到这一帧时停下。
   深链：#s3 直达第 3 步。
*/
(function(){
  const body = document.body;
  const raw = document.getElementById('script');
  const steps = raw ? JSON.parse(raw.textContent) : [];
  const N = steps.length || Number(body.dataset.steps || 1);

  const ttl = document.getElementById('ttl');
  const say = document.getElementById('say');
  const stepno = document.getElementById('stepno');
  const dots = document.getElementById('dots');
  const btnPrev = document.getElementById('prev');
  const btnNext = document.getElementById('next');
  const btnPlay = document.getElementById('play');

  let cur = 0, timer = null;

  // 进度点
  for(let i=0;i<N;i++){
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', '第 ' + (i+1) + ' 步');
    b.addEventListener('click', ()=>{ stop(); go(i); });
    dots.appendChild(b);
  }

  function apply(n){
    body.dataset.cur = n;
    document.querySelectorAll('[data-in]').forEach(el=>{
      el.classList.toggle('is-in', n >= +el.dataset.in);
    });
    document.querySelectorAll('[data-out]').forEach(el=>{
      el.classList.toggle('is-out', n >= +el.dataset.out);
    });
    document.querySelectorAll('[data-on]').forEach(el=>{
      el.classList.toggle('is-on', n === +el.dataset.on);
    });
    const s = steps[n] || {};
    ttl.textContent = s.t || '';
    say.innerHTML = s.say || '';
    stepno.textContent = String(n+1).padStart(2,'0') + ' / ' + String(N).padStart(2,'0');
    [...dots.children].forEach((d,i)=>{
      d.classList.toggle('on', i===n);
      d.setAttribute('aria-current', i===n ? 'step' : 'false');
    });
    btnPrev.disabled = n === 0;
    btnNext.disabled = n === N-1;
    btnPlay.textContent = timer ? '暂停' : (n === N-1 ? '重放' : '播放');
    if(history.replaceState) history.replaceState(null,'', n===0 ? location.pathname : '#s'+(n+1));
  }

  function go(n){
    cur = Math.max(0, Math.min(N-1, n));
    if(timer && steps[cur]?.pause) stop();
    apply(cur);
  }

  function stop(){
    if(timer){ clearInterval(timer); timer = null; }
    btnPlay.textContent = cur === N-1 ? '重放' : '播放';
  }

  function play(){
    if(timer){ stop(); return; }
    if(cur === N-1) go(0);
    timer = setInterval(()=>{
      if(cur >= N-1){ stop(); return; }
      go(cur+1);
    }, 3600);
    btnPlay.textContent = '暂停';
  }

  btnPrev.addEventListener('click', ()=>{ stop(); go(cur-1); });
  btnNext.addEventListener('click', ()=>{ stop(); go(cur+1); });
  btnPlay.addEventListener('click', play);

  addEventListener('keydown', e=>{
    if(e.target instanceof HTMLElement){
      if(e.target.isContentEditable || e.target.matches('input,select,textarea')) return;
      if(e.key === ' ' && e.target.closest('button,a,summary')) return;
    }
    if(e.key === 'ArrowRight' || e.key === ' '){ e.preventDefault(); stop(); go(cur+1); }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); stop(); go(cur-1); }
    if(e.key === 'Home'){ e.preventDefault(); stop(); go(0); }
  });

  // 左右滑动（移动端）
  let sx = null;
  addEventListener('touchstart', e=>{ sx = e.touches[0].clientX; }, {passive:true});
  addEventListener('touchend', e=>{
    if(sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if(Math.abs(dx) > 46){ stop(); go(cur + (dx < 0 ? 1 : -1)); }
    sx = null;
  }, {passive:true});

  // 深链
  const m = /#s(\d+)/.exec(location.hash);
  go(m ? (+m[1] - 1) : 0);
})();
