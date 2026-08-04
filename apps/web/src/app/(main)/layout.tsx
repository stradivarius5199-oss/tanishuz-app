import TabBar from '@/components/TabBar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden">
      {/* 
        Контент страниц (discover, matches, profile и т.д.) 
        pb-24 нужно чтобы нижний контент не перекрывался TabBar-ом 
      */}
      <div className="flex-1 overflow-y-auto pb-24">
        {children}
      </div>

      <TabBar />
    </div>
  );
}
