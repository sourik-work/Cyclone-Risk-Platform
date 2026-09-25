importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
 apiKey: "AIzaSyD-jnp80ZnWR4A8VOBSScOAbgnDqqSQgXQ",
  authDomain: "cyclone-risk-platform.firebaseapp.com",
  projectId: "cyclone-risk-platform",
  storageBucket: "cyclone-risk-platform.firebasestorage.app",
  messagingSenderId: "294356082247",
  appId: "1:294356082247:web:a802a5addd0970dce09b62"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  var notificationTitle = (payload.notification && payload.notification.title) || 'Cyclone Warning Division Alert';
  var notificationOptions = {
    body: (payload.notification && payload.notification.body) || 'Urgent cyclone warning alert issued.',
    icon: '/globe.svg'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
