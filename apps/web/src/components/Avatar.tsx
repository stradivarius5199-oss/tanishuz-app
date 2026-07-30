import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
}

export default function Avatar({ src, name = 'User', className = '' }: AvatarProps) {
  const [error, setError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  
  // Массив красивых градиентов для аватарок
  const gradients = [
    'from-pink-500 to-orange-400',
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-indigo-500',
    'from-green-400 to-emerald-600',
    'from-yellow-400 to-orange-500'
  ];
  
  // Выбираем градиент на основе кода первой буквы, чтобы для одного имени всегда был один цвет
  const colorIndex = name ? name.charCodeAt(0) % gradients.length : 0;
  const gradient = gradients[colorIndex];

  if (src && !error) {
    return (
      <img 
        src={src} 
        alt={name} 
        onError={() => setError(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-tr ${gradient} text-white font-bold ${className}`}>
      {initial}
    </div>
  );
}
