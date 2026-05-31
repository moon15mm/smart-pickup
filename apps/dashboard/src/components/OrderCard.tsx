'use client';

import { useState } from 'react';
import { OrderStatus } from '@smart-pickup/shared';
import type { Customer, CustomerVehicle, Order, ParkingSpot } from '@smart-pickup/shared';
import { formatPrice, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type DashboardOrder = Order & {
  customer?: Customer;
  vehicle?: CustomerVehicle | null;
  parkingSpot?: ParkingSpot | null;
};

interface Props {
  order: DashboardOrder;
  onUpdateStatus: (id: string, status: OrderStatus, estimatedMins?: number) => void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next?: OrderStatus; nextLabel?: string }> = {
  [OrderStatus.NEW]:       { label: 'جديد',         color: 'bg-blue-100 text-blue-800',    next: OrderStatus.ACCEPTED,  nextLabel: 'قبول الطلب' },
  [OrderStatus.ACCEPTED]:  { label: 'مقبول',         color: 'bg-indigo-100 text-indigo-800', next: OrderStatus.PREPARING, nextLabel: 'بدء التحضير' },
  [OrderStatus.PREPARING]: { label: 'جاري التحضير',  color: 'bg-amber-100 text-amber-800',  next: OrderStatus.READY,     nextLabel: 'جاهز للتسليم' },
  [OrderStatus.READY]:     { label: 'جاهز',          color: 'bg-emerald-100 text-emerald-800', next: OrderStatus.DELIVERED, nextLabel: 'تم التسليم ✓' },
  [OrderStatus.DELIVERED]: { label: 'مُسلَّم',        color: 'bg-green-100 text-green-800' },
  [OrderStatus.CANCELLED]: { label: 'ملغي',          color: 'bg-red-100 text-red-800' },
};

const VEHICLE_COLORS: Record<string, string> = {
  أبيض: 'bg-gray-100 border-gray-300',
  أسود: 'bg-gray-900',
  رمادي: 'bg-gray-400',
  أحمر: 'bg-red-500',
  أزرق: 'bg-blue-500',
  أخضر: 'bg-green-500',
  بيج: 'bg-yellow-100',
  ذهبي: 'bg-yellow-400',
};

export function OrderCard({ order, onUpdateStatus }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [estimatedMins, setEstimatedMins] = useState(10);
  const cfg = STATUS_CONFIG[order.status];
  const colorClass = VEHICLE_COLORS[order.vehicle?.color ?? ''] ?? 'bg-gray-200';

  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all',
      order.status === OrderStatus.NEW ? 'border-blue-400 shadow-blue-100' : 'border-transparent',
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900">#{order.orderNumber}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>
              {cfg.label}
            </span>
          </div>
          <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
        </div>

        {/* Customer & vehicle */}
        <div className="flex items-center gap-3 mb-3">
          {order.vehicle && (
            <div className={cn('w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0', colorClass)} />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{order.customer?.fullName ?? '—'}</p>
            {order.vehicle && (
              <p className="text-xs text-gray-400 truncate">
                {order.vehicle.make} {order.vehicle.model} — {order.vehicle.plateNumber}
              </p>
            )}
          </div>
          {order.parkingSpot && (
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">
              🅿️ {order.parkingSpot.spotNumber}
            </span>
          )}
        </div>

        {/* Items summary */}
        <div className="text-sm text-gray-500 mb-3">
          {order.items?.slice(0, 2).map((i) => (
            <span key={i.id} className="inline-block ml-2">
              {i.nameArSnapshot} ×{i.quantity}
            </span>
          ))}
          {order.items?.length > 2 && (
            <span className="text-blue-500">+{order.items.length - 2} أخرى</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-black text-blue-900">{formatPrice(order.total)}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 underline"
          >
            {expanded ? 'إخفاء' : 'التفاصيل'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.nameArSnapshot} × {item.quantity}</span>
              <span>{formatPrice(item.priceSnapshot * item.quantity)}</span>
            </div>
          ))}
          {order.notes && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">
              📝 {order.notes}
            </p>
          )}
        </div>
      )}

      {/* Action button */}
      {cfg.next && (
        <div className="px-4 pb-4">
          {cfg.next === OrderStatus.PREPARING && (
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-500">الوقت المتوقع:</label>
              <select
                value={estimatedMins}
                onChange={(e) => setEstimatedMins(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
              >
                {[5, 10, 15, 20, 30, 45].map((m) => (
                  <option key={m} value={m}>{m} دقيقة</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => onUpdateStatus(order.id, cfg.next!, estimatedMins)}
            className={cn(
              'w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95',
              order.status === OrderStatus.NEW ? 'bg-blue-900 text-white' :
              order.status === OrderStatus.READY ? 'bg-green-600 text-white' :
              'bg-blue-800 text-white',
            )}
          >
            {cfg.nextLabel}
          </button>
          {[OrderStatus.NEW, OrderStatus.ACCEPTED].includes(order.status) && (
            <button
              onClick={() => onUpdateStatus(order.id, OrderStatus.CANCELLED)}
              className="w-full py-2 text-red-500 text-xs mt-1"
            >
              إلغاء الطلب
            </button>
          )}
        </div>
      )}
    </div>
  );
}
