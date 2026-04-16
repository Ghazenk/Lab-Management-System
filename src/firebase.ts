import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, getDocFromServer, serverTimestamp } from 'firebase/firestore';

// NOTE: In a real production app, these values would be in firebase-applet-config.json
// If the file is missing or contains placeholders, we'll log a clear instruction.
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY", 
  authDomain: "helix-lab-os.firebaseapp.com",
  projectId: "helix-lab-os",
  storageBucket: "helix-lab-os.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:000000000000"
};

let app;
let auth: any;
let db: any;

try {
  // Check if config is still placeholders
  if (firebaseConfig.apiKey.startsWith("REPLACE")) {
    console.warn("Firebase is not yet configured. Please provide your API keys in src/firebase.ts or ensure set_up_firebase completed successfully.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("REPLACE");

export { auth, db };
export const googleProvider = new GoogleAuthProvider();

// Error Handling Helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection Test
export async function testConnection() {
  // Don't test if we know the config is invalid
  if (firebaseConfig.apiKey.startsWith("REPLACE")) {
    return;
  }
  
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}

export async function seedInitialData() {
  try {
    const samplesRef = collection(db, 'samples');
    const subjectsRef = collection(db, 'subjects');

    const sampleData = [
      { patientName: 'Subject 44-B', testType: 'PCR Sequences', priority: 'High', status: 'Processing', collectedAt: serverTimestamp() },
      { patientName: 'Subject 12-Z', testType: 'Cytology Screen', priority: 'Medium', status: 'Received', collectedAt: serverTimestamp() },
    ];

    const subjectData = [
      { name: 'Julian Thorne', age: 42, gender: 'Male', lastVisit: serverTimestamp() },
      { name: 'Elena Vance', age: 29, gender: 'Female', lastVisit: serverTimestamp() },
    ];

    for (const s of sampleData) await addDoc(samplesRef, s);
    for (const sub of subjectData) await addDoc(subjectsRef, sub);

    alert("Laboratory Database Seeded Successfully.");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}
