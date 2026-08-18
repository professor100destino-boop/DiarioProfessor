(()=>{
  const MOTIVOS=[
    'Desrespeito ao professor ou servidor',
    'Desrespeito ou agressão verbal a colega',
    'Agressão física ou tentativa de agressão',
    'Conversas, brincadeiras ou comportamento que prejudicam a aula',
    'Uso indevido de celular ou outro aparelho eletrônico',
    'Recusa em cumprir orientação do professor ou normas da escola',
    'Saída da sala de aula sem autorização',
    'Saída das dependências da escola sem autorização',
    'Atrasos recorrentes ou entrada indevida após o início da aula',
    'Linguagem ofensiva, palavrões ou gestos inadequados',
    'Bullying, intimidação ou constrangimento de colega',
    'Cyberbullying ou conduta inadequada em ambiente virtual ligada à escola',
    'Dano, mau uso ou tentativa de dano ao patrimônio escolar',
    'Fraude, cola ou uso de meio não autorizado em atividade/avaliação',
    'Porte ou uso de objeto proibido ou inadequado no ambiente escolar',
    'Porte, uso ou suspeita de substância proibida',
    'Desrespeito recorrente ao regimento ou às regras de convivência',
    'Outro motivo'
  ];

  const db=()=>window.db;
  const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const persist=()=>localStorage.setItem('professorControlV1',JSON.stringify(db()));
  const fmtDate=s=>{if(!s)return'';const [y,m,d]=s.split('-');return `${d}/${m}/${y}`};
  const escolaNome=id=>db().escolas.find(e=>e.id===id)?.nome||'';
  const turmaObj=id=>db().turmas.find(t=>t.id===id);
  const turmaTexto=id=>{const t=turmaObj(id);return t?`${t.serie} ${t.turma} • ${t.disciplina}`:''};
  const alunoNome=id=>db().alunos.find(a=>a.id===id)?.nome||'';

  function makeView(){
    if(document.querySelector('#view-advertencias'))return;
    const sec=document.createElement('section');
    sec.id='view-advertencias';sec.className='view';
    sec.innerHTML=`
      <div class="section-shell adv-shell">
        <div class="section-head"><div><h2>Advertências</h2><p>Registre advertências orais e escritas, sem precisar redigitar os motivos mais comuns.</p></div></div>
        <div class="panel adv-panel">
          <div class="adv-grid">
            <label>Escola<select id="advEscola"></select></label>
            <label>Turma<select id="advTurma"></select></label>
            <label>Aluno<select id="advAluno"></select></label>
            <label>Data<input type="date" id="advData"></label>
            <label>Hora<input type="time" id="advHora"></label>
            <label>Tipo<select id="advTipo"><option value="oral">Advertência oral</option><option value="escrita">Advertência escrita</option></select></label>
          </div>

          <div class="adv-block">
            <h3>Motivo(s) da advertência</h3>
            <p class="muted">Marque um ou mais motivos.</p>
            <div class="adv-reasons" id="advMotivos">${MOTIVOS.map((m,i)=>`<label class="adv-check"><input type="checkbox" value="${escHtml(m)}"><span><b>☐</b> ${escHtml(m)}</span></label>`).join('')}</div>
          </div>

          <div class="adv-grid adv-extra">
            <label class="adv-wide">Complemento / descrição breve<textarea id="advComplemento" rows="4" placeholder="Opcional. Use apenas quando precisar explicar melhor o ocorrido."></textarea></label>
            <label>Professor(a)<input id="advProfessor" placeholder="Nome do professor"></label>
            <label id="advRecusaWrap" class="hidden">Aluno recusou-se a assinar?<select id="advRecusou"><option value="nao">Não</option><option value="sim">Sim</option></select></label>
          </div>

          <div class="button-row adv-actions">
            <button class="primary" id="advSalvar">Salvar advertência</button>
            <button class="primary ghost hidden" id="advSalvarPdf">Salvar e gerar PDF</button>
          </div>
          <div class="notice adv-note"><b>Observação:</b> a advertência é um registro pedagógico/disciplinar. Situações graves que exijam registro oficial de ocorrência devem seguir os procedimentos da unidade escolar e do SIGE.</div>
        </div>

        <div class="panel" style="margin-top:18px">
          <div class="panel-head"><h3>Histórico de advertências</h3><span class="panel-tag" id="advCount">0 registros</span></div>
          <div id="advHistorico" class="table-wrap"></div>
        </div>
      </div>`;
    const rel=document.querySelector('#view-relatorios');
    if(rel) rel.parentNode.insertBefore(sec,rel); else document.querySelector('main')?.appendChild(sec);
  }

  function addNav(){
    if(document.querySelector('.nav-item[data-view="advertencias"]'))return;
    const nav=document.querySelector('.sidebar nav, nav.sidebar-nav, aside nav');
    if(!nav)return;
    const btn=document.createElement('button');btn.className='nav-item';btn.dataset.view='advertencias';btn.innerHTML='<span class="nav-ico">⚠️</span><span>Advertências</span>';
    const rel=nav.querySelector('[data-view="relatorios"]');if(rel)nav.insertBefore(btn,rel);else nav.appendChild(btn);
    btn.onclick=()=>openAdv();
  }

  function addHome(){
    const actions=document.querySelector('.hero-actions');if(!actions||actions.querySelector('[data-go="advertencias"]'))return;
    const b=document.createElement('button');b.className='primary hero-action-btn hero-action-red';b.dataset.go='advertencias';b.innerHTML='Advertência<span>Oral, escrita e PDF</span>';b.onclick=()=>openAdv();actions.appendChild(b);
  }

  function addStyles(){
    const s=document.createElement('style');s.textContent=`
      .hero-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}.hero-action-red{background:linear-gradient(135deg,#dc2626,#b91c1c)!important;color:#fff!important}
      .adv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.adv-grid label{display:flex;flex-direction:column;gap:6px;font-weight:800}.adv-grid input,.adv-grid select,.adv-grid textarea{width:100%;box-sizing:border-box}.adv-block{margin-top:20px}.adv-block h3{margin-bottom:4px}.adv-reasons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.adv-check{display:flex;align-items:flex-start;gap:9px;padding:11px 12px;border:1px solid var(--border);border-radius:13px;background:#fff;cursor:pointer;font-weight:600!important}.adv-check input{width:20px!important;height:20px!important;margin-top:1px;accent-color:#c62828}.adv-check:has(input:checked){border-color:#ef4444;background:#fff1f2}.adv-check input:checked+span b{font-size:0}.adv-check input:checked+span b:after{content:'☒';font-size:17px;color:#b91c1c}.adv-extra{margin-top:18px}.adv-wide{grid-column:1/-1}.adv-actions{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}.adv-note{margin-top:14px}.adv-badge{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:900}.adv-badge.oral{background:#eff6ff;color:#1d4ed8}.adv-badge.escrita{background:#fff1f2;color:#b91c1c}.adv-row-actions{display:flex;gap:7px;flex-wrap:wrap}.adv-mini{padding:7px 9px;border-radius:9px;border:1px solid var(--border);background:#fff;font-weight:800}.adv-mini.pdf{background:#7c3aed;color:#fff;border-color:#7c3aed}.adv-mini.del{color:#b91c1c}
      @media(max-width:900px){.adv-grid{grid-template-columns:1fr 1fr}.adv-reasons{grid-template-columns:1fr}.hero-actions{grid-template-columns:1fr 1fr!important}}
      @media(max-width:620px){.adv-grid{grid-template-columns:1fr}.hero-actions{grid-template-columns:1fr!important}}
    `;document.head.appendChild(s);
  }

  function openAdv(){
    if(typeof go==='function')go('advertencias');
    const p=document.querySelector('#pageTitle');if(p)p.textContent='Advertências';
    syncSelectors();renderHistory();
    document.querySelector('#sidebar')?.classList.remove('open');
  }

  function syncSelectors(){
    const E=document.querySelector('#advEscola'),T=document.querySelector('#advTurma'),A=document.querySelector('#advAluno');if(!E||!T||!A)return;
    const prevE=E.value,prevT=T.value,prevA=A.value;
    E.innerHTML=db().escolas.map(e=>`<option value="${e.id}">${escHtml(e.nome)}</option>`).join('');
    if(db().escolas.some(e=>e.id===prevE))E.value=prevE;
    const eid=E.value;
    const turmas=db().turmas.filter(t=>t.escolaId===eid);T.innerHTML=turmas.map(t=>`<option value="${t.id}">${escHtml(turmaTexto(t.id))}</option>`).join('');
    if(turmas.some(t=>t.id===prevT))T.value=prevT;
    const tid=T.value;const alunos=db().alunos.filter(a=>a.turmaId===tid&&a.ativo!==false).sort((a,b)=>(Number(a.numero)||999)-(Number(b.numero)||999)||a.nome.localeCompare(b.nome));
    A.innerHTML=alunos.map(a=>`<option value="${a.id}">${escHtml((a.numero?`${a.numero} - `:'')+a.nome)}</option>`).join('');if(alunos.some(a=>a.id===prevA))A.value=prevA;
  }

  function selectedMotivos(){return [...document.querySelectorAll('#advMotivos input:checked')].map(x=>x.value)}
  function clearForm(){document.querySelectorAll('#advMotivos input').forEach(x=>x.checked=false);document.querySelector('#advComplemento').value='';document.querySelector('#advRecusou').value='nao';}

  function collect(){
    const alunoId=document.querySelector('#advAluno')?.value,turmaId=document.querySelector('#advTurma')?.value,escolaId=document.querySelector('#advEscola')?.value;
    const motivos=selectedMotivos();if(!alunoId){alert('Selecione um aluno.');return null}if(!motivos.length){alert('Marque pelo menos um motivo da advertência.');return null}
    return {id:(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)),escolaId,turmaId,alunoId,data:document.querySelector('#advData').value,hora:document.querySelector('#advHora').value,tipo:document.querySelector('#advTipo').value,motivos,complemento:document.querySelector('#advComplemento').value.trim(),professor:document.querySelector('#advProfessor').value.trim(),recusouAssinar:document.querySelector('#advTipo').value==='escrita'&&document.querySelector('#advRecusou').value==='sim',criadoEm:new Date().toISOString()};
  }

  function saveAdv(makePdf=false){
    const r=collect();if(!r)return;db().advertencias=db().advertencias||[];db().advertencias.push(r);persist();renderHistory();clearForm();
    if(makePdf&&r.tipo==='escrita')gerarPDF(r.id);else alert(r.tipo==='oral'?'Advertência oral registrada com sucesso.':'Advertência escrita registrada com sucesso.');
  }

  function renderHistory(){
    db().advertencias=db().advertencias||[];const box=document.querySelector('#advHistorico'),count=document.querySelector('#advCount');if(!box)return;
    const rows=[...db().advertencias].sort((a,b)=>(b.data+b.hora).localeCompare(a.data+a.hora));if(count)count.textContent=`${rows.length} registro${rows.length===1?'':'s'}`;
    if(!rows.length){box.innerHTML='<p class="muted">Nenhuma advertência registrada.</p>';return}
    box.innerHTML=`<table><thead><tr><th>Data</th><th>Aluno</th><th>Turma</th><th>Tipo</th><th>Motivo</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmtDate(r.data)}<br><small>${escHtml(r.hora||'')}</small></td><td><b>${escHtml(alunoNome(r.alunoId))}</b></td><td>${escHtml(turmaTexto(r.turmaId))}</td><td><span class="adv-badge ${r.tipo}">${r.tipo==='escrita'?'Escrita':'Oral'}</span></td><td>${escHtml((r.motivos||[]).join('; '))}</td><td><div class="adv-row-actions">${r.tipo==='escrita'?`<button class="adv-mini pdf" onclick="window.gerarAdvertenciaPDF('${r.id}')">PDF / WhatsApp</button>`:''}<button class="adv-mini del" onclick="window.excluirAdvertencia('${r.id}')">Excluir</button></div></td></tr>`).join('')}</tbody></table>`;
  }

  async function gerarPDF(id){
    const r=(db().advertencias||[]).find(x=>x.id===id);if(!r)return;if(!window.jspdf?.jsPDF){alert('O gerador de PDF ainda está carregando. Aguarde alguns segundos.');return}
    const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});const m=18,w=174;let y=18;
    doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('ADVERTÊNCIA DISCIPLINAR - ESTUDANTE',105,y,{align:'center'});y+=10;
    doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text(`Escola: ${escolaNome(r.escolaId)}`,m,y);y+=6;doc.text(`Turma: ${turmaTexto(r.turmaId)}`,m,y);y+=6;doc.text(`Aluno(a): ${alunoNome(r.alunoId)}`,m,y);y+=6;doc.text(`Data: ${fmtDate(r.data)}    Hora: ${r.hora||'________'}`,m,y);y+=6;doc.text(`Professor(a): ${r.professor||'________________________________________'}`,m,y);y+=10;
    doc.setFont('helvetica','bold');doc.text('Motivo(s) assinalado(s):',m,y);y+=7;doc.setFont('helvetica','normal');
    (r.motivos||[]).forEach(mt=>{const lines=doc.splitTextToSize(`X  ${mt}`,w-5);doc.text(lines,m+3,y);y+=lines.length*5+2;if(y>255){doc.addPage();y=20}});
    if(r.complemento){y+=3;doc.setFont('helvetica','bold');doc.text('Complemento / descrição:',m,y);y+=6;doc.setFont('helvetica','normal');const lines=doc.splitTextToSize(r.complemento,w);doc.text(lines,m,y);y+=lines.length*5+6;}
    const texto='O(a) estudante acima identificado(a) foi orientado(a) sobre a conduta registrada e sobre a necessidade de observar as normas de convivência e as orientações da unidade escolar.';const tx=doc.splitTextToSize(texto,w);doc.text(tx,m,y);y+=tx.length*5+11;
    if(r.recusouAssinar){doc.setFont('helvetica','bold');doc.text('Registro: o(a) estudante recusou-se a assinar este documento.',m,y);y+=12;}
    if(y>245){doc.addPage();y=30}doc.setFont('helvetica','normal');doc.line(m,y,78,y);doc.line(92,y,150,y);y+=5;doc.setFontSize(9);doc.text('Assinatura do(a) estudante',m,y);doc.text('Professor(a)',92,y);y+=17;doc.line(m,y,78,y);doc.line(92,y,150,y);y+=5;doc.text('Responsável legal',m,y);doc.text('Coordenação/Direção',92,y);y+=12;doc.setFontSize(8);doc.text('Documento gerado pelo Professor Control para registro e encaminhamento à unidade escolar.',m,y);
    const fn=`advertencia_${alunoNome(r.alunoId).replace(/[^A-Za-z0-9]+/g,'_')}_${r.data}.pdf`;const blob=doc.output('blob');const file=new File([blob],fn,{type:'application/pdf'});
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:'Advertência escrita',text:`Advertência escrita - ${alunoNome(r.alunoId)} - ${fmtDate(r.data)}`,files:[file]});return}}catch(e){if(e?.name==='AbortError')return}
    doc.save(fn);alert('PDF gerado. Abra o arquivo e compartilhe pelo WhatsApp com a coordenação.');
  }

  function exclude(id){
    const r=(db().advertencias||[]).find(x=>x.id===id);if(!r)return;if(!confirm(`Excluir a advertência de ${alunoNome(r.alunoId)} em ${fmtDate(r.data)}?`))return;
    const senha=prompt('Digite a senha do Professor Control para confirmar:');if(senha===null)return;if(typeof securityCheckPassword==='function'&&!securityCheckPassword(senha)){alert('Senha incorreta.');return}
    db().advertencias=db().advertencias.filter(x=>x.id!==id);persist();renderHistory();
  }

  function init(){
    if(!window.db)return;db().advertencias=db().advertencias||[];persist();makeView();addNav();addHome();addStyles();
    const d=new Date();document.querySelector('#advData').value=d.toISOString().slice(0,10);document.querySelector('#advHora').value=d.toTimeString().slice(0,5);document.querySelector('#advProfessor').value=db().config?.profNome||'';
    document.querySelector('#advEscola').onchange=syncSelectors;document.querySelector('#advTurma').onchange=syncSelectors;
    document.querySelector('#advTipo').onchange=e=>{const written=e.target.value==='escrita';document.querySelector('#advRecusaWrap').classList.toggle('hidden',!written);document.querySelector('#advSalvarPdf').classList.toggle('hidden',!written)};
    document.querySelector('#advSalvar').onclick=()=>saveAdv(false);document.querySelector('#advSalvarPdf').onclick=()=>saveAdv(true);syncSelectors();renderHistory();
    window.gerarAdvertenciaPDF=gerarPDF;window.excluirAdvertencia=exclude;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();