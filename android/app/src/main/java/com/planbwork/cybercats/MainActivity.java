package com.planbwork.cybercats;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 優化 WebView 設定
        WebView webView = getBridge().getWebView();
        WebSettings webSettings = webView.getSettings();
        
        // 啟用硬體加速
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        
        // 優化渲染
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        
        // 啟用 JavaScript 引擎優化
        webSettings.setJavaScriptEnabled(true);
        
        // 關閉不必要的功能
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        
        // 優化 DOM 儲存
        webSettings.setDomStorageEnabled(true);
        
        // 優化快取
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // 優化圖片載入
        webSettings.setLoadsImagesAutomatically(true);
        webSettings.setBlockNetworkImage(false);
        
        // 額外的效能優化
        webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.SINGLE_COLUMN);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        // 關閉調試功能（如果存在）
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(false);
        }
        
        // 設定渲染優先級
        webView.setKeepScreenOn(true);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
    }
}