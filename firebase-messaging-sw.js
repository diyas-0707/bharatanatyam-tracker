cat << 'EOF'
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyExample", // will fill from your config
  authDomain: "bharatanatyam-tracker.firebaseapp.com",
  projectId: "bharatanatyam-tracker",
  storageBucket: "bharatanatyam-tracker.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  });
});
EOF
echo "done"
Output

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyExample", // will fill from your config
  authDomain: "bharatanatyam-tracker.firebaseapp.com",
  projectId: "bharatanatyam-tracker",
  storageBucket: "bharatanatyam-tracker.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data
  });
});
done
