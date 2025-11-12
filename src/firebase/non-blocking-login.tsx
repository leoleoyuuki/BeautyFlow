'use client';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider);
}
