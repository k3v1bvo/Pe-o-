// Capacitor configuration prepared for future Android APK builds via GitHub Actions.
// Web deployment on Vercel does not require Capacitor packages to be installed.
const config = {
  appId: 'com.calcapp.standard',
  appName: 'Calculadora',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;

