import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import Sidebar from './components/Sidebar';
import HeaderActionBar from './components/HeaderActionBar';
import StatCards from './components/StatCards';
import ChartsSection from './components/ChartsSection';
import SafetyInsightsSection from './components/SafetyInsightsSection';
import BlackspotsSection from './components/BlackspotsSection';
import AccidentTable from './components/AccidentTable';
import DatabaseExplorerSection from './components/DatabaseExplorerSection';
import DataQualitySection from './components/DataQualitySection';
import DataValidationModal from './components/DataValidationModal';
import { sampleAccidents } from './data/sampleAccidents';
import { processCsvDataset } from './utils/dataProcessing';
import {
  calculateOverviewStats,
  getAccidentsByMonth,
  getAccidentsByDayOfWeek,
  getAccidentsByWeather,
  getAccidentSeverityDistribution,
  generateSafetyInsights,
} from './utils/analytics';
import {
  getMonthlyAnalytics,
  getAnalyticsOverview,
  getSeverityAnalytics,
  getWeatherAnalytics,
} from './services/api';

export default function App() {
  const [processedDataset, setProcessedDataset] = useState(() => processCsvDataset(sampleAccidents));
  const [dataSource, setDataSource] = useState({
    name: 'CTP Baseline 2024',
    isCustom: false,
    isVerified: false,
  });
  const [activeNav, setActiveNav] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    fileName: '',
    result: null,
  });

  const [severityFilter, setSeverityFilter] = useState('All');

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

  const [backendMonthly, setBackendMonthly] = useState(null);
  const [backendOverview, setBackendOverview] = useState(null);
  const [backendSeverity, setBackendSeverity] = useState(null);
  const [backendWeather, setBackendWeather] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendAnalytics() {
      try {
        const [monthlyRes, overviewRes, severityRes, weatherRes] = await Promise.all([
          getMonthlyAnalytics(null, severityFilter),
          getAnalyticsOverview(null, severityFilter),
          getSeverityAnalytics(null),
          getWeatherAnalytics(null),
        ]);
        if (isMounted) {
          if (monthlyRes && Array.isArray(monthlyRes) && monthlyRes.length > 0) {
            setBackendMonthly(monthlyRes);
          }
          if (overviewRes && overviewRes.total_accidents !== undefined) {
            setBackendOverview(overviewRes);
          }
          if (severityRes && Array.isArray(severityRes)) {
            setBackendSeverity(severityRes);
          }
          if (weatherRes && Array.isArray(weatherRes)) {
            setBackendWeather(weatherRes);
          }
        }
      } catch (err) {
        // Fallback to local calculations gracefully
      }
    }
    if (!dataSource.isCustom) {
      loadBackendAnalytics();
    } else {
      setBackendMonthly(null);
      setBackendOverview(null);
      setBackendSeverity(null);
      setBackendWeather(null);
    }
    return () => {
      isMounted = false;
    };
  }, [severityFilter, dataSource]);

  const overviewStats = useMemo(() => {
    if (backendOverview && !dataSource.isCustom) {
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
    return calculateOverviewStats(filteredAccidents);
  }, [backendOverview, dataSource.isCustom, filteredAccidents]);

  const monthlyData = useMemo(() => {
    if (backendMonthly && backendMonthly.length > 0 && !dataSource.isCustom) {
      return backendMonthly;
    }
    return getAccidentsByMonth(filteredAccidents);
  }, [backendMonthly, dataSource.isCustom, filteredAccidents]);

  const dayOfWeekData = useMemo(() => getAccidentsByDayOfWeek(filteredAccidents), [filteredAccidents]);

  const weatherData = useMemo(() => {
    if (backendWeather && backendWeather.length > 0 && !dataSource.isCustom) {
      return backendWeather;
    }
    return getAccidentsByWeather(filteredAccidents);
  }, [backendWeather, dataSource.isCustom, filteredAccidents]);

  const severityData = useMemo(() => {
    if (backendSeverity && backendSeverity.length > 0 && !dataSource.isCustom) {
      return backendSeverity;
    }
    return getAccidentSeverityDistribution(filteredAccidents);
  }, [backendSeverity, dataSource.isCustom, filteredAccidents]);

  const safetyInsights = useMemo(() => generateSafetyInsights(filteredAccidents, severityFilter), [filteredAccidents, severityFilter]);

  const handleResetFilters = () => {
    setSeverityFilter('All');
  };

  const handleInitiateValidation = (validationResult, fileName) => {
    setValidationModal({
      isOpen: true,
      fileName,
      result: validationResult,
    });
  };

  const handleCloseValidationModal = () => {
    setValidationModal({
      isOpen: false,
      fileName: '',
      result: null,
    });
  };

  const handleConfirmImport = (updatedDataset) => {
    setProcessedDataset(updatedDataset);
    setDataSource({
      name: validationModal.fileName,
      isCustom: true,
      isVerified: true,
    });
    setValidationModal({
      isOpen: false,
      fileName: '',
      result: null,
    });
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

  const handleResetSample = () => {
    setProcessedDataset(processCsvDataset(sampleAccidents));
    setDataSource({
      name: 'CTP Baseline 2024',
      isCustom: false,
      isVerified: false,
    });
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

          <SafetyInsightsSection insights={safetyInsights} />

          <BlackspotsSection accidents={filteredAccidents} />

          <AccidentTable records={filteredAccidents} />

          <DatabaseExplorerSection />

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

      <DataValidationModal
        isOpen={validationModal.isOpen}
        fileName={validationModal.fileName}
        validationResult={validationModal.result}
        onClose={handleCloseValidationModal}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}
