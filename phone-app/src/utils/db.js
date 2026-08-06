// src/utils/db.js
// ==========================================
// 💾 饼干机核心数据库 (IndexedDB)
// ==========================================
const DB_NAME = "CherryPhoneDB";
let db;

export function initDB() {
    return new Promise((resolve, reject) => {
        // 版本号 8，包含了所有咱们设计的专属仓库
        const request = indexedDB.open(DB_NAME, 9);
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('api_profiles')) db.createObjectStore('api_profiles', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('app_settings')) db.createObjectStore('app_settings', { keyPath: 'key' });
            if (!db.objectStoreNames.contains('contacts_profiles')) db.createObjectStore('contacts_profiles', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('chat_history_db')) db.createObjectStore('chat_history_db', { keyPath: 'charId' });
            if (!db.objectStoreNames.contains('worldbook_db')) db.createObjectStore('worldbook_db', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('emoticons_db')) db.createObjectStore('emoticons_db', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('diary_db')) db.createObjectStore('diary_db', { keyPath: 'charId' });
            if (!db.objectStoreNames.contains('mail_db')) db.createObjectStore('mail_db', { keyPath: 'charId' });
               if (!db.objectStoreNames.contains('memory_db')) db.createObjectStore('memory_db', { keyPath: 'charId' });
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = (e) => reject(e);
    });
}

// 通用：保存设置数据
export async function saveSettingData(key, value) {
    if (!db) await initDB();
    const tx = db.transaction(['app_settings'], 'readwrite');
    tx.objectStore('app_settings').put({ key: key, value: value });
}

// 通用：读取设置数据
export async function getSettingValue(key) {
    if (!db) await initDB();
    return new Promise(res => {
        db.transaction(['app_settings'], 'readonly').objectStore('app_settings').get(key).onsuccess = e => res(e.target.result?.value ?? null);
    });
}