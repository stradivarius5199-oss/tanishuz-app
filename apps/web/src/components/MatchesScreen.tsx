'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, ChevronLeft, Crown } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import Avatar from './Avatar';
import { useTranslation } from '@/lib/i18n';

export default function MatchesScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await apiFetch('/matches');
      setMatches(data.matches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">{t('matches.title')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-yellow-500/20 text-white cursor-pointer hover:scale-[1.02] transition-transform">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5" />
                <h3 className="font-bold">Tanishuz Premium</h3>
              </div>
              <p className="text-sm opacity-90">{t('matches.vip')}</p>
            </div>
            <button className="bg-white text-yellow-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm" onClick={() => alert('VIP Features coming soon!')}>
              {t('matches.vip_btn')}
            </button>
          </div>
        </div>

        <section className="py-4">
          <h2 className="px-4 text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t('matches.new')}</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-4">
            {matches.filter(m => !m.lastMessage).length > 0 ? (
              matches.filter(m => !m.lastMessage).map(match => (
                <button 
                  key={match.matchId}
                  onClick={() => router.push(`/chat/${match.matchId}`)}
                  className="flex flex-col items-center gap-2 min-w-[80px]"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-500 p-0.5">
                    <Avatar 
                      src={match.partner.profile.photos[0]?.url} 
                      name={match.partner.profile.name}
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  <span className="text-xs font-medium truncate w-full text-center">{match.partner.profile.name}</span>
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-500 w-full p-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                {t('matches.no_new')}
              </div>
            )}
          </div>
        </section>

        <section className="mt-2">
          <h2 className="px-4 text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{t('matches.chats')}</h2>
          
          {matches.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p>{t('matches.no_chats')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {matches.filter(m => m.lastMessage).map(match => (
                <button 
                  key={match.matchId}
                  onClick={() => router.push(`/chat/${match.matchId}`)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden">
                      <Avatar 
                        src={match.partner.profile.photos[0]?.url} 
                        name={match.partner.profile.name}
                        className="w-full h-full"
                      />
                    </div>
                    {!match.isSeen && (
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-pink-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{match.partner.profile.name}</h3>
                      <span className="text-xs text-gray-500 shrink-0 ml-2">
                        {new Date(match.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${!match.isSeen ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                      {match.lastMessage.text}
                    </p>
                  </div>
                </button>
              ))}
              
              {matches.filter(m => m.lastMessage).length === 0 && (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm">{t('matches.no_chats')}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
