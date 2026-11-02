const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function calculateOverviewStats(accidents = []) {
  if (!accidents.length) {
    return {
      totalAccidents: 0,
      totalInjuries: 0,
      totalFatalities: 0,
      topLocation: 'N/A',
      topLocationCount: 0,
      uniqueLocationsCount: 0,
    };
  }

  let totalInjuries = 0;
  let totalFatalities = 0;
  const locationCounts = {};

  accidents.forEach((record) => {
    const injuries = Number(record.injuries) || 0;
    const fatalities = Number(record.fatalities) || 0;
    totalInjuries += injuries;
    totalFatalities += fatalities;

    const loc = (record.location || 'Unknown Location').trim();
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });

  let topLocation = 'N/A';
  let maxAccidentsAtLocation = 0;

  Object.entries(locationCounts).forEach(([loc, count]) => {
    if (count > maxAccidentsAtLocation) {
      maxAccidentsAtLocation = count;
      topLocation = loc;
    }
  });

  return {
    totalAccidents: accidents.length,
    totalInjuries,
    totalFatalities,
    topLocation,
    topLocationCount: maxAccidentsAtLocation,
    uniqueLocationsCount: Object.keys(locationCounts).length,
  };
}

export function getAccidentsByMonth(accidents = []) {
  const monthMap = {};
  MONTH_NAMES.forEach((m) => {
    monthMap[m] = 0;
  });

  accidents.forEach((record) => {
    const d = parseDate(record.date);
    if (d) {
      const monthName = MONTH_NAMES[d.getMonth()];
      monthMap[monthName] = (monthMap[monthName] || 0) + 1;
    }
  });

  return MONTH_NAMES.map((month) => ({
    month,
    accidents: monthMap[month] || 0,
  }));
}

export function getAccidentsByDayOfWeek(accidents = []) {
  const dayMap = {};
  DAY_NAMES.forEach((day) => {
    dayMap[day] = 0;
  });

  accidents.forEach((record) => {
    const d = parseDate(record.date);
    if (d) {
      const dayName = DAY_NAMES[d.getDay()];
      dayMap[dayName] = (dayMap[dayName] || 0) + 1;
    }
  });

  return DAY_NAMES.map((day) => ({
    day,
    accidents: dayMap[day] || 0,
  }));
}

export function getAccidentsByWeather(accidents = []) {
  const weatherMap = {};

  accidents.forEach((record) => {
    const weather = (record.weatherCondition || 'Unknown').trim();
    const formatted = weather.charAt(0).toUpperCase() + weather.slice(1);
    weatherMap[formatted] = (weatherMap[formatted] || 0) + 1;
  });

  return Object.entries(weatherMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getAccidentSeverityDistribution(accidents = []) {
  const severityMap = {
    'Fatal': 0,
    'High / Severe': 0,
    'Medium / Moderate': 0,
    'Low / Minor': 0,
  };

  accidents.forEach((record) => {
    const raw = (record.severity || 'Low').trim().toLowerCase();

    if (raw.includes('fatal') || raw.includes('death') || raw.includes('killed')) {
      severityMap['Fatal'] += 1;
    } else if (raw.includes('severe') || raw.includes('grievous') || raw.includes('major') || raw === 'high') {
      severityMap['High / Severe'] += 1;
    } else if (raw.includes('mod') || raw.includes('simple') || raw.includes('medium') || raw === 'med') {
      severityMap['Medium / Moderate'] += 1;
    } else {
      severityMap['Low / Minor'] += 1;
    }
  });

  return Object.entries(severityMap).map(([name, value]) => ({
    name,
    value,
  }));
}

export function getTopAccidentLocations(accidents = [], limit = 5) {
  const map = {};
  accidents.forEach((record) => {
    const loc = (record.location || 'Unknown').trim();
    map[loc] = (map[loc] || 0) + 1;
  });

  return Object.entries(map)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

import {
  standardizeWeather,
  standardizeSeverity,
  standardizeRoadCondition,
  validateAndFormatDate,
  getFieldValue
} from './dataProcessing.js';

export function normalizeCsvRecord(rawRow, index) {
  const rawDate = getFieldValue(rawRow, [
    'date', 'accident_date', 'accidentDate', 'crash_date', 'crashDate',
    'date_of_crash', 'incident_date', 'incidentDate', 'CRASH_DATE'
  ]);
  const dateRes = validateAndFormatDate(rawDate);
  const date = dateRes.isValid ? dateRes.formatted : (rawDate || '');

  const location = getFieldValue(rawRow, [
    'location', 'accident_location', 'accidentLocation', 'black_spot', 'blackspot',
    'place_of_occurrence', 'chowk', 'intersection', 'light_point', 'road_name'
  ]) || 'Unspecified Location';

  const sector = getFieldValue(rawRow, [
    'sector', 'area', 'zone', 'police_station', 'ps'
  ]) || '';

  const corridor = getFieldValue(rawRow, [
    'corridor', 'arterial_road', 'highway', 'road'
  ]) || '';

  const rawWeather = getFieldValue(rawRow, [
    'weather', 'weather_condition', 'weatherCondition', 'atmospheric_condition'
  ]);
  const weatherCondition = standardizeWeather(rawWeather).standardized;

  const rawRoad = getFieldValue(rawRow, [
    'road_condition', 'roadCondition', 'surface_condition', 'road_surface', 'surface'
  ]);
  const roadCondition = standardizeRoadCondition(rawRoad).standardized;

  const rawSeverity = getFieldValue(rawRow, [
    'severity', 'crash_severity', 'accident_severity', 'injury_severity', 'severity_level'
  ]);
  const severity = standardizeSeverity(rawSeverity).standardized;

  const injuriesRaw = getFieldValue(rawRow, ['injuries', 'injury_count', 'injured', 'persons_injured', 'total_injuries']);
  const injuriesNum = parseInt(injuriesRaw, 10);
  const injuries = !isNaN(injuriesNum) && injuriesNum >= 0 ? injuriesNum : 0;

  const fatalitiesRaw = getFieldValue(rawRow, ['fatalities', 'fatality_count', 'deaths', 'killed', 'persons_killed', 'total_fatalities']);
  const fatalitiesNum = parseInt(fatalitiesRaw, 10);
  const fatalities = !isNaN(fatalitiesNum) && fatalitiesNum >= 0 ? fatalitiesNum : 0;

  return {
    id: rawRow.id || `chd-csv-${index + 1}`,
    date,
    location,
    sector,
    corridor,
    weatherCondition,
    roadCondition,
    severity,
    injuries,
    fatalities,
  };
}
