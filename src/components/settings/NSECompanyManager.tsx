'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import type { RootState } from '@/types';
import {
  loadNSECompanies,
  uploadNSECompaniesCSV,
  searchNSECompanies,
  clearNSECompanies,
  setNSESearchTerm,
  clearNSECompaniesError,
  clearDuplicates
} from '@/lib/redux/slices';
import { CSVUploader } from './CSVUploader';
import { NSECompanyList } from './NSECompanyList';
import { DuplicateReport } from './DuplicateReport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export function NSECompanyManager() {
  const dispatch = useAppDispatch();
  const {
    data: companies,
    loading,
    error,
    searchTerm,
    uploadProgress,
    duplicates
  } = useAppSelector((state: RootState) => state.nseCompanies);

  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    dispatch(loadNSECompanies());
  }, [dispatch]);

  const handleSearch = (value: string) => {
    dispatch(setNSESearchTerm(value));
    if (value.trim()) {
      dispatch(searchNSECompanies(value));
    } else {
      dispatch(loadNSECompanies());
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all NSE company data? This action cannot be undone.')) {
      await dispatch(clearNSECompanies());
      dispatch(clearDuplicates());
    }
  };

  const handleCSVUpload = async (csvContent: string) => {
    try {
      await dispatch(uploadNSECompaniesCSV(csvContent)).unwrap();
      setShowUploader(false);
    } catch (error) {
      // Error is handled by the Redux slice
    }
  };

  const handleCloseUploader = () => {
    setShowUploader(false);
    dispatch(clearNSECompaniesError());
  };

  const handleCloseDuplicateReport = () => {
    dispatch(clearDuplicates());
  };

  return (
    <div className="space-y-6">
      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-medium">NSE Companies</h3>
            <p className="text-sm text-muted-foreground">
              {companies.length} companies loaded
            </p>
          </div>
          {companies.length > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>Data Available</span>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowUploader(true)}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload CSV</span>
          </Button>
          
          {companies.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Data</span>
            </Button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {loading && uploadProgress > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading CSV...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Duplicate Report */}
      {duplicates && duplicates.totalDuplicates > 0 && (
        <DuplicateReport
          duplicates={duplicates}
          onClose={handleCloseDuplicateReport}
        />
      )}

      {/* CSV Uploader Modal */}
      {showUploader && (
        <CSVUploader
          onUpload={handleCSVUpload}
          onClose={handleCloseUploader}
          loading={loading}
        />
      )}

      {/* Search and Company List */}
      {companies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search companies by symbol, name, or ISIN..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <NSECompanyList
            companies={companies}
            loading={loading}
            searchTerm={searchTerm}
          />
        </div>
      )}

      {/* Empty State */}
      {companies.length === 0 && !loading && !showUploader && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No NSE Company Data</h3>
                <p className="text-muted-foreground">
                  Upload a CSV file containing NSE company data to get started
                </p>
              </div>
              <Button onClick={() => setShowUploader(true)}>
                Upload NSE Companies CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}