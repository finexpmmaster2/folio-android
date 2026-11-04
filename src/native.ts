// Android bridge for PDF Reader (Capacitor). In a normal browser every function here is a no-op, so the web build
// keeps working unchanged.
import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Folio shows each document in a same-origin frame; Capacitor's bridge exists only in the top page, so frames
// delegate to the top page's copy of this module (window.__pdfNative).
type Bridge = { isNative: boolean; save: (blob: Blob, name: string) => Promise<boolean> };
const topBridge = (): Bridge | undefined => {
  try {
    return window.top !== window ? (window.top as unknown as { __pdfNative?: Bridge }).__pdfNative : undefined;
  } catch {
    return undefined;
  }
};
export const isNative = topBridge()?.isNative ?? Capacitor.isNativePlatform();

type IncomingFile = { name?: string; data?: string };
interface OpenFilePlugin {
  /** A PDF the app was opened with ("Open with" / "Share to") before the page was ready. */
  getPending(): Promise<IncomingFile>;
  addListener(event: "file", cb: (f: IncomingFile) => void): Promise<PluginListenerHandle>;
}
const OpenFile = registerPlugin<OpenFilePlugin>("OpenFile");

const toBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",", 2)[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Downloads don't exist inside an app: write the file to the app cache and open Android's share sheet
 *  ("Save to Files", Drive, Telegram, …). Returns false when not running as the Android app. */
export async function nativeSave(blob: Blob, name: string): Promise<boolean> {
  const top = topBridge();
  if (top) return top.save(blob, name);
  if (!isNative) return false;
  const safe = name.replace(/[\\/:*?"<>|]+/g, "_") || "document.pdf";
  const written = await Filesystem.writeFile({ path: safe, data: await blobToBase64(blob), directory: Directory.Cache });
  await Share.share({ title: safe, files: [written.uri], dialogTitle: safe });
  return true;
}

/** Calls `open` for every PDF Android hands to the app (at start and while it is running). */
export function onNativeOpen(open: (name: string, data: Uint8Array) => void) {
  if (!isNative) return;
  const take = (f: IncomingFile) => {
    if (f && f.data) open(f.name || "document.pdf", toBytes(f.data));
  };
  void OpenFile.addListener("file", take);
  void OpenFile.getPending().then(take).catch(() => {});
}

if (window.top === window && Capacitor.isNativePlatform()) {
  (window as unknown as { __pdfNative: Bridge }).__pdfNative = { isNative: true, save: nativeSave };
}
