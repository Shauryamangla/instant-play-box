// Persist the FileSystemDirectoryHandle in IndexedDB so the app remembers
// the chosen videos folder across reloads (autoplay-on-open requirement).
const DB = "pioneer-box";
const STORE = "handles";
const KEY = "videos-dir";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirHandle(handle: FileSystemDirectoryHandle) {
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => res((req.result as FileSystemDirectoryHandle) ?? null);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearDirHandle() {
  const db = await openDb();
  await new Promise<void>((res) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => res();
  });
}

export async function ensurePermission(handle: FileSystemDirectoryHandle) {
  // @ts-expect-error - non-standard but supported in Chromium
  const q = await handle.queryPermission?.({ mode: "read" });
  if (q === "granted") return true;
  // @ts-expect-error
  const r = await handle.requestPermission?.({ mode: "read" });
  return r === "granted";
}

const VIDEO_EXT = /\.(mp4|m4v|mkv|webm|mov|avi|3gp|ogv)$/i;

export async function listVideoFiles(
  handle: FileSystemDirectoryHandle,
  recursive = true,
  prefix = ""
): Promise<{ name: string; path: string; file: File }[]> {
  const out: { name: string; path: string; file: File }[] = [];
  const entries = (handle as unknown as { entries(): AsyncIterable<[string, FileSystemHandle]> }).entries();
  for await (const [name, entry] of entries) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (entry.kind === "file" && VIDEO_EXT.test(name)) {
      const file = await (entry as FileSystemFileHandle).getFile();
      out.push({ name, path, file });
    } else if (entry.kind === "directory" && recursive) {
      const nested = await listVideoFiles(entry as FileSystemDirectoryHandle, true, path);
      out.push(...nested);
    }
  }
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}