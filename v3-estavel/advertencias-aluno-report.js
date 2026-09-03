(()=>{
  if(!window.db)return;
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=s=>{if(!s)return'';const [y,m,d]=String(s).split('-');return d&&m&&y?`${d}/${m}/${y}`:String(s)};
  const alunoObj=id=>(db.alunos||[]).find(a=>a.id===id);
  const alunoNome=id=>alunoObj(id)?.nome||'Aluno não localizado';
  const escolaNome=id=>(db.escolas||[]).find(e=>e.id===id)?.nome||'';
  const turmaNome=id=>{const t=(db.turmas||[]).find(x=>x.id===id);return t?`${t.serie||''} ${t.turma||''}${t.disciplina?' • '+t.disciplina:''}`.trim():''};

  function hasNativePrint(){try{return !!(window.Android&&typeof window.Android.printHtml==='function')}catch(e){return false}}
  function printHtml(html,name){
    if(hasNativePrint()){
      window.Android.printHtml(html,name||'Relatório de advertências');
      return;
    }
    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.');return}
    w.document.open();w.document.write(html);w.document.close();
    setTimeout(()=>{try{w.focus();w.print()}catch(e){console.error(e)}},400);
  }

  function advertenciasDoAluno(id){
    return (db.advertencias||[])
      .filter(r=>r.alunoId===id)
      .sort((a,b)=>String(a.data||'').localeCompare(String(b.data||''))||String(a.hora||'').localeCompare(String(b.hora||'')));
  }

  function htmlRelatorioAluno(id){
    const aluno=alunoObj(id);
    const rows=advertenciasDoAluno(id);
    const oral=rows.filter(r=>r.tipo!=='escrita').length;
    const escrita=rows.filter(r=>r.tipo==='escrita').length;
    const escolas=[...new Set(rows.map(r=>escolaNome(r.escolaId)).filter(Boolean))];
    const turmas=[...new Set(rows.map(r=>turmaNome(r.turmaId)).filter(Boolean))];
    const corpo=rows.map((r,i)=>`<tr>
      <td>${i+1}</td>
      <td>${esc(fmtDate(r.data))}${r.hora?'<br><small>'+esc(r.hora)+'</small>':''}</td>
      <td>${esc(escolaNome(r.escolaId))}</td>
      <td>${esc(turmaNome(r.turmaId))}</td>
      <td class="${r.tipo==='escrita'?'escrita':'oral'}">${r.tipo==='escrita'?'Escrita':'Oral'}</td>
      <td>${esc((r.motivos||[]).join('; '))}${r.complemento?'<div class="comp"><b>Complemento:</b> '+esc(r.complemento)+'</div>':''}</td>
      <td>${esc(r.professor||'')}</td>
    </tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Relatório de advertências - ${esc(alunoNome(id))}</title><style>
      @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:10pt}h1{text-align:center;font-size:17pt;margin:0 0 8px}h2{text-align:center;font-size:12pt;font-weight:normal;margin:0 0 18px}.ident{border:1px solid #777;padding:10px 12px;margin-bottom:12px;line-height:1.5}.resumo{display:flex;gap:10px;margin:10px 0 14px}.resumo div{border:1px solid #999;border-radius:6px;padding:7px 12px}.resumo b{font-size:13pt}table{width:100%;border-collapse:collapse;font-size:8.8pt}th,td{border:1px solid #777;padding:6px;vertical-align:top}th{background:#eee}.oral{color:#1d4ed8;font-weight:bold}.escrita{color:#b91c1c;font-weight:bold}.comp{margin-top:5px;font-size:8.4pt}.rodape{margin-top:18px;color:#555;text-align:center;font-size:8.5pt}.assinatura{margin-top:38px;display:flex;justify-content:center}.linha{width:280px;border-top:1px solid #222;text-align:center;padding-top:5px}
    </style></head><body>
      <h1>RELATÓRIO DE ADVERTÊNCIAS POR ALUNO</h1>
      <h2>Docência Fácil / Professor Control</h2>
      <div class="ident"><b>Aluno(a):</b> ${esc(alunoNome(id))}<br>${aluno?.matricula?`<b>Matrícula:</b> ${esc(aluno.matricula)}<br>`:''}<b>Escola(s):</b> ${esc(escolas.join(' / ')||'—')}<br><b>Turma(s):</b> ${esc(turmas.join(' / ')||'—')}</div>
      <div class="resumo"><div>Total de registros: <b>${rows.length}</b></div><div>Advertências orais: <b>${oral}</b></div><div>Advertências escritas: <b>${escrita}</b></div></div>
      <table><thead><tr><th>Nº</th><th>Data / hora</th><th>Escola</th><th>Turma</th><th>Tipo</th><th>Motivo(s) / complemento</th><th>Professor(a)</th></tr></thead><tbody>${corpo}</tbody></table>
      <div class="assinatura"><div class="linha">Coordenação / Direção</div></div>
      <div class="rodape">Relatório gerado em ${new Date().toLocaleString('pt-BR')} • ${rows.length} registro${rows.length===1?'':'s'}</div>
    </body></html>`;
  }

  function alunosComAdvertencia(){
    const ids=[...new Set((db.advertencias||[]).map(r=>r.alunoId).filter(Boolean))];
    return ids.map(id=>alunoObj(id)||{id,nome:'Aluno não localizado'}).sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
  }

  function syncSelect(){
    const sel=$('#advRelAluno');if(!sel)return;
    const old=sel.value;
    const alunos=alunosComAdvertencia();
    sel.innerHTML=alunos.length?alunos.map(a=>`<option value="${esc(a.id)}">${esc(a.nome||'Aluno')}</option>`).join(''):'<option value="">Nenhum aluno com advertência</option>';
    if(alunos.some(a=>a.id===old))sel.value=old;
  }

  function generate(){
    const id=$('#advRelAluno')?.value;
    if(!id){alert('Selecione um aluno que possua advertência registrada.');return}
    const rows=advertenciasDoAluno(id);
    if(!rows.length){alert('Este aluno não possui advertências registradas.');return}
    printHtml(htmlRelatorioAluno(id),`Relatório de advertências - ${alunoNome(id)}`);
  }

  function enhance(){
    const hist=$('#advHistorico');if(!hist)return;
    if(!$('#advRelAlunoBox')){
      const box=document.createElement('div');
      box.id='advRelAlunoBox';
      box.innerHTML=`<div class="adv-rel-aluno-title"><div><b>Relatório de advertências por aluno</b><small>Selecione o estudante para imprimir todo o histórico individual.</small></div></div><div class="adv-rel-aluno-actions"><select id="advRelAluno" aria-label="Aluno para relatório"></select><button type="button" id="advRelAlunoBtn">🖨 Imprimir / Salvar em PDF</button></div>`;
      hist.parentNode.insertBefore(box,hist);
      $('#advRelAlunoBtn').onclick=generate;
    }
    syncSelect();
  }

  function style(){
    if($('#advRelAlunoStyle'))return;
    const s=document.createElement('style');s.id='advRelAlunoStyle';s.textContent=`
      #advRelAlunoBox{margin:4px 0 16px;padding:16px;border:1px solid #cbdcf4;background:#f6faff;border-radius:16px}.adv-rel-aluno-title b{display:block;font-size:16px;color:#173f73}.adv-rel-aluno-title small{display:block;color:#64748b;margin-top:4px}.adv-rel-aluno-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}#advRelAluno{flex:1;min-width:260px;padding:11px 12px;border:1px solid #cbd5e1;border-radius:12px;background:#fff}#advRelAlunoBtn{border:0;border-radius:12px;padding:12px 16px;background:#173f73;color:#fff;font-weight:900}@media(max-width:650px){#advRelAluno,.adv-rel-aluno-actions #advRelAlunoBtn{width:100%;min-width:0}}
    `;document.head.appendChild(s);
  }

  function init(){style();enhance();const obs=new MutationObserver(()=>enhance());obs.observe(document.body,{childList:true,subtree:true});window.imprimirRelatorioAdvertenciasAluno=generate;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();