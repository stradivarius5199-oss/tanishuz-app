'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, User, MessageCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import SwipeCard from './SwipeCard';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Avatar from './Avatar';
import { useTranslation } from '@/lib/i18n';

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<any | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/profiles/discover');
      setCandidates(data.candidates);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (userId: string, direction: 'left' | 'right' | 'up') => {
    // Убираем верхнего кандидата из локального стейта
    setCandidates((prev) => prev.slice(1));

    if (direction === 'left') {
      // Дизлайк (NOPE)
      apiFetch(`/likes/${userId}`, { method: 'DELETE' }).catch(console.error);
    } else {
      // Лайк или Суперлайк
      try {
        const type = direction === 'up' ? 'SUPER_LIKE' : 'LIKE';
        const res = await apiFetch('/likes', {
          method: 'POST',
          body: JSON.stringify({ toUserId: userId, type }),
        });

        // Если случился МАТЧ!
        if (res.isMatch) {
          triggerConfetti();
          // Находим инфу о пользователе из старого стейта или из ответа
          setMatchData(res.match);
        }
      } catch (err) {
        console.error('Ошибка лайка:', err);
      }
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF2E93', '#FF8A00']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF2E93', '#FF8A00']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Top Logo only */}
      <header className="flex justify-center items-center p-4 z-10">
        <span className="text-2xl font-outfit font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
          Sparks
        </span>
      </header>

      {/* Main Swipe Area */}
      <main className="flex-1 relative flex items-center justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center text-pink-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Ищем интересных людей...</p>
          </div>
        ) : candidates.length > 0 ? (
          <div className="relative w-full max-w-sm h-[65vh] max-h-[650px]">
            {/* Отрисовываем только верхние 2 карточки для оптимизации DOM */}
            {candidates.slice(0, 2).reverse().map((candidate, i, arr) => (
              <SwipeCard 
                key={candidate.id}
                candidate={candidate}
                isFront={i === arr.length - 1} // Последний в массиве = верхний на экране
                onSwipe={handleSwipe}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl max-w-sm">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium mb-1">{t('discover.empty')}</p>
            <p className="text-sm text-gray-500">{t('discover.empty_sub')}</p>
            <button 
              onClick={loadCandidates}
              className="btn-primary w-full mt-6"
            >
              Искать снова
            </button>
          </div>
        )}
      </main>

      {/* Bottom Actions */}
      <footer className="p-6 flex justify-center gap-6 z-10 pb-10">
        <button 
          onClick={() => { if(candidates.length) handleSwipe(candidates[0].userId, 'left'); }}
          disabled={!candidates.length}
          className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all disabled:opacity-50"
        >
          <X className="w-8 h-8 stroke-[3]" />
        </button>
        <button 
          onClick={() => { if(candidates.length) handleSwipe(candidates[0].userId, 'up'); }}
          disabled={!candidates.length}
          className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:scale-110 transition-all mt-2 disabled:opacity-50"
        >
          <Star className="w-7 h-7 stroke-[2.5]" />
        </button>
        <button 
          onClick={() => { if(candidates.length) handleSwipe(candidates[0].userId, 'right'); }}
          disabled={!candidates.length}
          className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center text-green-500 hover:bg-green-50 hover:scale-110 transition-all disabled:opacity-50"
        >
          <Heart className="w-8 h-8 stroke-[3] fill-green-500" />
        </button>
      </footer>

      {/* Match Overlay */}
      <AnimatePresence>
        {matchData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.h2 
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="text-4xl font-black text-white italic tracking-wider mb-2 drop-shadow-lg"
            >
              {t('discover.its_match')}
            </motion.h2>
            <p className="text-white/90 font-medium mb-8">
              {t('discover.match_sub')}
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => router.push('/matches')}
                className="bg-white text-pink-500 px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform"
              >
                {t('discover.send_msg')}
              </button>
              <button 
                onClick={() => setMatchData(null)}
                className="bg-white/20 text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/30 transition-colors"
              >
                {t('discover.continue')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
