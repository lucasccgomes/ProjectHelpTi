importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDmS0Y4KmovxzQCYCmGdKRv-in3d0kcI-E",
  authDomain: "projecthelpti.firebaseapp.com",
  projectId: "projecthelpti",
  storageBucket: "projecthelpti.appspot.com",
  messagingSenderId: "987449578842",
  appId: "1:987449578842:web:b1e11a7e97b5af905b8f63"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Recebido mensagem em background ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon/android-launchericon-144-144.png'
  };

  self.registration.getNotifications().then(notifications => {
    let alreadyShown = notifications.some(notification => notification.title === notificationTitle);
    if (!alreadyShown) {
      self.registration.showNotification(notificationTitle, notificationOptions);
    }
  });
});
