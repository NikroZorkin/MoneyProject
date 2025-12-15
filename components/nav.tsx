'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function Nav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/import', label: t('import') },
    { href: '/budgets', label: t('budgets') },
    { href: '/settings', label: t('settings') },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a2818]/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-6 px-4">
        {/* Logo */}
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 font-bold text-lg text-white hover:text-lime-400 transition-colors"
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 shadow-lg shadow-lime-500/20">
            <Wallet className="h-5 w-5 text-[#0a2818]" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Money Project
          </span>
        </Link>
        
        {/* Navigation */}
        <div className="flex gap-1 ml-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={`
                  relative px-4 py-2 rounded-lg transition-all duration-300
                  ${isActive 
                    ? 'bg-lime-500/20 text-lime-400 shadow-[0_0_20px_rgba(184,245,1,0.15)]' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Link href={item.href}>
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-lime-400 to-transparent" />
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
