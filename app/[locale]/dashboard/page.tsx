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
}

export default function DashboardPage() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/dashboard/page.tsx:28',message:'loadDashboard start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/dashboard/page.tsx:31',message:'Before fetch',data:{url:'/api/dashboard'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const response = await fetch('/api/dashboard');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/dashboard/page.tsx:33',message:'After fetch',data:{status:response.status,ok:response.ok,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (response.ok) {
        const dashboardData = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/dashboard/page.tsx:36',message:'Data received',data:{hasData:!!dashboardData,expenses:dashboardData?.expenses,income:dashboardData?.income},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setData(dashboardData);
      } else {
        // #region agent log
        const errorText = await response.text();
        fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/dashboard/page.tsx:40',message:'Response not ok',data:{status:response.status,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/dashboard/page.tsx:45',message:'Fetch error',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Failed to load dashboard:', error);
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/dashboard/page.tsx:48',message:'loadDashboard finally',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('dashboard')}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(data.expenses, data.currency, locale)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(data.income, data.currency, locale)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatMoney(data.balance, data.currency, locale)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dailyTrend.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Trend</CardTitle>
            <CardDescription>Expenses by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>By expense amount</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



