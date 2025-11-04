
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { initiateGoogleSignIn, initiateAppleSignIn } from "@/firebase/non-blocking-login";
import { Logo } from "@/components/icons/logo";

export default function LoginPage() {
  const { auth, user, isUserLoading } = useFirebase();

  const handleGoogleSignIn = () => {
    if (auth) {
      initiateGoogleSignIn(auth);
    }
  };

  const handleAppleSignIn = () => {
    if (auth) {
      initiateAppleSignIn(auth);
    }
  };
  
  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-2xl font-bold">Carregando...</div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo className="w-12 h-12 text-primary" />
            </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo ao BeautyFlow</CardTitle>
          <CardDescription>
            Entre com sua conta para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" onClick={handleGoogleSignIn}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" role="img" aria-label="Google logo">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.02C43.51 39.52 47 32.55 47 24.55z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6.02c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Entrar com Google
          </Button>
          <Button variant="outline" onClick={handleAppleSignIn}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 16 16" role="img" aria-label="Apple logo">
                <path d="M8.02.32c-1.95 0-3.35.94-4.66 2.76C2.25 4.54.5 9.2.5 9.2s-.08 1.95.7 3.32c.75 1.32 1.83 2.18 3.14 2.18s2.1-.8 3.63-2.15c1.45-1.25 2.14-2.15 3.56-2.15s2.34.8 3.03 2.15c1.45 1.35 2.65 2.15 4.08 2.15.75 0 2.22-1.2 2.22-3.84s-2.03-4.5-3.3-5.74c-1.28-1.2-2.9-2-4.5-2-.6 0-1.6.2-2.8.6-.08 0-1.4-.95-1.4-1.12 0-1.42 1.3-2.2 2.1-2.2.16 0 .32.02.48.06.16.03.32.05.48.06.13-.4.26-.8.4-1.2C10.74.83 9.42.32 8.02.32Zm1.65 9.77c-.1.65.23 1.63.88 2.45.65.82 1.52 1.55 2.6 1.55.15 0 .3-.02.44-.06.15-.04.3-.1.44-.18-.8-.4-1.44-1.04-1.9-1.84s-.7-1.78-.7-2.45c0-.6.2-1.3.65-2.03.45-.73 1.1-1.3 1.84-1.7.13.4.25.8.36 1.2.1.4.18.8.25 1.2-1.2.5-2.2 1.4-2.9 2.5-.3.45-.6.9-.9 1.3Z" fill="currentColor"></path>
            </svg>
            Entrar com Apple
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
