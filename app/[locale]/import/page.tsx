'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ImportPage() {
  const t = useTranslations('nav');
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reportCurrency, setReportCurrency] = useState('EUR');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const fileName = selectedFile.name.toLowerCase();
      const isValid = fileName.endsWith('.csv') || fileName.endsWith('.pdf');
      
      if (!isValid) {
        toast.error('Invalid file type. Please select a CSV or PDF file.');
        return;
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportCurrency', reportCurrency);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(data.error || 'This file has already been imported');
          if (data.importId) {
            router.push(`/import/review/${data.importId}`);
          }
        } else {
          toast.error(data.error || 'Import failed');
        }
        return;
      }

      toast.success(`Successfully imported ${data.transactionCount} transactions`);
      
      // Redirect to review page
      if (data.importId) {
        router.push(`/import/review/${data.importId}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{t('import')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Import Statement</CardTitle>
          <CardDescription>Upload CSV or PDF file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              CSV import is recommended for better accuracy. PDF import is available as fallback.
            </p>

            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                Select File
              </label>
              <Input
                id="file"
                type="file"
                accept=".csv,.pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Report Currency
              </label>
              <select
                id="currency"
                value={reportCurrency}
                onChange={(e) => setReportCurrency(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={uploading}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? 'Uploading...' : 'Upload and Import'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


