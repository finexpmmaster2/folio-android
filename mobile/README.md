# Folio for Android

Folio's reader (the web app in the repository root) packaged as an Android app with [Capacitor](https://capacitorjs.com/).
Everything runs on the phone: PDFs are never uploaded.

## What's different from desktop Folio
- **Opening PDFs:** the in-app picker, or Android's "Open with → Folio for Android" / "Share → Folio for Android"
  (`android/.../OpenFilePlugin.java` → `src/native.ts` → the document tabs).
- **Saving:** "Save copy" opens Android's share sheet (Save to Files, Drive, messengers…) instead of a download.
- **Touch:** two-finger pinch zoom; on phones (≤600 px wide, touch) the tools sit in a bottom bar.
- **Not available on Android:** Ask AI (uses the desktop app's sign-in), Print, keyboard shortcuts, auto-update.

## Build
Requirements: Node 20+, and either a local Android SDK + JDK 21, or an [EAS](https://expo.dev/eas) account.

```bash
# repository root: the web app
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci && npm run build
# Android project
cd mobile && npm ci && npx cap sync android
# local build (Android SDK + JDK 21):
cd android && ./gradlew assembleRelease
# or cloud build (no SDK needed): set your own EAS project id/owner in app.json first
npx eas-cli build -p android --profile apk
```
On EAS the hooks in `scripts/` install JDK 21 (Capacitor 8 needs it) and build + sync the web app automatically.

## Download
APKs are attached to this repository's [Releases](../../releases).
