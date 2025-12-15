'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMoney, parseMoney } from '@/lib/money';
import { toast } from 'sonner';
import { PiggyBank, Plus, Trash2, DollarSign, TrendingUp, Save } from 'lucide-react';

interface Category {
  id: string;
  key: string;
  name: string;
}

interface CategoryBudget {
  categoryId: string;
  limitCents: number;
}

interface IncomePlan {
  name: string;
  plannedAmountCents: number;
}

export default function BudgetsPage() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [incomePlans, setIncomePlans] = useState<IncomePlan[]>([]);
  const [totalLimitCents, setTotalLimitCents] = useState<number | null>(null);
  const [currency, setCurrency] = useState('EUR');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
    loadBudget();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadBudget = async () => {
    try {
      const response = await fetch(`/api/budgets?month=${new Date().toISOString()}&currency=${currency}`);
      if (response.ok) {
        const data = await response.json();
        if (data.budget) {
          setTotalLimitCents(data.budget.totalLimitCents);
          setCategoryBudgets(
            data.budget.categories?.map((cb: any) => ({
              categoryId: cb.categoryId,
              limitCents: cb.limitCents,
            })) || []
          );
          setIncomePlans(
            data.budget.incomePlans?.map((ip: any) => ({
              name: ip.name,
              plannedAmountCents: ip.plannedAmountCents,
            })) || []
          );
        }
      }
    } catch (error) {
      console.error('Failed to load budget:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: new Date().toISOString(),
          currency,
          totalLimitCents,
          categoryBudgets,
          incomePlans,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to save budget');
        return;
      }

      toast.success('Budget saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const addCategoryBudget = () => {
    if (categories.length > 0) {
      setCategoryBudgets([...categoryBudgets, { categoryId: categories[0].id, limitCents: 0 }]);
    }
  };

  const addIncomePlan = () => {
    setIncomePlans([...incomePlans, { name: '', plannedAmountCents: 0 }]);
  };

  const totalBudget = categoryBudgets.reduce((sum, cb) => sum + cb.limitCents, 0);
  const totalIncome = incomePlans.reduce((sum, ip) => sum + ip.plannedAmountCents, 0);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 text-glow">
          {t('budgets')}
        </h1>
        <p className="text-white/50">
          Plan your monthly spending and income
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-lime-500/20">
                <TrendingUp className="h-6 w-6 text-lime-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Planned Income</p>
                <p className="text-2xl font-bold text-lime-400">
                  {formatMoney(totalIncome, currency, locale)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/20">
                <PiggyBank className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Total Budget</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatMoney(totalBudget, currency, locale)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={totalIncome - totalBudget >= 0 ? 'lime-glow' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${totalIncome - totalBudget >= 0 ? 'bg-lime-500/20' : 'bg-red-500/20'}`}>
                <DollarSign className={`h-6 w-6 ${totalIncome - totalBudget >= 0 ? 'text-lime-400' : 'text-red-400'}`} />
              </div>
              <div>
                <p className="text-sm text-white/50">Savings Goal</p>
                <p className={`text-2xl font-bold ${totalIncome - totalBudget >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
                  {formatMoney(totalIncome - totalBudget, currency, locale)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-white">Budget Settings</CardTitle>
          <CardDescription className="text-white/40">Configure your budget currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Total Limit (Optional)</label>
              <Input
                type="text"
                placeholder="0.00"
                className="glass-input"
                value={totalLimitCents !== null ? (totalLimitCents / 100).toFixed(2) : ''}
                onChange={e => {
                  const parsed = parseMoney(e.target.value);
                  setTotalLimitCents(parsed || null);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Budgets */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Category Budgets</CardTitle>
              <CardDescription className="text-white/40">Set spending limits per category</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addCategoryBudget}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryBudgets.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No category budgets set</p>
              <p className="text-sm">Click "Add" to create one</p>
            </div>
          ) : (
            categoryBudgets.map((cb, index) => (
              <div key={index} className="flex gap-3 items-center p-3 rounded-lg bg-white/5">
                <div className="flex-1">
                  <Select
                    value={cb.categoryId}
                    onValueChange={value =>
                      setCategoryBudgets(prev =>
                        prev.map((item, i) => (i === index ? { ...item, categoryId: value } : item))
                      )
                    }
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Input
                    type="text"
                    placeholder="0.00"
                    className="glass-input text-right"
                    value={(cb.limitCents / 100).toFixed(2)}
                    onChange={e => {
                      const parsed = parseMoney(e.target.value);
                      setCategoryBudgets(prev =>
                        prev.map((item, i) => (i === index ? { ...item, limitCents: parsed } : item))
                      );
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setCategoryBudgets(prev => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Income Plans */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Planned Income</CardTitle>
              <CardDescription className="text-white/40">Expected income sources for the month</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addIncomePlan}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {incomePlans.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No income plans set</p>
              <p className="text-sm">Click "Add" to create one</p>
            </div>
          ) : (
            incomePlans.map((ip, index) => (
              <div key={index} className="flex gap-3 items-center p-3 rounded-lg bg-white/5">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Income source name"
                    className="glass-input"
                    value={ip.name}
                    onChange={e =>
                      setIncomePlans(prev =>
                        prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                      )
                    }
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="text"
                    placeholder="0.00"
                    className="glass-input text-right"
                    value={(ip.plannedAmountCents / 100).toFixed(2)}
                    onChange={e => {
                      const parsed = parseMoney(e.target.value);
                      setIncomePlans(prev =>
                        prev.map((item, i) => (i === index ? { ...item, plannedAmountCents: parsed } : item))
                      );
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setIncomePlans(prev => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base">
        {saving ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-[#0a2818]/30 border-t-[#0a2818] rounded-full animate-spin" />
            Saving...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Budget
          </div>
        )}
      </Button>
    </div>
  );
}
