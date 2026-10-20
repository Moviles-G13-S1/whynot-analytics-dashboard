import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Public Firebase Web app identifiers, shared with the Flutter web configuration.
// These are not credentials. Firestore Security Rules enforce data access.
export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
const app = initializeApp({
  apiKey: 'AIzaSyC4xtLLJm8OCQjsstslGStVU8C-iAJdEoc',
  appId: '1:755619451989:web:e7b8ec9382ae96664830dc',
  messagingSenderId: '755619451989',
  projectId: useEmulators ? 'demo-whynot' : 'whynot-f4ae6',
  authDomain: 'whynot-f4ae6.firebaseapp.com',
  storageBucket: 'whynot-f4ae6.firebasestorage.app',
});

export const auth = getAuth(app);
export const db = getFirestore(app);
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
