'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Send, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useSocket } from './SocketProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Avatar from './Avatar';
import { useTranslation } from '@/lib/i18n';

export default function ChatScreen({ matchId }: { matchId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  const [sending, setSending] = useState(false);
  
  const { socket, isConnected } = useSocket();
  const { user } = useAuthStore();
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadHistory();
  }, [matchId]);

  useEffect(() => {
    if (socket && isConnected) {
      const handleNewMessage = (data: any) => {
        if (data.matchId === matchId) {
          setMessages(prev => [...prev, data.message]);
        }
      };

      socket.on('new_message', handleNewMessage);
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket, isConnected, matchId]);

  useEffect(() => {
    // Автоскролл вниз при новых сообщениях
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const data = await apiFetch(`/matches/${matchId}/messages`);
      setMessages(data.messages);
      
      if (data.messages.length > 0) {
        const otherUser = data.messages.find((m:any) => m.senderId !== user?.id)?.sender;
        if (otherUser) setPartner(otherUser);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const currentText = text.trim();
    setText('');

    try {
      setSending(true);
      const data = await apiFetch(`/matches/${matchId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: currentText })
      });
      setMessages(prev => [...prev, data.message]);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => router.push('/matches')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Avatar 
              src={partner?.profile?.photos?.[0]?.url} 
              name={partner?.profile?.name} 
              className="w-full h-full" 
            />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white leading-tight">
              {partner?.profile?.name || t('common.loading')}
            </h2>
            <span className="text-xs text-green-500 font-medium">Онлайн</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 my-8">
                <p>{t('discover.its_match')}</p>
                <p className="text-sm mt-1">{t('discover.send_msg')}!</p>
              </div>
            )}
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id;
              const showTime = idx === 0 || new Date(msg.createdAt).getTime() - new Date(messages[idx-1].createdAt).getTime() > 5 * 60 * 1000;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showTime && (
                    <span className="text-[11px] text-gray-400 mb-2 mt-4 self-center font-medium">
                      {format(new Date(msg.createdAt), 'd MMM, HH:mm', { locale: ru })}
                    </span>
                  )}
                  <div 
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                      isMe 
                        ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-br-sm shadow-sm shadow-pink-500/20' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {format(new Date(msg.createdAt), 'HH:mm')} {isMe && (msg.readAt ? '✓✓' : '✓')}
                  </span>
                </div>
              );
            })}
          </>
        )}
        <div ref={endRef} />
      </main>

      {/* Input */}
      <footer className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-shadow"
          />
          <button 
            type="submit"
            disabled={!text.trim() || sending}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-pink-500/20 transition-transform active:scale-95"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </footer>
    </div>
  );
}
