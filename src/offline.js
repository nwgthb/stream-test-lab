import { writeToConsole } from './telemetry.js';

const DB_NAME = 'StreamLabOfflineDB';
const STORE_NAME = 'VideoBlobs';
let dbInstance = null;

export function initOfflineDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      updateCacheStatusDisplay();
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      writeToConsole('IndexedDB hardware error occurred.', 'error');
      reject(e);
    };
  });
}

export function saveVideoToOfflineCache(key, fileBlob) {
  if (!dbInstance) return;

  const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  store.put(fileBlob, `offline_video_${key}`);

  transaction.oncomplete = () => {
    writeToConsole(`Success: Local asset saved to persistent database partition channel ${key}! Ready for completely offline execution loop.`, 'state');
    updateCacheStatusDisplay();
  };
}

export function loadOfflineCachedVideo(key, videoElement) {
  if (!dbInstance) return;

  const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(`offline_video_${key}`);

  request.onsuccess = (e) => {
    const fileBlob = e.target.result;
    if (fileBlob) {
      const blobUrl = URL.createObjectURL(fileBlob);
      videoElement.src = blobUrl;
      videoElement.load();
      videoElement.play().catch((err) => writeToConsole(`Offline boot halt note: ${err.message}`, 'warn'));
      writeToConsole(`Pipeline ${key}: Secured resource handle from local offline database cache cluster. Sourcing active stream...`, 'state');
    } else {
      writeToConsole(`Pipeline Bypassed: No offline cache file found for Channel ${key}. Please drag & drop an MP4 asset file down first.`, 'error');
    }
  };
}

function updateCacheStatusDisplay() {
  const statusPanel = document.getElementById('cacheStatusPanel');
  if (!statusPanel || !dbInstance) return;

  const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAllKeys();

  request.onsuccess = () => {
    const keys = request.result;
    statusPanel.textContent = keys.length > 0
      ? `Offline Database Active. Partitions Cached: [ ${keys.join(', ')} ]`
      : 'Offline Database Storage Active. Caching Shelf Empty.';
  };
}

export { DB_NAME, STORE_NAME };
