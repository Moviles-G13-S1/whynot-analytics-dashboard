import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Public Firebase Web app identifiers, shared with the Flutter web configuration.
// These are not credentials. Authorization is enforced inside the callable function.
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
const functions = getFunctions(app, 'us-central1');
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
export const getAdminAnalytics = httpsCallable(functions, 'get_admin_analytics');
