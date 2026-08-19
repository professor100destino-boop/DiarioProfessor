package br.com.professor100destino.docenciafacil;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

public class BackupImportActivity extends Activity {
    private static final String PROFESSOR_URL="https://professor100destino-boop.github.io/DiarioProfessor/";
    private static final String MAIN_KEY="professorControlV1";
    private TextView status;
    private WebView web;
    private JSONObject storage;
    private boolean restored=false;

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(32,32,32,32);
        root.setBackgroundColor(Color.rgb(238,243,251));
        status=new TextView(this);
        status.setText("Lendo backup do Professor Control…");
        status.setTextSize(22);
        status.setTextColor(Color.rgb(21,34,53));
        status.setGravity(Gravity.CENTER);
        root.addView(status,new LinearLayout.LayoutParams(-1,-2));
        web=new WebView(this);
        web.setVisibility(WebView.INVISIBLE);
        root.addView(web,new LinearLayout.LayoutParams(1,1));
        setContentView(root);

        try{
            String text=readSharedBackup(getIntent());
            JSONObject payload=new JSONObject(text);
            if(!"Professor Control / Docência Fácil".equals(payload.optString("app"))) throw new Exception("Arquivo não pertence ao Professor Control");
            storage=payload.optJSONObject("localStorage");
            if(storage==null || !storage.has(MAIN_KEY)) throw new Exception("Backup sem os dados principais");
            new JSONObject(storage.getString(MAIN_KEY));
            status.setText("Backup válido. Restaurando escolas, turmas, alunos, chamadas, notas e demais dados…");
            prepareWebView();
        }catch(Exception e){
            status.setText("Não foi possível restaurar este backup.\n\n"+e.getMessage());
        }
    }

    private String readSharedBackup(Intent intent) throws Exception{
        Uri uri=null;
        if(Intent.ACTION_SEND.equals(intent.getAction())){
            if(android.os.Build.VERSION.SDK_INT>=33) uri=intent.getParcelableExtra(Intent.EXTRA_STREAM,Uri.class);
            else uri=intent.getParcelableExtra(Intent.EXTRA_STREAM);
        }
        if(uri==null && intent.getClipData()!=null && intent.getClipData().getItemCount()>0) uri=intent.getClipData().getItemAt(0).getUri();
        if(uri==null) throw new Exception("Nenhum arquivo de backup foi recebido");
        InputStream in=getContentResolver().openInputStream(uri);
        if(in==null) throw new Exception("Não foi possível abrir o arquivo");
        BufferedReader br=new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        StringBuilder sb=new StringBuilder(); String line;
        while((line=br.readLine())!=null) sb.append(line).append('\n');
        br.close(); return sb.toString();
    }

    private void prepareWebView(){
        WebSettings s=web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        web.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView view,String url){
                super.onPageFinished(view,url);
                if(restored)return;
                restored=true;
                restoreStorage();
            }
        });
        web.loadUrl(PROFESSOR_URL+"?restaurar="+System.currentTimeMillis());
    }

    private void restoreStorage(){
        try{
            StringBuilder js=new StringBuilder("(function(){try{");
            Iterator<String> keys=storage.keys();
            while(keys.hasNext()){
                String k=keys.next();
                Object value=storage.opt(k);
                if(value instanceof String){
                    js.append("localStorage.setItem(").append(JSONObject.quote(k)).append(',').append(JSONObject.quote((String)value)).append(");");
                }
            }
            js.append("sessionStorage.setItem('professor_control_session_ok','1');return 'OK';}catch(e){return 'ERRO:'+e.message;}})();");
            web.evaluateJavascript(js.toString(),result->{
                if(result!=null && result.contains("OK")){
                    status.setText("Dados restaurados com sucesso.\nAbrindo o Docência Fácil…");
                    Toast.makeText(this,"Backup restaurado com sucesso",Toast.LENGTH_LONG).show();
                    web.postDelayed(()->{
                        Intent i=new Intent(this,MainActivity.class);
                        i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(i); finish();
                    },800);
                }else status.setText("O arquivo foi lido, mas não consegui gravar os dados no Docência Fácil.");
            });
        }catch(Exception e){status.setText("Erro ao restaurar: "+e.getMessage());}
    }
}
