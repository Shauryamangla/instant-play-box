# Building an Offline Android APK

This project uses [Capacitor](https://capacitorjs.com/) to wrap the web app as a native Android APK that runs fully offline after install.

## Prerequisites

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) (with Android SDK + JDK 17)

## Build steps

```bash
npm install
npm run build
npx cap add android   # first time only
npx cap sync android
```

Then open the `android/` folder in Android Studio and click **Build → Generate Signed Bundle / APK** to produce the installable APK.

## Notes

- `webDir` is set to `dist/client` in `capacitor.config.ts` — this is where the TanStack Start Vite build emits the static client assets bundled into the APK.
- The bundled service worker (`public/sw.js`) caches the app shell so the app works without internet after first launch.
- After any code change, re-run `npm run build && npx cap sync android` (or `npm run cap:build`) to update the Android project, then rebuild in Android Studio.