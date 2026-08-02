'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error || !code) {
      router.push('/?error=google_auth_failed');
      return;
    }

    // Отправляем authorization code на сервер
    apiFetch('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, redirectUri: window.location.origin + '/auth/google/callback' }),
    })
      .then((data) => {
        login(data.accessToken, data.refreshToken, data.user);
        if (!data.user.profile?.isComplete) {
          router.push('/onboarding');
        } else {
          router.push('/discover');
        }
      })
      .catch(() => {
        router.push('/?error=google_auth_failed');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-medium">Входим через Google...</p>
      </div>
    </div>
  );
}
