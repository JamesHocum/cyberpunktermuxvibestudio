/**
 * Electron Builder Configuration
 * Build desktop apps for Windows, macOS, and Linux
 * 
 * Usage:
 * - npm run electron:build:win  -> Windows installer
 * - npm run electron:build:mac  -> macOS DMG
 * - npm run electron:build:linux -> Linux AppImage
 */
export default {
  appId: 'app.lovable.cyberpunk-termux',
  productName: 'Cyberpunk Termux Studio',
  copyright: 'Copyright © 2024 Lovable',
  
  // Directories
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  
  // Files to include
  files: [
    'dist/**/*',
    'electron/**/*',
    'package.json',
  ],
  
  // macOS configuration
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.developer-tools',
    icon: 'build/icon.icns',
    darkModeSupport: true,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  },
  
  // DMG configuration
  dmg: {
    backgroundColor: '#000000',
    title: '${productName}',
    icon: 'build/icon.icns',
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
  },
  
  // Windows configuration
  win: {
    target: ['nsis', 'portable'],
    icon: 'build/icon.ico',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  },
  
  // NSIS installer configuration
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    installerHeaderIcon: 'build/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Cyberpunk Termux',
  },
  
  // Linux configuration
  linux: {
    target: ['AppImage', 'deb', 'rpm'],
    icon: 'build/icons',
    category: 'Development',
    maintainer: 'Lovable',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
    desktop: {
      Name: 'Cyberpunk Termux Studio',
      Comment: 'Cyberpunk-themed development environment',
      Terminal: false,
      Type: 'Application',
      Categories: 'Development;IDE;',
    },
  },
  
  // Compression
  compression: 'maximum',
  
  // Auto-update configuration (optional)
  publish: {
    provider: 'github',
    owner: 'lovable',
    repo: 'cyberpunk-termux',
    releaseType: 'release',
  },
};
