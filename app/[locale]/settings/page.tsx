'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface Category {
  id: string;
  key: string;
  name: string;
}

export default function SettingsPage() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [reportCurrency, setReportCurrency] = useState('EUR');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
    loadSettings();
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

  const loadSettings = async () => {
    // Load from localStorage or API
    const savedCurrency = localStorage.getItem('reportCurrency');
    if (savedCurrency) {
      setReportCurrency(savedCurrency);
    }
  };

  const handleLanguageChange = (newLocale: string) => {
    router.replace(`/${newLocale}${window.location.pathname.replace(/^\/[^/]+/, '')}`);
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setReportCurrency(newCurrency);
    localStorage.setItem('reportCurrency', newCurrency);
    toast.success('Report currency updated');
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setEditingName(category.name);
  };

  const saveCategoryName = async (categoryId: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/categories/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          locale,
          name: editingName,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to save category name');
        return;
      }

      await loadCategories();
      setEditingCategory(null);
      toast.success('Category name updated');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save category name');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t('settings')}</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Language & Region</CardTitle>
            <CardDescription>UI language, date format, week start</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={locale} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Date format and week start are determined by the selected language/region.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display Currency</CardTitle>
            <CardDescription>Report currency for dashboard and reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Currency</label>
              <Select value={reportCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                  <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                  <SelectItem value="PLN">PLN (Polish Zloty)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              All amounts in the dashboard will be converted and displayed in this currency.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage transaction category names</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Name ({locale})</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-mono text-sm">{cat.key}</TableCell>
                    <TableCell>
                      {editingCategory === cat.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => saveCategoryName(cat.id)}
                            disabled={saving}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCategory(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span>{cat.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCategory !== cat.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditCategory(cat)}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



