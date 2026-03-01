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
