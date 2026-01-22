import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6 bg-card">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>PAU Biología - Preparación para Selectividad</p>
          <p className="mt-1">2º Bachillerato</p>
        </div>
      </footer>
    </div>
  );
}
