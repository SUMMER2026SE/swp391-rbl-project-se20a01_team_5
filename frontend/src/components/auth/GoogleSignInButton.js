"use client";

import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export default function GoogleSignInButton({ onCredential, onError, text = 'signin_with', disabled = false }) {
  const tokenClientRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const actionLabel = text === 'signup_with' ? 'Đăng ký bằng Google' : 'Đăng nhập bằng Google';

  useEffect(() => {
    if (!clientId) return undefined;

    const markReady = () => window.setTimeout(() => setIsReady(true), 0);
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existingScript) {
      if (window.google?.accounts?.oauth2) {
        markReady();
      } else {
        existingScript.addEventListener('load', markReady, { once: true });
      }
      return undefined;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = markReady;
    script.onerror = () => onError?.('Không thể tải Google Identity Services.');
    document.head.appendChild(script);

    return undefined;
  }, [clientId, onError]);

  useEffect(() => {
    if (!clientId || !isReady || !window.google?.accounts?.oauth2) return;

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: (response) => {
        setIsOpening(false);
        if (response?.access_token) {
          onCredential({ accessToken: response.access_token });
        } else {
          onError?.('Google không trả về token hợp lệ.');
        }
      },
      error_callback: () => {
        setIsOpening(false);
        onError?.('Không thể mở đăng nhập Google.');
      },
    });
  }, [clientId, isReady, onCredential, onError]);

  const handleClick = () => {
    if (!clientId) {
      onError?.('Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID cho frontend.');
      return;
    }
    if (!tokenClientRef.current) {
      onError?.('Google login chưa sẵn sàng, vui lòng thử lại.');
      return;
    }
    setIsOpening(true);
    tokenClientRef.current.requestAccessToken();
  };

  return (
    <button
      type="button"
      aria-label={actionLabel}
      onClick={handleClick}
      disabled={disabled || isOpening}
      className="h-12 w-full rounded-xl bg-brand-surface/50 border border-black/5 px-4 font-semibold text-sm hover:bg-white hover:border-brand-secondary/40 hover:shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <GoogleIcon />
      <span className="whitespace-nowrap leading-none">{isOpening ? 'Đang mở...' : 'Google'}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.43Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.34l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.81-1.76-5.6-4.13H3.07v2.59A9.99 9.99 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.97a6 6 0 0 1 0-3.94V7.44H3.07a9.99 9.99 0 0 0 0 9.12l3.33-2.59Z" />
      <path fill="#EA4335" d="M12 5.9c1.47 0 2.78.51 3.82 1.5l2.87-2.87C16.95 2.91 14.7 2 12 2a9.99 9.99 0 0 0-8.93 5.44l3.33 2.59C7.19 7.66 9.4 5.9 12 5.9Z" />
    </svg>
  );
}
