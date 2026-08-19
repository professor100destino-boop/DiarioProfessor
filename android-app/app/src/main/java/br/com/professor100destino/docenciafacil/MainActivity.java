package br.com.professor100destino.docenciafacil;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.text.InputType;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.net.http.SslError;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class MainActivity extends Activity {
    private static final String PROFESSOR_URL = "https://professor100destino-boop.github.io/DiarioProfessor/";
    private static final String SIAP_HOME = "https://siap.educacao.go.gov.br/";
    private static final String SIAP_PLANEJAMENTO = "https://siap.educacao.go.gov.br/AcompanhamentoPlanejamentoProfessorListagem.aspx";
    private static final String PREFS = "siap_secure_prefs";
    private static final String KEY_ALIAS = "siap_credentials_key";

    private WebView web;
    private LinearLayout siapBar;
    private SharedPreferences prefs;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        prefs=getSharedPreferences(PREFS,MODE_PRIVATE);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);

        HorizontalScrollView scroll = new HorizontalScrollView(this);
        scroll.setFillViewport(true);
        siapBar = new LinearLayout(this);
        siapBar.setOrientation(LinearLayout.HORIZONTAL);
        siapBar.setPadding(8,8,8,8);
        siapBar.setGravity(Gravity.CENTER_VERTICAL);
        siapBar.setBackgroundColor(Color.rgb(11,42,85));
        scroll.addView(siapBar, new HorizontalScrollView.LayoutParams(-2,-2));
        root.addView(scroll, new LinearLayout.LayoutParams(-1,-2));

        addButton("← Docência Fácil", v -> load(PROFESSOR_URL));
        addButton("Início SIAP", v -> openSiapWithSavedData(SIAP_HOME));
        addButton("Planejamento", v -> openSiapWithSavedData(SIAP_PLANEJAMENTO));
        addButton("Dados SIAP", v -> showCredentialsDialog(false,null));
        addButton("Recarregar", v -> web.reload());
        addButton("− Zoom", v -> web.zoomOut());
        addButton("+ Zoom", v -> web.zoomIn());
        addButton("↔ Tela", v -> toggleOrientation());

        web = new WebView(this);
        root.addView(web, new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(web, true);

        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req){
                Uri u=req.getUrl();
                String host=u.getHost()==null?"":u.getHost().toLowerCase();
                if(host.endsWith("siap.educacao.go.gov.br") || host.endsWith("professor100destino-boop.github.io")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW,u)); } catch(Exception ignored) {}
                return true;
            }
            @Override public void onPageFinished(WebView view,String url){
                super.onPageFinished(view,url);
                boolean inSiap=url!=null && url.contains("siap.educacao.go.gov.br");
                siapBar.setVisibility(inSiap?View.VISIBLE:View.GONE);
                CookieManager.getInstance().flush();
                if(inSiap){
                    view.evaluateJavascript("(function(){var m=document.querySelector('meta[name=viewport]');if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}m.content='width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes';})();",null);
                    if(url.toLowerCase().contains("login")) injectSavedLogin();
                }
            }
            @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error){ handler.cancel(); }
        });

        siapBar.setVisibility(View.GONE);
        load(PROFESSOR_URL);
    }

    private void addButton(String text, View.OnClickListener click){
        Button b=new Button(this);
        b.setText(text); b.setTextColor(Color.WHITE); b.setTextSize(13);
        b.setAllCaps(false); b.setBackgroundColor(Color.rgb(25,72,125));
        b.setOnClickListener(click);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-2,-2); lp.setMargins(4,0,4,0);
        siapBar.addView(b,lp);
    }

    private void load(String url){ web.loadUrl(url); }

    private void openSiapWithSavedData(String target){
        if(!hasCredentials()) showCredentialsDialog(true,target);
        else load(target);
    }

    private boolean hasCredentials(){
        return prefs.contains("user") && prefs.contains("pass") && !getUser().isEmpty() && !getPass().isEmpty();
    }

    private void showCredentialsDialog(boolean openAfter,String target){
        LinearLayout box=new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        int pad=(int)(20*getResources().getDisplayMetrics().density);
        box.setPadding(pad,8,pad,0);

        EditText user=new EditText(this);
        user.setHint("Usuário do SIAP");
        user.setSingleLine(true);
        user.setText(getUser());
        box.addView(user,new LinearLayout.LayoutParams(-1,-2));

        EditText pass=new EditText(this);
        pass.setHint("Senha do SIAP");
        pass.setSingleLine(true);
        pass.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);
        pass.setText(getPass());
        box.addView(pass,new LinearLayout.LayoutParams(-1,-2));

        AlertDialog dialog=new AlertDialog.Builder(this)
            .setTitle(hasCredentials()?"Dados do SIAP":"Primeiro acesso ao SIAP Fácil")
            .setMessage("Cadastre uma vez. O aplicativo preencherá usuário e senha automaticamente nas próximas entradas. O código de segurança continua sendo digitado manualmente.")
            .setView(box)
            .setNegativeButton("Cancelar",null)
            .setPositiveButton("Salvar",null)
            .create();
        dialog.setOnShowListener(x->dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
            String u=user.getText().toString().trim();
            String p=pass.getText().toString();
            if(u.isEmpty()){user.setError("Informe o usuário");return;}
            if(p.isEmpty()){pass.setError("Informe a senha");return;}
            saveCredentials(u,p);
            dialog.dismiss();
            if(openAfter) load(target==null?SIAP_HOME:target);
            else if(web.getUrl()!=null && web.getUrl().toLowerCase().contains("login")) injectSavedLogin();
        }));
        dialog.show();
    }

    private void injectSavedLogin(){
        if(!hasCredentials())return;
        String ju=JSONObject.quote(getUser());
        String jp=JSONObject.quote(getPass());
        String js="(function(){try{"+
            "var all=[].slice.call(document.querySelectorAll('input')).filter(function(i){return !i.disabled&&i.type!=='hidden';});"+
            "var pass=all.find(function(i){return (i.type||'').toLowerCase()==='password';});"+
            "var user=all.find(function(i){var t=(i.type||'text').toLowerCase();return i!==pass&&(t==='text'||t==='email'||t==='tel');});"+
            "if(user){user.value="+ju+";user.dispatchEvent(new Event('input',{bubbles:true}));user.dispatchEvent(new Event('change',{bubbles:true}));}"+
            "if(pass){pass.value="+jp+";pass.dispatchEvent(new Event('input',{bubbles:true}));pass.dispatchEvent(new Event('change',{bubbles:true}));}"+
            "var cand=all.filter(function(i){var t=(i.type||'text').toLowerCase();return i!==user&&i!==pass&&(t==='text'||t==='tel'||t==='number');});"+
            "var cap=cand.find(function(i){var s=((i.id||'')+' '+(i.name||'')+' '+(i.placeholder||'')).toLowerCase();return /cod|segur|captcha|verif/.test(s);})||cand[cand.length-1];"+
            "if(cap){cap.focus();cap.scrollIntoView({block:'center'});}"+
            "}catch(e){}})();";
        web.evaluateJavascript(js,null);
    }

    private void saveCredentials(String user,String pass){
        prefs.edit().putString("user",encrypt(user)).putString("pass",encrypt(pass)).apply();
    }
    private String getUser(){return decrypt(prefs.getString("user",""));}
    private String getPass(){return decrypt(prefs.getString("pass",""));}

    private SecretKey getOrCreateKey() throws Exception{
        KeyStore ks=KeyStore.getInstance("AndroidKeyStore"); ks.load(null);
        if(ks.containsAlias(KEY_ALIAS)) return ((KeyStore.SecretKeyEntry)ks.getEntry(KEY_ALIAS,null)).getSecretKey();
        KeyGenerator kg=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
        kg.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .build());
        return kg.generateKey();
    }
    private String encrypt(String value){
        try{
            Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE,getOrCreateKey());
            String iv=Base64.encodeToString(c.getIV(),Base64.NO_WRAP);
            String data=Base64.encodeToString(c.doFinal(value.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);
            return iv+"."+data;
        }catch(Exception e){return "";}
    }
    private String decrypt(String value){
        if(value==null||value.isEmpty())return "";
        try{
            String[] p=value.split("\\.",2);
            if(p.length!=2)return "";
            Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE,getOrCreateKey(),new GCMParameterSpec(128,Base64.decode(p[0],Base64.NO_WRAP)));
            return new String(c.doFinal(Base64.decode(p[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);
        }catch(Exception e){return "";}
    }

    private void toggleOrientation(){
        int current=getResources().getConfiguration().orientation;
        setRequestedOrientation(current==android.content.res.Configuration.ORIENTATION_LANDSCAPE ? ActivityInfo.SCREEN_ORIENTATION_PORTRAIT : ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
    }

    public class Bridge {
        @JavascriptInterface public void openSiap(){ runOnUiThread(() -> openSiapWithSavedData(SIAP_HOME)); }
        @JavascriptInterface public void openPlanning(){ runOnUiThread(() -> openSiapWithSavedData(SIAP_PLANEJAMENTO)); }
        @JavascriptInterface public void backToProfessor(){ runOnUiThread(() -> load(PROFESSOR_URL)); }
        @JavascriptInterface public void editSiapData(){ runOnUiThread(() -> showCredentialsDialog(false,null)); }
    }

    @Override public void onBackPressed(){
        if(web!=null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
