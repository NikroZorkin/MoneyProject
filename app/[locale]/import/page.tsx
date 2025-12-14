import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ImportPage() {
  const t = useTranslations('nav');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('import')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Import Statement</CardTitle>
          <CardDescription>Upload CSV or PDF file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              CSV import is recommended for better accuracy. PDF import is available as fallback.
            </p>
            <Button>Upload File</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


