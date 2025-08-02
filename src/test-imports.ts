// Test file to check imports
import { CSVUploader } from '@/components/settings/CSVUploader';
import { NSECompanyList } from '@/components/settings/NSECompanyList';
import { DuplicateReport } from '@/components/settings/DuplicateReport';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  loadNSECompanies,
  uploadNSECompaniesCSV,
  searchNSECompanies,
  clearNSECompanies,
  setNSESearchTerm,
  clearNSECompaniesError,
  clearDuplicates
} from '@/lib/redux/slices';

console.log('All imports successful');