'use client';

import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { MapPin, Info } from 'lucide-react';
import Avatar from './Avatar';

interface Candidate {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  city: string;
  bioRu?: string;
  goal: string;
  blurPhotos: boolean;
  photos: { url: string }[];
}

interface SwipeCardProps {
  candidate: Candidate;
  isFront: boolean;
  onSwipe: (userId: string, direction: 'left' | 'right' | 'up') => void;
}

export default function SwipeCard({ candidate, isFront, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Анимация вращения и прозрачности при свайпе
  const rotate = useTransform(x, [-300, 300], [-20, 20]);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 1, 1, 1, 0.5]
  );

  // Цветные оверлеи при свайпе
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const superLikeOpacity = useTransform(y, [-100, 0], [1, 0]);

  const [showBio, setShowBio] = useState(false);

  const calculateAge = (birthDate: string) => {
    const ageDifMs = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    
    // Свайп вправо (Лайк)
    if (info.offset.x > threshold) {
      animate(x, 500, { duration: 0.3 });
      setTimeout(() => onSwipe(candidate.userId, 'right'), 300);
    } 
    // Свайп влево (Дизлайк)
    else if (info.offset.x < -threshold) {
      animate(x, -500, { duration: 0.3 });
      setTimeout(() => onSwipe(candidate.userId, 'left'), 300);
    } 
    // Свайп вверх (Суперлайк)
    else if (info.offset.y < -threshold && Math.abs(info.offset.x) < 50) {
      animate(y, -500, { duration: 0.3 });
      setTimeout(() => onSwipe(candidate.userId, 'up'), 300);
    } 
    // Возврат на место
    else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 });
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 20 });
    }
  };

  const photoUrl = candidate.photos?.[0]?.url || 'https://via.placeholder.com/800x1000?text=No+Photo';
  const age = calculateAge(candidate.birthDate);

  const goalLabels: Record<string, string> = {
    MARRIAGE: 'Создание семьи',
    RELATIONSHIP: 'Отношения',
    FRIENDSHIP: 'Дружба'
  };

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        opacity,
      }}
      drag={isFront ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      className={`absolute w-full h-[65vh] max-h-[650px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing origin-bottom ${isFront ? 'z-20' : 'z-10 scale-95 opacity-80'}`}
    >
      {/* Photo with optional Blur for privacy */}
      <div className={`relative w-full h-full ${candidate.blurPhotos ? 'blur-md' : ''}`}>
        <Avatar src={candidate.photos?.[0]?.url} name={candidate.name} className="w-full h-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Swipe Indicators */}
      {isFront && (
        <>
          <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-10 z-30 pointer-events-none border-4 border-green-500 rounded-lg px-4 py-2 rotate-[-20deg]">
            <span className="text-4xl font-bold text-green-500 uppercase tracking-wider">Лайк</span>
          </motion.div>
          <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-10 z-30 pointer-events-none border-4 border-red-500 rounded-lg px-4 py-2 rotate-[20deg]">
            <span className="text-4xl font-bold text-red-500 uppercase tracking-wider">Нет</span>
          </motion.div>
          <motion.div style={{ opacity: superLikeOpacity }} className="absolute bottom-40 left-1/2 -translate-x-1/2 z-30 pointer-events-none border-4 border-blue-500 rounded-lg px-4 py-2">
            <span className="text-4xl font-bold text-blue-500 uppercase tracking-wider">Супер</span>
          </motion.div>
        </>
      )}

      {/* Info Section */}
      <div className="absolute bottom-0 left-0 w-full p-6 text-white pointer-events-none">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold">{candidate.name}</h2>
              <span className="text-2xl font-light">{age}</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-200 mt-1">
              <MapPin className="w-4 h-4" />
              <span>{candidate.city}</span>
            </div>
            
            <div className="mt-2 inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium">
              {goalLabels[candidate.goal] || candidate.goal}
            </div>

            <AnimatePresence>
              {showBio && candidate.bioRu && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 text-sm text-gray-200 line-clamp-3"
                >
                  {candidate.bioRu}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onPointerDown={(e) => {
              e.stopPropagation(); // Не перехватывать драг
              setShowBio(!showBio);
            }}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-white/30 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
