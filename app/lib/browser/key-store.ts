const databaseName = "anynote";
const storeName = "keys";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(database.transaction(storeName, mode).objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export function getStoredKey(name: string) {
  return run<CryptoKey | undefined>("readonly", (store) => store.get(name));
}

export function storeKey(name: string, key: CryptoKey) {
  return run("readwrite", (store) => store.put(key, name));
}

export function deleteStoredKey(name: string) {
  return run("readwrite", (store) => store.delete(name));
}
