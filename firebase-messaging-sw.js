importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD8UJlf7N95PSfbWIFmKRkww-qduDcExp0",
  authDomain: "bharatanatyam-tracker.firebaseapp.com",
  projectId: "bharatanatyam-tracker",
  storageBucket: "bharatanatyam-tracker.firebasestorage.app",
  messagingSenderId: "596130424146",
  appId: "1:596130424146:web:548447703d6efc920a868b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  });
});
