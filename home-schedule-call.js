(()=>{
  const $=s=>document.querySelector(s);

  function horariosHoje(){
    const hoje=new Date().getDay();
    return (window.db?.horarios||[])
      .filter(h=>Number(h.dia)===hoje)
      .sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||'')||Number(a.aula)-Number(b.aula));
  }

  function aulaDiaDaTurma(h){
    const itens=(db.horarios||[])
      .filter(x=>Number(x.dia)===Number(h.dia)&&x.turmaId===h.turmaId)
      .sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||'')||Number(a.aula)-Number(b.aula));
    const pos=Math.max(0,itens.findIndex(x=>x.id===h.id));
    return String(Math.min(pos+1,2));
  }

  window.irParaChamadaDoHorario=(horarioId)=>{
    const h=(db.horarios||[]).find(x=>x.id===horarioId);
    if(!h)return;
    if(typeof go==='function')go('frequencia');
    const p=$('#pageTitle');if(p)p.textContent='Frequência';

    setTimeout(()=>{
      const escola=$('#freqEscola');
      if(escola){
        escola.value=h.escolaId||'';
        escola.dispatchEvent(new Event('change',{bubbles:true}));
      }
      setTimeout(()=>{
        const turma=$('#freqTurma'),data=$('#freqData'),aula=$('#freqAulaDia');
        if(turma){turma.value=h.turmaId||'';turma.dispatchEvent(new Event('change',{bubbles:true}))}
        if(data){data.value=new Date().toISOString().slice(0,10);data.dispatchEvent(new Event('change',{bubbles:true}))}
        if(aula){aula.value=aulaDiaDaTurma(h);aula.dispatchEvent(new Event('change',{bubbles:true}))}
        if(typeof renderFreq==='function')renderFreq();
        window.scrollTo({top:0,behavior:'smooth'});
      },100);
    },80);
  };

  function addButtons(){
    const area=$('#homeScheduleToday');
    if(!area)return;
    const rows=[...area.querySelectorAll('.home-class-row')];
    const hs=horariosHoje();
    if(!rows.length||!hs.length)return;

    rows.forEach((row,i)=>{
      if(row.querySelector('.home-call-btn'))return;
      const h=hs[i];if(!h)return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='home-call-btn';
      btn.textContent='Fazer chamada';
      btn.addEventListener('click',()=>window.irParaChamadaDoHorario(h.id));
      row.appendChild(btn);
    });
  }

  const st=document.createElement('style');
  st.textContent=`
    .home-class-row{grid-template-columns:105px 92px 1fr 1fr auto!important;align-items:center}
    .home-call-btn{border:0;border-radius:11px;padding:10px 14px;background:#2563eb;color:#fff;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:0 4px 12px #2563eb33}
    .home-call-btn:active{transform:scale(.98)}
    @media(max-width:900px){.home-class-row{grid-template-columns:90px 80px 1fr auto!important}.home-class-row .hc-disc{grid-column:3}.home-call-btn{grid-column:4;grid-row:1/3}}
    @media(max-width:620px){.home-class-row{grid-template-columns:1fr!important}.home-call-btn{grid-column:auto;grid-row:auto;width:100%;margin-top:6px}}
  `;
  document.head.appendChild(st);

  let timer;
  const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(addButtons,60)});
  obs.observe(document.body,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(addButtons,150));
  else setTimeout(addButtons,150);
})();