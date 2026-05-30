'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { formatPrice } from '@/lib/utils';

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  avgPrepMins: string;
  topProducts: Array<{ name: string; qty: string; revenue: string }>;
  hourlyBreakdown: Array<{ hour: string; orders: string }>;
}

interface DailySale {
  date: string;
  orders: string;
  revenue: string;
}

export default function AnalyticsPage() {
  const { storeId } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [daily, setDaily] = useState<DailySale[]>([]);
  const [range, setRange] = useState(30);

  useEffect(() => {
    if (!storeId) return;
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      api.get(`/analytics/store/${storeId}/dashboard?from=${today}T00:00:00&to=${today}T23:59:59`),
      api.get(`/analytics/store/${storeId}/daily-sales?days=${range}`),
    ]).then(([d, s]) => {
      setDashboard(d as DashboardData);
      setDaily(s as DailySale[]);
    });
  }, [storeId, range]);

  const kpis = [
    { label: 'طلبات اليوم',       value: dashboard?.totalOrders ?? 0,         icon: '📦', color: 'bg-blue-50 text-blue-800' },
    { label: 'إيرادات اليوم',     value: formatPrice(dashboard?.totalRevenue ?? 0), icon: '💰', color: 'bg-emerald-50 text-emerald-800' },
    { label: 'متوسط وقت التحضير', value: `${dashboard?.avgPrepMins ?? 0} دقيقة`, icon: '⏱️', color: 'bg-amber-50 text-amber-800' },
  ];

  return (
    <div className="flex min-h-screen" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">التحليلات</h1>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
          >
            {[7, 14, 30, 90].map((d) => (
              <option key={d} value={d}>آخر {d} يوم</option>
            ))}
          </select>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={`rounded-2xl p-5 ${kpi.color}`}>
              <span className="text-3xl">{kpi.icon}</span>
              <p className="text-2xl font-black mt-2">{kpi.value}</p>
              <p className="text-sm opacity-70 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Daily revenue chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-700 mb-4">الإيرادات اليومية</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatPrice(Number(v))} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1B4F72"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Top products */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-700 mb-4">أكثر المنتجات مبيعاً</h2>
            {dashboard?.topProducts?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dashboard.topProducts} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#2E86C1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-300 text-center py-8">لا بيانات</p>
            )}
          </div>

          {/* Hourly */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-700 mb-4">توزيع الطلبات بالساعة</h2>
            {dashboard?.hourlyBreakdown?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dashboard.hourlyBreakdown}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#1ABC9C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-300 text-center py-8">لا بيانات</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
