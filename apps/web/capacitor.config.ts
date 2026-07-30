import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sparks.uz.app',
  appName: 'Sparks UZ',
  webDir: 'out',
  server: {
    url: 'https://tanishuz-app-web.vercel.app',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'YOUR_WEB_CLIENT_ID', // TODO: User needs to replace this
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
