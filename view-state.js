(()=>{
  const STATE_KEY='professor_control_ui_state_v1';
  const MAX_AGE=24*60*60*1000;
  let closing=false;
  let timer=null;
  let restored=false;

  const $=s=>document.querySelector(s);

  function authLocked(){
    const lock=$('#authLock');
    return !!(lock && !lock.classList.contains('hidden'));
  }

  function activeView(){
    const el=$('.view.active');
    return el?.id?.replace(/^view-/,'')||'dashboard';
  }

  function capture(){
    if(closing||authLocked())return;
    try{
      const view=activeView();
      const root=$('#view-'+view);
      const controls={};
      if(root){
        root.querySelectorAll('select[id],input[id],textarea[id]').forEach(el=>{
          if(el.closest('#authLock'))return;
          const type=(el.type||'').toLowerCase();
          if(type==='password'||type==='file'||type==='button'||type==='submit')return;
          if(type==='checkbox'||type==='radio')controls[el.id]=!!el.checked;
          else controls[el.id]=el.value;
        });
      }

      const state={
        version:2,
        savedAt:Date.now(),
        view,
        scrollTop:document.scrollingElement?.scrollTop||window.scrollY||0,
        sidebarScroll:$('#sidebar')?.scrollTop||0,
        controls,
        checkedValues:root?[...root.querySelectorAll('input[type="checkbox"]:checked')].filter(x=>!x.closest('#authLock')).map(x=>x.value):[]
      };

      try{
        if(typeof planejamentoAtualId!=='undefined'&&planejamentoAtualId){
          state.planId=planejamentoAtualId;
          state.planAula=typeof aulaAtualNumero!=='undefined'?aulaAtualNumero:null;
        }
      }catch(e){}

      try{
        if(view==='frequencia'&&typeof currentFreq!=='undefined'&&currentFreq){
          state.freqDraft=JSON.parse(JSON.stringify(currentFreq));
        }
      }catch(e){}

      localStorage.setItem(STATE_KEY,JSON.stringify(state));
    }catch(e){console.warn('Não foi possível guardar o estado da tela.',e)}
  }

  function scheduleCapture(delay=120){
    if(authLocked())return;
    clearTimeout(timer);
    timer=setTimeout(capture,delay);
  }

  function readState(){
    try{
      const s=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      if(!s||!s.savedAt||Date.now()-s.savedAt>MAX_AGE)return null;
      return s;
    }catch(e){return null}
  }

  function openView(view){
    if(!view||view==='dashboard')return true;
    const target=$('#view-'+view);
    if(!target)return false;
    try{
      if(typeof go==='function'){
        go(view);
        return true;
      }
    }catch(e){}
    const nav=$(`.nav-item[data-view="${CSS.escape(view)}"]`);
    if(nav){nav.click();return true}
    return false;
  }

  function setControl(id,value,attempt=0){
    if(authLocked())return;
    const el=document.getElementById(id);
    if(!el||el.closest('#authLock')){
      if(!el&&attempt<24)setTimeout(()=>setControl(id,value,attempt+1),100);
      return;
    }
    const type=(el.type||'').toLowerCase();
    if(type==='password'||type==='file')return;
    if(type==='checkbox'||type==='radio'){
      el.checked=!!value;
      return;
    }
    if(el.tagName==='SELECT'){
      const exists=[...el.options].some(o=>o.value===String(value));
      if(!exists){
        if(attempt<24)setTimeout(()=>setControl(id,value,attempt+1),100);
        return;
      }
    }
    if(el.value!==String(value??'')){
      el.value=String(value??'');
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function restoreControls(state){
    const entries=Object.entries(state.controls||{});
    const rank=id=>/escola/i.test(id)?0:/turma/i.test(id)?1:/bimestre|data|aula/i.test(id)?2:3;
    entries.sort((a,b)=>rank(a[0])-rank(b[0]));
    entries.forEach(([id,value],i)=>setTimeout(()=>setControl(id,value),i*35));

    if(Array.isArray(state.checkedValues)&&state.checkedValues.length){
      setTimeout(()=>{
        if(authLocked())return;
        const root=$('#view-'+state.view);if(!root)return;
        const wanted=new Set(state.checkedValues.map(String));
        root.querySelectorAll('input[type="checkbox"]').forEach(ch=>{if(!ch.closest('#authLock'))ch.checked=wanted.has(String(ch.value))});
      },700);
    }
  }

  function restorePlanning(state){
    if(!state.planId||typeof window.abrirPlanejamento!=='function')return;
    setTimeout(()=>{
      if(authLocked())return;
      try{window.abrirPlanejamento(state.planId,state.planAula||null,false)}catch(e){}
    },900);
  }

  function restoreFrequencyDraft(state){
    if(state.view!=='frequencia'||!state.freqDraft)return;
    setTimeout(()=>{
      if(authLocked())return;
      try{
        if(typeof currentFreq!=='undefined')currentFreq={...state.freqDraft};
        document.querySelectorAll('.seg[data-aid]').forEach(seg=>{
          const status=state.freqDraft[seg.dataset.aid];
          if(!status)return;
          [...seg.querySelectorAll('button[data-status]')].forEach(b=>b.classList.toggle('active',b.dataset.status===status));
        });
      }catch(e){}
    },1100);
  }

  function doRestore(){
    if(restored||authLocked())return false;
    const state=readState();
    restored=true;
    if(!state)return true;

    let tries=0;
    const attempt=()=>{
      if(authLocked())return;
      tries++;
      const ok=state.view==='dashboard'?true:openView(state.view);
      if(!ok&&tries<30){setTimeout(attempt,100);return}

      restoreControls(state);
      restorePlanning(state);
      restoreFrequencyDraft(state);

      setTimeout(()=>{
        if(authLocked())return;
        try{
          const y=Number(state.scrollTop)||0;
          if(document.scrollingElement)document.scrollingElement.scrollTop=y;
          const sb=$('#sidebar');if(sb)sb.scrollTop=Number(state.sidebarScroll)||0;
        }catch(e){}
      },1250);
    };
    setTimeout(attempt,280);
    return true;
  }

  function waitForUnlock(){
    if(!authLocked()){
      doRestore();
      return;
    }
    const lock=$('#authLock');
    if(!lock)return;
    const obs=new MutationObserver(()=>{
      if(lock.classList.contains('hidden')){
        obs.disconnect();
        setTimeout(doRestore,120);
      }
    });
    obs.observe(lock,{attributes:true,attributeFilter:['class']});
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden')capture();
  });
  window.addEventListener('pagehide',capture);
  window.addEventListener('beforeunload',capture);
  document.addEventListener('change',e=>{if(!e.target?.closest?.('#authLock'))scheduleCapture(80)},true);
  document.addEventListener('input',e=>{if(!e.target?.closest?.('#authLock'))scheduleCapture(250)},true);
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#closeAppNav')){
      closing=true;
      try{localStorage.removeItem(STATE_KEY)}catch(err){}
      return;
    }
    if(e.target?.closest?.('#authLock'))return;
    if(e.target?.closest?.('.nav-item,[data-go],.lesson-btn'))scheduleCapture(180);
  },true);
  window.addEventListener('scroll',()=>{if(!authLocked())scheduleCapture(180)},{passive:true});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitForUnlock);else waitForUnlock();

  window.professorControlSaveUiState=capture;
  window.professorControlClearUiState=()=>{try{localStorage.removeItem(STATE_KEY)}catch(e){}};
})();
