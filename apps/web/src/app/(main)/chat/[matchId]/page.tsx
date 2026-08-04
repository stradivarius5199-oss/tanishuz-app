import ChatScreen from '@/components/ChatScreen';

export default function ChatPage({ params }: { params: { matchId: string } }) {
  return <ChatScreen matchId={params.matchId} />;
}
