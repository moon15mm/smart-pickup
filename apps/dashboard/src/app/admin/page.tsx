'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { TenantPlan, TenantStatus, StoreCategory } from '@smart-pickup/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Store,
  FileText,
  DollarSign,
  Plus,
  Loader2,
  Lock,
  Globe,
  Mail,
  Phone,
  User,
  Activity,
  Layers,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  billingEmail: string;
  createdAt: string;
  stores?: Array<{ id: string; name: string }>;
  staff?: Array<{ id: string; name: string; role: string; mobile: string }>;
}

interface StatsData {
  tenantsCount: number;
  storesCount: number;
  ordersCount: number;
  totalRevenue: number;
  statusDistribution: Record<string, number>;
  planDistribution: Record<string, number>;
}

const PLAN_COLORS = {
  [TenantPlan.STARTER]: '#3B82F6',   // Blue
  [TenantPlan.GROWTH]: '#10B981',    // Emerald
  [TenantPlan.BUSINESS]: '#8B5CF6',  // Purple
  [TenantPlan.ENTERPRISE]: '#F59E0B',// Amber
};

const PLAN_LABELS = {
  [TenantPlan.STARTER]: 'الباقة الأساسية (Starter)',
  [TenantPlan.GROWTH]: 'الباقة المتقدمة (Growth)',
  [TenantPlan.BUSINESS]: 'باقة الأعمال (Business)',
  [TenantPlan.ENTERPRISE]: 'باقة الشركات (Enterprise)',
};

const STATUS_LABELS = {
  [TenantStatus.TRIAL]: 'فترة تجريبية',
  [TenantStatus.ACTIVE]: 'نشط',
  [TenantStatus.SUSPENDED]: 'معطل مؤقتاً',
  [TenantStatus.CANCELLED]: 'ملغي',
};

const STATUS_BADGES = {
  [TenantStatus.TRIAL]: 'default',
  [TenantStatus.ACTIVE]: 'success',
  [TenantStatus.SUSPENDED]: 'warning',
  [TenantStatus.CANCELLED]: 'destructive',
};

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal Step Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Register Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    billingEmail: '',
    plan: TenantPlan.STARTER,
    // Step 2: First branch info
    storeName: '',
    storeNameAr: '',
    storeCategory: StoreCategory.GROCERY,
    // Step 3: Owner info
    ownerName: '',
    ownerMobile: '',
    ownerPin: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsList, statsInfo] = await Promise.all([
        api.get('/tenants/admin/list'),
        api.get('/tenants/admin/stats'),
      ]);
      setTenants((tenantsList as TenantItem[]) ?? []);
      setStats(statsInfo as StatsData);
    } catch (err) {
      toast.error('فشل تحميل بيانات لوحة التحكم العامة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async () => {
    if (!form.name || !form.slug || !form.billingEmail) {
      toast.error('يرجى ملء جميع البيانات الأساسية في الخطوة الأولى');
      return;
    }
    if (!form.storeNameAr || !form.storeName) {
      toast.error('يرجى ملء بيانات الفرع الأول في الخطوة الثانية');
      return;
    }
    if (!form.ownerName || !form.ownerMobile || form.ownerPin.length < 4) {
      toast.error('يرجى ملء بيانات المالك ورمز الدخول (4 أرقام على الأقل) في الخطوة الثالثة');
      return;
    }

    setSaving(true);
    try {
      await api.post('/tenants/register', form);
      toast.success('تم تسجيل المتجر وتأسيس الفرع وحساب المالك بنجاح!');
      setModalOpen(false);
      setStep(1);
      // Reset form
      setForm({
        name: '',
        slug: '',
        billingEmail: '',
        plan: TenantPlan.STARTER,
        storeName: '',
        storeNameAr: '',
        storeCategory: StoreCategory.GROCERY,
        ownerName: '',
        ownerMobile: '',
        ownerPin: '',
      });
      loadData();
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'فشل التسجيل';
      if (data) {
        if (typeof data.message === 'string') {
          msg = data.message;
        } else if (typeof data.message === 'object') {
          const inner = data.message.message;
          msg = Array.isArray(inner) ? inner.join(', ') : (inner || data.message.error || msg);
        }
      } else {
        msg = err.message || msg;
      }

      if (msg === 'Slug already taken') {
        toast.error('رابط المتجر (Slug) محجوز مسبقاً، يرجى اختيار اسم آخر');
      } else {
        toast.error(`فشل التسجيل: ${msg}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTenant = async (
    id: string,
    updates: { plan?: TenantPlan; status?: TenantStatus }
  ) => {
    try {
      await api.patch(`/tenants/${id}/admin-update`, updates);
      toast.success('تم تحديث بيانات المتجر');
      // Update local state
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      // Refresh stats
      const statsInfo = await api.get('/tenants/admin/stats');
      setStats(statsInfo as StatsData);
    } catch {
      toast.error('فشل تحديث البيانات');
    }
  };

  // Format plan distribution chart data
  const pieData = stats
    ? Object.keys(stats.planDistribution).map((k) => ({
        name: PLAN_LABELS[k as TenantPlan] || k,
        value: stats.planDistribution[k],
      }))
    : [];

  const barData = stats
    ? Object.keys(stats.statusDistribution).map((k) => ({
        name: STATUS_LABELS[k as TenantStatus] || k,
        المتاجر: stats.statusDistribution[k],
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Premium Header */}
      <header className="bg-slate-950 border-b border-slate-800 py-5 px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              منصة Smart Pickup
              <span className="text-xs bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                لوحة المشرف العام
              </span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">إدارة المتاجر المشتركة والإحصائيات العامة للمنصة</p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 font-bold py-5 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02]">
          <Plus className="h-5 w-5" /> إضافة متجر جديد
        </Button>
      </header>

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-400 text-sm">جاري تحميل بيانات المنصة...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-950 border-slate-800 text-slate-100 hover:border-blue-500/50 transition-all duration-300">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-medium">المتاجر المشتركة</p>
                    <h3 className="text-3xl font-black text-white">{stats?.tenantsCount}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950 border-slate-800 text-slate-100 hover:border-indigo-500/50 transition-all duration-300">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-medium">الفروع النشطة</p>
                    <h3 className="text-3xl font-black text-white">{stats?.storesCount}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <Store className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950 border-slate-800 text-slate-100 hover:border-emerald-500/50 transition-all duration-300">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-medium">إجمالي الطلبات</p>
                    <h3 className="text-3xl font-black text-white">{stats?.ordersCount}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <FileText className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950 border-slate-800 text-slate-100 hover:border-amber-500/50 transition-all duration-300">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-medium">إيرادات المنصة</p>
                    <h3 className="text-3xl font-black text-emerald-400">
                      {stats?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-bold text-slate-400">ر.س</span>
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Plan Distribution Chart */}
              <Card className="bg-slate-950 border-slate-800 text-slate-100">
                <CardHeader className="border-b border-slate-800/60 pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-400" /> توزيع الباقات المشتركة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[300px]">
                  {pieData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                      لا توجد بيانات كافية لعرض المخطط
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => {
                            const planKey = Object.keys(PLAN_LABELS).find(
                              (k) => PLAN_LABELS[k as TenantPlan] === entry.name
                            ) as TenantPlan;
                            return <Cell key={`cell-${index}`} fill={PLAN_COLORS[planKey] || '#64748B'} />;
                          })}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            border: '1px solid #1E293B',
                            borderRadius: '8px',
                            color: '#F8FAFC',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution Chart */}
              <Card className="bg-slate-950 border-slate-800 text-slate-100">
                <CardHeader className="border-b border-slate-800/60 pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-400" /> تصنيف المحلات حسب الحالة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[300px]">
                  {barData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                      لا توجد بيانات كافية لعرض المخطط
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} barSize={40}>
                        <XAxis
                          dataKey="name"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            border: '1px solid #1E293B',
                            borderRadius: '8px',
                            color: '#F8FAFC',
                          }}
                        />
                        <Bar dataKey="المتاجر" fill="#6366F1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tenants Management Table */}
            <Card className="bg-slate-950 border-slate-800 text-slate-100">
              <CardHeader className="border-b border-slate-800/60 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Store className="h-5 w-5 text-blue-500" /> قائمة المحلات والمتاجر المشتركة
                </CardTitle>
                <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700/50">
                  {tenants.length} منشأة مسجلة
                </span>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full border-collapse text-right text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase">
                      <th className="p-4">المنشأة والـ Slug</th>
                      <th className="p-4">خطة الاشتراك</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">تاريخ التسجيل</th>
                      <th className="p-4">الفروع</th>
                      <th className="p-4">المالك / الجوال</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {tenants.map((t) => {
                      const owner = t.staff?.find((s) => s.role === 'owner');
                      return (
                        <tr key={t.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-white">{t.name}</p>
                            <p className="text-xs text-slate-500" dir="ltr">{t.slug}</p>
                          </td>
                          <td className="p-4">
                            <select
                              value={t.plan}
                              onChange={(e) =>
                                handleUpdateTenant(t.id, { plan: e.target.value as TenantPlan })
                              }
                              className="text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-slate-200"
                            >
                              <option value={TenantPlan.STARTER}>الأساسية (Starter)</option>
                              <option value={TenantPlan.GROWTH}>المتقدمة (Growth)</option>
                              <option value={TenantPlan.BUSINESS}>الأعمال (Business)</option>
                              <option value={TenantPlan.ENTERPRISE}>الشركات (Enterprise)</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <Badge variant={STATUS_BADGES[t.status] as any}>
                              {STATUS_LABELS[t.status]}
                            </Badge>
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            {new Date(t.createdAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-slate-900 px-2 py-1 rounded-md border border-slate-800 font-semibold text-xs text-slate-300">
                              {t.stores?.length ?? 0} فرع
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-semibold text-slate-300">{owner?.name ?? '—'}</p>
                            <p className="text-[11px] text-slate-500" dir="ltr">{owner?.mobile ?? '—'}</p>
                          </td>
                          <td className="p-4 flex items-center justify-center gap-2">
                            {t.status === TenantStatus.SUSPENDED ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateTenant(t.id, { status: TenantStatus.ACTIVE })
                                }
                                className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 bg-transparent"
                              >
                                تفعيل المتجر
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateTenant(t.id, { status: TenantStatus.SUSPENDED })
                                }
                                className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 bg-transparent"
                              >
                                تعطيل الحساب
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {tenants.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          لا يوجد محلات مسجلة في المنصة بعد
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Registration Steps Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-xl bg-slate-950 border-slate-800 text-slate-100 overflow-hidden shadow-2xl relative">
            {/* Modal Progress Indicator */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg text-white">تسجيل منشأة جديدة بالمنصة</h2>
                <p className="text-xs text-slate-400 mt-1">تأسيس متجر وتجهيز فرعه الأول وصلاحيات المالك</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-2xl font-light shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            <div className="flex bg-slate-900/40 px-6 py-3 border-b border-slate-800/50 text-xs">
              <div className="flex items-center gap-2 flex-1 justify-center">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                  step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>1</span>
                <span className={step === 1 ? 'font-bold text-white' : 'text-slate-400'}>بيانات المنشأة</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-700 mx-1 shrink-0 self-center" />
              <div className="flex items-center gap-2 flex-1 justify-center">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                  step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>2</span>
                <span className={step === 2 ? 'font-bold text-white' : 'text-slate-400'}>الفرع الأول</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-700 mx-1 shrink-0 self-center" />
              <div className="flex items-center gap-2 flex-1 justify-center">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                  step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>3</span>
                <span className={step === 3 ? 'font-bold text-white' : 'text-slate-400'}>بيانات الدخول</span>
              </div>
            </div>

            <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Step 1: General Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">اسم المنشأة/الشركة (عربي/إنجليزي) *</label>
                    <div className="relative">
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="مثل: أسواق العثيم أو صيدلية الدواء"
                        className="bg-slate-900 border-slate-800 text-slate-100 pr-10"
                      />
                      <Store className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">المعرف الفريد بالرابط (Slug) *</label>
                    <div className="relative">
                      <Input
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().trim() })}
                        placeholder="مثل: othaim-supermarket (أحرف إنجليزية فقط)"
                        className="bg-slate-900 border-slate-800 text-slate-100 pr-10 text-right font-mono"
                        dir="ltr"
                      />
                      <Globe className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                    <p className="text-[10px] text-slate-500">سيُستخدم في الرابط للعملاء: scan/othaim-supermarket</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold block">بريد إرسال الفواتير والمراسلات *</label>
                      <div className="relative">
                        <Input
                          type="email"
                          value={form.billingEmail}
                          onChange={(e) => setForm({ ...form, billingEmail: e.target.value.trim() })}
                          placeholder="billing@company.com"
                          className="bg-slate-900 border-slate-800 text-slate-100 pr-10 text-right"
                          dir="ltr"
                        />
                        <Mail className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold block">باقة الاشتراك الأساسية</label>
                      <select
                        value={form.plan}
                        onChange={(e) => setForm({ ...form, plan: e.target.value as TenantPlan })}
                        className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 hover:border-slate-700 focus:outline-none focus:border-blue-500"
                      >
                        <option value={TenantPlan.STARTER}>الأساسية (Starter)</option>
                        <option value={TenantPlan.GROWTH}>المتقدمة (Growth)</option>
                        <option value={TenantPlan.BUSINESS}>الأعمال (Business)</option>
                        <option value={TenantPlan.ENTERPRISE}>الشركات (Enterprise)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: First Store Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">اسم الفرع الأول (بالعربي) *</label>
                    <Input
                      value={form.storeNameAr}
                      onChange={(e) => setForm({ ...form, storeNameAr: e.target.value })}
                      placeholder="مثل: أسواق العثيم - فرع حي الربوة"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">اسم الفرع الأول (بالإنجليزي) *</label>
                    <Input
                      value={form.storeName}
                      onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                      placeholder="e.g. Al Othaim - Al Rabwah Branch"
                      className="bg-slate-900 border-slate-800 text-slate-100 text-right"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">تصنيف المتجر / النشاط</label>
                    <select
                      value={form.storeCategory}
                      onChange={(e) =>
                        setForm({ ...form, storeCategory: e.target.value as StoreCategory })
                      }
                      className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 hover:border-slate-700 focus:outline-none"
                    >
                      <option value={StoreCategory.GROCERY}>تموينات / سوبرماركت</option>
                      <option value={StoreCategory.RESTAURANT}>مطعم</option>
                      <option value={StoreCategory.CAFE}>مقهى / كافيه</option>
                      <option value={StoreCategory.PHARMACY}>صيدلية</option>
                      <option value={StoreCategory.PET_STORE}>مستلزمات حيوانات أليفة</option>
                      <option value={StoreCategory.ELECTRONICS}>إلكترونيات</option>
                      <option value={StoreCategory.STATIONERY}>قرطاسية ومكتبة</option>
                      <option value={StoreCategory.OTHER}>آخر</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Owner Admin Login Credentials */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">اسم المالك/المدير المسؤول *</label>
                    <div className="relative">
                      <Input
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="مثل: عبد الرحمن بن علي"
                        className="bg-slate-900 border-slate-800 text-slate-100 pr-10"
                      />
                      <User className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">رقم جوال المالك (اسم المستخدم للدخول) *</label>
                    <div className="relative">
                      <Input
                        type="tel"
                        value={form.ownerMobile}
                        onChange={(e) => setForm({ ...form, ownerMobile: e.target.value.trim() })}
                        placeholder="+9665xxxxxxxx"
                        className="bg-slate-900 border-slate-800 text-slate-100 pr-10 text-right font-mono"
                        dir="ltr"
                      />
                      <Phone className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">رمز دخول المالك (PIN مكون من 4 إلى 6 أرقام) *</label>
                    <div className="relative">
                      <Input
                        type="password"
                        value={form.ownerPin}
                        onChange={(e) => setForm({ ...form, ownerPin: e.target.value.replace(/\D/g, '') })}
                        maxLength={6}
                        placeholder="• • • •"
                        className="bg-slate-900 border-slate-800 text-slate-100 pr-10 text-center tracking-[0.5em] text-lg font-bold"
                      />
                      <Lock className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                    <p className="text-[10px] text-slate-500">يستخدم للدخول إلى لوحة التحكم من قِبل المالك لتعديل الموظفين والمنتجات.</p>
                  </div>
                </div>
              )}
            </CardContent>

            <div className="bg-slate-900 border-t border-slate-800 p-4 flex gap-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="flex-1 bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 ml-1.5 shrink-0" /> السابق
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => {
                    if (step === 1 && (!form.name || !form.slug || !form.billingEmail)) {
                      toast.error('أكمل البيانات المطلوبة للمنشأة أولاً');
                      return;
                    }
                    if (step === 2 && (!form.storeNameAr || !form.storeName)) {
                      toast.error('أدخل أسماء الفرع الأول أولاً');
                      return;
                    }
                    setStep((s) => (s + 1) as any);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  التالي
                </Button>
              ) : (
                <Button
                  onClick={handleRegister}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري التأسيس...
                    </>
                  ) : (
                    'تأسيس المنشأة وإطلاق المتجر ✓'
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
