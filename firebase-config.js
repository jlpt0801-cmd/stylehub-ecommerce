// Configuración de Firebase (usa tus datos reales)
const firebaseConfig = {
  apiKey: "AIzaSyBdrj1QHs34xVJcU3QgDrcw2WMmCHggjRw",
  authDomain: "stylehub-pagos.firebaseapp.com",
  projectId: "stylehub-pagos",
  storageBucket: "stylehub-pagos.appspot.com",
  messagingSenderId: "692596341152",
  appId: "1:692596341152:web:ba3386ece6a6ab7fde8cc5"
};

// Inicialización segura
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();