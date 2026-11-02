import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import Sidebar from './components/Sidebar';
import HeaderActionBar from './components/HeaderActionBar';
import StatCards from './components/StatCards';
import ChartsSection from './components/ChartsSection';
import BlackspotsSection from './components/BlackspotsSection';
import AccidentTable from './components/AccidentTable';
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
} from './utils/analytics';

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

  const overviewStats = useMemo(() => calculateOverviewStats(filteredAccidents), [filteredAccidents]);
  const monthlyData = useMemo(() => getAccidentsByMonth(filteredAccidents), [filteredAccidents]);
  const dayOfWeekData = useMemo(() => getAccidentsByDayOfWeek(filteredAccidents), [filteredAccidents]);
  const weatherData = useMemo(() => getAccidentsByWeather(filteredAccidents), [filteredAccidents]);
  const severityData = useMemo(() => getAccidentSeverityDistribution(filteredAccidents), [filteredAccidents]);

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
