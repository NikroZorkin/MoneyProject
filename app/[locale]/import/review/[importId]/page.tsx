'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/money';
import { useLocale } from 'next-intl';

interface Transaction {
  id: string;
  bookingDate: string;
  accountAmountCents: number;
  accountCurrency: string;
  convertedAmountCents: number;
  reportCurrency: string;
  descriptionRaw: string;
  merchantNormalized: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isReviewed: boolean;
  confidence: number | null;
  sourceRef: string;
}

interface Category {
  id: string;
  key: string;
  name: string;
}

export default function ReviewPage() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const importId = params.importId as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [importId]);

  const loadData = async () => {
    try {
      const [txRes, catRes] = await Promise.all([
        fetch(`/api/import/${importId}/transactions`),
        fetch('/api/categories'),
      ]);

      if (!txRes.ok || !catRes.ok) {
        toast.error('Failed to load data');
        return;
      }

      const txData = await txRes.json();
      const catData = await catRes.json();

      setTransactions(txData.transactions || []);
      setCategories(catData.categories || []);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (txId: string, categoryId: string) => {
    setTransactions(prev =>
      prev.map(tx =>
        tx.id === txId
          ? { ...tx, categoryId, categoryName: categories.find(c => c.id === categoryId)?.name || null }
          : tx
      )
    );
  };

  const handleBulkCategoryApply = () => {
    if (!selectedCategory || selectedRows.size === 0) {
      toast.error('Please select a category and transactions');
      return;
    }

    const categoryName = categories.find(c => c.id === selectedCategory)?.name || null;
    setTransactions(prev =>
      prev.map(tx =>
        selectedRows.has(tx.id)
          ? { ...tx, categoryId: selectedCategory, categoryName }
          : tx
      )
    );
    setSelectedRows(new Set());
    toast.success(`Applied category to ${selectedRows.size} transactions`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/import/${importId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.map(tx => ({
            id: tx.id,
            categoryId: tx.categoryId,
            merchantNormalized: tx.merchantNormalized,
          })),
        }),
      });

      if (!response.ok) {
        toast.error('Failed to save changes');
        return;
      }

      toast.success('Changes saved successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const toggleRowSelection = (txId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  const unreviewedCount = transactions.filter(tx => !tx.isReviewed).length;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Review Transactions</h1>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Complete'}
          </Button>
        </div>
      </div>

      {unreviewedCount > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Apply Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
              <Button
                onClick={handleBulkCategoryApply}
                disabled={!selectedCategory || selectedRows.size === 0}
              >
                Apply to {selectedRows.size} selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
          <CardDescription>
            {unreviewedCount} transactions need review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(tx.id)}
                        onChange={() => toggleRowSelection(tx.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>{new Date(tx.bookingDate).toLocaleDateString(locale)}</TableCell>
                    <TableCell>
                      {formatMoney(tx.convertedAmountCents, tx.reportCurrency, locale)}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={tx.merchantNormalized || tx.descriptionRaw}
                        onChange={e => {
                          setTransactions(prev =>
                            prev.map(t =>
                              t.id === tx.id ? { ...t, merchantNormalized: e.target.value } : t
                            )
                          );
                        }}
                        className="min-w-[200px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tx.categoryId || ''}
                        onValueChange={value => handleCategoryChange(tx.id, value)}
                      >
                        <SelectTrigger className="min-w-[150px]">
                          <SelectValue placeholder="Uncategorized" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {tx.confidence !== null && (
                        <Badge variant={tx.confidence > 0.8 ? 'default' : 'secondary'}>
                          {(tx.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
