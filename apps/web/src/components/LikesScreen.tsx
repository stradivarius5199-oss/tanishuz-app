'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Heart, Sparkles, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LikesScreen() {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false); // Mock for now

  useEffect(() => {
    loadLikes();
  }, []);

  const loadLikes = async () => {
    try {
      const data = await apiFetch('/likes/received');
      setLikes(data.likes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <h1 className="text-2xl font-bold font-outfit">Лайки</h1>
        <p className="text-gray-500 text-sm mt-1">Эти люди оценили вас</p>
      </div>

      {/* Premium Banner */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-pink-500 to-orange-400 rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles className="w-24 h-24" />
          </div>
          <h2 className="text-xl font-bold mb-2">Tanishuz Premium</h2>
          <p className="text-white/90 text-sm mb-4">Узнайте, кому вы понравились, и создавайте пары моментально!</p>
          <button 
            onClick={() => setIsPremium(true)}
            className="bg-white text-pink-500 font-bold py-3 px-6 rounded-full w-full shadow-lg hover:scale-105 transition-transform"
          >
            Подключить Premium
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          </div>
        ) : likes.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {likes.map((like, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={like.userId} 
                className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800"
              >
                {/* Photo */}
                <div 
                  className={`w-full h-full bg-cover bg-center transition-all duration-500 ${!isPremium ? 'blur-xl scale-110 brightness-75' : ''}`}
                  style={{ backgroundImage: `url(${like.photoUrl || 'https://via.placeholder.com/300?text=Photo'})` }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Content */}
                {isPremium ? (
                  <div className="absolute bottom-0 left-0 p-3 text-white">
                    <p className="font-bold">{like.name}</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center z-10">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                      <Lock className="w-6 h-6" />
                    </div>
                  </div>
                )}

                {/* Badge if SUPER LIKE */}
                {like.type === 'SUPER_LIKE' && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" />
                    Супер
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Heart className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium">Пока нет новых лайков</p>
          </div>
        )}
      </div>
    </div>
  );
}
