(()=>{
  if(!window.db)return;
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=s=>{if(!s)return'';const [y,m,d]=String(s).split('-');return `${d}/${m}/${y}`};
  const escola=id=>(db.escolas||[]).find(e=>e.id===id)?.nome||'';
  const turma=id=>{const t=(db.turmas||[]).find(x=>x.id===id);return t?`${t.serie||''} ${t.turma||''}${t.disciplina?' • '+t.disciplina:''}`.trim():''};
  const aluno=id=>(db.alunos||[]).find(a=>a.id===id)?.nome||'';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  async function ensureJsPDF(){
    if(window.jspdf?.jsPDF)return window.jspdf.jsPDF;
    let s=[...document.scripts].find(x=>String(x.src||'').includes('jspdf'));
    if(!s){s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';document.head.appendChild(s)}
    for(let i=0;i<50;i++){if(window.jspdf?.jsPDF)return window.jspdf.jsPDF;await sleep(120)}
    throw new Error('Não foi possível carregar o gerador de PDF. Conecte à internet e tente novamente.');
  }

  function getAdv(id){return (db.advertencias||[]).find(x=>x.id===id)}

  function htmlDocumento(r){
    const motivos=(r.motivos||[]).map(m=>`<li>${esc(m)}</li>`).join('');
    const tipo=r.tipo==='escrita'?'ADVERTÊNCIA ESCRITA':'REGISTRO DE ADVERTÊNCIA ORAL';
    return `<!doctype html><html><head><meta charset="utf-8"><title>${tipo}</title><style>
      @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:12pt;line-height:1.4}
      h1{text-align:center;font-size:17pt;margin:0 0 20px}table{width:100%;border-collapse:collapse;margin-bottom:16px}td{border:1px solid #555;padding:8px;vertical-align:top}.label{font-weight:700;width:22%}
      h2{font-size:12.5pt;margin:16px 0 8px}ul{margin:6px 0 16px;padding-left:24px}.desc{border:1px solid #777;padding:10px;min-height:62px;white-space:pre-wrap}
      .texto{margin-top:18px;text-align:justify}.assinaturas{display:grid;grid-template-columns:1fr 1fr;gap:35px;margin-top:55px}.linha{border-top:1px solid #111;text-align:center;padding-top:6px;font-size:10.5pt}
      .rodape{margin-top:30px;font-size:9pt;color:#555;text-align:center}.recusa{font-weight:700;margin-top:14px}
    </style></head><body>
      <h1>${tipo}</h1>
      <table>
        <tr><td class="label">Escola</td><td>${esc(escola(r.escolaId))}</td></tr>
        <tr><td class="label">Turma</td><td>${esc(turma(r.turmaId))}</td></tr>
        <tr><td class="label">Aluno(a)</td><td><b>${esc(aluno(r.alunoId))}</b></td></tr>
        <tr><td class="label">Data / Hora</td><td>${esc(fmtDate(r.data))}${r.hora?' às '+esc(r.hora):''}</td></tr>
        <tr><td class="label">Professor(a)</td><td>${esc(r.professor||'')}</td></tr>
      </table>
      <h2>Motivo(s) registrado(s)</h2><ul>${motivos}</ul>
      ${r.complemento?`<h2>Complemento / descrição do ocorrido</h2><div class="desc">${esc(r.complemento)}</div>`:''}
      <p class="texto">O(a) estudante acima identificado(a) foi orientado(a) sobre a conduta registrada e sobre a necessidade de observar as normas de convivência e as orientações da unidade escolar.</p>
      ${r.recusouAssinar?'<div class="recusa">Registro: o(a) estudante recusou-se a assinar este documento.</div>':''}
      <div class="assinaturas"><div class="linha">Professor(a) / responsável pelo registro</div><div class="linha">Estudante / responsável</div></div>
      <div class="rodape">Documento gerado pelo Docência Fácil / Professor Control</div>
    </body></html>`;
  }

  async function buildPdf(r){
    const JsPDF=await ensureJsPDF();
    const doc=new JsPDF({unit:'mm',format:'a4'});const m=17,w=176;let y=18;
    const title=r.tipo==='escrita'?'ADVERTÊNCIA DISCIPLINAR - ESTUDANTE':'REGISTRO DE ADVERTÊNCIA ORAL';
    doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(title,105,y,{align:'center'});y+=12;
    doc.setFontSize(10.5);doc.setFont('helvetica','normal');
    const info=[`Escola: ${escola(r.escolaId)}`,`Turma: ${turma(r.turmaId)}`,`Aluno(a): ${aluno(r.alunoId)}`,`Data: ${fmtDate(r.data)}${r.hora?'    Hora: '+r.hora:''}`,`Professor(a): ${r.professor||''}`];
    info.forEach(t=>{const l=doc.splitTextToSize(t,w);doc.text(l,m,y);y+=l.length*5.3+1});y+=4;
    doc.setFont('helvetica','bold');doc.text('Motivo(s) registrado(s):',m,y);y+=7;doc.setFont('helvetica','normal');
    (r.motivos||[]).forEach(mt=>{const l=doc.splitTextToSize(`• ${mt}`,w-4);if(y+l.length*5>270){doc.addPage();y=18}doc.text(l,m+2,y);y+=l.length*5+2});
    if(r.complemento){y+=3;if(y>245){doc.addPage();y=18}doc.setFont('helvetica','bold');doc.text('Complemento / descrição do ocorrido:',m,y);y+=6;doc.setFont('helvetica','normal');const l=doc.splitTextToSize(r.complemento,w);doc.text(l,m,y);y+=l.length*5+7}
    const txt='O(a) estudante acima identificado(a) foi orientado(a) sobre a conduta registrada e sobre a necessidade de observar as normas de convivência e as orientações da unidade escolar.';
    if(y>235){doc.addPage();y=18}const tx=doc.splitTextToSize(txt,w);doc.text(tx,m,y);y+=tx.length*5+12;
    if(r.recusouAssinar){doc.setFont('helvetica','bold');doc.text('Registro: o(a) estudante recusou-se a assinar este documento.',m,y);y+=14}
    if(y>245){doc.addPage();y=40}
    doc.setDrawColor(60);doc.line(m,y,m+72,y);doc.line(120,y,193,y);y+=5;doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text('Professor(a) / responsável pelo registro',m+36,y,{align:'center'});doc.text('Estudante / responsável',156.5,y,{align:'center'});
    const safe=aluno(r.alunoId).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,45)||'aluno';
    const filename=`advertencia_${safe}_${r.data||'data'}.pdf`;
    const blob=doc.output('blob');const file=new File([blob],filename,{type:'application/pdf'});return{blob,file,filename};
  }

  function blobToBase64(blob){return new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(String(rd.result||'').split(',').pop());rd.onerror=()=>reject(rd.error);rd.readAsDataURL(blob)})}
  function hasNativePdf(){try{return !!(window.Android&&typeof window.Android.savePdfBase64==='function')}catch(e){return false}}
  function hasNativePrint(){try{return !!(window.Android&&typeof window.Android.printHtml==='function')}catch(e){return false}}
  async function nativePdf(blob,filename,share){const b64=await blobToBase64(blob);window.Android.savePdfBase64(b64,filename,!!share)}
  function download(blob,filename){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},2500)}

  function printHtml(html,name){
    if(hasNativePrint()){window.Android.printHtml(html,name||'Advertência');return}
    const w=window.open('','_blank');
    if(!w){alert('O navegador bloqueou a janela de impressão. Permita pop-ups ou use Salvar PDF.');return}
    w.document.open();w.document.write(html);w.document.close();
    setTimeout(()=>{try{w.focus();w.print()}catch(e){console.error(e)}},350);
  }

  async function mostrarAcoes(id){
    const r=getAdv(id);if(!r)return;
    let pdf;try{pdf=await buildPdf(r)}catch(e){alert(e.message||'Não foi possível gerar o PDF.');return}
    document.getElementById('advPdfOverlay')?.remove();
    const ov=document.createElement('div');ov.id='advPdfOverlay';ov.style.cssText='position:fixed;inset:0;background:#03102399;z-index:999999;display:grid;place-items:center;padding:18px';
    ov.innerHTML=`<div style="width:min(520px,100%);background:white;border-radius:22px;padding:24px;color:#14213d;box-shadow:0 20px 60px #0006">
      <h3 style="margin:0 0 7px;font-size:24px">Advertência pronta</h3><p style="margin:0 0 16px;color:#64748b">${esc(aluno(r.alunoId))} • ${r.tipo==='escrita'?'Escrita':'Oral'} • ${fmtDate(r.data)}</p>
      <button id="advPrintBtn" style="display:block;width:100%;border:0;background:#334155;color:#fff;padding:15px;border-radius:13px;font-weight:900;font-size:17px;margin:9px 0">🖨 Imprimir / Salvar como PDF</button>
      <button id="advSavePdfBtn" style="display:block;width:100%;border:0;background:#2563eb;color:#fff;padding:15px;border-radius:13px;font-weight:900;font-size:17px;margin:9px 0">💾 Salvar PDF</button>
      <button id="advSharePdfBtn" style="display:block;width:100%;border:0;background:#16a34a;color:#fff;padding:15px;border-radius:13px;font-weight:900;font-size:17px;margin:9px 0">📲 Compartilhar / WhatsApp</button>
      <button id="advClosePdfBtn" style="display:block;width:100%;border:0;background:#e8eef7;color:#17345f;padding:13px;border-radius:13px;font-weight:800;font-size:16px;margin-top:9px">Fechar</button>
      <div id="advPdfMsg" style="display:none;margin-top:10px;background:#fff7d6;color:#7a5600;padding:11px;border-radius:11px"></div></div>`;
    document.body.appendChild(ov);
    $('#advClosePdfBtn').onclick=()=>ov.remove();ov.onclick=e=>{if(e.target===ov)ov.remove()};
    $('#advPrintBtn').onclick=()=>printHtml(htmlDocumento(r),`Advertência - ${aluno(r.alunoId)}`);
    $('#advSavePdfBtn').onclick=async()=>{const msg=$('#advPdfMsg');try{if(hasNativePdf()){await nativePdf(pdf.blob,pdf.filename,false);msg.style.display='block';msg.textContent='PDF salvo em Downloads/DocenciaFacil.'}else download(pdf.blob,pdf.filename)}catch(e){msg.style.display='block';msg.textContent='Não foi possível salvar o PDF.'}};
    $('#advSharePdfBtn').onclick=async()=>{const msg=$('#advPdfMsg');try{if(hasNativePdf()){await nativePdf(pdf.blob,pdf.filename,true);return}if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[pdf.file]}))){await navigator.share({title:'Advertência escolar',text:`${aluno(r.alunoId)} - ${fmtDate(r.data)}`,files:[pdf.file]})}else{msg.style.display='block';msg.textContent='Este navegador não permite compartilhar o PDF diretamente. Salve o PDF e envie pelo WhatsApp.'}}catch(e){if(e?.name!=='AbortError'){msg.style.display='block';msg.textContent='Não foi possível abrir o compartilhamento.'}}};
  }

  function htmlHistorico(){
    const rows=[...(db.advertencias||[])].sort((a,b)=>String(b.data+b.hora).localeCompare(String(a.data+a.hora)));
    return `<!doctype html><html><head><meta charset="utf-8"><title>Histórico de advertências</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#111}h1{text-align:center;font-size:17pt}table{width:100%;border-collapse:collapse;font-size:9.5pt}th,td{border:1px solid #777;padding:6px;vertical-align:top}th{background:#eee}.oral{color:#1d4ed8;font-weight:bold}.escrita{color:#b91c1c;font-weight:bold}</style></head><body><h1>HISTÓRICO DE ADVERTÊNCIAS</h1><table><thead><tr><th>Data</th><th>Aluno</th><th>Turma</th><th>Tipo</th><th>Motivo(s)</th><th>Professor</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmtDate(r.data)}<br>${esc(r.hora||'')}</td><td><b>${esc(aluno(r.alunoId))}</b></td><td>${esc(turma(r.turmaId))}</td><td class="${r.tipo}">${r.tipo==='escrita'?'Escrita':'Oral'}</td><td>${esc((r.motivos||[]).join('; '))}${r.complemento?'<br><small>'+esc(r.complemento)+'</small>':''}</td><td>${esc(r.professor||'')}</td></tr>`).join('')}</tbody></table></body></html>`;
  }

  function enhance(){
    const box=$('#advHistorico');if(!box)return;
    const panelHead=box.closest('.panel')?.querySelector('.panel-head');
    if(panelHead&&!document.getElementById('advPrintHistoryBtn')){
      const b=document.createElement('button');b.id='advPrintHistoryBtn';b.className='adv-mini';b.textContent='🖨 Imprimir histórico';b.style.marginLeft='auto';b.onclick=()=>printHtml(htmlHistorico(),'Histórico de advertências');panelHead.appendChild(b);
    }
    box.querySelectorAll('tbody tr').forEach(tr=>{
      const del=tr.querySelector('button[onclick*="excluirAdvertencia"]');if(!del)return;
      const m=(del.getAttribute('onclick')||'').match(/excluirAdvertencia\(['"]([^'"]+)/);if(!m)return;const id=m[1];
      const old=tr.querySelector('button[onclick*="gerarAdvertenciaPDF"]');if(old)old.remove();
      if(!tr.querySelector(`[data-adv-print="${CSS.escape(id)}"]`)){
        const b=document.createElement('button');b.type='button';b.className='adv-mini pdf';b.dataset.advPrint=id;b.textContent='Imprimir / PDF';b.onclick=()=>mostrarAcoes(id);del.parentElement.insertBefore(b,del);
      }
    });
  }

  window.gerarAdvertenciaPDF=mostrarAcoes;
  const obs=new MutationObserver(()=>enhance());obs.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,200));else setTimeout(enhance,200);
})();