'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import type { Staff } from '@smart-pickup/shared';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/staff/login', { mobile, pin }) as {
        staff: Staff; accessToken: string;
      };
      login(data.staff, data.accessToken);
      router.push('/orders');
    } catch {
      toast.error('بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl">🚗</span>
          </div>
          <h1 className="text-xl font-black text-gray-900">Smart Pickup</h1>
          <p className="text-gray-400 text-sm mt-1">دخول الموظفين</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">رقم الجوال</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              placeholder="+966xxxxxxxxx"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">الرقم السري (PIN)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-center tracking-widest text-xl"
              placeholder="• • • • • •"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3.5 rounded-xl font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
