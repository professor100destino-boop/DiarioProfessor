/* ===== backup completo ===== */
D.exportBackup=function(){
  try{
    var payload={
      app:"DiarioProfessor",
      version:1,
      createdAt:new Date().toISOString(),
      data:{
        schools:state.schools,
        classes:state.classes
      },
      auth:{
        configured:!!auth.configured,
        salt:auth.salt||"",
        hash:auth.hash||"",
        name:auth.name||""
      }
    };

    var json=JSON.stringify(payload,null,2);
    var blob=new Blob([json],{type:"application/json;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");

    a.href=url;
    a.download="backup_diario_professor_"+todayISO()+".json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    alert("Backup baixado com sucesso. Guarde esse arquivo em local seguro.");
  }catch(e){
    alert("Não foi possível gerar o backup.");
    console.error(e);
  }
};

D.importBackup=function(ev){
  var file=ev.target.files&&ev.target.files[0];
  if(!file)return;

  if(!confirm("Restaurar backup? Isso vai substituir os dados atuais deste aparelho.")){
    ev.target.value="";
    return;
  }

  var reader=new FileReader();

  reader.onload=function(){
    try{
      var payload=JSON.parse(reader.result);

      if(!payload || payload.app!=="DiarioProfessor" || !payload.data){
        alert("Arquivo de backup inválido.");
        ev.target.value="";
        return;
      }

      var restored=migrate(payload.data);

      state.schools=restored.schools||[];
      state.classes=restored.classes||[];

      if(payload.auth && typeof payload.auth==="object"){
        auth={
          configured:!!payload.auth.configured,
          salt:payload.auth.salt||"",
          hash:payload.auth.hash||"",
          name:payload.auth.name||""
        };
        saveAuth();
      }

      save();

      state.locked=false;
      state.authErr="";
      state.ui.screen="home";

      alert("Backup restaurado com sucesso.");
      ev.target.value="";
      render();
    }catch(e){
      alert("Erro ao restaurar o backup. Verifique se o arquivo está correto.");
      console.error(e);
      ev.target.value="";
    }
  };

  reader.onerror=function(){
    alert("Não foi possível ler o arquivo de backup.");
    ev.target.value="";
  };

  reader.readAsText(file);
};
