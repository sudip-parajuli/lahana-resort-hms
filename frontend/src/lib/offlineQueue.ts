// IndexedDB offline queue and cache manager for Lahana Resort PMS

const DB_NAME = "lahana_offline_db";
const DB_VERSION = 1;

export interface OfflineOrder {
  id?: number;
  table_id: number | null;
  reservation_id: number | null;
  order_type: string;
  notes: string;
  discount_amount: string;
  items: Array<{
    menu_item_id: number;
    quantity: number;
    modifiers: any;
    notes: string;
  }>;
  created_at: string;
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("offline_orders")) {
        db.createObjectStore("offline_orders", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("catalog_cache")) {
        db.createObjectStore("catalog_cache");
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

// 1. Queue management
export async function queueOfflineOrder(order: Omit<OfflineOrder, "created_at">): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("offline_orders", "readwrite");
    const store = transaction.objectStore("offline_orders");
    const payload = {
      ...order,
      created_at: new Date().toISOString(),
    };
    const request = store.add(payload);

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function getOfflineOrders(): Promise<OfflineOrder[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("offline_orders", "readonly");
    const store = transaction.objectStore("offline_orders");
    const request = store.getAll();

    request.onsuccess = (event: any) => {
      resolve(event.target.result || []);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function deleteOfflineOrder(id: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("offline_orders", "readwrite");
    const store = transaction.objectStore("offline_orders");
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

// 2. Catalog Caching
export async function setCacheItem(key: string, data: any): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("catalog_cache", "readwrite");
    const store = transaction.objectStore("catalog_cache");
    const request = store.put(data, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function getCacheItem<T = any>(key: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("catalog_cache", "readonly");
    const store = transaction.objectStore("catalog_cache");
    const request = store.get(key);

    request.onsuccess = (event: any) => {
      resolve(event.target.result !== undefined ? event.target.result : null);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}
