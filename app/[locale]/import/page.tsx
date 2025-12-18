'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, FileText, FileSpreadsheet, AlertCircle, CheckCircle2, Brain, Sparkles } from 'lucide-react';

type ImportStage = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'done';

export default function ImportPage() {
  const t = useTranslations('nav');
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<ImportStage>('idle');
  const [reportCurrency, setReportCurrency] = useState('EUR');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const fileName = selectedFile.name.toLowerCase();
    const isValid = fileName.endsWith('.csv') || fileName.endsWith('.pdf');
    
    if (!isValid) {
      toast.error('Invalid file type. Please select a CSV or PDF file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
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

  const isCSV = file?.name.toLowerCase().endsWith('.csv');
  const isPDF = file?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 text-glow">
          {t('import')}
        </h1>
        <p className="text-white/50">
          Upload your bank statement to import transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-lime-400" />
            Import Statement
          </CardTitle>
          <CardDescription className="text-white/40">
            Upload CSV or PDF file from your bank
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info box */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-lime-500/10 border border-lime-500/20">
            <AlertCircle className="h-5 w-5 text-lime-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-white/70">
              <span className="text-lime-400 font-medium">CSV import is recommended</span> for better accuracy. 
              PDF import is available as fallback but may require manual review.
            </p>
          </div>

          {/* Drop zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${dragActive 
                ? 'border-lime-400 bg-lime-500/10' 
                : file 
                  ? 'border-lime-500/30 bg-lime-500/5' 
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="file"
              type="file"
              accept=".csv,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {file ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  {isCSV ? (
                    <div className="p-4 rounded-full bg-lime-500/20">
                      <FileSpreadsheet className="h-10 w-10 text-lime-400" />
                    </div>
                  ) : (
                    <div className="p-4 rounded-full bg-orange-500/20">
                      <FileText className="h-10 w-10 text-orange-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-sm text-white/50">
                    {(file.size / 1024).toFixed(2)} KB • {isCSV ? 'CSV' : 'PDF'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-lime-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready to import
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-white/5">
                    <Upload className="h-10 w-10 text-white/40" />
                  </div>
                </div>
                <div>
                  <p className="text-white">
                    <span className="text-lime-400 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-white/40 mt-1">CSV or PDF up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Currency selector */}
          <div className="space-y-2">
            <label htmlFor="currency" className="text-sm font-medium text-white/70">
              Report Currency
            </label>
            <select
              id="currency"
              value={reportCurrency}
              onChange={(e) => setReportCurrency(e.target.value)}
              className="w-full rounded-lg glass-input px-4 py-3 text-white bg-white/5 border border-white/15 focus:border-lime-500/50 focus:outline-none transition-colors"
              disabled={uploading}
            >
              <option value="EUR" className="bg-[#1a3d2b]">EUR - Euro</option>
              <option value="USD" className="bg-[#1a3d2b]">USD - US Dollar</option>
              <option value="GBP" className="bg-[#1a3d2b]">GBP - British Pound</option>
              <option value="JPY" className="bg-[#1a3d2b]">JPY - Japanese Yen</option>
            </select>
            <p className="text-xs text-white/40">
              Transactions in other currencies will be converted using ECB rates
            </p>
          </div>

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full h-12 text-base"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-[#0a2818]/30 border-t-[#0a2818] rounded-full animate-spin" />
                Importing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload and Import
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
