'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Settings, Globe, DollarSign, Tag, Check, X, Pencil } from 'lucide-react';

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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 text-glow">
          {t('settings')}
        </h1>
        <p className="text-white/50">
          Customize your preferences and settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Language & Region */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Language & Region</CardTitle>
                <CardDescription className="text-white/40">
                  UI language, date format, week start
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Language</label>
              <Select value={locale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-white/40">
              Date format and week start are determined by the selected language/region.
            </p>
          </CardContent>
        </Card>

        {/* Display Currency */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-lime-500/20">
                <DollarSign className="h-5 w-5 text-lime-400" />
              </div>
              <div>
                <CardTitle className="text-white">Display Currency</CardTitle>
                <CardDescription className="text-white/40">
                  Report currency for dashboard and reports
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Report Currency</label>
              <Select value={reportCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                  <SelectItem value="PLN">PLN - Polish Zloty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-white/40">
              All amounts in the dashboard will be converted and displayed in this currency using ECB rates.
            </p>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Tag className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Categories</CardTitle>
                <CardDescription className="text-white/40">
                  Manage transaction category names ({locale.toUpperCase()})
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <code className="text-xs text-white/40 font-mono bg-white/5 px-2 py-1 rounded min-w-[140px]">
                    {cat.key}
                  </code>
                  
                  {editingCategory === cat.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        className="glass-input flex-1"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-lime-400 hover:text-lime-300 hover:bg-lime-500/10"
                        onClick={() => saveCategoryName(cat.id)}
                        disabled={saving}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white/50 hover:text-white hover:bg-white/10"
                        onClick={() => setEditingCategory(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-white">{cat.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white/40 hover:text-white hover:bg-white/10"
                        onClick={() => startEditCategory(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              
              {categories.length === 0 && (
                <div className="text-center py-8 text-white/40">
                  <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No categories found</p>
                  <p className="text-sm">Run database seed to create default categories</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
