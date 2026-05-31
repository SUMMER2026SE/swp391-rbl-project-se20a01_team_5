"use client";

import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export default function GoogleSignInButton({ onCredential, onError, text = 'signin_with' }) {
  const buttonRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existingScript) {
      if (window.google?.accounts?.id) {
        window.setTimeout(() => setIsReady(true), 0);
      } else {
        existingScript.addEventListener('load', () => setIsReady(true), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsReady(true);
    script.onerror = () => onError?.('Không thể tải Google Identity Services.');
    document.head.appendChild(script);
  }, [clientId, onError]);

  useEffect(() => {
    if (!clientId || !isReady || !buttonRef.current || !window.google?.accounts?.id) return;

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          onCredential(response.credential);
        } else {
          onError?.('Google không trả về credential hợp lệ.');
        }
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text,
      width: 240,
    });
  }, [clientId, isReady, onCredential, onError, text]);

  if (!clientId) {
    return (
      <button
        type="button"
        onClick={() => onError?.('Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID cho frontend.')}
        className="w-full py-3 rounded-xl bg-brand-surface/50 border border-black/5 font-semibold text-sm hover:bg-black/5 transition-colors"
      >
        Google
      </button>
    );
  }

  return (
    <div className="w-full min-h-[44px] rounded-xl bg-brand-surface/50 border border-black/5 flex items-center justify-center overflow-hidden">
      <div ref={buttonRef} />
    </div>
  );
}
