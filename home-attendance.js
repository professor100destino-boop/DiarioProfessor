(()=>{
  const $=s=>document.querySelector(s);

  function sortedToday(){
    const today=new Date().getDay();
    return (window.db?.horarios||[])
      .filter(h=>Number(h.dia)===today)
      .sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||'')||Number(a.aula)-Number(b.aula));
  }

  function aulaDaTurma(h,items){
    const mesmas=items.filter(x=>x.turmaId===h.turmaId).sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||'')||Number(a.aula)-Number(b.aula));
    const pos=mesmas.findIndex(x=>x.id===h.id);
    return String(pos<=0?1:2);
  }

  function abrirChamada(h,items){
    try{
      if(typeof go==='function') go('frequencia');
      const p=$('#pageTitle'); if(p) p.textContent='Frequência';

      const escola=$('#freqEscola');
      if(escola){
        escola.value=h.escolaId||'';
        escola.dispatchEvent(new Event('change',{bubbles:true}));
      }

      setTimeout(()=>{
        const turma=$('#freqTurma');
        if(turma){
          turma.value=h.turmaId||'';
          turma.dispatchEvent(new Event('change',{bubbles:true}));
        }
        const data=$('#freqData');
        if(data){
          data.value=new Date().toISOString().slice(0,10);
          data.dispatchEvent(new Event('change',{bubbles:true}));
        }
        const aula=$('#freqAulaDia');
        if(aula){
          aula.value=aulaDaTurma(h,items);
          aula.dispatchEvent(new Event('change',{bubbles:true}));
        }
        if(typeof renderFreq==='function') renderFreq();
        window.scrollTo({top:0,behavior:'smooth'});
      },80);
    }catch(e){
      console.error(e);
      alert('Não foi possível abrir a chamada desta aula.');
    }
  }

  function aplicar(){
    const area=$('#homeScheduleToday');
    if(!area) return;
    const rows=[...area.querySelectorAll('.home-class-row')];
    const items=sortedToday();
    if(!rows.length||!items.length) return;

    rows.forEach((row,i)=>{
      if(row.querySelector('.home-call-btn')) return;
      const h=items[i];
      if(!h) return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='home-call-btn';
      btn.textContent='Fazer chamada';
      btn.addEventListener('click',()=>abrirChamada(h,items));
      row.appendChild(btn);
    });
  }

  const st=document.createElement('style');
  st.textContent=`
    .home-class-row{grid-template-columns:105px 92px 1fr 1fr auto!important;align-items:center}
    .home-call-btn{border:0;border-radius:12px;padding:10px 14px;background:#1478e8;color:#fff;font-weight:900;white-space:nowrap;cursor:pointer;box-shadow:0 4px 12px #1478e833}
    .home-call-btn:active{transform:translateY(1px)}
    @media(max-width:900px){.home-class-row{grid-template-columns:90px 80px 1fr auto!important}.home-class-row .hc-disc{grid-column:3}.home-call-btn{grid-column:4;grid-row:1/3}}
    @media(max-width:620px){.home-class-row{grid-template-columns:1fr!important}.home-call-btn{grid-column:auto;grid-row:auto;width:100%;margin-top:6px}}
  `;
  document.head.appendChild(st);

  const obs=new MutationObserver(()=>aplicar());
  obs.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicar,150));
  else setTimeout(aplicar,150);
})();