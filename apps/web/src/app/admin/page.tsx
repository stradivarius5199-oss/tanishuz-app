'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const statsData = await apiFetch('/admin/stats');
        const usersData = await apiFetch('/admin/users');
        setStats(statsData);
        setUsers(usersData.users);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки данных');
        if (err.message.includes('Доступ запрещен') || err.message.includes('403')) {
           router.push('/');
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleBan = async (userId: string) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/ban`, { method: 'POST' });
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: res.user.isBanned } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center shadow-lg backdrop-blur-md">
        <h2 className="text-xl font-bold mb-2">Отказано в доступе</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Обзор платформы</h2>
        <p className="text-slate-400">Статистика и управление пользователями</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Всего пользователей" value={stats.totalUsers} icon="👥" color="from-blue-500 to-cyan-400" />
        <StatCard title="Мэтчи" value={stats.totalMatches} icon="💖" color="from-pink-500 to-rose-400" />
        <StatCard title="Сообщения" value={stats.totalMessages} icon="💬" color="from-purple-500 to-indigo-400" />
        <StatCard title="Фотографии" value={stats.totalPhotos} icon="📸" color="from-orange-500 to-amber-400" />
        <StatCard title="Лайки" value={stats.totalLikes} icon="👍" color="from-emerald-500 to-teal-400" />
        <StatCard title="Заблокированы" value={stats.bannedUsers} icon="🚫" color="from-red-500 to-rose-600" />
        <StatCard title="Мужчины" value={stats.maleProfiles} icon="👨" color="from-slate-600 to-slate-500" />
        <StatCard title="Женщины" value={stats.femaleProfiles} icon="👩" color="from-slate-600 to-slate-500" />
      </div>

      {/* Users Table */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <h3 className="text-xl font-bold text-white">Пользователи</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Имя</th>
                <th className="px-6 py-4 font-medium">Город</th>
                <th className="px-6 py-4 font-medium">Роль</th>
                <th className="px-6 py-4 font-medium">Статус</th>
                <th className="px-6 py-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-300 font-medium">{user.email}</td>
                  <td className="px-6 py-4 text-slate-400">{user.profile?.name || '—'}</td>
                  <td className="px-6 py-4 text-slate-400">{user.profile?.city || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isBanned ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {user.isBanned ? 'Заблокирован' : 'Активен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleBan(user.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${
                          user.isBanned 
                            ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                            : 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20'
                        }`}
                      >
                        {user.isBanned ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Нет пользователей
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${color} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}
