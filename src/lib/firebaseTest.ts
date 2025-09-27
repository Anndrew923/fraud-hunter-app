// Firebase 連線測試工具
import { db, auth } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// 測試 Firestore 連線
export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    console.log('🔥 測試 Firestore 連線...');
    
    // 嘗試讀取測試集合
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    console.log('✅ Firestore 連線成功！');
    console.log(`📊 找到 ${snapshot.size} 個測試文件`);
    
    return true;
  } catch (error) {
    console.error('❌ Firestore 連線失敗：', error);
    return false;
  }
};

// 測試 Firebase Auth 連線
export const testAuthConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      console.log('🔐 測試 Firebase Auth 連線...');
      
      // 監聽認證狀態變化
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('✅ Firebase Auth 連線成功！');
          console.log(`👤 用戶 ID: ${user.uid}`);
        } else {
          console.log('ℹ️ 未登入狀態（正常）');
        }
        unsubscribe();
        resolve(true);
      });
      
      // 5秒後超時
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Firebase Auth 連線失敗：', error);
      resolve(false);
    }
  });
};

// 測試匿名登入
export const testAnonymousLogin = async (): Promise<boolean> => {
  try {
    console.log('🔓 測試匿名登入...');
    
    const userCredential = await signInAnonymously(auth);
    console.log('✅ 匿名登入成功！');
    console.log(`👤 匿名用戶 ID: ${userCredential.user.uid}`);
    
    return true;
  } catch (error) {
    console.error('❌ 匿名登入失敗：', error);
    return false;
  }
};

// 建立測試資料
export const createTestData = async (): Promise<boolean> => {
  try {
    console.log('📝 建立測試資料...');
    
    const testData = {
      message: 'Hello Firebase!',
      timestamp: new Date(),
      app: '詐騙獵人',
      version: '1.0.0'
    };
    
    const docRef = await addDoc(collection(db, 'test'), testData);
    console.log('✅ 測試資料建立成功！');
    console.log(`📄 文件 ID: ${docRef.id}`);
    
    return true;
  } catch (error) {
    console.error('❌ 建立測試資料失敗：', error);
    return false;
  }
};

// 完整測試
export const runFullFirebaseTest = async (): Promise<void> => {
  console.log('🚀 開始 Firebase 完整測試...\n');
  
  const results = {
    firestore: await testFirestoreConnection(),
    auth: await testAuthConnection(),
    anonymousLogin: false, // 暫時跳過匿名登入測試
    testData: false
  };
  
  // 如果 Firestore 連線成功，嘗試建立測試資料
  if (results.firestore) {
    results.testData = await createTestData();
  }
  
  console.log('\n📊 測試結果：');
  console.log(`Firestore: ${results.firestore ? '✅' : '❌'}`);
  console.log(`Auth: ${results.auth ? '✅' : '❌'}`);
  console.log(`匿名登入: ${results.anonymousLogin ? '✅' : '❌'} (已跳過)`);
  console.log(`測試資料: ${results.testData ? '✅' : '❌'}`);
  
  const coreServicesPassed = results.firestore && results.auth;
  
  if (coreServicesPassed) {
    console.log('\n🎉 核心服務測試通過！Firebase 設定完成！');
    console.log('💡 提示：如需匿名登入功能，請在 Firebase Console 中啟用');
  } else {
    console.log('\n⚠️ 核心服務測試失敗，請檢查 Firebase 設定');
  }
};
