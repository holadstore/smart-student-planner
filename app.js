(() => {
  'use strict';
  const CONTENT = window.Y5Q_CONTENT;
  const app = document.getElementById('app');
  const storeKey = 'y5KnowledgeQuest.v2';
  const avatars = ['🦉','🦊','🤖','🚀','🧙'];
  const todayKey = () => new Date().toISOString().slice(0,10);
  const fresh = () => ({
    playerName:'Explorer', avatar:'🦉', xp:0, coins:20, stars:0, sound:true, bestStreak:0,
    completed:{english:[],maths:[],science:[]}, attempts:{}, worldBoss:{english:false,maths:false,science:false},
    daily:{date:todayKey(),correct:0,rewarded:false}
  });
  let state = load();
  let activeWorld = null;
  let activeSection = 0;
  let quiz = null;
  let deferredInstall = null;

  function load(){
    try{
      const x=JSON.parse(localStorage.getItem(storeKey));
      const base=fresh();
      const merged=x?{...base,...x,completed:{...base.completed,...x.completed},worldBoss:{...base.worldBoss,...x.worldBoss},daily:{...base.daily,...x.daily}}:base;
      if(merged.daily.date!==todayKey()) merged.daily={date:todayKey(),correct:0,rewarded:false};
      return merged;
    }catch{return fresh();}
  }
  function save(){ localStorage.setItem(storeKey,JSON.stringify(state)); updateTop(); }
  function esc(s){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function completedSet(w){ return new Set(state.completed[w]||[]); }
  function setCompleted(w,set){ state.completed[w]=[...set].sort((a,b)=>a-b); save(); }
  function overall(){ const total=Object.values(CONTENT).reduce((n,w)=>n+w.sections.length,0); const done=Object.keys(CONTENT).reduce((n,w)=>n+completedSet(w).size,0); return {done,total,pct:Math.round(done/total*100)}; }
  function worldPct(w){ return Math.round(completedSet(w).size/CONTENT[w].sections.length*100); }
  function worldClass(w){ return CONTENT[w].theme; }
  function updateTop(){
    const put=(id,value)=>{const n=document.getElementById(id);if(n)n.textContent=value;};
    put('starsTop',state.stars);
    put('coinsTop',state.coins);
    put('xpTop',state.xp);
    put('levelTop',Math.max(1,Math.floor(state.xp/100)+1));
    put('soundBtn',state.sound?'🔊':'🔇');
    put('avatarTop',state.avatar);
    put('playerTop',state.playerName||'Explorer');
  }
  function setActiveNav(key){
    document.querySelectorAll('.side-link').forEach(b=>b.classList.remove('active'));
    const map={home:'navHome',progress:'navProgress',english:'navEnglish',maths:'navMaths',science:'navScience',challenges:'navChallenges',achievements:'navAchievements',profile:'navProfile',bests:'navLeaderboard',settings:'navSettings'};
    const el=document.getElementById(map[key]);if(el)el.classList.add('active');
  }
  function beep(kind='ok'){
    if(!state.sound)return;
    try{const AC=window.AudioContext||window.webkitAudioContext;const ctx=new AC();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=kind==='ok'?720:kind==='bad'?170:460;g.gain.setValueAtTime(.045,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16);o.start();o.stop(ctx.currentTime+.17);}catch{}
  }
  function confetti(){const colors=['#7a5af8','#3973f4','#12b76a','#fdb022','#f04438','#36bffa'];for(let i=0;i<42;i++){const d=document.createElement('i');d.className='confetti';d.style.left=(Math.random()*100)+'vw';d.style.background=colors[i%colors.length];d.style.animationDelay=(Math.random()*.35)+'s';document.body.appendChild(d);setTimeout(()=>d.remove(),2100);}}
  function recordCorrect(){
    if(state.daily.date!==todayKey()) state.daily={date:todayKey(),correct:0,rewarded:false};
    state.daily.correct=Math.min(3,state.daily.correct+1);
    if(state.daily.correct>=3&&!state.daily.rewarded){state.daily.rewarded=true;state.coins+=15;state.xp+=20;setTimeout(()=>showToast('Daily Quest complete! +15 coins · +20 XP'),350);}
  }
  function showToast(text){const n=document.createElement('div');n.className='pill';n.style.cssText='position:fixed;right:18px;bottom:18px;z-index:200;background:#101828;color:#fff;padding:12px 15px;box-shadow:0 12px 35px rgba(0,0,0,.25)';n.textContent=text;document.body.appendChild(n);setTimeout(()=>n.remove(),2600);}

  function renderHome(){
    activeWorld=null;quiz=null;setActiveNav('home');
    const o=overall();
    const daily=Math.min(3,state.daily.correct||0);
    const latest=state.stars?('⭐ '+state.stars+' mastery star'+(state.stars===1?'':'s')):'Complete your first mission to earn a badge.';
    app.innerHTML=`
      <section class="hero hero-premium">
        <div class="hero-premium-inner">
          <div class="eyebrow">YEAR 5 • KNOWLEDGE ADVENTURE</div>
          <h1><span>Year 5</span> Knowledge Quest</h1>
          <p class="hero-tagline">THREE WORLDS. A BRIGHTER YOU.</p>
          <div class="feature-pills">
            <span>🎓 Learn key Year 5 skills</span><span>🎮 Play interactive missions</span><span>🏆 Earn rewards and badges</span><span>🌟 Build confidence</span>
          </div>
          <div class="hero-actions">
            <button class="btn btn-primary" id="startAdventure">Start Adventure</button>
            <button class="btn btn-secondary" id="quickPlay">⚡ Quick Challenge</button>
          </div>
        </div>
        <div class="hero-castle" aria-hidden="true"><div class="castle-moon">✦</div><div class="castle-icon">🏰</div><div class="hero-scroll">EXPLORE<br>LEARN<br>ACHIEVE</div></div>
      </section>

      <section class="home-dashboard">
        <div class="home-worlds">
          <div class="section-head compact"><div><h2>Choose your world</h2><p>Explore a complete learning map across English, Maths and Science.</p></div></div>
          <div class="world-grid premium-world-grid">${Object.entries(CONTENT).map(([k,w])=>worldCard(k,w)).join('')}</div>
        </div>
        <aside class="journey-card">
          <h3>Your Journey</h3>
          <div class="journey-ring" style="--progress:${o.pct*3.6}deg"><div><strong>${o.pct}%</strong><span>Overall Progress</span></div></div>
          ${Object.entries(CONTENT).map(([k,w])=>`<div class="journey-row"><div><span>${w.icon} ${esc(w.label.replace(' World',''))}</span><b>${completedSet(k).size}/${w.sections.length}</b></div><div class="journey-track"><i class="${k}" style="width:${worldPct(k)}%"></i></div></div>`).join('')}
          <div class="latest-achievement"><small>Latest achievement</small><strong>${latest}</strong></div>
          <button class="btn btn-secondary journey-btn" id="journeyProgress">View progress</button>
        </aside>
      </section>

      <section class="quick-grid">
        <button class="quick-card" id="dailyCard"><span class="quick-icon">🎯</span><span><strong>Daily Challenge</strong><small>Answer 3 correctly today · ${daily}/3 complete</small></span><b>›</b></button>
        <button class="quick-card" id="petCard"><span class="quick-icon">${state.avatar}</span><span><strong>My Avatar</strong><small>${esc(state.playerName)} · customise your explorer</small></span><b>›</b></button>
        <button class="quick-card" id="bestCard"><span class="quick-icon">🏆</span><span><strong>Personal Bests</strong><small>Best streak: ${state.bestStreak}</small></span><b>›</b></button>
        <button class="quick-card" id="teacherView"><span class="quick-icon">📊</span><span><strong>Parent / Teacher</strong><small>See learning progress at a glance</small></span><b>›</b></button>
      </section>`;
    document.getElementById('startAdventure').onclick=()=>{
