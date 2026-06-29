import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

  // Sync / Create user in Firestore
  const syncUserInFirestore = async (firebaseUser: User, additionalName: string | null = null) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || additionalName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "User"),
          createdAt: new Date().toISOString(),
          analysisHistory: []
        };
        await setDoc(userRef, userData);
        console.log("Created new user document in Firestore.");
      }
    } catch (error) {
      console.error("Error syncing user document to Firestore:", error);
    }
  };

  // Sign up with Email/Password
  const signUp = async (email: string, password: string, fullName: string): Promise<User> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name in Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
      // Sync to Firestore
      await syncUserInFirestore(userCredential.user, fullName);
      return userCredential.user;
    } finally {
      setLoading(false);
    }
  };

  // Login with Email/Password
  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserInFirestore(userCredential.user);
      return userCredential.user;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<User> => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await syncUserInFirestore(userCredential.user);
      return userCredential.user;
    } finally {
      setLoading(false);
    }
  };

  // Send Password Reset Email
  const forgotPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  // Logout
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Listen to Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userToken = await firebaseUser.getIdToken(true); // force refresh
          setToken(userToken);
        } catch (tErr) {
          console.error("Error retrieving user auth token:", tErr);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    loading,
    signUp,
    login,
    loginWithGoogle,
    forgotPassword,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth hook must be used inside an AuthProvider component.");
  }
  return context;
};
