import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDmS0Y4KmovxzQCYCmGdKRv-in3d0kcI-E",
    authDomain: "projecthelpti.firebaseapp.com",
    projectId: "projecthelpti",
    storageBucket: "projecthelpti.appspot.com",
    messagingSenderId: "987449578842",
    appId: "1:987449578842:web:b1e11a7e97b5af905b8f63"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
