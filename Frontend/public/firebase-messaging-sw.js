// Frontend/public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCK2AFHj7colqDJI6sSphmmd3yQjsYLpGw",
  authDomain: "mycalo-ai.firebaseapp.com",
  projectId: "mycalo-ai",
  storageBucket: "mycalo-ai.firebasestorage.app",
  messagingSenderId: "240647685816",
  appId: "1:240647685816:web:c43fd02558b4ab9cd4d64d",
  measurementId: "G-YT8C2MC0DC"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title || 'MyCalo AI';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.webp', 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});