(()=>{
  const $=s=>document.querySelector(s);
  const KEY_LOCAL='professorControlV1';
  const DIAS=[
    {v:1,n:'Segunda-feira'},
    {v:2,n:'Terça-feira'},
    {v:3,n:'Quarta-feira'},
    {v:4,n:'Quinta-feira'},
    {v:5,n:'Sexta-feira'},
    {v:6,n:'Sábado'}
  ];

  function uid(){return (crypto?.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2)))}
  function esc2(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function persist(){
    try{localStorage.setItem(KEY_LOCAL,JSON.stringify(db))}catch(e){console.error(e)}
  }
  function turmaLabel(t){
    if(!t)return '';
    const serie=t.serie||''; const turma=t.turma||''; const disc=t.disciplina||'';
    return `${serie} ${turma}${disc?' • '+disc:''}`.trim();
  }
  function escolaNome(id){return (db.escolas||[]).find(e=>e.id===id)?.nome||'Escola'}
  function turmaNome(id){return turmaLabel((db.turmas||[]).find(t=>t.id===id))}
  function disciplinaNome(id){return (db.disciplinas||[]).find(d=>d.id===id)?.nome||'Disciplina'}
  function diaNome(v){return DIAS.find(d=>d.v===Number(v))?.n||''}

  db.disciplinas=Array.isArray(db.disciplinas)?db.disciplinas:[];
  db.horarios=Array.isArray(db.horarios)?db.horarios:[];

  // Aproveita automaticamente as disciplinas já informadas nas turmas.
  const existentes=new Set(db.disciplinas.map(d=>(d.nome||'').trim().toLocaleLowerCase('pt-BR')));
  (db.turmas||[]).forEach(t=>{
    const nome=(t.disciplina||'').trim();
    const k=nome.toLocaleLowerCase('pt-BR');
    if(nome && !existentes.has(k)){
      db.disciplinas.push({id:uid(),nome});
      existentes.add(k);
    }
  });
  persist();

  function injectStyles(){
    if($('#horariosStyles'))return;
    const st=document.createElement('style');st.id='horariosStyles';
    st.textContent=`
      .hor-top-actions{display:flex;gap:10px;flex-wrap:wrap}
      .hor-grid{display:grid;grid-template-columns:1fr 1.5fr;gap:18px;margin-top:16px}
      .hor-card{background:#fff;border:1px solid var(--border);border-radius:20px;padding:18px;box-shadow:var(--shadow-soft)}
      .hor-card h3{margin:0 0 12px}.hor-list{display:flex;flex-direction:column;gap:8px}
      .hor-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:14px;background:#f8fbff}
      .hor-item-main{display:flex;flex-direction:column;gap:3px}.hor-item-main small{color:var(--muted)}
      .hor-actions{display:flex;gap:7px;flex-wrap:wrap}.hor-actions button{padding:8px 10px;border-radius:10px;border:0;font-weight:800;cursor:pointer}
      .hor-del{background:#fee2e2;color:#991b1b}.hor-edit{background:#e0ecff;color:#174a84}
      .grade-dia{margin-top:16px}.grade-dia h4{margin:0 0 8px;color:#173b68}
      .grade-row{display:grid;grid-template-columns:90px 110px 1fr 1fr auto;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #e8eef6}
      .grade-row:last-child{border-bottom:0}.grade-time{font-weight:900;color:#0b4a8f}.grade-aula{font-weight:800}
      #horarioModal{border:0;border-radius:22px;padding:0;max-width:720px;width:min(94vw,720px);box-shadow:0 20px 60px #0005}
      #horarioModal::backdrop{background:#0f172a99}.hor-modal{padding:22px}.hor-modal h3{margin-top:0}.hor-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .hor-form-grid label{display:flex;flex-direction:column;gap:6px;font-weight:800}.hor-form-grid select,.hor-form-grid input{width:100%}
      .hor-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
      .home-schedule{margin:18px 0}.home-schedule-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px}.home-schedule-head h3{margin:0}.home-school{background:#fff;border:1px solid var(--border);border-radius:18px;padding:14px 16px;margin-bottom:10px;box-shadow:var(--shadow-soft)}
      .home-school-title{font-weight:900;color:#133f73;margin-bottom:8px}.home-class-row{display:grid;grid-template-columns:105px 92px 1fr 1fr;gap:10px;padding:8px 0;border-top:1px solid #edf2f7}.home-class-row:first-of-type{border-top:0}
      .hor-empty{padding:16px;border:1px dashed #b8c7d9;border-radius:14px;color:var(--muted);text-align:center}
      @media(max-width:900px){.hor-grid{grid-template-columns:1fr}.grade-row{grid-template-columns:80px 90px 1fr}.grade-row .g-disc{grid-column:3}.grade-row .g-school{display:none}.home-class-row{grid-template-columns:90px 80px 1fr}.home-class-row .hc-disc{grid-column:3}}
      @media(max-width:620px){.hor-form-grid{grid-template-columns:1fr}.grade-row{grid-template-columns:1fr}.home-class-row{grid-template-columns:1fr}.grade-row>*{grid-column:auto!important}.home-class-row>*{grid-column:auto!important}}
    `;
    document.head.appendChild(st);
  }

  function injectMenuAndView(){
    if(!$('#view-horarios')){
      const configView=$('#view-config');
      const sec=document.createElement('section');sec.id='view-horarios';sec.className='view';
      sec.innerHTML=`<div class="section-shell">
        <div class="section-head"><div><h2>Horários de Aula</h2><p>Cadastre as disciplinas e organize sua grade semanal por escola, turma e disciplina.</p></div><div class="hor-top-actions"><button class="primary ghost" id="novaDisciplinaBtn">+ Disciplina</button><button class="primary" id="novoHorarioBtn">+ Aula no horário</button></div></div>
        <div class="hor-grid">
          <div class="hor-card"><h3>Disciplinas cadastradas</h3><div id="disciplinasList" class="hor-list"></div></div>
          <div class="hor-card"><h3>Grade semanal</h3><div class="toolbar wrap"><select id="horFiltroEscola" aria-label="Filtrar escola"></select></div><div id="horariosGrade"></div></div>
        </div>
      </div>`;
      configView?.parentNode?.insertBefore(sec,configView);
    }

    if(!document.querySelector('.nav-item[data-view="horarios"]')){
      const nav=document.querySelector('.sidebar nav')||document.querySelector('nav');
      const btn=document.createElement('button');btn.className='nav-item';btn.dataset.view='horarios';btn.innerHTML='<span class="nav-ico">🗓️</span><span>Horários</span>';
      const cfg=document.querySelector('.nav-item[data-view="config"]');
      if(cfg&&cfg.parentNode===nav)nav.insertBefore(btn,cfg);else nav?.appendChild(btn);
      btn.addEventListener('click',()=>{
        if(typeof go==='function')go('horarios');
        const p=$('#pageTitle');if(p)p.textContent='Horários';
        renderHorarios();
      });
    }

    if(!$('#horarioModal')){
      const d=document.createElement('dialog');d.id='horarioModal';
      d.innerHTML='<form method="dialog" class="hor-modal" id="horarioForm"><h3 id="horarioModalTitle">Cadastrar aula</h3><div id="horarioModalBody"></div><div class="hor-modal-actions"><button class="primary ghost" value="cancel">Cancelar</button><button class="primary" id="horarioModalSalvar" value="default">Salvar</button></div></form>';
      document.body.appendChild(d);
    }
  }

  function renderDisciplinas(){
    const box=$('#disciplinasList');if(!box)return;
    const arr=[...(db.disciplinas||[])].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
    box.innerHTML=arr.length?arr.map(d=>`<div class="hor-item"><div class="hor-item-main"><b>${esc2(d.nome)}</b></div><div class="hor-actions"><button class="hor-edit" onclick="window.editarDisciplinaHorario('${d.id}')">Editar</button><button class="hor-del" onclick="window.excluirDisciplinaHorario('${d.id}')">Excluir</button></div></div>`).join(''):'<div class="hor-empty">Nenhuma disciplina cadastrada.</div>';
  }

  function fillFiltroEscola(){
    const s=$('#horFiltroEscola');if(!s)return;
    const old=s.value;
    s.innerHTML='<option value="">Todas as escolas</option>'+ (db.escolas||[]).map(e=>`<option value="${e.id}">${esc2(e.nome)}</option>`).join('');
    if([...s.options].some(o=>o.value===old))s.value=old;
  }

  function renderGrade(){
    const box=$('#horariosGrade');if(!box)return;
    const filtro=$('#horFiltroEscola')?.value||'';
    const arr=(db.horarios||[]).filter(h=>!filtro||h.escolaId===filtro).sort((a,b)=>Number(a.dia)-Number(b.dia)||(a.inicio||'').localeCompare(b.inicio||'')||Number(a.aula)-Number(b.aula));
    if(!arr.length){box.innerHTML='<div class="hor-empty" style="margin-top:12px">Nenhum horário cadastrado.</div>';return}
    box.innerHTML=DIAS.map(d=>{
      const itens=arr.filter(h=>Number(h.dia)===d.v);if(!itens.length)return '';
      return `<div class="grade-dia"><h4>${d.n}</h4><div>${itens.map(h=>`<div class="grade-row"><div class="grade-time">${esc2(h.inicio||'--:--')}–${esc2(h.fim||'--:--')}</div><div class="grade-aula">${esc2(h.aula)}ª aula</div><div>${esc2(turmaNome(h.turmaId))}</div><div class="g-disc"><b>${esc2(disciplinaNome(h.disciplinaId))}</b><br><small>${esc2(escolaNome(h.escolaId))}</small></div><div class="hor-actions"><button class="hor-edit" onclick="window.editarHorarioAula('${h.id}')">Editar</button><button class="hor-del" onclick="window.excluirHorarioAula('${h.id}')">Excluir</button></div></div>`).join('')}</div></div>`;
    }).join('');
  }

  function renderHorarios(){fillFiltroEscola();renderDisciplinas();renderGrade();renderHomeSchedule()}

  function openDisciplina(id=''){
    const d=id?(db.disciplinas||[]).find(x=>x.id===id):null;
    $('#horarioModalTitle').textContent=d?'Editar disciplina':'Nova disciplina';
    $('#horarioModalBody').innerHTML=`<div class="hor-form-grid"><label style="grid-column:1/-1">Nome da disciplina<input id="discNomeHor" maxlength="80" value="${esc2(d?.nome||'')}" placeholder="Ex.: História"></label></div>`;
    const dlg=$('#horarioModal');dlg.dataset.tipo='disciplina';dlg.dataset.id=id;dlg.showModal();
  }

  function turmasDaEscola(escolaId){return (db.turmas||[]).filter(t=>t.escolaId===escolaId)}
  function optionsTurmas(escolaId,sel=''){return turmasDaEscola(escolaId).map(t=>`<option value="${t.id}" ${t.id===sel?'selected':''}>${esc2(turmaLabel(t))}</option>`).join('')}
  function optionsDisciplinas(sel=''){return (db.disciplinas||[]).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')).map(d=>`<option value="${d.id}" ${d.id===sel?'selected':''}>${esc2(d.nome)}</option>`).join('')}

  function openHorario(id=''){
    if(!(db.escolas||[]).length){alert('Cadastre uma escola primeiro.');return}
    if(!(db.turmas||[]).length){alert('Cadastre uma turma primeiro.');return}
    if(!(db.disciplinas||[]).length){alert('Cadastre uma disciplina primeiro.');return}
    const h=id?(db.horarios||[]).find(x=>x.id===id):null;
    const escolaId=h?.escolaId||(db.escolas||[])[0].id;
    $('#horarioModalTitle').textContent=h?'Editar aula no horário':'Cadastrar aula no horário';
    $('#horarioModalBody').innerHTML=`<div class="hor-form-grid">
      <label>Escola<select id="horEscola">${(db.escolas||[]).map(e=>`<option value="${e.id}" ${e.id===escolaId?'selected':''}>${esc2(e.nome)}</option>`).join('')}</select></label>
      <label>Turma<select id="horTurma">${optionsTurmas(escolaId,h?.turmaId||'')}</select></label>
      <label>Disciplina<select id="horDisciplina">${optionsDisciplinas(h?.disciplinaId||'')}</select></label>
      <label>Dia da semana<select id="horDia">${DIAS.map(d=>`<option value="${d.v}" ${Number(h?.dia||1)===d.v?'selected':''}>${d.n}</option>`).join('')}</select></label>
      <label>Número da aula<select id="horAula">${Array.from({length:10},(_,i)=>i+1).map(n=>`<option value="${n}" ${Number(h?.aula||1)===n?'selected':''}>${n}ª aula</option>`).join('')}</select></label>
      <label>Horário inicial<input id="horInicio" type="time" value="${esc2(h?.inicio||'')}"></label>
      <label>Horário final<input id="horFim" type="time" value="${esc2(h?.fim||'')}"></label>
    </div>`;
    $('#horEscola').onchange=()=>{$('#horTurma').innerHTML=optionsTurmas($('#horEscola').value)};
    const dlg=$('#horarioModal');dlg.dataset.tipo='horario';dlg.dataset.id=id;dlg.showModal();
  }

  function salvarModal(ev){
    ev.preventDefault();
    const dlg=$('#horarioModal');const tipo=dlg.dataset.tipo;const id=dlg.dataset.id||'';
    if(tipo==='disciplina'){
      const nome=($('#discNomeHor')?.value||'').trim();if(!nome){alert('Informe o nome da disciplina.');return}
      const dup=(db.disciplinas||[]).find(d=>d.id!==id&&(d.nome||'').trim().toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR'));
      if(dup){alert('Essa disciplina já está cadastrada.');return}
      if(id){const d=db.disciplinas.find(x=>x.id===id);if(d)d.nome=nome}else db.disciplinas.push({id:uid(),nome});
    }else{
      const escolaId=$('#horEscola')?.value||'',turmaId=$('#horTurma')?.value||'',disciplinaId=$('#horDisciplina')?.value||'';
      const dia=Number($('#horDia')?.value||1),aula=Number($('#horAula')?.value||1),inicio=$('#horInicio')?.value||'',fim=$('#horFim')?.value||'';
      if(!escolaId||!turmaId||!disciplinaId){alert('Selecione escola, turma e disciplina.');return}
      if(!inicio||!fim){alert('Informe o horário inicial e final.');return}
      if(fim<=inicio){alert('O horário final deve ser posterior ao inicial.');return}
      const reg={id:id||uid(),escolaId,turmaId,disciplinaId,dia,aula,inicio,fim};
      if(id){const i=db.horarios.findIndex(x=>x.id===id);if(i>=0)db.horarios[i]=reg}else db.horarios.push(reg);
    }
    persist();dlg.close();renderHorarios();
  }

  window.editarDisciplinaHorario=id=>openDisciplina(id);
  window.excluirDisciplinaHorario=id=>{
    if((db.horarios||[]).some(h=>h.disciplinaId===id)){alert('Essa disciplina está sendo usada na grade. Exclua ou altere esses horários primeiro.');return}
    if(!confirm('Excluir esta disciplina?'))return;db.disciplinas=db.disciplinas.filter(d=>d.id!==id);persist();renderHorarios();
  };
  window.editarHorarioAula=id=>openHorario(id);
  window.excluirHorarioAula=id=>{if(!confirm('Excluir este horário de aula?'))return;db.horarios=db.horarios.filter(h=>h.id!==id);persist();renderHorarios()};

  function renderHomeSchedule(){
    const dash=$('#view-dashboard');if(!dash)return;
    let area=$('#homeScheduleToday');
    if(!area){
      area=document.createElement('div');area.id='homeScheduleToday';area.className='home-schedule';
      const cards=$('#dashboardCards');
      if(cards)cards.parentNode.insertBefore(area,cards);else dash.appendChild(area);
    }
    const today=new Date().getDay();const dia=DIAS.find(d=>d.v===today);
    const items=(db.horarios||[]).filter(h=>Number(h.dia)===today).sort((a,b)=>(a.inicio||'').localeCompare(b.inicio||'')||Number(a.aula)-Number(b.aula));
    area.innerHTML=`<div class="home-schedule-head"><div><span class="eyebrow">HORÁRIO DO DIA</span><h3>${dia?.n||'Hoje'}</h3></div><button class="link-btn" id="abrirHorariosHome">Ver grade completa</button></div>`;
    if(!items.length){area.innerHTML+='<div class="hor-empty">Nenhuma aula cadastrada para hoje.</div>'}
    else{
      const escolas=[...new Set(items.map(h=>h.escolaId))];
      area.innerHTML+=escolas.map(eid=>`<div class="home-school"><div class="home-school-title">🏫 ${esc2(escolaNome(eid))}</div>${items.filter(h=>h.escolaId===eid).map(h=>`<div class="home-class-row"><div><b>${esc2(h.inicio)}–${esc2(h.fim)}</b></div><div>${esc2(h.aula)}ª aula</div><div><b>${esc2(turmaNome(h.turmaId))}</b></div><div class="hc-disc">${esc2(disciplinaNome(h.disciplinaId))}</div></div>`).join('')}</div>`).join('');
    }
    $('#abrirHorariosHome')?.addEventListener('click',()=>{if(typeof go==='function')go('horarios');const p=$('#pageTitle');if(p)p.textContent='Horários';renderHorarios()});
  }

  function init(){
    injectStyles();injectMenuAndView();
    $('#novaDisciplinaBtn')?.addEventListener('click',()=>openDisciplina());
    $('#novoHorarioBtn')?.addEventListener('click',()=>openHorario());
    $('#horFiltroEscola')?.addEventListener('change',renderGrade);
    $('#horarioForm')?.addEventListener('submit',salvarModal);
    renderHorarios();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();