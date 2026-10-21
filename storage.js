// The player's saves and settings, kept in IndexedDB between visits (see Platform/PersistentStorage.cs).
// The game itself reads and writes plain files; the page's file system lives in memory, so every file
// the game reports as written is mirrored here, and all of them are written back before the next start.
const DB = 'pieces-of-the-dynasties';
const STORE = 'files';
let opening = null;

function db() {
    opening ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DB, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    return opening;
}

async function write(mode, action) {
    const database = await db();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE, mode);
        action(tx.objectStore(STORE));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Every stored file as JSON [[path, text], ...]; '[]' when storage is unavailable (private browsing,
// blocked site data) — the game then simply starts without saves, as on a first visit.
export async function loadAll() {
    try {
        const database = await db();
        return await new Promise((resolve, reject) => {
            const files = [];
            const cursor = database.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
            cursor.onsuccess = () => {
                const c = cursor.result;
                if (c) { files.push([c.key, c.value]); c.continue(); }
                else resolve(JSON.stringify(files));
            };
            cursor.onerror = () => reject(cursor.error);
        });
    } catch (e) {
        console.warn('Saved games are unavailable in this browser:', e);
        return '[]';
    }
}

export function put(path, text) {
    write('readwrite', store => store.put(text, path)).catch(e => console.warn('Could not keep ' + path + ':', e));
}

export function remove(path) {
    write('readwrite', store => store.delete(path)).catch(e => console.warn('Could not delete ' + path + ':', e));
}
