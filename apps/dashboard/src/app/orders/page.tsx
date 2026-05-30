'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { joinStoreRoom, onNewOrder, onOrderStatusUpdate } from '@/lib/socket';
import { OrderStatus } from '@smart-pickup/shared';
import type { Order } from '@smart-pickup/shared';
import { OrderCard } from '@/components/OrderCard';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

type Filter = 'active' | 'all' | OrderStatus;

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'النشطة', value: 'active' },
  { label: 'الكل', value: 'all' },
  { label: 'جديد', value: OrderStatus.NEW },
  { label: 'مقبول', value: OrderStatus.ACCEPTED },
  { label: 'تحضير', value: OrderStatus.PREPARING },
  { label: 'جاهز', value: OrderStatus.READY },
  { label: 'مُسلَّم', value: OrderStatus.DELIVERED },
];

export default function OrdersPage() {
  const { storeId, staff } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('active');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!storeId || !staff?.tenantId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter !== 'all' && filter !== 'active') q.set('status', filter);
      const today = new Date().toISOString().split('T')[0];
      q.set('date', today);
      const data = await api.get(`/orders/store/${storeId}?${q}`) as { items: Order[] };
      let items = data.items ?? [];
      if (filter === 'active') {
        items = items.filter((o) => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status));
      }
      setOrders(items);
    } finally {
      setLoading(false);
    }
  }, [storeId, staff?.tenantId, filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!storeId) return;
    joinStoreRoom(storeId);

    const offNew = onNewOrder((order) => {
      setOrders((prev) => [order as Order, ...prev]);
      toast.success('🛒 طلب جديد!', { duration: 5000 });
      // Play notification sound
      if (typeof window !== 'undefined') {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    });

    const offStatus = onOrderStatusUpdate((update) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === update.orderId ? { ...o, status: update.status as OrderStatus } : o,
        ),
      );
    });

    return () => { offNew(); offStatus(); };
  }, [storeId]);

  const updateStatus = async (orderId: string, status: OrderStatus, estimatedMins?: number) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status, estimatedMins });
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status } : o),
      );
      toast.success('تم تحديث الحالة');
    } catch {
      toast.error('فشل التحديث');
    }
  };

  return (
    <div className="flex min-h-screen" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">الطلبات</h1>
            <p className="text-gray-400 text-sm">اليوم • {orders.length} طلب</p>
          </div>
          <button
            onClick={load}
            className="text-sm text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50"
          >
            ↻ تحديث
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                filter === f.value
                  ? 'bg-blue-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-lg">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
