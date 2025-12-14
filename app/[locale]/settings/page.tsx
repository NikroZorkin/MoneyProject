import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const t = useTranslations('nav');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('settings')}</h1>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Language & Region</CardTitle>
            <CardDescription>UI language, date format, week start</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Settings coming soon...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Display Currency</CardTitle>
            <CardDescription>Report currency for dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Currency settings coming soon...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage transaction categories</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Category management coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


