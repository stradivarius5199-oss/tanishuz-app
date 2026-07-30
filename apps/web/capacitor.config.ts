import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sparks.uz.app',
  appName: 'Sparks UZ',
  webDir: 'out',
  server: {
    url: 'https://tanishuz-app-web.vercel.app',
    cleartext: true
  }
};

export default config;
