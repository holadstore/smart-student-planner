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
      const next=Object.keys(CONTENT).find(k=>worldPct(k)<100)||'english';openWorld(next);
    };
    document.getElementById('quickPlay').onclick=()=>startArcade();
    document.getElementById('journeyProgress').onclick=renderTeacher;
    document.getElementById('dailyCard').onclick=()=>startArcade(null,5);
    document.getElementById('petCard').onclick=renderProfile;
    document.getElementById('bestCard').onclick=renderBests;
    document.getElementById('teacherView').onclick=renderTeacher;
    app.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>openWorld(b.dataset.world));
  }
  function worldCard(k,w){
    const pct=worldPct(k);
    const copy=k==='english'?'Words open new worlds.':'maths'===k?'Numbers power your future.':'Discover. Question. Understand.';
    const bullets=k==='english'?['Word classes, punctuation & sentences','Writing, stories & text types','Reading & comprehension','Spelling & tricky words']:k==='maths'?['Number & place value','Calculations & problem solving','Fractions, decimals & percentages','Measure, geometry & statistics']:['Living things & the human body','Materials & their properties','Forces, electricity, light & sound','Earth, space & scientific enquiry'];
    return `<button class="world-card premium-world ${worldClass(k)}" data-world="${k}">
      <div class="world-scene ${worldClass(k)}-scene"><div class="scene-orb scene-a"></div><div class="scene-orb scene-b"></div><span class="scene-symbol">${w.icon}</span><span class="section-count">${w.sections.length} SECTIONS</span></div>
      <div class="world-content"><div class="world-title-row"><span class="world-icon">${w.icon}</span><div><h3>${esc(w.label)}</h3><p>${copy}</p></div></div>
      <ul>${bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      <div class="progress-mini"><div class="progress"><i style="width:${pct}%"></i></div><div class="progress-label"><span>${completedSet(k).size}/${w.sections.length} mastered</span><span>${pct}%</span></div></div>
      <span class="explore-cta">Explore ${esc(w.label)} →</span></div></button>`;
  }

  function openWorld(w){activeWorld=w;activeSection=0;setActiveNav(w);renderWorld();}
  function renderWorld(){
    const w=CONTENT[activeWorld],done=completedSet(activeWorld),pct=worldPct(activeWorld),bossReady=pct===100;
    app.innerHTML=`<section class="panel"><div class="toolbar"><button class="btn btn-ghost" id="homeBtn">← Home</button><span class="pill">${w.icon} ${esc(w.label)}</span><span class="pill">${done.size}/${w.sections.length} sections mastered</span><span class="pill">${pct}% complete</span></div></section>
    <div class="grid-2" style="margin-top:16px">
      <section class="panel"><div class="section-head" style="margin-top:0"><div><h2>Adventure Map</h2><p>Pick a mission. Every mission represents a major learning section.</p></div></div><div class="map">${w.sections.map((s,i)=>missionCard(s,i,done)).join('')}</div></section>
      <aside>
        <section class="panel"><h3>World rewards</h3><div class="badge-grid"><div class="badge ${pct>=25?'unlocked':''}"><strong>🥉 Explorer</strong><span class="muted">25% complete</span></div><div class="badge ${pct>=50?'unlocked':''}"><strong>🥈 Pathfinder</strong><span class="muted">50% complete</span></div><div class="badge ${pct>=75?'unlocked':''}"><strong>🥇 Scholar</strong><span class="muted">75% complete</span></div><div class="badge ${pct===100?'unlocked':''}"><strong>🏆 World Master</strong><span class="muted">100% complete</span></div></div></section>
        <section class="panel" style="margin-top:16px"><h3>Final World Challenge</h3><p class="muted">Complete every section, then take a 5-question boss challenge.</p><button class="btn ${bossReady?'btn-dark':'btn-ghost'}" id="bossBtn" ${bossReady?'':'disabled'}>${state.worldBoss[activeWorld]?'🏆 Boss defeated':'⚔️ Start Boss Challenge'}</button></section>
        <section class="panel" style="margin-top:16px"><h3>How to play</h3><p class="muted">Learn the section, inspect every topic, complete the 3-question challenge and earn a mastery star.</p></section>
      </aside>
    </div>`;
    document.getElementById('homeBtn').onclick=renderHome;
    document.getElementById('bossBtn').onclick=()=>{if(bossReady)startBoss(activeWorld);};
    app.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{activeSection=Number(b.dataset.section);renderMission();});
  }
  function missionCard(s,i,done){const qCount=CONTENT[activeWorld].questions.filter(q=>q.section===i).length;return `<button class="mission ${done.has(i)?'done':''}" data-section="${i}"><span class="mission-num">${done.has(i)?'✓':i+1}</span><span><span class="mission-title">${esc(s.title)}</span><span class="mission-sub">${s.topics.length} textbook topics</span><span class="mission-progress">${qCount} challenge question${qCount===1?'':'s'} in this build</span></span><span class="mission-star">${done.has(i)?'⭐':'›'}</span></button>`;}

  function renderMission(){
    const w=CONTENT[activeWorld],s=w.sections[activeSection],done=completedSet(activeWorld).has(activeSection),qCount=questionPool(activeWorld,activeSection).length;
    app.innerHTML=`<section class="panel">
      <div class="toolbar"><button class="btn btn-ghost" id="backWorld">← ${esc(w.label)}</button><span class="pill">Mission ${activeSection+1}/${w.sections.length}</span>${done?'<span class="pill">⭐ Mastered</span>':''}</div>
      <div class="section-head"><div><h2>${esc(s.title)}</h2><p>Learn first. Think aloud. Then enter the challenge arena.</p></div><div style="font-size:46px">${w.icon}</div></div>
      <div class="lesson-steps"><div class="learn-step"><b>1. 📖 Learn</b><span>Read the mission briefing and connect it to the section topics.</span></div><div class="learn-step"><b>2. 🗣️ Explain</b><span>Use the explain-it prompt to put the idea into your own words.</span></div><div class="learn-step"><b>3. 🎯 Play</b><span>Complete three challenge rounds and aim for mastery.</span></div></div>
      <div class="lesson-box"><h4>📖 Mission briefing</h4><p>${esc(s.lesson)}</p></div>
      <div class="lesson-box"><h4>🧭 Everything in this section</h4><div class="topic-chips">${s.topics.map(t=>`<span class="topic-chip">${esc(t)}</span>`).join('')}</div></div>
      <div class="lesson-box"><h4>🗣️ Explain-it mission</h4><p>${esc(s.explain)}</p></div>
      <div class="hero-actions" style="margin-top:16px"><button class="btn btn-accent" id="startChallenge">🎯 Start 3-Round Challenge</button><button class="btn btn-ghost" id="randomChallenge">🎲 Surprise Me</button></div>
      <p class="muted" style="font-size:12px;margin-bottom:0">This section currently has ${qCount} original challenge question${qCount===1?'':'s'} in rotation. More questions can be added without changing your progress.</p>
    </section>`;
    document.getElementById('backWorld').onclick=renderWorld;
    document.getElementById('startChallenge').onclick=()=>startSectionQuiz(activeWorld,activeSection);
    document.getElementById('randomChallenge').onclick=()=>startArcade(activeWorld,5);
  }

  function questionPool(world,section=null){const qs=CONTENT[world].questions;return section===null?qs:qs.filter(q=>q.section===section);}
  function chooseQuestion(world,section=null){const pool=questionPool(world,section);if(!pool.length)return null;const key=world+':'+(section===null?'all':section);const n=state.attempts[key]||0;state.attempts[key]=n+1;save();return pool[n%pool.length];}
  function randomQuestion(world=null){const w=world||shuffle(Object.keys(CONTENT))[0];const q=shuffle(CONTENT[w].questions)[0];return {world:w,q};}
  function startSectionQuiz(world,section){const q=chooseQuestion(world,section);if(!q)return;quiz={mode:'section',world,section,q,round:1,total:3,correct:0,streak:0,hint:false,removed:[]};renderQuiz();}
  function startArcade(world=null,total=10){const pick=randomQuestion(world);quiz={mode:'arcade',world:pick.world,section:pick.q.section,q:pick.q,round:1,total,correct:0,streak:0,hint:false,removed:[]};renderQuiz();}
  function startBoss(world){const pick=randomQuestion(world);quiz={mode:'boss',world,section:pick.q.section,q:pick.q,round:1,total:5,correct:0,streak:0,hint:false,removed:[]};renderQuiz();}

  function renderQuiz(){
    const w=CONTENT[quiz.world],s=w.sections[quiz.section],q=quiz.q,pct=Math.round((quiz.round-1)/quiz.total*100);
    const label=quiz.mode==='section'?'Mission Challenge':quiz.mode==='boss'?'World Boss Challenge':'Arcade Mode';
    app.innerHTML=`<section class="panel challenge-shell">
      <div class="quiz-progress"><i style="width:${pct}%"></i></div>
      <div class="quiz-meta"><span class="pill">${w.icon} ${esc(s.title)}</span><span class="pill">Round ${quiz.round}/${quiz.total}</span><span class="pill">✅ ${quiz.correct}</span><span class="pill">🔥 ${quiz.streak}</span></div>
      <div class="eyebrow" style="color:#667085">${label}</div>
      <h2 class="question">${esc(q.q)}</h2>
      <div class="answers" id="answerGrid">${q.a.map((x,i)=>`<button class="answer" data-answer="${i}"><strong>${String.fromCharCode(65+i)}.</strong> ${esc(x)}</button>`).join('')}</div>
      <div id="feedback" class="feedback hidden"></div>
      <div class="power-row"><button class="power" id="hintPower">💡 Hint <small>−2 coins</small></button><button class="power" id="fiftyPower">✂️ 50/50 <small>−3 coins</small></button><button class="power" id="quitQuiz">← Leave challenge</button></div>
    </section>`;
    app.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>submitAnswer(Number(b.dataset.answer)));
    document.getElementById('hintPower').onclick=useHint;
    document.getElementById('fiftyPower').onclick=useFifty;
    document.getElementById('quitQuiz').onclick=()=>quiz.mode==='section'?renderMission():quiz.mode==='boss'?renderWorld():renderHome();
  }
  function useHint(){if(quiz.hint)return;if(state.coins<2){showModal('Not enough coins','Complete challenges to earn more coins.');return;}state.coins-=2;quiz.hint=true;save();const f=document.getElementById('feedback');f.classList.remove('hidden');f.innerHTML='<strong>Hint:</strong> '+esc(quiz.q.h);beep('hint');}
  function useFifty(){if(quiz.removed.length)return;if(state.coins<3){showModal('Not enough coins','Complete challenges to earn more coins.');return;}const wrong=[0,1,2,3].filter(i=>i!==quiz.q.c);quiz.removed=shuffle(wrong).slice(0,2);state.coins-=3;save();quiz.removed.forEach(i=>{const b=document.querySelector(`[data-answer="${i}"]`);if(b){b.disabled=true;b.style.visibility='hidden';}});beep('hint');}
  function submitAnswer(i){
    const correct=i===quiz.q.c;app.querySelectorAll('[data-answer]').forEach(b=>b.disabled=true);
    const chosen=document.querySelector(`[data-answer="${i}"]`),right=document.querySelector(`[data-answer="${quiz.q.c}"]`);if(right)right.classList.add('correct');if(!correct&&chosen)chosen.classList.add('wrong');
    const feedback=document.getElementById('feedback');feedback.classList.remove('hidden');
    if(correct){const gain=quiz.hint?8:12;state.xp+=gain;state.coins+=3;state.stars+=1;quiz.correct++;quiz.streak++;state.bestStreak=Math.max(state.bestStreak,quiz.streak);recordCorrect();beep('ok');feedback.innerHTML=`<strong>Great job!</strong> ${esc(quiz.q.e)}<br><strong>+${gain} XP · +3 coins · +1 star</strong>`;confetti();}
    else{quiz.streak=0;beep('bad');feedback.innerHTML=`<strong>Good try.</strong> ${esc(quiz.q.e)}<br>Use the explanation to strengthen your next answer.`;}
    save();
    const action=document.createElement('div');action.className='hero-actions';action.style.marginTop='14px';const next=document.createElement('button');next.className='btn btn-dark';next.textContent=quiz.round>=quiz.total?'Finish Challenge':'Next Round';next.onclick=nextQuestion;action.appendChild(next);feedback.appendChild(action);
  }
  function nextQuestion(){
    if(quiz.round>=quiz.total){finishQuiz();return;}
    quiz.round++;quiz.hint=false;quiz.removed=[];
    if(quiz.mode==='section'){quiz.q=chooseQuestion(quiz.world,quiz.section);}
    else{const pick=randomQuestion(quiz.world);quiz.world=pick.world;quiz.q=pick.q;quiz.section=pick.q.section;}
    renderQuiz();
  }
  function finishQuiz(){
    if(quiz.mode==='section'){
      const passed=quiz.correct>=2;
      if(passed){const set=completedSet(quiz.world);set.add(quiz.section);setCompleted(quiz.world,set);showModal('Mission mastered!','You scored '+quiz.correct+' out of '+quiz.total+'. This textbook section is now marked as mastered.',()=>renderWorld());}
      else{showModal('Mission complete','You scored '+quiz.correct+' out of '+quiz.total+'. Review the lesson and try again for mastery.',()=>renderMission());}
      return;
