'use client';

import React, { useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { LogIn, LogOut, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getBackendUrl } from '../../lib/config';

export const SignInButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [backendVerified, setBackendVerified] = useState<boolean | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          const backendUrl = getBackendUrl();
          const resp = await fetch(`${backendUrl}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken }),
          });
          if (resp.ok) {
            const data = await resp.json();
            setBackendVerified(Boolean(data.valid));
          }
        } catch (err) {
          console.warn('Background token verification notice:', err);
        }
      } else {
        setBackendVerified(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    if (!auth) {
      setErrorToast('Authentication is currently unavailable. Please check your configuration.');
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoading(true);
    setErrorToast(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const backendUrl = getBackendUrl();

      const resp = await fetch(`${backendUrl}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });

      if (resp.ok) {
        const verifyData = await resp.json();
        setBackendVerified(Boolean(verifyData.valid));
      } else {
        console.warn('Backend verification returned non-200 code');
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      // Don't show popup closed by user as an alert
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorToast(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
      setBackendVerified(null);
    } catch (err: any) {
      setErrorToast(err?.message || 'Failed to sign out');
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {user ? (
        <div className="dashboard-control flex items-center gap-2 rounded-md border border-border-subtle bg-surface-1/60 shadow-sm">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-5 h-5 rounded-full ring-1 ring-accent-cyan/50"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-cyan-600 text-[10px] font-bold text-white flex items-center justify-center">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <div className="flex items-center gap-1.5 max-w-[120px] sm:max-w-[160px]">
            <span
              className="text-xs font-medium text-text-primary truncate"
              title={user.email || user.displayName || 'User'}
            >
              {user.email || user.displayName}
            </span>
            {backendVerified && (
              <span title="Verified with Backend Token Validator">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </span>
            )}
          </div>

          <button
            onClick={handleSignOut}
            title="Sign out"
            className="dashboard-icon-control ml-1 inline-flex items-center justify-center rounded text-text-tertiary transition-colors hover:bg-white/5 hover:text-red-400"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="dashboard-control flex items-center gap-2 rounded-md border border-border-subtle bg-surface-1/60 font-medium text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary disabled:opacity-50"
          title="Sign in with Google"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="hidden sm:inline">Sign in</span>
        </button>
      )}

      {/* Error Notification Toast */}
      {errorToast && (
        <div className="absolute top-full right-0 mt-2 w-64 p-2.5 bg-red-950/90 border border-red-500/50 rounded-lg text-[11px] text-red-200 flex items-start gap-2 shadow-xl z-50 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorToast}</div>
          <button
            onClick={() => setErrorToast(null)}
            className="text-red-400 hover:text-red-200 text-xs font-bold px-1"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
