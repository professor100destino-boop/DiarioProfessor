(()=>{
  const MAIN_KEY='professorControlV1';

  function escHtml(v){
    return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function getDB(){ return window.db || db; }
  function persist(){
    const d=getDB();
    localStorage.setItem(MAIN_KEY,JSON.stringify(d));
  }
  function fmtDate(d){
    if(!d)return '';
    try{return new Date(d+'T12:00:00').toLocaleDateString('pt-BR')}catch(e){return d}
  }

  function removeConteudosMenu(){
    document.querySelectorAll('.nav-item[data-view="conteudos"], [data-go="conteudos"]').forEach(el=>{
      if(el.matches('.nav-item')) el.remove();
      else el.dataset.go='planejamento';
    });
    const old=document.getElementById('view-conteudos');
    if(old) old.style.display='none';
  }

  function enhancePlanningHeader(){
    const view=document.getElementById('view-planejamento');
    if(!view)return;
    const h=view.querySelector('.section-head h2');
    const p=view.querySelector('.section-head p');
    if(h) h.textContent='Planejamento de Aulas';
    if(p) p.textContent='Planeje, consulte cada aula e registre a execução diretamente no mesmo lugar.';
  }

  function ensureHistoryArea(){
    if(document.getElementById('planExecHistory'))return;
    const area=document.getElementById('planAulasArea');
    if(!area)return;
    const box=document.createElement('div');
    box.id='planExecHistory';
    box.className='plan-exec-history';
    box.innerHTML=`
      <div class="section-head plan-exec-head">
        <div>
          <h3 style="margin:0">Aulas executadas</h3>
          <p class="muted" style="margin:5px 0 0">Histórico do que realmente foi trabalhado com a turma selecionada.</p>
        </div>
      </div>
      <div id="planExecHistoryList"></div>`;
    area.parentNode.insertBefore(box,area);
  }

  function linkedLabel(c){
    if(!c.planejamentoId || !c.aulaNumero)return '';
    return `Aula ${c.aulaNumero} do planejamento`;
  }

  function renderExecutionHistory(){
    ensureHistoryArea();
    const list=document.getElementById('planExecHistoryList');
    if(!list)return;
    const d=getDB();
    const tid=document.getElementById('planTurma')?.value||'';
    if(!tid){
      list.innerHTML='<p class="muted">Selecione uma turma para visualizar as aulas executadas.</p>';
      return;
    }
    const rows=(d.conteudos||[]).filter(c=>c.turmaId===tid).sort((a,b)=>(b.data||'').localeCompare(a.data||''));
    if(!rows.length){
      list.innerHTML='<div class="plan-exec-empty">Nenhuma aula executada registrada para esta turma.</div>';
      return;
    }
    list.innerHTML=rows.map(c=>`<div class="plan-exec-row">
      <div class="plan-exec-main">
        <div class="plan-exec-date">${escHtml(fmtDate(c.data))}</div>
        <div><b>${escHtml(c.titulo||'Aula realizada')}</b>${linkedLabel(c)?` <span class="plan-exec-badge">${escHtml(linkedLabel(c))}</span>`:''}</div>
        ${c.conteudo?`<div class="plan-exec-text"><b>Conteúdo:</b> ${escHtml(c.conteudo)}</div>`:''}
        ${c.atividade?`<div class="plan-exec-text"><b>Atividade:</b> ${escHtml(c.atividade)}</div>`:''}
      </div>
      <button type="button" class="primary ghost plan-exec-edit" onclick="editarExecucaoAula('${c.id}')">Editar</button>
    </div>`).join('');
  }

  function executionFor(pid,numero){
    return (getDB().conteudos||[]).find(c=>c.planejamentoId===pid && Number(c.aulaNumero)===Number(numero));
  }

  function injectLessonExecution(pid,numero){
    const detail=document.getElementById('planLessonDetail');
    if(!detail || detail.classList.contains('hidden'))return;
    const old=detail.querySelector('.plan-exec-actions');
    if(old)old.remove();
    const record=executionFor(pid,numero);
    const box=document.createElement('div');
    box.className='plan-exec-actions';
    box.innerHTML=record
      ? `<div class="plan-exec-done">✓ Aula executada em <b>${escHtml(fmtDate(record.data))}</b></div>
         <button type="button" class="primary plan-exec-btn" onclick="executarAulaPlanejada('${pid}',${Number(numero)})">Editar execução</button>`
      : `<button type="button" class="primary plan-exec-btn" onclick="executarAulaPlanejada('${pid}',${Number(numero)})">▶ Executar aula</button>
         <small class="muted">Registre o que realmente foi trabalhado nesta aula.</small>`;
    detail.appendChild(box);
  }

  window.executarAulaPlanejada=function(pid,numero){
    const d=getDB();
    const p=(d.planejamentos||[]).find(x=>x.id===pid); if(!p)return;
    const a=(p.aulas||[]).find(x=>Number(x.numero)===Number(numero)); if(!a)return;
    const current=executionFor(pid,numero);
    const today=typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);
    const title=current?.titulo || a.titulo || `Aula ${numero}`;
    const content=current?.conteudo || a.objetivos || a.titulo || '';
    const activity=current?.atividade || '';
    const planned=`<div class="notice" style="margin-bottom:14px"><b>AULA ${Number(numero)} – ${escHtml(a.titulo)}</b>${a.metodologia?`<br><small><b>Metodologia planejada:</b> ${escHtml(a.metodologia)}</small>`:''}</div>`;
    modal(current?'Editar execução da aula':'Executar aula',`${planned}
      <label>Data<input id="mExecData" type="date" value="${escHtml(current?.data||today)}"></label>
      <label>Título<input id="mExecTitulo" value="${escHtml(title)}"></label>
      <label>Conteúdo ministrado<textarea id="mExecConteudo">${escHtml(content)}</textarea></label>
      <label>Atividade realizada<textarea id="mExecAtividade" placeholder="Descreva a atividade realizada, se houver">${escHtml(activity)}</textarea></label>`,()=>{
        const titulo=document.getElementById('mExecTitulo')?.value.trim();
        if(!titulo)return false;
        const payload={
          turmaId:p.turmaId,
          data:document.getElementById('mExecData')?.value||today,
          titulo,
          conteudo:document.getElementById('mExecConteudo')?.value||'',
          atividade:document.getElementById('mExecAtividade')?.value||'',
          planejamentoId:pid,
          aulaNumero:Number(numero),
          bimestre:p.bimestre || document.getElementById('planBimestre')?.value || '3º Bimestre'
        };
        if(current) Object.assign(current,payload);
        else (d.conteudos??=[]).push({id:typeof id==='function'?id():'c'+Date.now(),...payload});
        persist();
        setTimeout(()=>{
          renderExecutionHistory();
          injectLessonExecution(pid,numero);
          if(typeof toast==='function')toast(current?'Execução atualizada':'Aula executada e registrada');
        },50);
        return true;
      });
  };

  window.editarExecucaoAula=function(cid){
    const d=getDB();
    const c=(d.conteudos||[]).find(x=>x.id===cid); if(!c)return;
    if(c.planejamentoId && c.aulaNumero){
      window.executarAulaPlanejada(c.planejamentoId,c.aulaNumero);
      return;
    }
    modal('Editar aula executada',`
      <label>Data<input id="mExecData" type="date" value="${escHtml(c.data||'')}"></label>
      <label>Título<input id="mExecTitulo" value="${escHtml(c.titulo||'')}"></label>
      <label>Conteúdo ministrado<textarea id="mExecConteudo">${escHtml(c.conteudo||'')}</textarea></label>
      <label>Atividade realizada<textarea id="mExecAtividade">${escHtml(c.atividade||'')}</textarea></label>`,()=>{
        const titulo=document.getElementById('mExecTitulo')?.value.trim(); if(!titulo)return false;
        c.data=document.getElementById('mExecData')?.value||c.data;
        c.titulo=titulo;
        c.conteudo=document.getElementById('mExecConteudo')?.value||'';
        c.atividade=document.getElementById('mExecAtividade')?.value||'';
        persist();
        setTimeout(renderExecutionHistory,50);
        return true;
      });
  };

  function hookLessonOpen(){
    const original=window.abrirAulaPlanejamento;
    if(typeof original==='function' && !original.__execHook){
      const wrapped=function(pid,numero,scroll=true){
        const r=original(pid,numero,scroll);
        setTimeout(()=>injectLessonExecution(pid,numero),0);
        return r;
      };
      wrapped.__execHook=true;
      window.abrirAulaPlanejamento=wrapped;
    }
  }

  function installStyles(){
    if(document.getElementById('planningExecuteStyles'))return;
    const s=document.createElement('style');
    s.id='planningExecuteStyles';
    s.textContent=`
      .plan-exec-history{margin:22px 0 10px;padding:18px;border:1px solid #dbe5f1;border-radius:18px;background:#f8fbff}
      .plan-exec-head{margin-bottom:12px!important}.plan-exec-row{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:14px 4px;border-top:1px solid #e3eaf4}
      .plan-exec-row:first-child{border-top:0}.plan-exec-main{min-width:0;flex:1}.plan-exec-date{font-size:13px;color:#64748b;font-weight:700;margin-bottom:3px}
      .plan-exec-text{margin-top:5px;color:#475569}.plan-exec-badge{display:inline-block;background:#dcfce7;color:#166534;border-radius:999px;padding:3px 8px;font-size:12px;margin-left:5px}
      .plan-exec-empty{padding:16px;border-radius:13px;background:#fff;color:#64748b}.plan-exec-actions{margin-top:20px;padding-top:18px;border-top:1px solid #dbe5f1;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      .plan-exec-btn{background:linear-gradient(135deg,#15803d,#22a65a)!important;min-height:48px}.plan-exec-done{background:#dcfce7;color:#166534;border-radius:12px;padding:12px 14px}
      @media(max-width:700px){.plan-exec-row{align-items:flex-start;flex-direction:column}.plan-exec-edit{width:100%}.plan-exec-actions .plan-exec-btn{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function init(){
    removeConteudosMenu();
    enhancePlanningHeader();
    ensureHistoryArea();
    installStyles();
    hookLessonOpen();
    const turma=document.getElementById('planTurma');
    const escola=document.getElementById('planEscola');
    const bim=document.getElementById('planBimestre');
    turma?.addEventListener('change',()=>setTimeout(renderExecutionHistory,0));
    escola?.addEventListener('change',()=>setTimeout(renderExecutionHistory,0));
    bim?.addEventListener('change',()=>setTimeout(renderExecutionHistory,0));
    renderExecutionHistory();

    const detail=document.getElementById('planLessonDetail');
    if(detail){
      new MutationObserver(()=>{
        try{
          if(typeof planejamentoAtualId!=='undefined' && typeof aulaAtualNumero!=='undefined' && planejamentoAtualId && aulaAtualNumero)
            injectLessonExecution(planejamentoAtualId,aulaAtualNumero);
        }catch(e){}
      }).observe(detail,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
  else setTimeout(init,0);
})();