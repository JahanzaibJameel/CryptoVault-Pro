# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portfolio.spec.ts >> Portfolio Management >> should display portfolio page correctly
- Location: tests\e2e\portfolio.spec.ts:12:7

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "http://localhost:4200/portfolio", waiting until "load"

```

```
Error: browserContext.close: Test ended.
Browser logs:

<launching> C:\Users\Admin\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --enable-automation --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=C:\Users\Admin\AppData\Local\Temp\playwright_chromiumdev_profile-PPdC49 --remote-debugging-pipe --no-startup-window
<launched> pid=17960
[pid=17960][err] [0512/232240.750:INFO:CONSOLE:733] "[vite] connecting...", source: http://localhost:4200/@vite/client (733)
[pid=17960][err] [0512/232240.852:INFO:CONSOLE:1469] "Sentry is disabled or DSN not configured", source: http://localhost:4200/main.js (1469)
[pid=17960][err] [0512/232240.939:INFO:CONSOLE:11204] "Angular is running in development mode.", source: http://localhost:4200/@fs/D:/Angular/crypto-vault-pro/.angular/cache/21.2.10/crypto-vault-pro/vite/deps/chunk-2XHZGH7S.js?v=765d549d (11204)
```