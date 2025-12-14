'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

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
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center gap-4">
        <Link href="/dashboard" className="font-bold">
          Money Project
        </Link>
        <div className="flex gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? 'default' : 'ghost'}
                asChild
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

