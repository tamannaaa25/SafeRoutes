import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import Sidebar from './components/Sidebar';
import HeaderActionBar from './components/HeaderActionBar';
import StatCards from './components/StatCards';
import ChartsSection from './components/ChartsSection';
import SafetyInsightsSection from './components/SafetyInsightsSection';
import BlackspotsSection from './components/BlackspotsSection';
import AccidentTable from './components/AccidentTable';
import DataQualitySection from './components/DataQualitySection';
import DataValidationModal from './components/DataValidationModal';
import { sampleAccidents } from './data/sampleAccidents';
import { processCsvDataset, transformBackendRecordsToProcessed } from './utils/dataProcessing';
import {
  calculateOverviewStats,
  getAccidentsByMonth,
  getAccidentsByDayOfWeek,
  getAccidentsByWeather,
  getAccidentSeverityDistribution,
  generateSafetyInsights,
} from './utils/analytics';
import {
  getDatasets,
  getDatasetRecords,
  getDatasetQualityReport,
  getMonthlyAnalytics,
  getAnalyticsOverview,
  getSeverityAnalytics,
  getWeatherAnalytics,
  uploadDatasetFile,
} from './services/api';

export default function App() {
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [processedDataset, setProcessedDataset] = useState(() => processCsvDataset(sampleAccidents));
  const [dataSource, setDataSource] = useState({
    name: 'Chandigarh Demonstration Dataset',
    isCustom: false,
    isVerified: false,
    id: null,
    totalRecords: sampleAccidents.length,
  });
  const [activeNav, setActiveNav] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    fileName: '',
    result: null,
    file: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [severityFilter, setSeverityFilter] = useState('All');

  const [backendMonthly, setBackendMonthly] = useState(null);
  const [backendOverview, setBackendOverview] = useState(null);
  const [backendSeverity, setBackendSeverity] = useState(null);
  const [backendWeather, setBackendWeather] = useState(null);

  const accidents = useMemo(() => {
    return (processedDataset.processedRecords || [])
      .filter((r) => !r.isExcluded)
      .map((r) => r.cleaned);
  }, [processedDataset]);

  const filteredAccidents = useMemo(() => {
    return accidents.filter((item) => {
      if (severityFilter === 'All') return true;
      const s = (item.severity || '').toLowerCase();
      const f = severityFilter.toLowerCase();
      if (f === 'high' || f === 'severe') return s === 'high' || s === 'severe';
      if (f === 'medium' || f === 'moderate') return s === 'medium' || s === 'moderate';
      if (f === 'low' || f === 'minor') return s === 'low' || s === 'minor';
      if (f === 'fatal') return s === 'fatal';
      return s === f;
    });
  }, [accidents, severityFilter]);

  const loadDatasetData = useCallback(async (targetDatasetId, targetName = null, filterSev = 'All') => {
    if (!targetDatasetId) return;

    try {
      const [recordsRes, qualityRes, overviewRes, monthlyRes, severityRes, weatherRes] = await Promise.allSettled([
        getDatasetRecords(targetDatasetId, { page_size: 500 }),
        getDatasetQualityReport(targetDatasetId),
        getAnalyticsOverview(targetDatasetId, filterSev),
        getMonthlyAnalytics(targetDatasetId, filterSev),
        getSeverityAnalytics(targetDatasetId),
        getWeatherAnalytics(targetDatasetId),
      ]);

      const recordsData = recordsRes.status === 'fulfilled' ? recordsRes.value : null;
      const qualityData = qualityRes.status === 'fulfilled' ? qualityRes.value : null;
      const overviewData = overviewRes.status === 'fulfilled' ? overviewRes.value : null;
      const monthlyData = monthlyRes.status === 'fulfilled' ? monthlyRes.value : null;
      const severityData = severityRes.status === 'fulfilled' ? severityRes.value : null;
      const weatherData = weatherRes.status === 'fulfilled' ? weatherRes.value : null;

      if (recordsData && Array.isArray(recordsData.records)) {
        const transformed = transformBackendRecordsToProcessed(recordsData.records, qualityData);
        setProcessedDataset(transformed);
      }

      setBackendOverview(overviewData && overviewData.total_accidents !== undefined ? overviewData : null);
      setBackendMonthly(monthlyData && Array.isArray(monthlyData) && monthlyData.length > 0 ? monthlyData : null);
      setBackendSeverity(severityData && Array.isArray(severityData) && severityData.length > 0 ? severityData : null);
      setBackendWeather(weatherData && Array.isArray(weatherData) && weatherData.length > 0 ? weatherData : null);

      const resolvedName = targetName || qualityData?.dataset_name || `Dataset #${targetDatasetId}`;
      const isBaseline = resolvedName.toLowerCase().includes('demonstration') || resolvedName.toLowerCase().includes('demo');

      setDataSource({
        id: targetDatasetId,
        name: resolvedName,
        isCustom: !isBaseline,
        isVerified: true,
        totalRecords: qualityData?.total_records || recordsData?.total_records || 0,
      });
    } catch (err) {
      console.warn('Failed to load dataset from backend:', err.message);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const datasets = await getDatasets();
        if (isMounted && Array.isArray(datasets) && datasets.length > 0) {
          setAvailableDatasets(datasets);
          // Prefer dataset 9 (15 records) or first available
          const preferred = datasets.find((d) => d.id === 9) || datasets[0];
          setSelectedDatasetId(preferred.id);
          await loadDatasetData(preferred.id, preferred.dataset_name, severityFilter);
          return;
        }
      } catch (e) {
        console.warn('Could not retrieve datasets list from backend:', e.message);
      }
      if (isMounted) {
        setProcessedDataset(processCsvDataset(sampleAccidents));
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadDatasetData]);

  useEffect(() => {
    let isMounted = true;
    async function updateFilterAnalytics() {
      if (!selectedDatasetId) return;
      try {
        const [overviewRes, monthlyRes] = await Promise.allSettled([
          getAnalyticsOverview(selectedDatasetId, severityFilter),
          getMonthlyAnalytics(selectedDatasetId, severityFilter),
        ]);
        if (isMounted) {
          if (overviewRes.status === 'fulfilled' && overviewRes.value?.total_accidents !== undefined) {
            setBackendOverview(overviewRes.value);
          }
          if (monthlyRes.status === 'fulfilled' && Array.isArray(monthlyRes.value)) {
            setBackendMonthly(monthlyRes.value);
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    updateFilterAnalytics();
    return () => {
      isMounted = false;
    };
  }, [severityFilter, selectedDatasetId]);

  const overviewStats = useMemo(() => {
    if (backendOverview && backendOverview.total_accidents !== undefined && severityFilter === 'All') {
      return {
        totalAccidents: backendOverview.total_accidents,
        totalInjuries: backendOverview.total_injuries,
        totalFatalities: backendOverview.total_fatalities,
        topLocation: backendOverview.top_location,
        topLocationCount: backendOverview.top_location_count,
        uniqueLocationsCount: backendOverview.unique_locations_count,
        validCount: backendOverview.valid_records,
        invalidCount: backendOverview.invalid_records,
      };
    }
    const local = calculateOverviewStats(filteredAccidents);
    return {
      ...local,
      validCount: processedDataset.validRecords,
      invalidCount: processedDataset.invalidRecords,
    };
  }, [backendOverview, filteredAccidents, processedDataset, severityFilter]);

  const monthlyData = useMemo(() => {
    if (backendMonthly && backendMonthly.length > 0) {
      return backendMonthly;
    }
    return getAccidentsByMonth(filteredAccidents);
  }, [backendMonthly, filteredAccidents]);

  const dayOfWeekData = useMemo(() => getAccidentsByDayOfWeek(filteredAccidents), [filteredAccidents]);

  const weatherData = useMemo(() => {
    if (backendWeather && backendWeather.length > 0) {
      return backendWeather;
    }
    return getAccidentsByWeather(filteredAccidents);
  }, [backendWeather, filteredAccidents]);

  const severityData = useMemo(() => {
    if (backendSeverity && backendSeverity.length > 0) {
      return backendSeverity;
    }
    return getAccidentSeverityDistribution(filteredAccidents);
  }, [backendSeverity, filteredAccidents]);

  const safetyInsights = useMemo(() => generateSafetyInsights(filteredAccidents, severityFilter), [filteredAccidents, severityFilter]);

  const handleResetFilters = () => {
    setSeverityFilter('All');
  };

  const handleSelectDataset = async (datasetId) => {
    setSelectedDatasetId(datasetId);
    const ds = availableDatasets.find((d) => d.id === datasetId);
    await loadDatasetData(datasetId, ds ? ds.dataset_name : null, severityFilter);
  };

  const handleInitiateValidation = (validationResult, fileName, file = null) => {
    setValidationModal({
      isOpen: true,
      fileName,
      result: validationResult,
      file,
    });
  };

  const handleCloseValidationModal = () => {
    setValidationModal({
      isOpen: false,
      fileName: '',
      result: null,
      file: null,
    });
  };

  const handleConfirmImport = async (updatedDataset) => {
    const newSourceName = validationModal.fileName || 'Custom Dataset';
    const uploadedFile = validationModal.file;

    setProcessedDataset(updatedDataset);
    setDataSource({
      name: newSourceName,
      isCustom: true,
      isVerified: true,
      id: null,
      totalRecords: updatedDataset.totalRecords,
    });
    setBackendMonthly(null);
    setBackendOverview(null);
    setBackendSeverity(null);
    setBackendWeather(null);

    setValidationModal({
      isOpen: false,
      fileName: '',
      result: null,
      file: null,
    });

    if (uploadedFile) {
      setIsUploading(true);
      setUploadError(null);
      try {
        const uploadRes = await uploadDatasetFile(uploadedFile, newSourceName);
        if (uploadRes && uploadRes.dataset && uploadRes.dataset.id) {
          const newId = uploadRes.dataset.id;
          setSelectedDatasetId(newId);
          try {
            const datasetsList = await getDatasets();
            if (Array.isArray(datasetsList)) {
              setAvailableDatasets(datasetsList);
            }
          } catch (e) {
            // Ignore
          }
          await loadDatasetData(newId, newSourceName, severityFilter);
        }
      } catch (err) {
        console.warn('Backend CSV dataset upload synchronization failed; running with validated client data:', err.message);
        setUploadError(err.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleToggleRecordExclusion = (recordId) => {
    setProcessedDataset((prev) => ({
      ...prev,
      processedRecords: prev.processedRecords.map((r) =>
        r.id === recordId ? { ...r, isExcluded: !r.isExcluded } : r
      ),
    }));
  };

  const handleBatchExcludeInvalid = () => {
    setProcessedDataset((prev) => ({
      ...prev,
      processedRecords: prev.processedRecords.map((r) =>
        r.status === 'invalid' || r.isDuplicate ? { ...r, isExcluded: true } : r
      ),
    }));
  };

  const handleBatchRestoreAll = () => {
    setProcessedDataset((prev) => ({
      ...prev,
      processedRecords: prev.processedRecords.map((r) => ({ ...r, isExcluded: false })),
    }));
  };

  const handleBatchIncludeOnlyValid = () => {
    setProcessedDataset((prev) => ({
      ...prev,
      processedRecords: prev.processedRecords.map((r) => ({
        ...r,
        isExcluded: r.status !== 'valid',
      })),
    }));
  };

  const handleResetSample = async () => {
    const baseline = availableDatasets.find(
      (d) =>
        d.id === 8 ||
        (d.dataset_name && d.dataset_name.toLowerCase().includes('demonstration')) ||
        (d.dataset_name && d.dataset_name.toLowerCase().includes('demo'))
    );
    if (baseline) {
      setSelectedDatasetId(baseline.id);
      await loadDatasetData(baseline.id, baseline.dataset_name, 'All');
      setSeverityFilter('All');
    } else {
      setSelectedDatasetId(null);
      setSeverityFilter('All');
      setProcessedDataset(processCsvDataset(sampleAccidents));
      setDataSource({
        name: 'Chandigarh Road Accidents Demonstration Dataset',
        isCustom: false,
        isVerified: false,
        id: null,
        totalRecords: sampleAccidents.length,
      });
      setBackendMonthly(null);
      setBackendOverview(null);
      setBackendSeverity(null);
      setBackendWeather(null);
    }
  };

  const handleExportCSV = () => {
    if (!filteredAccidents || filteredAccidents.length === 0) {
      alert('No records available to export with the current filter settings.');
      return;
    }

    const exportRows = filteredAccidents.map((item) => ({
      'Accident Date': item.date,
      Location: item.location,
      Sector: item.sector || '',
      Corridor: item.corridor || '',
      'Weather Condition': item.weatherCondition,
      'Road Condition': item.roadCondition,
      Severity: item.severity,
      Injuries: item.injuries,
      Fatalities: item.fatalities,
    }));

    const csvString = Papa.unparse(exportRows);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chandigarh_accident_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeNav={activeNav}
        onNavSelect={setActiveNav}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        currentSource={dataSource}
      />

      <div className="main-wrapper">
        <HeaderActionBar
          availableDatasets={availableDatasets}
          selectedDatasetId={selectedDatasetId}
          onSelectDataset={handleSelectDataset}
          severityFilter={severityFilter}
          onSeverityFilterChange={setSeverityFilter}
          onResetFilters={handleResetFilters}
          onExportCSV={handleExportCSV}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          filteredCount={filteredAccidents.length}
          totalCount={accidents.length}
          currentSource={dataSource}
          onInitiateValidation={handleInitiateValidation}
          onResetSample={handleResetSample}
        />

        <main className="dashboard-content">
          <StatCards stats={overviewStats} />

          <ChartsSection
            monthlyData={monthlyData}
            dayOfWeekData={dayOfWeekData}
            weatherData={weatherData}
            severityData={severityData}
          />

          <SafetyInsightsSection
            insights={safetyInsights}
            datasetId={selectedDatasetId}
            severityFilter={severityFilter}
          />

          <BlackspotsSection accidents={filteredAccidents} />

          <AccidentTable records={filteredAccidents} />

          <DataQualitySection
            qualityReport={processedDataset}
            onToggleRecordExclusion={handleToggleRecordExclusion}
            onBatchExcludeInvalid={handleBatchExcludeInvalid}
            onBatchRestoreAll={handleBatchRestoreAll}
            onBatchIncludeOnlyValid={handleBatchIncludeOnlyValid}
            currentSource={dataSource}
          />
        </main>
      </div>

      {validationModal.isOpen && validationModal.result && (
        <DataValidationModal
          isOpen={validationModal.isOpen}
          fileName={validationModal.fileName}
          validationResult={validationModal.result}
          onClose={handleCloseValidationModal}
          onConfirmImport={handleConfirmImport}
        />
      )}
    </div>
  );
}
