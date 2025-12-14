import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BudgetsPage() {
  const t = useTranslations('nav');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('budgets')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budgets</CardTitle>
          <CardDescription>Set budgets by category</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Budget management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


