import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyDstmPUOdXNOnWGQsjJsS6_M11SZWUtTFQ',
  authDomain: 'snuxi-project.firebaseapp.com',
  projectId: 'snuxi-project',
  storageBucket: 'snuxi-project.firebasestorage.app',
  messagingSenderId: '1079228242208',
  appId: '1:1079228242208:web:9825696d3dbc91daf5df45',
  measurementId: 'G-1XE4QM9YGG',
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const messaging = getMessaging(app);
