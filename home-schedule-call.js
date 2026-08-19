(()=>{
  const $=s=>document.querySelector(s);
  const diaHoje=()=>{const d=new Date().getDay();return d===0?7:d};

  function turmaLabel(t){
    if(!t)return '';
    const serie=t.serie||'';const turma=t.turma||'';const disc=t.disciplina||'';
    return `${serie} ${turma}${disc?' • '+disc:''}`.trim();
  }

  function aulaDiaDaTurma(h){
    const itens=(db.horarios||[])
      .filter(x=>Number(x.dia)===Number(h.dia)&&x.turmaId===h.turmaId)
      .sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||'')||Number(a.aula)-Number(b.aula));
    const pos=Math.max(0,itens.findIndex(x=>x.id===h.id));
    return String(Math.min(pos+1,2));
  }

  window.irParaChamadaDoHorario=(horarioId)=>{
    const h=(db.horarios||[]).find(x=>x.id===horarioId);if(!h)return;
    if(typeof go==='function')go('frequencia');
    setTimeout(()=>{
      const escola=$('#freqEscola'),turma=$('#freqTurma'),data=$('#freqData'),aula=$('#freqAulaDia');
      if(escola){
        escola.value=h.escolaId;
        escola.dispatchEvent(new Event('change',{bubbles:true}));
      }
      setTimeout(()=>{
        if(turma){turma.value=h.turmaId;turma.dispatchEvent(new Event('change',{bubbles:true}))}
        if(data){data.value=new Date().toISOString().slice(0,10);data.dispatchEvent(new Event('change',{bubbles:true}))}
        if(aula){aula.value=aulaDiaDaTurma(h);aula.dispatchEvent(new Event('change',{bubbles:true}))}
        if(typeof renderFreq==='function')renderFreq();
        const p=$('#pageTitle');if(p)p.textContent='Frequência';
        window.scrollTo({top:0,behavior:'smooth'});
      },80);
    },80);
  };

  function addButtons(){
    if(!window.db||!Array.isArray(db.horarios))return;
    const hoje=diaHoje();
    document.querySelectorAll('.home-school').forEach(box=>{
      const titulo=(box.querySelector('.home-school-title')?.textContent||'').trim();
      const escola=(db.escolas||[]).find(e=>(e.nome||'').trim()===titulo);
      if(!escola)return;
      const hs=db.horarios.filter(h=>Number(h.dia)===hoje&&h.escolaId===escola.id)
        .sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||'')||Number(a.aula)-Number(b.aula));
      const rows=[...box.querySelectorAll('.home-class-row')];
      rows.forEach((row,i)=>{
        if(row.querySelector('.home-call-btn'))return;
        const h=hs[i];if(!h)return;
        const btn=document.createElement('button');
        btn.className='home-call-btn';
        btn.textContent='Fazer chamada';
        btn.onclick=()=>window.irParaChamadaDoHorario(h.id);
        row.appendChild(btn);
      });
    });
  }

  const st=document.createElement('style');
  st.textContent=`
    .home-class-row{grid-template-columns:105px 92px 1fr 1fr auto!important;align-items:center}
    .home-call-btn{border:0;border-radius:11px;padding:9px 12px;background:#2563eb;color:#fff;font-weight:900;cursor:pointer;white-space:nowrap}
    .home-call-btn:active{transform:scale(.98)}
    @media(max-width:900px){.home-class-row{grid-template-columns:90px 80px 1fr auto!important}.home-call-btn{grid-column:4;grid-row:1/3}}
    @media(max-width:620px){.home-class-row{grid-template-columns:1fr!important}.home-call-btn{grid-column:auto;grid-row:auto;width:100%;margin-top:4px}}
  `;
  document.head.appendChild(st);

  let timer;
  const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(addButtons,40)});
  obs.observe(document.body,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addButtons);else addButtons();
})();