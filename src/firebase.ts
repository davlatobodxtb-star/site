/**
 * Инициализация Firebase SDK v10+ с использованием firebase-applet-config.json.
 * Экспортирует экземпляры app, auth (Аутентификация), db (Firestore) и storage (Хранилище файлов).
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Проверка наличия валидной конфигурации
export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== ''
);

// Предотвращение повторной инициализации
const app: FirebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(firebaseConfig);

// Экземпляры сервисов Firebase с оптимизированным IndexedDB кэшем для мгновенного отклика
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch {
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db: Firestore = dbInstance;
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

export { app };
export default app;
