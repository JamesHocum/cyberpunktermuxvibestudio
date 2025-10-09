import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7634a36513934f41921227f505acceca',
  appName: 'nimble-craft-ide-37686',
  webDir: 'dist',
  server: {
    url: 'https://7634a365-1393-4f41-9212-27f505acceca.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
