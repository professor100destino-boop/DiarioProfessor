(()=>{
  const $=window.$||((s)=>document.querySelector(s));
  if(!window.db||!$('#freqData')||!$('#freqList')) return;

  db.alunos=(db.alunos||[]).map(a=>({...a,ativo:a.ativo!==false,motivoInativo:a.motivoInativo||'',dataInativacao:a.dataInativacao||''}));
  db.frequencias=(db.frequencias||[]).map(f=>({...f,aulaDia:String(f.aulaDia||'1')}));
  localStorage.setItem(KEY,JSON.stringify(db));

  if(!$('#freqAulaDia')){
    const sel=document.createElement('select');
    sel.id='freqAulaDia';
    sel.setAttribute('aria-label','Aula do dia');
    sel.innerHTML='<option value="1">1ª aula</option><option value="2">2ª aula</option>';
    $('#freqData').insertAdjacentElement('afterend',sel);
  }

  const css=document.createElement('style');
  css.textContent='.attendance-student-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.btn-inactivate{border:1px solid #f59e0b;background:#fff7ed;color:#9a3412;border-radius:12px;padding:8px 12px;font-weight:800}.attendance-bottom-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:22px 0 8px;padding:18px;background:#fff;border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow-soft)}.attendance-bottom-actions button{min-width:210px}.btn-pdf{background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;border:0;border-radius:14px;padding:13px 18px;font-weight:900}.inactive-box{margin-top:14px;padding:14px;border:1px dashed #f59e0b;border-radius:16px;background:#fffaf0}.inactive-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f7df9d}.inactive-row:last-child{border-bottom:0}.freq-note{margin:10px 0 14px;padding:10px 12px;border-radius:12px;background:#eef6ff;color:#174a84;font-weight:700}';
  document.head.appendChild(css);

  const currentAula=()=>String($('#freqAulaDia')?.value||'1');
  const currentDate=()=>$('#freqData')?.value||new Date().toISOString().slice(0,10);
  const currentTurma=()=>$('#freqTurma')?.value||'';

  window.setFreq=(aid,status)=>{
    const turmaId=currentTurma(), data=currentDate(), aulaDia=currentAula();
    if(!turmaId) return;
    let f=db.frequencias.find(x=>x.alunoId===aid&&x.turmaId===turmaId&&x.data===data&&String(x.aulaDia||'1')===aulaDia);
    if(f){f.status=status;f.aulaDia=aulaDia}else db.frequencias.push({id:id(),alunoId:aid,turmaId,data,aulaDia,status});
    localStorage.setItem(KEY,JSON.stringify(db));
    renderFreq();
  };

  window.marcarTodosPresentes=()=>{
    const turmaId=currentTurma(), data=currentDate(), aulaDia=currentAula();
    if(!turmaId) return;
    db.alunos.filter(a=>a.turmaId===turmaId&&a.ativo!==false).forEach(a=>{
      let f=db.frequencias.find(x=>x.alunoId===a.id&&x.turmaId===turmaId&&x.data===data&&String(x.aulaDia||'1')===aulaDia);
      if(f){f.status='Presente';f.aulaDia=aulaDia}else db.frequencias.push({id:id(),alunoId:a.id,turmaId,data,aulaDia,status:'Presente'});
    });
    localStorage.setItem(KEY,JSON.stringify(db));renderFreq();
  };

  window.salvarChamadaAtual=()=>{
    const turmaId=currentTurma(), data=currentDate(), aulaDia=currentAula();
    if(!turmaId){alert('Selecione a turma.');return}
    db.alunos.filter(a=>a.turmaId===turmaId&&a.ativo!==false).forEach(a=>{
      const f=db.frequencias.find(x=>x.alunoId===a.id&&x.turmaId===turmaId&&x.data===data&&String(x.aulaDia||'1')===aulaDia);
      if(!f) db.frequencias.push({id:id(),alunoId:a.id,turmaId,data,aulaDia,status:'Presente'});
    });
    localStorage.setItem(KEY,JSON.stringify(db));
    alert(`Chamada da ${aulaDia}ª aula salva com sucesso.`);
  };

  window.desativarAlunoChamada=(aid)=>{
    const a=db.alunos.find(x=>x.id===aid);if(!a)return;
    const escolha=prompt(`Desativar aluno: ${a.nome}\n\n1 - Transferência\n2 - Parou de estudar\n3 - Mudou de turma\n4 - Outro\n\nDigite o número do motivo:`);
    if(escolha===null)return;
    const motivos=['Transferência','Parou de estudar','Mudou de turma','Outro'];const idx=Number(escolha)-1;
    if(idx<0||idx>=motivos.length){alert('Opção inválida.');return}
    let motivo=motivos[idx],detalhe='';
    if(motivo==='Mudou de turma'){
      const outras=db.turmas.filter(t=>t.id!==a.turmaId);
      if(outras.length){const op=outras.map((t,i)=>`${i+1} - ${turmaNomeCompleto(t)}`).join('\n');const d=prompt(`Para qual turma mudou?\n\n${op}\n\nDigite o número ou deixe em branco.`);if(d&&Number(d)>=1&&Number(d)<=outras.length)detalhe=`Mudou para ${turmaNomeCompleto(outras[Number(d)-1])}`}
    }else if(motivo==='Outro') detalhe=prompt('Informe o motivo:')||'Outro';
    if(!confirm(`Confirmar desativação de ${a.nome}?\nMotivo: ${detalhe||motivo}`))return;
    const senha=prompt('Digite a senha do Professor Control para confirmar:');if(senha===null)return;
    if(!securityCheckPassword(senha)){alert('Senha incorreta.');return}
    a.ativo=false;a.motivoInativo=detalhe||motivo;a.dataInativacao=new Date().toISOString();save();alert('Aluno desativado com sucesso.');
  };

  window.reativarAluno=(aid)=>{
    const a=db.alunos.find(x=>x.id===aid);if(!a)return;
    const senha=prompt(`Digite a senha para reativar ${a.nome}:`);if(senha===null)return;
    if(!securityCheckPassword(senha)){alert('Senha incorreta.');return}
    a.ativo=true;a.motivoInativo='';a.dataInativacao='';save();alert('Aluno reativado com sucesso.');
  };

  window.renderFreq=()=>{
    const box=$('#freqList');if(!box)return;
    const turmaId=currentTurma(),data=currentDate(),aulaDia=currentAula();
    const ativos=db.alunos.filter(a=>a.turmaId===turmaId&&a.ativo!==false).sort((a,b)=>(Number(a.numero)||999)-(Number(b.numero)||999)||a.nome.localeCompare(b.nome));
    const inativos=db.alunos.filter(a=>a.turmaId===turmaId&&a.ativo===false).sort((a,b)=>(Number(a.numero)||999)-(Number(b.numero)||999)||a.nome.localeCompare(b.nome));
    const getStatus=aid=>db.frequencias.find(x=>x.alunoId===aid&&x.turmaId===turmaId&&x.data===data&&String(x.aulaDia||'1')===aulaDia)?.status||'Presente';
    let h=`<div class="freq-note">${aulaDia}ª aula do dia — esta chamada é salva separadamente.</div>`;
    h+=ativos.map(a=>{const s=getStatus(a.id);return `<div class="freq-row"><div style="min-width:280px"><b>${esc(a.numero||'')} ${esc(a.nome)}</b><div class="attendance-student-actions"><button class="btn-inactivate" onclick="desativarAlunoChamada('${a.id}')">Desativar aluno</button></div></div><div class="seg">${['Presente','Falta','Justificada','Atraso'].map(st=>`<button class="${s===st?'active':''}" onclick="setFreq('${a.id}','${st}')">${st}</button>`).join('')}</div></div>`}).join('');
    h+='<div class="attendance-bottom-actions"><button class="primary" onclick="salvarChamadaAtual()">Salvar chamada</button><button class="btn-pdf" onclick="gerarRelatorioFaltososPDF()">Gerar PDF dos faltosos</button></div>';
    if(inativos.length)h+=`<div class="inactive-box"><b>Alunos desativados nesta turma</b>${inativos.map(a=>`<div class="inactive-row"><div><b>${esc(a.nome)}</b><br><small>${esc(a.motivoInativo||'Sem motivo informado')}</small></div><button class="primary ghost" onclick="reativarAluno('${a.id}')">Reativar</button></div>`).join('')}</div>`;
    box.innerHTML=h;
  };

  window.gerarRelatorioFaltososPDF=async()=>{
    const turmaId=currentTurma(),data=currentDate(),aulaDia=currentAula();if(!turmaId){alert('Selecione a turma.');return}
    const t=db.turmas.find(x=>x.id===turmaId),e=db.escolas.find(x=>x.id===t?.escolaId);
    const faltosos=db.alunos.filter(a=>a.turmaId===turmaId&&a.ativo!==false).filter(a=>{const f=db.frequencias.find(x=>x.alunoId===a.id&&x.turmaId===turmaId&&x.data===data&&String(x.aulaDia||'1')===aulaDia);return (f?.status||'Presente')==='Falta'}).sort((a,b)=>(Number(a.numero)||999)-(Number(b.numero)||999)||a.nome.localeCompare(b.nome));
    if(!faltosos.length){alert('Não há alunos marcados com falta nesta chamada.');return}
    if(!window.jspdf?.jsPDF){alert('O gerador de PDF ainda está carregando. Aguarde alguns segundos.');return}
    const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'});let y=18;const m=16;doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('RELATÓRIO DE ALUNOS FALTOSOS',m,y);y+=10;doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text(`Escola: ${e?.nome||''}`,m,y);y+=6;doc.text(`Turma: ${turmaNomeCompleto(t)}`,m,y);y+=6;const [ano,mes,dia]=data.split('-');doc.text(`Data: ${dia}/${mes}/${ano}`,m,y);y+=6;doc.text(`Aula do dia: ${aulaDia}ª aula`,m,y);y+=6;doc.text(`Quantidade de faltosos: ${faltosos.length}`,m,y);y+=10;doc.setFont('helvetica','bold');doc.text('Nº',m,y);doc.text('Aluno',m+14,y);y+=6;doc.setFont('helvetica','normal');faltosos.forEach((a,i)=>{if(y>278){doc.addPage();y=18}doc.text(String(a.numero||i+1),m,y);const n=doc.splitTextToSize(a.nome,155);doc.text(n,m+14,y);y+=Math.max(7,n.length*5)});const fn=`faltosos_${(t?.turma||'turma').replace(/[^\w-]+/g,'_')}_${data}_${aulaDia}a_aula.pdf`;const blob=doc.output('blob'),file=new File([blob],fn,{type:'application/pdf'});try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'Relatório de alunos faltosos',text:`${turmaNomeCompleto(t)} - ${dia}/${mes}/${ano} - ${aulaDia}ª aula`,files:[file]});return}}catch(err){if(err?.name==='AbortError')return}doc.save(fn);
  };

  $('#freqAulaDia').onchange=renderFreq;
  $('#freqTurma').onchange=renderFreq;
  $('#freqData').onchange=renderFreq;
  $('#todosPresentesBtn').onclick=marcarTodosPresentes;
  $('#salvarFreqBtn').onclick=salvarChamadaAtual;
  renderFreq();
})();