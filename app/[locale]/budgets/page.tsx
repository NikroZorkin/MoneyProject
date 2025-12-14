'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMoney, parseMoney } from '@/lib/money';
import { toast } from 'sonner';

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

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t('budgets')}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Budget</CardTitle>
          <CardDescription>Set budgets for the current month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Total Limit (Optional)</label>
            <Input
              type="text"
              placeholder="0.00"
              value={totalLimitCents !== null ? formatMoney(totalLimitCents, currency, locale).replace(/[^\d.,-]/g, '') : ''}
              onChange={e => {
                const parsed = parseMoney(e.target.value);
                setTotalLimitCents(parsed || null);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Category Budgets</CardTitle>
          <CardDescription>Set limits per category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryBudgets.map((cb, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  value={cb.categoryId}
                  onValueChange={value =>
                    setCategoryBudgets(prev =>
                      prev.map((item, i) => (i === index ? { ...item, categoryId: value } : item))
                    )
                  }
                >
                  <SelectTrigger>
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
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={formatMoney(cb.limitCents, currency, locale).replace(/[^\d.,-]/g, '')}
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
                onClick={() => setCategoryBudgets(prev => prev.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addCategoryBudget}>
            Add Category Budget
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Planned Income</CardTitle>
          <CardDescription>Expected income sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {incomePlans.map((ip, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Income source name"
                  value={ip.name}
                  onChange={e =>
                    setIncomePlans(prev =>
                      prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                    )
                  }
                />
              </div>
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={formatMoney(ip.plannedAmountCents, currency, locale).replace(/[^\d.,-]/g, '')}
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
                onClick={() => setIncomePlans(prev => prev.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addIncomePlan}>
            Add Income Plan
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Budget'}
      </Button>
    </div>
  );
}



