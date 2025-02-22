
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBkkFF0XhNZeWuDmOfEhsgdfX1VBG7WTas",
  authDomain: "biteology-app.firebaseapp.com",
  projectId: "biteology-app",
  storageBucket: "biteology-app.appspot.com",
  messagingSenderId: "170427653176",
  appId: "1:170427653176:web:b2e2909f3ce3b856c8a355"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
