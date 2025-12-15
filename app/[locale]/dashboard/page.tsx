'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/money';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Area,
  AreaChart 
} from 'recharts';
import { TrendingDown, TrendingUp, Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardData {
  expenses: number;
  income: number;
  balance: number;
  topCategories: Array<{ name: string; amount: number }>;
  dailyTrend: Array<{ date: string; amount: number }>;
  currency: string;
  transactionCount: number;
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, currency, locale }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="text-white/70">{label}</p>
        <p className="text-lime-400 font-semibold">
          {formatMoney(payload[0].value, currency, locale)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
            <div className="text-lg text-white/50">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="glass-card p-6 text-center">
            <div className="text-lg text-red-400">{error}</div>
            <button 
              onClick={loadDashboard}
              className="mt-4 px-4 py-2 btn-lime rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-white/50">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 text-glow">
          {t('dashboard')}
        </h1>
        <p className="text-white/50">
          Overview of your finances this month
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Expenses Card */}
        <Card className="group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/50">
                Total Expenses
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <TrendingDown className="h-4 w-4 text-red-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400 flex items-center gap-2">
              {formatMoney(data.expenses, data.currency, locale)}
              <ArrowDownRight className="h-5 w-5 text-red-400/50" />
            </div>
            <p className="text-xs text-white/40 mt-1">This month</p>
          </CardContent>
        </Card>
        
        {/* Income Card */}
        <Card className="group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/50">
                Total Income
              </CardTitle>
              <div className="p-2 rounded-lg bg-lime-500/10 group-hover:bg-lime-500/20 transition-colors">
                <TrendingUp className="h-4 w-4 text-lime-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-lime-400 flex items-center gap-2">
              {formatMoney(data.income, data.currency, locale)}
              <ArrowUpRight className="h-5 w-5 text-lime-400/50" />
            </div>
            <p className="text-xs text-white/40 mt-1">This month</p>
          </CardContent>
        </Card>
        
        {/* Balance Card */}
        <Card className="group lime-glow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/50">
                Balance
              </CardTitle>
              <div className="p-2 rounded-lg bg-lime-500/10 group-hover:bg-lime-500/20 transition-colors">
                <Wallet className="h-4 w-4 text-lime-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.balance < 0 ? 'text-red-400' : 'text-lime-400'}`}>
              {formatMoney(data.balance, data.currency, locale)}
            </div>
            <p className="text-xs text-white/40 mt-1">Net this month</p>
          </CardContent>
        </Card>
        
        {/* Transactions Card */}
        <Card className="group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/50">
                Transactions
              </CardTitle>
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                <Activity className="h-4 w-4 text-white/70" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{data.transactionCount}</div>
            <p className="text-xs text-white/40 mt-1">Reviewed this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Daily Spending Trend</CardTitle>
            <CardDescription className="text-white/40">
              Your daily expenses over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.dailyTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b8f501" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#b8f501" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={11} 
                    stroke="rgba(255,255,255,0.3)"
                    tickFormatter={(value) => value.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    fontSize={11} 
                    stroke="rgba(255,255,255,0.3)"
                    tickFormatter={(value) => `${(value / 100).toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip currency={data.currency} locale={locale} />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#b8f501" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-white/40">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-white/20" />
                  <p>No spending data for this period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Top Categories Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Top Categories</CardTitle>
            <CardDescription className="text-white/40">
              Where your money goes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topCategories} layout="vertical">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#b8f501" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#c4ff0d" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                  <XAxis 
                    type="number" 
                    fontSize={11} 
                    stroke="rgba(255,255,255,0.3)"
                    tickFormatter={(value) => `${(value / 100).toFixed(0)}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    fontSize={11} 
                    stroke="rgba(255,255,255,0.5)"
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip currency={data.currency} locale={locale} />} />
                  <Bar 
                    dataKey="amount" 
                    fill="url(#barGradient)" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-white/40">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-white/20" />
                  <p>No category data available</p>
                  <p className="text-sm mt-1">Import some transactions to see insights</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
