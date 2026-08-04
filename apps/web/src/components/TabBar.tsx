'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Flame, Grid, Heart, MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { id: 'discover', path: '/discover', icon: Flame },
    { id: 'explore', path: '/explore', icon: Grid },
    { id: 'likes', path: '/likes', icon: Heart },
    { id: 'matches', path: '/matches', icon: MessageCircle },
    { id: 'profile', path: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 w-full z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent backdrop-blur-sm pointer-events-none">
      <div className="flex justify-between items-center bg-gray-900/90 rounded-full px-6 py-3 shadow-2xl border border-gray-800/50 pointer-events-auto">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.path);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className="relative p-2 flex flex-col items-center justify-center transition-transform active:scale-90"
            >
              <Icon 
                className={`w-7 h-7 transition-colors duration-300 ${isActive ? 'text-pink-500 fill-pink-500/20' : 'text-gray-400 hover:text-gray-200'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-1 w-1 h-1 rounded-full bg-pink-500"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
