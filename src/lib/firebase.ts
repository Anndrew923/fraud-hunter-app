import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBaqSKULWdxVamJqyFQ8WMjKg1FxwgitYM",
  authDomain: "fraud-hunter-app-99eb3.firebaseapp.com",
  projectId: "fraud-hunter-app-99eb3",
  storageBucket: "fraud-hunter-app-99eb3.firebasestorage.app",
  messagingSenderId: "205176654815",
  appId: "1:205176654815:web:9889103a77aaf5fc46d26a",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firebase 服務
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
