import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCby5WCd4eWkLkefBEzkuor5CY16oa5-qg",
    authDomain: "inventuraxpro.firebaseapp.com",
    projectId: "inventuraxpro",
    storageBucket: "inventuraxpro.firebasestorage.app",
    messagingSenderId: "348243188370",
    appId: "1:348243188370:web:d6c0bf47e61db2684d244b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);