'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/money';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardData {
  expenses: number;
  income: number;
  balance: number;
  topCategories: Array<{ name: string; amount: number }>;
  dailyTrend: Array<{ date: string; amount: number }>;
  currency: string;
  transactionCount: number;
}

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
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-destructive">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('dashboard')}</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatMoney(data.expenses, data.currency, locale)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(data.income, data.currency, locale)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.balance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatMoney(data.balance, data.currency, locale)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.transactionCount}</div>
            <p className="text-xs text-muted-foreground">Reviewed this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Spending Trend</CardTitle>
            <CardDescription>Expenses by day</CardDescription>
          </CardHeader>
          <CardContent>
            {data.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No spending data for this period
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>By expense amount</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
