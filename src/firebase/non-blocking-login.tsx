'use client';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';

export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider);
}

export function initiateAppleSignIn(authInstance: Auth): void {
  const provider = new OAuthProvider('apple.com');
  signInWithPopup(authInstance, provider);
}
