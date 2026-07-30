'use client';

import { ReactNode } from 'react';
import { SocketProvider } from './SocketProvider';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
}
