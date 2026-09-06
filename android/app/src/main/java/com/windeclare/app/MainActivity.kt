package com.windeclare.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.windeclare.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var isOffline = false
    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    companion object {
        private const val TARGET_URL = "https://windeclare.com"
        private const val TARGET_HOST = "windeclare.com"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Switch from Splash theme to standard App theme
        setTheme(R.style.Theme_WinDeclare)
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupBackNavigation()
        setupWebView()
        setupSwipeRefresh()
        setupOfflineScreen()
        registerNetworkCallback()

        if (savedInstanceState != null) {
            binding.webView.restoreState(savedInstanceState)
        } else {
            loadInitialPage()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        with(binding.webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = false
            allowContentAccess = false

            // Enforce HTTPS security
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }

        // Enable cookies
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(binding.webView, true)

        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.progressBar.progress = newProgress
                } else {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefreshLayout.isRefreshing = false
                }
            }
        }

        binding.webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val uri = request?.url ?: return false
                val host = uri.host.orEmpty()
                val scheme = uri.scheme.orEmpty()

                // Keep windeclare.com links inside WebView
                if (host.equals(TARGET_HOST, ignoreCase = true) || host.endsWith(".$TARGET_HOST", ignoreCase = true)) {
                    return false
                }

                // Handle external URL schemes (tel, mailto, whatsapp, market, external domains)
                return try {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    startActivity(intent)
                    true
                } catch (e: Exception) {
                    false
                }
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                if (isNetworkAvailable()) {
                    showWebView()
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.swipeRefreshLayout.isRefreshing = false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // Only show offline screen if the main frame failed to load
                if (request?.isForMainFrame == true) {
                    showOfflineScreen()
                }
            }
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setColorSchemeResources(R.color.primary)
        binding.swipeRefreshLayout.setOnRefreshListener {
            if (isNetworkAvailable()) {
                if (isOffline) {
                    binding.webView.loadUrl(TARGET_URL)
                } else {
                    binding.webView.reload()
                }
            } else {
                binding.swipeRefreshLayout.isRefreshing = false
                showOfflineScreen()
            }
        }

        // Prevent swipe-to-refresh conflict when WebView is scrolled down
        binding.webView.viewTreeObserver.addOnScrollChangedListener {
            binding.swipeRefreshLayout.isEnabled = (binding.webView.scrollY == 0)
        }
    }

    private fun setupOfflineScreen() {
        binding.btnRetry.setOnClickListener {
            if (isNetworkAvailable()) {
                showWebView()
                binding.webView.loadUrl(binding.webView.url ?: TARGET_URL)
            } else {
                showOfflineScreen()
            }
        }
    }

    private fun loadInitialPage() {
        if (isNetworkAvailable()) {
            showWebView()
            binding.webView.loadUrl(TARGET_URL)
        } else {
            showOfflineScreen()
        }
    }

    private fun showOfflineScreen() {
        isOffline = true
        binding.swipeRefreshLayout.visibility = View.GONE
        binding.offlineLayout.visibility = View.VISIBLE
        binding.progressBar.visibility = View.GONE
    }

    private fun showWebView() {
        isOffline = false
        binding.offlineLayout.visibility = View.GONE
        binding.swipeRefreshLayout.visibility = View.VISIBLE
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val activeNetwork = cm.activeNetwork ?: return false
            val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return false
            return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                    capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = cm.activeNetworkInfo
            @Suppress("DEPRECATION")
            return networkInfo != null && networkInfo.isConnected
        }
    }

    private fun registerNetworkCallback() {
        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                runOnUiThread {
                    if (isOffline) {
                        showWebView()
                        val currentUrl = binding.webView.url
                        if (currentUrl.isNullOrEmpty() || currentUrl == "about:blank") {
                            binding.webView.loadUrl(TARGET_URL)
                        } else {
                            binding.webView.reload()
                        }
                    }
                }
            }

            override fun onLost(network: Network) {
                runOnUiThread {
                    if (!isNetworkAvailable()) {
                        showOfflineScreen()
                    }
                }
            }
        }

        try {
            connectivityManager?.registerNetworkCallback(request, networkCallback as ConnectivityManager.NetworkCallback)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        binding.webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        binding.webView.onResume()
    }

    override fun onPause() {
        binding.webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        networkCallback?.let {
            try {
                connectivityManager?.unregisterNetworkCallback(it)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        binding.webView.destroy()
        super.onDestroy()
    }
}
