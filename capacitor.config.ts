// Capacitor configuration prepared for Android APK builds via GitHub Actions.
// Web deployment on Vercel does not require Capacitor packages to be installed.
const serverUrl = process.env.CAP_SERVER_URL;

const config = {
  appId: 'com.calcapp.standard',
  appName: 'Calculadora',
  webDir: 'out',
  server: {
    ...(serverUrl ? { url: serverUrl } : {}),
    androidScheme: 'https',
    allowNavigation: ['calc-app-tawny.vercel.app', '*.vercel.app'],
  },
};

export default config;
