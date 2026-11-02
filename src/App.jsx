import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import Sidebar from './components/Sidebar';
import HeaderActionBar from './components/HeaderActionBar';
import StatCards from './components/StatCards';
import ChartsSection from './components/ChartsSection';
import BlackspotsSection from './components/BlackspotsSection';
import AccidentTable from './components/AccidentTable';
import DataValidationModal from './components/DataValidationModal';
import { sampleAccidents } from './data/sampleAccidents';
import {
  calculateOverviewStats,
  getAccidentsByMonth,
  getAccidentsByDayOfWeek,
  getAccidentsByWeather,
  getAccidentSeverityDistribution,
} from './utils/analytics';

export default function App() {
  const [accidents, setAccidents] = useState(sampleAccidents);
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

  const filteredAccidents = useMemo(() => {
    return accidents.filter((item) => {
      if (severityFilter !== 'All' && item.severity.toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }
      return true;
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

  const handleConfirmImport = (approvedRecords, importStats) => {
    setAccidents(approvedRecords);
    setDataSource({
      name: validationModal.fileName,
      isCustom: true,
      isVerified: true,
      totalUploaded: importStats.totalUploaded,
      excludedCount: importStats.excludedCount,
    });
    setValidationModal({
      isOpen: false,
      fileName: '',
      result: null,
    });
  };

  const handleResetSample = () => {
    setAccidents(sampleAccidents);
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
