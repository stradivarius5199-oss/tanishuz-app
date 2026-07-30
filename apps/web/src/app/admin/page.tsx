'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Ban, CheckCircle, ChevronLeft, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Avatar from '@/components/Avatar';

export default function AdminScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.isAdmin) {
      // Исключительно для MVP, пускаем только админа
      router.replace('/');
    } else {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/stats')
      ]);
      setUsers(usersData.users || []);
      setStats(statsData || null);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (id: string, isBanned: boolean) => {
    if (!confirm(`Вы уверены, что хотите ${isBanned ? 'разбанить' : 'забанить'} этого пользователя?`)) return;
    try {
      await apiFetch(`/admin/users/${id}/ban`, { method: 'POST' });
      setUsers(users.map(u => u.id === id ? { ...u, isBanned: !u.isBanned } : u));
    } catch (err: any) {
      alert(err.message || 'Ошибка при бане');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/')} className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:scale-105 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-pink-500" />
            Админ Панель
          </h1>
          <p className="text-sm text-gray-500">Управление пользователями</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6">
          {error}
        </div>
      )}

      {/* STATS DASHBOARD */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalUsers}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Всего Юзеров</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-pink-500 mb-1">{stats.totalMatches}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Матчей</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-blue-500 mb-1">{stats.totalMessages}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Сообщений</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-red-500 mb-1">{stats.bannedUsers}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Забанено</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Поиск по имени или email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Профиль</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4">Город</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Загрузка...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Пользователи не найдены</td>
                </tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <Avatar name={u.profile?.name || '?'} className="w-full h-full" />
                      </div>
                      <div className="font-semibold">{u.profile?.name || 'Нет профиля'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.email || '-'}</td>
                  <td className="px-6 py-4">
                    {u.isBanned ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                        <Ban className="w-3.5 h-3.5" /> Забанен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Активен
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.profile?.city || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleBan(u.id, u.isBanned)}
                      className={`px-4 py-2 rounded-xl font-semibold text-xs transition-colors ${
                        u.isBanned ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                    >
                      {u.isBanned ? 'Разбанить' : 'Забанить'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
