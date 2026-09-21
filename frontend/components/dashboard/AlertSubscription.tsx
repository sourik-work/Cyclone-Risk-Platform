'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from '../../lib/firebase';

interface AlertSubscriptionProps {
  currentState?: string;
}

export const AlertSubscription: React.FC<AlertSubscriptionProps> = ({
  currentState = 'Odisha',
}) => {
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for saved subscription state for this state
    try {
      const saved = localStorage.getItem(`fcm_sub_${currentState.toLowerCase().replace(/\s+/g, '_')}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSubscribed(Boolean(parsed.active));
        setSubscriptionId(parsed.subscriptionId || null);
      } else {
        setSubscribed(false);
        setSubscriptionId(null);
      }
    } catch {
      // ignore storage errors
    }
  }, [currentState]);

  const handleToggle = async () => {
    setErrorMsg(null);

    if (subscribed) {
      // Toggle off
      setSubscribed(false);
      setSubscriptionId(null);
      try {
        localStorage.removeItem(`fcm_sub_${currentState.toLowerCase().replace(/\s+/g, '_')}`);
      } catch {}
      return;
    }

    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setErrorMsg('Web notifications are not supported in this browser.');
      return;
    }

    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted by browser.');
      }

      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        throw new Error('FCM Web Messaging is not supported or initialized.');
      }

      const vapidKey =
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
        'BLGoWzZEHMA9waWNbXuxeej1tk2odYAEX95YYFNSYtZkzn-TkbikpRPOVQGjINNQ8GCy8_x6DKXtaAQPQHQ0fmc';

      let token = '';
      try {
        token = await getToken(messaging, { vapidKey });
      } catch (tokenErr: any) {
        console.warn('Direct getToken notice, attempting with service worker registration:', tokenErr);
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
        } else {
          throw tokenErr;
        }
      }

      if (!token) {
        throw new Error('Failed to retrieve FCM device token.');
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const resp = await fetch(`${backendUrl}/api/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcm_token: token,
          state: currentState,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned error (${resp.status})`);
      }

      const data = await resp.json();
      setSubscribed(true);
      setSubscriptionId(data.subscription_id || null);

      try {
        localStorage.setItem(
          `fcm_sub_${currentState.toLowerCase().replace(/\s+/g, '_')}`,
          JSON.stringify({ active: true, subscriptionId: data.subscription_id, token })
        );
      } catch {}
    } catch (err: any) {
      console.error('Alert subscription failed:', err);
      setErrorMsg(err.message || 'Failed to subscribe to alerts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="fcm-alert-subscription-card"
      className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              subscribed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {subscribed ? <BellRing className="w-4 h-4 animate-pulse" /> : <Bell className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-200 tracking-wide">
              EMERGENCY PUSH ALERTS
            </h4>
            <p className="text-[11px] text-slate-400">Direct FCM web notifications</p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50 ${
            subscribed
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
          }`}
          title={subscribed ? 'Click to unsubscribe' : `Subscribe to ${currentState} alerts`}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Registering...</span>
            </>
          ) : subscribed ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Subscribed</span>
            </>
          ) : (
            <span>Subscribe</span>
          )}
        </button>
      </div>

      {/* Subscribed Badge & Status */}
      {subscribed && (
        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-[11px] font-medium text-emerald-300">
              Subscribed to <strong className="font-semibold">{currentState}</strong> alerts
            </span>
          </div>
          {subscriptionId && (
            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              ID: {subscriptionId.slice(0, 8)}
            </span>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-2 rounded-lg bg-red-950/70 border border-red-500/40 flex items-start gap-1.5 text-[11px] text-red-300">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
