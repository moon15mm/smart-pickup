'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/orders',    icon: '📋', label: 'الطلبات' },
  { href: '/products',  icon: '📦', label: 'المنتجات' },
  { href: '/staff',     icon: '👥', label: 'الموظفون' },
  { href: '/analytics', icon: '📊', label: 'التحليلات' },
  { href: '/settings',  icon: '⚙️', label: 'الإعدادات' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { staff, logout } = useAuth();

  return (
    <aside className="w-64 bg-blue-900 min-h-screen flex flex-col py-6 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <span className="text-xl">🚗</span>
        </div>
        <div>
          <p className="font-black text-white text-sm">Smart Pickup</p>
          <p className="text-blue-300 text-xs">{staff?.name ?? 'موظف'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-white text-blue-900'
                : 'text-blue-200 hover:bg-white/10 hover:text-white',
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-300 hover:bg-white/10 hover:text-white transition-colors mt-4"
      >
        <span>🚪</span> خروج
      </button>
    </aside>
  );
}
