const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  isElectron: () => ipcRenderer.invoke('is-electron'),

  platform: process.platform,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('[Electron] Preload script loaded');
  console.log('[Electron] Platform:', process.platform);
});
