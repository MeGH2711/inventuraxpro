// context/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // SESSION TIMER LOGIC
                const loginTime = localStorage.getItem("login_timestamp");
                const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 172,800,000 ms

                if (loginTime && (Date.now() - parseInt(loginTime) > TWO_DAYS_MS)) {
                    // Session expired
                    handleLogout();
                    setUser(null);
                } else {
                    setUser(currentUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loginWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        return signInWithPopup(auth, provider);
    };

    const handleLogout = () => {
        localStorage.removeItem("login_timestamp"); // Clear timer
        return signOut(auth);
    };

    const value = {
        user,
        loginWithGoogle,
        logout: handleLogout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);