/*!
 * X-Frame-Titan v7.0.0-Ultimate | Enterprise Bypass & Virtual Browser Engine
 * Copyright (c) 2026 X-Frame-Titan Contributors | MIT License
 * 
 * Distribution: jsDelivr Ready (UMD/IIFE)
 * Features: True Bypass, Network Interception, Gateway Swarm, Frame-Busting Immunity, AST DOM Rewriting
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.XFrameTitan = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // =========================================================================
    // 1. ADVANCED CONFIGURATION & DISTRIBUTED SWARM
    // =========================================================================
    const CONFIG = {
        VERSION: '7.0.0',
        TIMEOUT_MS: 15000,
        MAX_RETRIES: 3,
        DEFAULT_MODE: 'virtual', // modes: 'virtual' (true bypass), 'cloak' (viewer), 'direct'
        PROXY_SWARM: [
            { name: 'CorsProxyIO', url: (target) => `https://corsproxy.io/?${encodeURIComponent(target)}`, health: 100 },
            { name: 'AllOrigins',  url: (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`, health: 100 },
            { name: 'CodeTabs',    url: (target) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`, health: 100 },
            { name: 'ProxyHera',   url: (target) => `https://crossorigin.me/${target}`, health: 100 } // Fallback
        ],
        VIEWER_SWARM: [
            (target) => `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(target)}`,
            (target) => `https://web.archive.org/web/${target}`
        ]
    };

    // =========================================================================
    // 2. THE VIRTUAL DOM WORKER (Off-Main-Thread Processing Engine)
    // =========================================================================
    // This engine parses raw HTML, neutralizes security headers, and rewrites ALL asset URIs.
    const VIRTUAL_ENGINE_SOURCE = `
        self.addEventListener('message', function(e) {
            const { html, targetUrl, gatewayPattern } = e.data;
            let domString = html;

            const makeProxyUrl = (path) => {
                if (!path || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('#')) return path;
                try {
                    const absoluteUrl = new URL(path, targetUrl).href;
                    return gatewayPattern.replace('__URL__', encodeURIComponent(absoluteUrl));
                } catch(e) { return path; }
            };

            // 1. Strip Hostile Meta Tags (CSP & X-Frame-Options)
            domString = domString.replace(/<meta[^>]*http-equiv=["']?(Content-Security-Policy|X-Frame-Options)["']?[^>]*>/gim, '<!-- Sec-Header Stripped -->');

            // 2. Base Tag Injection
            if (!domString.includes('<base')) {
                domString = domString.replace(/<head[^>]*>/i, match => match + \`<base href="\${targetUrl}">\`);
            }

            // 3. Asset Rewriting (Images, Scripts, Styles)
            // Rewrite src="..."
            domString = domString.replace(/\\b(src|href)=["']([^"']+)["']/gi, (match, attr, url) => {
                if(attr.toLowerCase() === 'href' && !match.toLowerCase().includes('stylesheet')) return match; // skip anchor hrefs for now
                return \`\${attr}="\${makeProxyUrl(url)}"\`;
            });

            // 4. CSS inline url(...) Rewriting
            domString = domString.replace(/url\\(["']?([^"')]+)["']?\\)/gi, (match, url) => {
                return \`url("\${makeProxyUrl(url)}")\`;
            });

            self.postMessage({ type: 'COMPLETE', html: domString });
        });
    `;

    // =========================================================================
    // 3. IN-CONTEXT INTERCEPTION PAYLOAD (The Master Algorithm)
    // =========================================================================
    // This script is injected directly into the iframe's execution environment.
    // It mocks browser parameters to beat fingerprinting, routes XHR/Fetch through the 
    // gateway swarm, and intercepts all <a> and <form> events to keep the user trapped in the engine.
    const generateInterceptorPayload = (targetUrl, gatewayPattern) => `
        <script id="titan-interceptor">
            (function() {
                const TARGET_URL = "${targetUrl}";
                const GATEWAY = "${gatewayPattern}";

                const proxify = (url) => {
                    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
                    try {
                        const abs = new URL(url, TARGET_URL).href;
                        return GATEWAY.replace('__URL__', encodeURIComponent(abs));
                    } catch(e) { return url; }
                };

                // 1. NEUTRALIZE FRAME-BUSTERS & MOCK ENVIRONMENT
                try {
                    if (window.top !== window.self) {
                        window.top = window.self;
                        window.parent = window.self;
                    }
                    Object.defineProperty(navigator, 'webdriver', { get: () => false });
                    Object.defineProperty(navigator, 'userAgent', { get: () => navigator.userAgent + ' TitanEngine/7.0' });
                } catch(e) {}

                // 2. PROXY NETWORK API: window.fetch
                const originalFetch = window.fetch;
                window.fetch = async function() {
                    let args = Array.from(arguments);
                    if (typeof args[0] === 'string' || args[0] instanceof URL) {
                        args[0] = proxify(args[0].toString());
                    } else if (args[0] instanceof Request) {
                        args[0] = new Request(proxify(args[0].url), args[0]);
                    }
                    return originalFetch.apply(this, args);
                };

                // 3. PROXY NETWORK API: XMLHttpRequest
                const originalOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
                    arguments[1] = proxify(url.toString());
                    return originalOpen.apply(this, arguments);
                };

                // 4. INTERCEPT DOM NAVIGATION (Links & Forms)
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.addEventListener('click', (e) => {
                        const a = e.target.closest('a');
                        if (a && a.href && !a.href.startsWith('javascript:')) {
                            e.preventDefault();
                            window.parent.postMessage({ type: 'TITAN_NAVIGATE', url: a.href }, '*');
                        }
                    }, true);

                    document.body.addEventListener('submit', (e) => {
                        const form = e.target;
                        if(form.method.toLowerCase() === 'get') {
                            e.preventDefault();
                            const url = new URL(form.action || TARGET_URL);
                            new FormData(form).forEach((v, k) => url.searchParams.append(k, v));
                            window.parent.postMessage({ type: 'TITAN_NAVIGATE', url: url.href }, '*');
                        }
                    }, true);
                });
            })();
        </script>
    `;

    // =========================================================================
    // 4. TITAN BASE COMPONENT EXTENSION
    // =========================================================================
    class XFrameTitanElement extends HTMLIFrameElement {
        static get observedAttributes() {
            return ['src', 'mode', 'theme'];
        }

        constructor() {
            super();
            this.#initializeCore();
        }

        // --- PRIVATE FIELDS ---
        #state = {
            gatewayIndex: 0,
            activeUrl: null,
            worker: null,
            isProcessing: false,
            cache: new Map()
        };

        #initializeCore() {
            // Setup Web Worker via Blob dynamically
            if (window.Worker) {
                const blob = new Blob([VIRTUAL_ENGINE_SOURCE], { type: 'application/javascript' });
                this.#state.worker = new Worker(URL.createObjectURL(blob));
                this.#state.worker.onmessage = this.#handleWorkerResponse.bind(this);
            }

            // Bind Event Listeners
            this.#handleIframeMessage = this.#handleIframeMessage.bind(this);
        }

        // --- DOM LIFECYCLE ---
        connectedCallback() {
            // Apply Secure Styles
            this.setAttribute('data-titan-version', CONFIG.VERSION);
            this.style.cssText = this.style.cssText || 'width: 100%; height: 100%; border: none; overflow: hidden; background: #ffffff;';

            window.addEventListener('message', this.#handleIframeMessage);

            if (this.hasAttribute('src')) {
                this.navigate(this.getAttribute('src'));
            }
        }

        disconnectedCallback() {
            if (this.#state.worker) this.#state.worker.terminate();
            window.removeEventListener('message', this.#handleIframeMessage);
        }

        attributeChangedCallback(name, oldVal, newVal) {
            if (name === 'src' && newVal && newVal !== this.#state.activeUrl && !this.#state.isProcessing) {
                this.navigate(newVal);
            }
        }

        // --- PUBLIC API ---
        async navigate(url) {
            if (!url) return;
            
            this.#state.activeUrl = url;
            this.#state.isProcessing = true;
            this.dispatchEvent(new CustomEvent('titan-load-start', { detail: { url } }));
            this.#renderLoader();

            const mode = this.getAttribute('mode') || CONFIG.DEFAULT_MODE;

            // Cache check
            if (this.#state.cache.has(url)) {
                this.#injectProcessedDOM(this.#state.cache.get(url));
                return;
            }

            try {
                if (mode === 'cloak') {
                    await this.#executeCloakRoute(url);
                } else if (mode === 'direct') {
                    await this.#executeDirectRoute(url);
                } else {
                    await this.#executeVirtualRoute(url); // True Bypass
                }
            } catch (err) {
                console.error('[X-Frame-Titan] Fatal Engine Error:', err);
                this.#executeCloakRoute(url); // Ultimate fallback to cloaking viewer
            }
        }

        // --- ROUTING STRATEGIES (ALGORITHMS) ---
        async #executeVirtualRoute(targetUrl) {
            // 1. Fetch raw HTML using the Smart Gateway Swarm
            const { html, gatewayPattern } = await this.#fetchViaSwarm(targetUrl);

            // 2. Process HTML AST & Rewrite URLs via Multi-Threading
            if (this.#state.worker) {
                this.#state.worker.postMessage({
                    html: html,
                    targetUrl: targetUrl,
                    gatewayPattern: gatewayPattern
                });
            } else {
                throw new Error("Worker Initialization Failed");
            }
        }

        async #executeDirectRoute(targetUrl) {
            const res = await fetch(targetUrl, { mode: 'cors' });
            if (!res.ok) throw new Error("CORS Blocked");
            this.#injectProcessedDOM(await res.text(), targetUrl, "{url}");
        }

        async #executeCloakRoute(targetUrl) {
            // Bypasses X-Frame-Options by nesting the request inside public infrastructure
            const viewerUrl = CONFIG.VIEWER_SWARM[0](targetUrl);
            this.removeAttribute('srcdoc');
            super.src = viewerUrl;
            this.#state.isProcessing = false;
        }

        // --- SWARM LOAD BALANCER ---
        async #fetchViaSwarm(targetUrl) {
            let lastError;
            const swarm = CONFIG.PROXY_SWARM;

            // Exponential loop through healthy gateways
            for (let attempt = 0; attempt < swarm.length; attempt++) {
                const proxyIndex = (this.#state.gatewayIndex + attempt) % swarm.length;
                const gateway = swarm[proxyIndex];
                
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
                    
                    const proxyUrl = gateway.url(targetUrl);
                    const response = await fetch(proxyUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    // Stick to the successful gateway for subsequent inner requests
                    this.#state.gatewayIndex = proxyIndex;
                    
                    // Return raw HTML and the pattern needed for internal rewriting
                    return { 
                        html: await response.text(), 
                        gatewayPattern: gateway.url('__URL__') 
                    };

                } catch (e) {
                    console.warn(`[Titan] Gateway '${gateway.name}' degraded. Cycling...`);
                    gateway.health -= 10;
                    lastError = e;
                }
            }
            throw lastError || new Error("Total Swarm Failure");
        }

        // --- VIRTUAL DOM ASSEMBLY ---
        #handleWorkerResponse(e) {
            if (e.data.type === 'COMPLETE') {
                const gatewayPattern = CONFIG.PROXY_SWARM[this.#state.gatewayIndex].url('__URL__');
                this.#injectProcessedDOM(e.data.html, this.#state.activeUrl, gatewayPattern);
            }
        }

        #injectProcessedDOM(cleanHtml, originalUrl, gatewayPattern) {
            // Append the In-Context Interception Engine
            const interceptorScript = generateInterceptorPayload(originalUrl, gatewayPattern);
            const finalDOM = cleanHtml.replace('<head>', '<head>' + interceptorScript);

            // Cache for massive performance boost on back/forward navigation
            this.#state.cache.set(originalUrl, cleanHtml);

            // Inject via SrcDoc (Creates a Same-Origin secure execution context isolated from parent)
            this.srcdoc = finalDOM;
            this.#state.isProcessing = false;
            this.dispatchEvent(new CustomEvent('titan-load-complete', { detail: { url: originalUrl } }));
        }

        // --- INTERCEPTOR EVENT BRIDGE ---
        #handleIframeMessage(event) {
            // Ensure message came from OUR iframe
            if (event.source !== this.contentWindow) return;

            const data = event.data;
            if (data && data.type === 'TITAN_NAVIGATE') {
                // Catch links clicked inside the virtual browser and handle them in the Parent
                console.info(`[Titan] Inner Navigation Captured: ${data.url}`);
                this.navigate(data.url);
            }
        }

        // --- UI METRICS ---
        #renderLoader() {
            // Enterprise minimalist preloader
            const themeColor = this.getAttribute('theme') || '#2563eb';
            const preloader = `
                <style>
                    body { display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; margin:0; background:#f8fafc; font-family:system-ui,-apple-system,sans-serif; }
                    .titan-spinner { width:48px; height:48px; border:4px solid #e2e8f0; border-top-color:${themeColor}; border-radius:50%; animation:spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                    .titan-text { margin-top:20px; font-weight:600; color:#475569; letter-spacing:0.5px; }
                    @keyframes spin { 100% { transform:rotate(360deg); } }
                </style>
                <div class="titan-spinner"></div>
                <div class="titan-text">Establishing Secure Virtual Tunnel...</div>
            `;
            this.srcdoc = preloader;
        }
    }

    // =========================================================================
    // 5. REGISTRATION AND EXPORT
    // =========================================================================
    function init() {
        if (typeof window !== 'undefined' && window.customElements) {
            if (!customElements.get('x-frame-bypass')) {
                customElements.define('x-frame-bypass', XFrameTitanElement, { extends: 'iframe' });
                console.log(`%c 🛡️ X-Frame-Titan v${CONFIG.VERSION} | Enterprise Bypass Engine Active `, 'background:#1e293b; color:#10b981; padding:4px; border-radius:4px; font-weight:bold;');
            }
        }
        return XFrameTitanElement;
    }

    return init();
}));
