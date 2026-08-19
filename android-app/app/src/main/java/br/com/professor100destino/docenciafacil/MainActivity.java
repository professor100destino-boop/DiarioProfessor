package br.com.professor100destino.docenciafacil;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
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
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class MainActivity extends Activity {
    private static final String PROFESSOR_URL="https://professor100destino-boop.github.io/DiarioProfessor/";
    private static final String SHELL_URL="file:///android_asset/siap-shell.html";
    private static final String LOGIN_URL="https://siap.educacao.go.gov.br/login.aspx";
    private static final String DIARIO_URL="https://siap.educacao.go.gov.br/DiarioEscolarListagem.aspx";
    private static final String FREQUENCIA_URL="https://siap.educacao.go.gov.br/FrequenciaAlunoEdicao.aspx";
    private static final String CONTEUDO_URL="https://siap.educacao.go.gov.br/ConteudoProgramaticoEdicao.aspx";
    private static final String PLANEJAMENTO_URL="https://siap.educacao.go.gov.br/AcompanhamentoPlanejamentoProfessorListagem.aspx";
    private static final String ESCOLA_URL="https://siap.educacao.go.gov.br/DefinirEscola.aspx";
    private static final String PREFS="siap_secure_prefs";
    private static final String KEY_ALIAS="siap_credentials_key";

    private SharedPreferences prefs;
    private WebView uiWeb,siapWeb;
    private LinearLayout siteTop;
    private TextView siteTitle,siteSub;
    private Button siteOrient;
    private String shellTarget="auto";
    private boolean loginSubmitted=false;
    private boolean captchaAfterFailure=false;
    private int loginAttempts=0;
    private boolean returnToMenuAfterSchool=false;
    private boolean pendingUpdate=false;

    @SuppressLint({"SetJavaScriptEnabled","AddJavascriptInterface"})
    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        prefs=getSharedPreferences(PREFS,MODE_PRIVATE);

        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(243,246,252));
        siteTop=buildSiteTop();
        siteTop.setVisibility(View.GONE);
        root.addView(siteTop,new LinearLayout.LayoutParams(-1,dp(92)));

        FrameLayout frame=new FrameLayout(this);
        root.addView(frame,new LinearLayout.LayoutParams(-1,0,1));

        uiWeb=new WebView(this);
        siapWeb=new WebView(this);
        frame.addView(uiWeb,new FrameLayout.LayoutParams(-1,-1));
        frame.addView(siapWeb,new FrameLayout.LayoutParams(-1,-1));
        siapWeb.setVisibility(View.GONE);
        setContentView(root);

        configureWeb(uiWeb,true);
        configureWeb(siapWeb,false);
        uiWeb.addJavascriptInterface(new UiBridge(),"Android");
        siapWeb.addJavascriptInterface(new SiapBridge(),"SiapNative");

        uiWeb.setWebChromeClient(new WebChromeClient());
        uiWeb.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
                Uri u=r.getUrl(); String host=u.getHost()==null?"":u.getHost().toLowerCase();
                if(host.endsWith("professor100destino-boop.github.io")||"file".equals(u.getScheme()))return false;
                try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}
                return true;
            }
            @Override public void onPageFinished(WebView v,String url){
                super.onPageFinished(v,url);
                if(url!=null&&url.startsWith(SHELL_URL))applyShellTarget();
            }
        });

        siapWeb.setWebChromeClient(new WebChromeClient());
        siapWeb.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
                Uri u=r.getUrl(); String host=u.getHost()==null?"":u.getHost().toLowerCase();
                if(host.endsWith("siap.educacao.go.gov.br"))return false;
                try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}
                return true;
            }
            @Override public void onPageFinished(WebView v,String url){
                super.onPageFinished(v,url);
                CookieManager.getInstance().flush();
                if(url==null)return;
                String low=url.toLowerCase();
                if(low.contains("login.aspx")||low.endsWith("/login")||low.contains("/login?")){
                    boolean failed=loginSubmitted;
                    loginSubmitted=false;
                    captchaAfterFailure=failed;
                    if(failed)loginAttempts++;
                    showShell("captcha");
                    injectLoginAndReadCaptcha();
                    return;
                }
                if(pendingUpdate){
                    pendingUpdate=false;
                    showShell("menu");
                    uiEval("alert('Turmas atualizadas.');");
                    return;
                }
                if(low.contains("definirescola.aspx")){
                    showSiapPage("Trocar escola","Selecione a escola no SIAP");
                    returnToMenuAfterSchool=true;
                    return;
                }
                if(returnToMenuAfterSchool){
                    returnToMenuAfterSchool=false;
                    showShell("menu");
                    return;
                }
                if(loginAttempts>0||captchaAfterFailure||low.contains("menusistema")||low.contains("default.aspx")){
                    loginAttempts=0; captchaAfterFailure=false;
                    showShell("menu");
                }
            }
            @Override public void onReceivedSslError(WebView v,SslErrorHandler h,SslError e){h.cancel();}
        });

        CookieManager cm=CookieManager.getInstance();
        cm.setAcceptCookie(true); cm.setAcceptThirdPartyCookies(siapWeb,true);
        showProfessor();
    }

    private void configureWeb(WebView w,boolean ui){
        WebSettings s=w.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true);
        s.setSupportZoom(true); s.setBuiltInZoomControls(!ui); s.setDisplayZoomControls(false);
        s.setUseWideViewPort(true); s.setLoadWithOverviewMode(true); s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    }

    private LinearLayout buildSiteTop(){
        LinearLayout bar=new LinearLayout(this); bar.setOrientation(LinearLayout.HORIZONTAL); bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(16),dp(8),dp(12),dp(8)); bar.setBackgroundColor(Color.rgb(16,52,116));
        TextView icon=new TextView(this); icon.setText("📋✓"); icon.setTextSize(24); icon.setGravity(Gravity.CENTER); icon.setTextColor(Color.WHITE);
        bar.addView(icon,new LinearLayout.LayoutParams(dp(50),-1));
        LinearLayout texts=new LinearLayout(this); texts.setOrientation(LinearLayout.VERTICAL); texts.setGravity(Gravity.CENTER_VERTICAL);
        siteTitle=new TextView(this); siteTitle.setTextColor(Color.WHITE); siteTitle.setTextSize(27); siteTitle.setTypeface(null,1);
        siteSub=new TextView(this); siteSub.setTextColor(Color.rgb(225,233,247)); siteSub.setTextSize(16);
        texts.addView(siteTitle); texts.addView(siteSub); bar.addView(texts,new LinearLayout.LayoutParams(0,-1,1));
        siteOrient=new Button(this); siteOrient.setAllCaps(false); siteOrient.setTextColor(Color.WHITE); siteOrient.setTextSize(15); siteOrient.setBackgroundColor(Color.rgb(36,75,135)); siteOrient.setOnClickListener(v->toggleOrientation());
        bar.addView(siteOrient,new LinearLayout.LayoutParams(-2,dp(56))); updateOrientationLabels(); return bar;
    }

    private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density+.5f);}

    private void showProfessor(){
        siteTop.setVisibility(View.GONE); siapWeb.setVisibility(View.GONE); uiWeb.setVisibility(View.VISIBLE); shellTarget="auto"; uiWeb.loadUrl(PROFESSOR_URL);
    }
    private void showShell(String target){
        siteTop.setVisibility(View.GONE); siapWeb.setVisibility(View.GONE); uiWeb.setVisibility(View.VISIBLE); shellTarget=target;
        String u=uiWeb.getUrl(); if(u==null||!u.startsWith(SHELL_URL))uiWeb.loadUrl(SHELL_URL); else applyShellTarget();
    }
    private void applyShellTarget(){
        updateOrientationLabels();
        if("menu".equals(shellTarget))uiEval("window.siapLoginSuccess&&window.siapLoginSuccess();");
        else if("captcha".equals(shellTarget))uiEval("(function(){var f=window.startLogin;if(document.getElementById('captcha')){document.getElementById('topTitle').textContent='Entrar no SIAP';document.getElementById('topSub').textContent='Código de segurança';document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.getElementById('captcha').classList.add('active');var cu=document.getElementById('capUser');if(cu)cu.innerHTML='Acesso configurado para <b>'+((Android.getSavedUser&&Android.getSavedUser())||'')+'.</b>';}})();");
    }
    private void showSiapPage(String title,String sub){
        uiWeb.setVisibility(View.GONE); siapWeb.setVisibility(View.VISIBLE); siteTop.setVisibility(View.VISIBLE); siteTitle.setText(title); siteSub.setText(sub); updateOrientationLabels();
    }
    private void loadSiapPage(String url,String title,String sub){showSiapPage(title,sub);siapWeb.loadUrl(url);}
    private void uiEval(String js){uiWeb.post(()->uiWeb.evaluateJavascript(js,null));}

    private void startLogin(){
        if(!hasCredentials()){showShell("auto");return;}
        loginAttempts=0; loginSubmitted=false; captchaAfterFailure=false; showShell("captcha"); siapWeb.loadUrl(LOGIN_URL);
    }

    private void injectLoginAndReadCaptcha(){
        if(!hasCredentials())return;
        String ju=JSONObject.quote(getUser()),jp=JSONObject.quote(getPass());
        String js="(function(){try{"+
            "var vis=function(e){return e&&e.offsetParent!==null&&!e.disabled};"+
            "var a=[].slice.call(document.querySelectorAll('input')).filter(vis);"+
            "var p=a.find(function(i){return (i.type||'').toLowerCase()==='password';});"+
            "var u=a.find(function(i){var s=((i.id||'')+' '+(i.name||'')).toLowerCase();return /usu|user|login|cpf/.test(s)&&(i.type||'text')!=='password';})||a.find(function(i){var t=(i.type||'text').toLowerCase();return i!==p&&(t==='text'||t==='email'||t==='tel');});"+
            "if(u){u.value="+ju+";u.dispatchEvent(new Event('input',{bubbles:true}));u.dispatchEvent(new Event('change',{bubbles:true}));}"+
            "if(p){p.value="+jp+";p.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('change',{bubbles:true}));}"+
            "var code='';var els=[].slice.call(document.querySelectorAll('body *')).filter(vis);for(var k=0;k<els.length;k++){var t=(els[k].innerText||'').trim();if(/^[A-Za-z0-9]{6,12}$/.test(t)&&/[A-Za-z]/.test(t)&&/\\d/.test(t)){code=t;break;}}"+
            "SiapNative.captcha(code);"+
            "}catch(e){SiapNative.captcha('');}})();";
        siapWeb.evaluateJavascript(js,null);
    }

    private void submitCaptchaInternal(String code){
        if(code==null||code.trim().isEmpty())return;
        loginSubmitted=true;
        String jc=JSONObject.quote(code.trim());
        String js="(function(){try{"+
            "var vis=function(e){return e&&e.offsetParent!==null&&!e.disabled};var a=[].slice.call(document.querySelectorAll('input')).filter(vis);"+
            "var p=a.find(function(i){return (i.type||'').toLowerCase()==='password';});"+
            "var txt=a.filter(function(i){var t=(i.type||'text').toLowerCase();return i!==p&&(t==='text'||t==='tel'||t==='number');});"+
            "var c=txt.find(function(i){var s=((i.id||'')+' '+(i.name||'')+' '+(i.placeholder||'')).toLowerCase();return /cod|segur|captcha|verif/.test(s);})||txt[txt.length-1];"+
            "if(c){c.value="+jc+";c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}));}"+
            "var bs=[].slice.call(document.querySelectorAll('input[type=submit],input[type=button],button')).filter(vis);var b=bs.find(function(x){return /entrar/i.test((x.value||x.innerText||''));})||bs[0];if(b)b.click();"+
            "}catch(e){}})();";
        siapWeb.evaluateJavascript(js,null);
    }

    private void menuActionInternal(String action){
        if(action==null)return;
        switch(action){
            case "frequencia": loadSiapPage(DIARIO_URL,"SIAP Fácil","Fazer frequência"); break;
            case "conteudos": loadSiapPage(DIARIO_URL,"SIAP Fácil","Registrar conteúdos"); break;
            case "planejamento": loadSiapPage(PLANEJAMENTO_URL,"SIAP Fácil","Planejamento"); break;
            case "escola": returnToMenuAfterSchool=true; loadSiapPage(ESCOLA_URL,"SIAP Fácil","Trocar escola"); break;
            case "atualizar": pendingUpdate=true; siapWeb.setVisibility(View.GONE); siteTop.setVisibility(View.GONE); siapWeb.loadUrl(DIARIO_URL+"?atualizar="+System.currentTimeMillis()); break;
            case "sair": safeLogout(); break;
        }
    }

    private void safeLogout(){
        CookieManager.getInstance().removeAllCookies(v->{CookieManager.getInstance().flush();siapWeb.clearHistory();siapWeb.clearCache(false);showShell("auto");});
    }

    private boolean hasCredentials(){return !getUser().isEmpty()&&!getPass().isEmpty();}
    private boolean saveCredentialsInternal(String user,String pass){
        try{String old=getPass();if("__KEEP__".equals(pass))pass=old;if(user==null||user.trim().isEmpty()||pass==null||pass.isEmpty())return false;prefs.edit().putString("user",encrypt(user.trim())).putString("pass",encrypt(pass)).apply();return true;}catch(Exception e){return false;}
    }
    private String getUser(){return decrypt(prefs.getString("user",""));}
    private String getPass(){return decrypt(prefs.getString("pass",""));}

    private SecretKey getOrCreateKey() throws Exception{
        KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);if(ks.containsAlias(KEY_ALIAS))return((KeyStore.SecretKeyEntry)ks.getEntry(KEY_ALIAS,null)).getSecretKey();
        KeyGenerator kg=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");kg.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());return kg.generateKey();
    }
    private String encrypt(String v){try{Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,getOrCreateKey());return Base64.encodeToString(c.getIV(),Base64.NO_WRAP)+"."+Base64.encodeToString(c.doFinal(v.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);}catch(Exception e){return"";}}
    private String decrypt(String v){if(v==null||v.isEmpty())return"";try{String[]p=v.split("\\.",2);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,getOrCreateKey(),new GCMParameterSpec(128,Base64.decode(p[0],Base64.NO_WRAP)));return new String(c.doFinal(Base64.decode(p[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);}catch(Exception e){return"";}}

    private void toggleOrientation(){int c=getResources().getConfiguration().orientation;setRequestedOrientation(c==Configuration.ORIENTATION_LANDSCAPE?ActivityInfo.SCREEN_ORIENTATION_PORTRAIT:ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);}
    private String orientationAction(){return getResources().getConfiguration().orientation==Configuration.ORIENTATION_LANDSCAPE?"Vertical":"Horizontal";}
    private void updateOrientationLabels(){if(siteOrient!=null)siteOrient.setText("↻ "+orientationAction());if(uiWeb!=null)uiEval("window.siapOrientationChanged&&window.siapOrientationChanged();");}
    @Override public void onConfigurationChanged(Configuration n){super.onConfigurationChanged(n);updateOrientationLabels();}

    public class UiBridge{
        @JavascriptInterface public void openSiap(){runOnUiThread(()->showShell("auto"));}
        @JavascriptInterface public void openPlanning(){runOnUiThread(()->{if(hasCredentials())menuActionInternal("planejamento");else showShell("auto");});}
        @JavascriptInterface public void backToProfessor(){runOnUiThread(()->showProfessor());}
        @JavascriptInterface public boolean hasCredentials(){return MainActivity.this.hasCredentials();}
        @JavascriptInterface public String getSavedUser(){return getUser();}
        @JavascriptInterface public boolean saveCredentials(String u,String p){return saveCredentialsInternal(u,p);}
        @JavascriptInterface public void startLogin(){runOnUiThread(()->MainActivity.this.startLogin());}
        @JavascriptInterface public void submitCaptcha(String c){runOnUiThread(()->submitCaptchaInternal(c));}
        @JavascriptInterface public void refreshCaptcha(){runOnUiThread(()->{loginSubmitted=false;siapWeb.reload();});}
        @JavascriptInterface public void cancelLogin(){runOnUiThread(()->{loginSubmitted=false;siapWeb.stopLoading();});}
        @JavascriptInterface public void copyText(String t){ClipboardManager cm=(ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE);cm.setPrimaryClip(ClipData.newPlainText("Código SIAP",t));}
        @JavascriptInterface public void menuAction(String a){runOnUiThread(()->menuActionInternal(a));}
        @JavascriptInterface public void toggleOrientation(){runOnUiThread(()->MainActivity.this.toggleOrientation());}
        @JavascriptInterface public String orientationAction(){return MainActivity.this.orientationAction();}
    }
    public class SiapBridge{
        @JavascriptInterface public void captcha(String code){runOnUiThread(()->{
            String safe=code==null?"":code.trim();String q=JSONObject.quote(safe);
            if(captchaAfterFailure){captchaAfterFailure=false;if(loginAttempts>=5)uiEval("window.siapLoginFailed&&window.siapLoginFailed("+q+",'Não foi possível entrar após 5 tentativas. Confira usuário, senha e código de segurança.');");else uiEval("window.siapLoginFailed&&window.siapLoginFailed("+q+",'O SIAP não confirmou a entrada. Confira o novo código e tente novamente.');");}
            else uiEval("window.siapSetCaptcha&&window.siapSetCaptcha("+q+");");
        });}
    }

    @Override public void onBackPressed(){
        if(siapWeb.getVisibility()==View.VISIBLE){showShell("menu");return;}
        String u=uiWeb.getUrl();if(u!=null&&u.startsWith(SHELL_URL)){showProfessor();return;}if(uiWeb.canGoBack())uiWeb.goBack();else super.onBackPressed();
    }
}
