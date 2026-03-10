import JSZip from "jszip";

export async function generatePWAPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  Object.entries(fileContents).forEach(([path, content]) => zip.file(path, content));
  zip.file("public/manifest.json", JSON.stringify({
    name: projectName, short_name: projectName, start_url: "/", display: "standalone",
    background_color: "#0d1117", theme_color: "#00ff88",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ]
  }, null, 2));
  zip.file("public/sw.js", `const CACHE='pwa-v1';const ASSETS=['/'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));`);
  zip.file("README.md", `# ${projectName} (PWA)\n\nProgressive Web App ready for deployment.\n\n## Deploy\n1. \`npm install\`\n2. \`npm run build\`\n3. Deploy \`dist/\` to any static host\n`);
  return zip.generateAsync({ type: "blob" });
}

function electronMain() {
  return `const { app, BrowserWindow } = require('electron');
const path = require('path');
function createWindow() {
  const win = new BrowserWindow({ width: 1280, height: 800, webPreferences: { nodeIntegration: false, contextIsolation: true } });
  win.loadFile(path.join(__dirname, '../dist/index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });`;
}

function baseDevDeps() {
  return { electron: "^28.0.0", "electron-builder": "^24.9.1", vite: "^5.0.0" };
}

export async function generateWindowsPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  const slug = projectName.toLowerCase().replace(/\s+/g, "-");
  Object.entries(fileContents).forEach(([p, c]) => zip.file(`src/${p}`, c));
  zip.file("electron/main.cjs", electronMain());
  zip.file("package.json", JSON.stringify({ name: slug, version: "1.0.0", main: "electron/main.cjs", scripts: { dev: "vite", build: "vite build", "package:win": "vite build && electron-builder --win --config electron-builder.config.js" }, devDependencies: baseDevDeps() }, null, 2));
  zip.file("electron-builder.config.js", `module.exports={appId:'com.${slug}.app',productName:'${projectName}',directories:{output:'release',buildResources:'build'},files:['dist/**/*','electron/**/*','package.json'],win:{target:['nsis','portable'],artifactName:'\${productName}-\${version}-Setup.\${ext}'},nsis:{oneClick:false,allowToChangeInstallationDirectory:true,createDesktopShortcut:true}};`);
  zip.file("README.md", `# ${projectName} — Windows Package\n\n## Build\n1. \`npm install\`\n2. \`npm run package:win\`\n3. Installer in \`release/\`\n`);
  return zip.generateAsync({ type: "blob" });
}

export async function generateLinuxPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  const slug = projectName.toLowerCase().replace(/\s+/g, "-");
  Object.entries(fileContents).forEach(([p, c]) => zip.file(`src/${p}`, c));
  zip.file("electron/main.cjs", electronMain());
  zip.file("package.json", JSON.stringify({ name: slug, version: "1.0.0", main: "electron/main.cjs", scripts: { dev: "vite", build: "vite build", "package:linux": "vite build && electron-builder --linux --config electron-builder.config.js" }, devDependencies: baseDevDeps() }, null, 2));
  zip.file("electron-builder.config.js", `module.exports={appId:'com.${slug}.app',productName:'${projectName}',directories:{output:'release',buildResources:'build'},files:['dist/**/*','electron/**/*','package.json'],linux:{target:['AppImage','deb','rpm'],category:'Development',icon:'build/icon.png',artifactName:'\${productName}-\${version}.\${ext}'}};`);
  zip.file("README.md", `# ${projectName} — Linux Package\n\n## Build\n1. \`npm install\`\n2. \`npm run package:linux\`\n3. AppImage/deb/rpm in \`release/\`\n\nRequires Node.js 18+.\n`);
  return zip.generateAsync({ type: "blob" });
}

export async function generateMacPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  const slug = projectName.toLowerCase().replace(/\s+/g, "-");
  Object.entries(fileContents).forEach(([p, c]) => zip.file(`src/${p}`, c));
  zip.file("electron/main.cjs", electronMain());
  zip.file("package.json", JSON.stringify({ name: slug, version: "1.0.0", main: "electron/main.cjs", scripts: { dev: "vite", build: "vite build", "package:mac": "vite build && electron-builder --mac --config electron-builder.config.js" }, devDependencies: baseDevDeps() }, null, 2));
  zip.file("electron-builder.config.js", `module.exports={appId:'com.${slug}.app',productName:'${projectName}',directories:{output:'release',buildResources:'build'},files:['dist/**/*','electron/**/*','package.json'],mac:{target:['dmg','zip'],category:'public.app-category.developer-tools',darkModeSupport:true,icon:'build/icon.icns',artifactName:'\${productName}-\${version}.\${ext}'},dmg:{title:'${projectName}',icon:'build/icon.icns'}};`);
  zip.file("README.md", `# ${projectName} — macOS Package\n\n## Build\n1. \`npm install\`\n2. \`npm run package:mac\`\n3. DMG in \`release/\`\n\nRequires macOS and Node.js 18+.\n`);
  return zip.generateAsync({ type: "blob" });
}

export async function generateAndroidPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  const slug = projectName.toLowerCase().replace(/\s+/g, "-");
  Object.entries(fileContents).forEach(([p, c]) => zip.file(`src/${p}`, c));
  zip.file("capacitor.config.ts", `import { CapacitorConfig } from '@capacitor/cli';\n\nconst config: CapacitorConfig = {\n  appId: 'com.${slug}.app',\n  appName: '${projectName}',\n  webDir: 'dist',\n  plugins: {\n    SplashScreen: {\n      launchShowDuration: 0\n    }\n  }\n};\n\nexport default config;\n`);
  zip.file("package.json", JSON.stringify({
    name: slug, version: "1.0.0",
    scripts: {
      dev: "vite", build: "vite build",
      "cap:sync": "npx cap sync",
      "android": "npm run build && npx cap sync && npx cap run android",
    },
    dependencies: { "@capacitor/core": "^7.4.3", "@capacitor/android": "^7.4.3" },
    devDependencies: { "@capacitor/cli": "^7.4.3", vite: "^5.0.0" },
  }, null, 2));
  zip.file("README.md", `# ${projectName} — Android APK\n\n## Build\n1. \`npm install\`\n2. \`npx cap add android\`\n3. \`npm run android\`\n\nRequires Android Studio and Node.js 18+.\n`);
  return zip.generateAsync({ type: "blob" });
}

export async function generateIOSPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  const slug = projectName.toLowerCase().replace(/\s+/g, "-");
  Object.entries(fileContents).forEach(([p, c]) => zip.file(`src/${p}`, c));
  zip.file("capacitor.config.ts", `import { CapacitorConfig } from '@capacitor/cli';\n\nconst config: CapacitorConfig = {\n  appId: 'com.${slug}.app',\n  appName: '${projectName}',\n  webDir: 'dist',\n  plugins: {\n    SplashScreen: {\n      launchShowDuration: 0\n    }\n  }\n};\n\nexport default config;\n`);
  zip.file("package.json", JSON.stringify({
    name: slug, version: "1.0.0",
    scripts: {
      dev: "vite", build: "vite build",
      "cap:sync": "npx cap sync",
      "ios": "npm run build && npx cap sync && npx cap run ios",
    },
    dependencies: { "@capacitor/core": "^7.4.3", "@capacitor/ios": "^7.4.3" },
    devDependencies: { "@capacitor/cli": "^7.4.3", vite: "^5.0.0" },
  }, null, 2));
  zip.file("README.md", `# ${projectName} — iOS IPA\n\n## Build\n1. \`npm install\`\n2. \`npx cap add ios\`\n3. \`npm run ios\`\n\n**Requires macOS with Xcode installed.** Final IPA generation must be done locally on a Mac.\n`);
  return zip.generateAsync({ type: "blob" });
}

export async function generateChromeExtPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  const slug = projectName.toLowerCase().replace(/\s+/g, "-");
  Object.entries(fileContents).forEach(([p, c]) => zip.file(`src/${p}`, c));
  zip.file("manifest.json", JSON.stringify({
    manifest_version: 3,
    name: projectName,
    version: "1.0.0",
    description: `${projectName} browser extension`,
    action: { default_popup: "popup.html", default_icon: { "16": "icons/icon-16.png", "48": "icons/icon-48.png", "128": "icons/icon-128.png" } },
    permissions: ["activeTab", "storage"],
    content_scripts: [{ matches: ["<all_urls>"], js: ["content.js"], css: ["content.css"] }],
    background: { service_worker: "background.js", type: "module" },
    icons: { "16": "icons/icon-16.png", "48": "icons/icon-48.png", "128": "icons/icon-128.png" }
  }, null, 2));
  zip.file("popup.html", `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="popup.css"><title>${projectName}</title></head><body><div id="root"></div><script src="popup.js"></script></body></html>`);
  zip.file("popup.js", `document.getElementById('root').innerHTML = '<h1>${projectName}</h1><p>Extension loaded.</p>';`);
  zip.file("popup.css", `body { width: 320px; min-height: 200px; font-family: system-ui; background: #0d1117; color: #00ff41; padding: 16px; } h1 { font-size: 18px; }`);
  zip.file("background.js", `chrome.runtime.onInstalled.addListener(() => { console.log('${projectName} extension installed'); });`);
  zip.file("content.js", `// Content script for ${projectName}\nconsole.log('${projectName} content script loaded');`);
  zip.file("content.css", `/* Content styles for ${projectName} */`);
  zip.file("README.md", `# ${projectName} — Chrome Extension\n\n## Install\n1. Go to \`chrome://extensions\`\n2. Enable Developer Mode\n3. Click "Load unpacked" and select this folder\n\n## Build from source\n1. \`npm install\`\n2. \`npm run build\`\n3. Load the \`dist/\` folder as unpacked extension\n`);
  zip.file("package.json", JSON.stringify({ name: slug, version: "1.0.0", scripts: { dev: "vite", build: "vite build" }, devDependencies: { vite: "^5.0.0" } }, null, 2));
  return zip.generateAsync({ type: "blob" });
}

export async function generateIDEExtensionPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  const slug = projectName.toLowerCase().replace(/\s+/g, "-");
  zip.file("extension.json", JSON.stringify({
    id: slug,
    name: projectName,
    version: "1.0.0",
    description: `${projectName} — a Cyberpunk Termux IDE extension`,
    author: "Developer",
    main: "index.js",
    permissions: ["editor", "terminal", "sidebar"]
  }, null, 2));
  zip.file("index.js", `// ${projectName} IDE Extension\n// Exports: default (init function) or named { init, name, version }\n\nexport const name = '${projectName}';\nexport const version = '1.0.0';\n\nexport function init() {\n  console.log('${projectName} extension initialized');\n  // Access IDE APIs here\n}\n\nexport default init;\n`);
  zip.file("README.md", `# ${projectName} — IDE Extension\n\nA custom extension for Cyberpunk Termux IDE.\n\n## Structure\n- \`extension.json\` — metadata and permissions\n- \`index.js\` — entry point (must export \`init\` or \`default\`)\n\n## Install\n1. Host the built JS on a CDN or static server\n2. Submit via the IDE Extension Registry\n3. Or load locally via the Extensions panel\n`);
  Object.entries(fileContents).forEach(([p, c]) => zip.file(`src/${p}`, c));
  return zip.generateAsync({ type: "blob" });
}

export async function generateZipPackage(projectName: string, fileContents: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  Object.entries(fileContents).forEach(([path, content]) => zip.file(path, content));
  zip.file("README.md", `# ${projectName}\n\nProject source files.\n`);
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
