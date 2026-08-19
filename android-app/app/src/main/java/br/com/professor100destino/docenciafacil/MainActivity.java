package br.com.professor100destino.docenciafacil;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
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
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;

public class MainActivity extends Activity {
    private static final String PROFESSOR_URL = "https://professor100destino-boop.github.io/DiarioProfessor/";
    private static final String SIAP_HOME = "https://siap.educacao.go.gov.br/";
    private static final String SIAP_PLANEJAMENTO = "https://siap.educacao.go.gov.br/AcompanhamentoPlanejamentoProfessorListagem.aspx";

    private WebView web;
    private LinearLayout siapBar;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);

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
        addButton("Início SIAP", v -> load(SIAP_HOME));
        addButton("Planejamento", v -> load(SIAP_PLANEJAMENTO));
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

    private void toggleOrientation(){
        int current=getResources().getConfiguration().orientation;
        setRequestedOrientation(current==android.content.res.Configuration.ORIENTATION_LANDSCAPE ? ActivityInfo.SCREEN_ORIENTATION_PORTRAIT : ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
    }

    public class Bridge {
        @JavascriptInterface public void openSiap(){ runOnUiThread(() -> load(SIAP_HOME)); }
        @JavascriptInterface public void openPlanning(){ runOnUiThread(() -> load(SIAP_PLANEJAMENTO)); }
        @JavascriptInterface public void backToProfessor(){ runOnUiThread(() -> load(PROFESSOR_URL)); }
    }

    @Override public void onBackPressed(){
        if(web!=null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
