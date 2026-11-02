export function getFieldValue(row, possibleKeys) {
  if (!row || typeof row !== 'object') return null;

  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null) {
      const val = String(row[key]).trim();
      if (val !== '') return val;
    }
  }

  const rowKeys = Object.keys(row);
  for (const key of possibleKeys) {
    const cleanTarget = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const match = rowKeys.find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget
    );
    if (match && row[match] !== undefined && row[match] !== null) {
      const val = String(row[match]).trim();
      if (val !== '') return val;
    }
  }

  return null;
}

export function cleanText(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

export function standardizeSeverity(rawSeverity) {
  if (!rawSeverity || typeof rawSeverity !== 'string') {
    return { standardized: 'Unknown', isRecognized: false, raw: '' };
  }
  const clean = cleanText(rawSeverity);
  if (!clean) {
    return { standardized: 'Unknown', isRecognized: false, raw: '' };
  }
  const lower = clean.toLowerCase();

  if (/fatal|death|killed|dead/.test(lower)) {
    return { standardized: 'Fatal', isRecognized: true, raw: clean };
  }
  if (/severe|grievous|major|incapacitating|critical|\bhigh\b/.test(lower)) {
    return { standardized: 'High', isRecognized: true, raw: clean };
  }
  if (/moderate|\bmed\b|\bmedium\b|simple|non-grievous/.test(lower)) {
    return { standardized: 'Medium', isRecognized: true, raw: clean };
  }
  if (/minor|trivial|property|slight|pdo|\blow\b/.test(lower)) {
    return { standardized: 'Low', isRecognized: true, raw: clean };
  }

  return { standardized: clean, isRecognized: false, raw: clean };
}

export function standardizeWeather(rawWeather) {
  if (!rawWeather || typeof rawWeather !== 'string') {
    return { standardized: 'Unknown', isRecognized: false, raw: '' };
  }
  const clean = cleanText(rawWeather);
  if (!clean) {
    return { standardized: 'Unknown', isRecognized: false, raw: '' };
  }
  const lower = clean.toLowerCase();

  if (/dense\s*fog|very\s*dense\s*fog|heavy\s*fog|thick\s*fog/.test(lower)) {
    return { standardized: 'Dense Fog', isRecognized: true, raw: clean };
  }
  if (/\bfog\b|foggy|mist|misty|shallow\s*fog/.test(lower)) {
    return { standardized: 'Fog', isRecognized: true, raw: clean };
  }
  if (/rain|rainy|drizzle|shower|thunderstorm|wet\s*weather/.test(lower)) {
    return { standardized: 'Rain', isRecognized: true, raw: clean };
  }
  if (/clear|sunny|fine\s*weather|fair|clear\s*sky/.test(lower)) {
    return { standardized: 'Clear', isRecognized: true, raw: clean };
  }
  if (/cloudy|overcast|partly\s*cloudy/.test(lower)) {
    return { standardized: 'Cloudy', isRecognized: true, raw: clean };
  }
  if (/haze|hazy|smog|smoke/.test(lower)) {
    return { standardized: 'Haze', isRecognized: true, raw: clean };
  }
  if (/wind|windy|dust\s*storm|storm|gale/.test(lower)) {
    return { standardized: 'Windy', isRecognized: true, raw: clean };
  }

  return { standardized: clean, isRecognized: false, raw: clean };
}

export function standardizeRoadCondition(rawRoad) {
  if (!rawRoad || typeof rawRoad !== 'string') {
    return { standardized: 'Unknown', isRecognized: false, raw: '' };
  }
  const clean = cleanText(rawRoad);
  if (!clean) {
    return { standardized: 'Unknown', isRecognized: false, raw: '' };
  }
  const lower = clean.toLowerCase();

  if (/dry|normal|good/.test(lower)) {
    return { standardized: 'Dry', isRecognized: true, raw: clean };
  }
  if (/wet|damp/.test(lower)) {
    return { standardized: 'Wet', isRecognized: true, raw: clean };
  }
  if (/foggy\s*surface|dew/.test(lower)) {
    return { standardized: 'Foggy Surface', isRecognized: true, raw: clean };
  }
  if (/waterlogged|flooded|standing\s*water/.test(lower)) {
    return { standardized: 'Waterlogged', isRecognized: true, raw: clean };
  }
  if (/slippery|oil|greasy/.test(lower)) {
    return { standardized: 'Slippery', isRecognized: true, raw: clean };
  }
  if (/pothole|damaged|broken|rough/.test(lower)) {
    return { standardized: 'Potholed / Damaged', isRecognized: true, raw: clean };
  }

  return { standardized: clean, isRecognized: false, raw: clean };
}

export function validateAndFormatDate(rawDate) {
  if (!rawDate || typeof rawDate !== 'string') {
    return { isValid: false, formatted: null, error: 'Missing date value' };
  }
  const clean = cleanText(rawDate);
  if (!clean) {
    return { isValid: false, formatted: null, error: 'Missing date value' };
  }

  const datePart = clean.includes(' ') ? clean.split(' ')[0] : clean;
  let parsed = null;

  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(datePart)) {
    const parts = datePart.split(/[-/.]/);
    parsed = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(datePart)) {
    const parts = datePart.split(/[-/.]/);
    parsed = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  } else {
    parsed = new Date(datePart);
  }

  if (!parsed || isNaN(parsed.getTime())) {
    return { isValid: false, formatted: null, error: `Invalid date format: "${clean}"` };
  }

  const year = parsed.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1990 || year > currentYear + 1) {
    return { isValid: false, formatted: null, error: `Year out of valid range (${year})` };
  }

  if (parsed.getTime() > Date.now() + 86400000) {
    return { isValid: false, formatted: null, error: `Date cannot be in the future (${datePart})` };
  }

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');

  return { isValid: true, formatted: `${yyyy}-${mm}-${dd}`, error: null };
}

export function validateCasualtyCount(val, fieldName) {
  if (val === undefined || val === null || String(val).trim() === '') {
    return { isValid: false, value: 0, isMissing: true, error: `Missing ${fieldName} count` };
  }
  const str = cleanText(val);
  const num = Number(str);

  if (isNaN(num)) {
    return { isValid: false, value: 0, isMissing: false, error: `Non-numeric ${fieldName}: "${str}"` };
  }
  if (!Number.isInteger(num)) {
    return { isValid: false, value: Math.floor(num), isMissing: false, error: `${fieldName} must be a whole number` };
  }
  if (num < 0) {
    return { isValid: false, value: num, isMissing: false, error: `Negative ${fieldName} count (${num})` };
  }

  return { isValid: true, value: num, isMissing: false, error: null };
}

export function checkChandigarhLocation(location = '', sector = '', corridor = '') {
  const combined = cleanText(`${location} ${sector} ${corridor}`).toLowerCase();

  const outsideDistricts = [
    'panchkula', 'mohali', 'sas nagar', 'zirakpur', 'kharar',
    'ambala', 'delhi', 'karnal', 'patiala', 'ludhiana', 'shimla',
    'pinjore', 'kalka', 'dera bassi', 'solan', 'kurukshetra', 'panipat'
  ];

  for (const outside of outsideDistricts) {
    const reg = new RegExp(`\\b${outside}\\b`, 'i');
    if (reg.test(combined)) {
      return {
        isConfirmed: false,
        isOutside: true,
        message: `Location indicates outside Chandigarh UT (${outside.toUpperCase()})`
      };
    }
  }

  const sectorRegex = /\b(?:sector|sec\.?)\s*(?:[1-9]|[1-5][0-9]|6[0-3])\b/i;
  if (sectorRegex.test(combined)) {
    return { isConfirmed: true, isOutside: false, message: 'Confirmed Chandigarh Sector' };
  }

  const corridors = [
    'madhya marg', 'dakshin marg', 'purv marg', 'vikas marg',
    'himalaya marg', 'sarovar marg', 'jan marg', 'vidya marg',
    'shanti path', 'udyog path', 'sukhna path', 'nh-05', 'nh-5'
  ];
  for (const c of corridors) {
    if (combined.includes(c)) {
      return { isConfirmed: true, isOutside: false, message: 'Confirmed Chandigarh Corridor' };
    }
  }

  const landmarks = [
    'tribune chowk', 'transport chowk', 'housing board', 'kalagram',
    'hallomajra', 'poultry farm', 'matka chowk', 'cricket stadium',
    'kisan bhawan', 'piccadilly', 'aroma', 'press chowk', 'pgi',
    'pgimer', 'panjab university', 'sukhna lake', 'manimajra', 'mani majra',
    'mauli jagran', 'dadu majra', 'maloya', 'dhanas', 'kajheri',
    'burail', 'industrial area', 'it park', 'kishangarh', 'isbt 17',
    'isbt 43', 'railway station', 'behlana', 'chandigarh', 'chd'
  ];
  for (const l of landmarks) {
    if (combined.includes(l)) {
      return { isConfirmed: true, isOutside: false, message: 'Confirmed Chandigarh Landmark' };
    }
  }

  return {
    isConfirmed: false,
    isOutside: false,
    message: 'Location cannot be confirmed within Chandigarh UT road network'
  };
}

export function processCsvDataset(rawRows = []) {
  const processedRecords = [];
  const seenIds = new Map();
  const duplicateFingerprints = new Map();
  const nearFingerprints = new Map();

  let validCount = 0;
  let warningCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  let totalMissingFields = 0;

  const validRows = rawRows.filter((r) => r && Object.values(r).some((v) => v && String(v).trim() !== ''));

  validRows.forEach((row, idx) => {
    const rowNumber = idx + 1;
    const issues = [];
    const missingFields = [];

    const rawDate = getFieldValue(row, [
      'date', 'accident_date', 'accidentDate', 'crash_date', 'crashDate',
      'date_of_crash', 'incident_date', 'incidentDate', 'CRASH_DATE'
    ]);
    const rawTime = getFieldValue(row, [
      'time', 'accident_time', 'accidentTime', 'crash_time', 'time_of_crash', 'incident_time'
    ]);
    const rawLocation = getFieldValue(row, [
      'location', 'accident_location', 'accidentLocation', 'black_spot', 'blackspot',
      'place_of_occurrence', 'chowk', 'intersection', 'light_point', 'road_name'
    ]);
    const rawSector = getFieldValue(row, [
      'sector', 'area', 'zone', 'police_station', 'ps'
    ]);
    const rawCorridor = getFieldValue(row, [
      'corridor', 'arterial_road', 'highway', 'road'
    ]);
    const rawWeather = getFieldValue(row, [
      'weather', 'weather_condition', 'weatherCondition', 'atmospheric_condition'
    ]);
    const rawRoad = getFieldValue(row, [
      'road_condition', 'roadCondition', 'surface_condition', 'road_surface', 'surface'
    ]);
    const rawSeverity = getFieldValue(row, [
      'severity', 'crash_severity', 'accident_severity', 'injury_severity', 'severity_level'
    ]);
    const rawInjuries = getFieldValue(row, [
      'injuries', 'injury_count', 'injured', 'persons_injured', 'total_injuries'
    ]);
    const rawFatalities = getFieldValue(row, [
      'fatalities', 'fatality_count', 'deaths', 'killed', 'persons_killed', 'total_fatalities'
    ]);

    if (!rawDate) {
      issues.push({ field: 'Date', severity: 'error', message: 'Missing required accident date' });
      missingFields.push('Date');
    }
    if (!rawLocation) {
      issues.push({ field: 'Location', severity: 'error', message: 'Missing required accident location' });
      missingFields.push('Location');
    }
    if (!rawSeverity) {
      issues.push({ field: 'Severity', severity: 'error', message: 'Missing required crash severity' });
      missingFields.push('Severity');
    }
    if (!rawSector) {
      issues.push({ field: 'Sector', severity: 'warning', message: 'Sector not provided' });
      missingFields.push('Sector');
    }
    if (!rawWeather) {
      issues.push({ field: 'Weather', severity: 'warning', message: 'Weather condition not provided' });
      missingFields.push('Weather');
    }
    if (!rawRoad) {
      missingFields.push('Road Surface');
    }

    const dateResult = validateAndFormatDate(rawDate);
    if (!dateResult.isValid && rawDate) {
      issues.push({ field: 'Date', severity: 'error', message: dateResult.error });
    }

    const injuriesResult = validateCasualtyCount(rawInjuries, 'Injuries');
    if (!injuriesResult.isValid) {
      if (injuriesResult.isMissing) {
        issues.push({ field: 'Injuries', severity: 'warning', message: 'Injuries count not recorded (treated as 0)' });
        missingFields.push('Injuries');
      } else {
        issues.push({ field: 'Injuries', severity: 'error', message: injuriesResult.error });
      }
    }

    const fatalitiesResult = validateCasualtyCount(rawFatalities, 'Fatalities');
    if (!fatalitiesResult.isValid) {
      if (fatalitiesResult.isMissing) {
        issues.push({ field: 'Fatalities', severity: 'warning', message: 'Fatalities count not recorded (treated as 0)' });
        missingFields.push('Fatalities');
      } else {
        issues.push({ field: 'Fatalities', severity: 'error', message: fatalitiesResult.error });
      }
    }

    const weatherResult = standardizeWeather(rawWeather);
    if (!weatherResult.isRecognized && rawWeather) {
      issues.push({
        field: 'Weather',
        severity: 'warning',
        message: `Unrecognized weather "${rawWeather}". Retained as "${weatherResult.standardized}" without inventing data.`
      });
    }

    const roadResult = standardizeRoadCondition(rawRoad);

    const severityResult = standardizeSeverity(rawSeverity);
    if (!severityResult.isRecognized && rawSeverity) {
      issues.push({
        field: 'Severity',
        severity: 'error',
        message: `Unrecognized severity "${rawSeverity}". Expected: Fatal, High, Medium, or Low.`
      });
    }

    const locationCheck = checkChandigarhLocation(rawLocation || '', rawSector || '', rawCorridor || '');
    if (!locationCheck.isConfirmed) {
      issues.push({
        field: 'Location',
        severity: 'warning',
        message: locationCheck.message
      });
    }

    const cleanedDate = dateResult.isValid ? dateResult.formatted : (rawDate || null);
    const cleanedLocation = cleanText(rawLocation) || 'Unknown';
    const cleanedSector = cleanText(rawSector) || 'Unknown';
    const cleanedCorridor = cleanText(rawCorridor) || 'Unknown';
    const cleanedWeather = weatherResult.standardized;
    const cleanedRoad = roadResult.standardized;
    const cleanedSeverity = severityResult.standardized;
    const cleanedInjuries = injuriesResult.isValid ? injuriesResult.value : 0;
    const cleanedFatalities = fatalitiesResult.isValid ? fatalitiesResult.value : 0;
    const cleanedTime = cleanText(rawTime) || null;

    let isDuplicate = false;
    let duplicateOfRow = null;

    const rawId = getFieldValue(row, ['accident_id', 'id', 'record_id', 'incident_id']);
    if (rawId) {
      if (seenIds.has(rawId)) {
        isDuplicate = true;
        duplicateOfRow = seenIds.get(rawId);
        issues.push({
          field: 'Duplicate ID',
          severity: 'warning',
          message: `Duplicate accident ID "${rawId}" (already assigned to Row #${duplicateOfRow})`
        });
      } else {
        seenIds.set(rawId, rowNumber);
      }
    }

    if (dateResult.isValid && cleanedLocation !== 'Unknown') {
      const timeComponent = cleanedTime ? cleanedTime.toLowerCase() : '';
      const dupKey = `${cleanedDate}|${cleanedLocation.toLowerCase()}|${timeComponent}|${cleanedSeverity.toLowerCase()}|${cleanedInjuries}|${cleanedFatalities}`;
      const nearKey = `${cleanedDate}|${cleanedLocation.toLowerCase()}`;

      if (duplicateFingerprints.has(dupKey)) {
        isDuplicate = true;
        duplicateOfRow = duplicateFingerprints.get(dupKey);
        issues.push({
          field: 'Duplicate',
          severity: 'warning',
          message: `Exact duplicate of Row #${duplicateOfRow} (matching Date, Location, Time, Severity, and Casualties)`
        });
      } else if (nearFingerprints.has(nearKey)) {
        const nearRow = nearFingerprints.get(nearKey);
        issues.push({
          field: 'Duplicate',
          severity: 'warning',
          message: `Potential near-duplicate of Row #${nearRow} (matching Date and Location with slight variance)`
        });
      } else {
        nearFingerprints.set(nearKey, rowNumber);
      }

      if (!duplicateFingerprints.has(dupKey)) {
        duplicateFingerprints.set(dupKey, rowNumber);
      }
    }

    if (isDuplicate) {
      duplicateCount++;
    }

    totalMissingFields += missingFields.length;

    const hasErrors = issues.some((i) => i.severity === 'error');
    const hasWarnings = issues.some((i) => i.severity === 'warning');

    let status = 'valid';
    if (hasErrors) {
      status = 'invalid';
      invalidCount++;
    } else if (hasWarnings) {
      status = 'warning';
      warningCount++;
    } else {
      validCount++;
    }

    const defaultExcluded = hasErrors || isDuplicate;

    processedRecords.push({
      id: `proc-rec-${rowNumber}`,
      rowNumber,
      status,
      issues,
      isDuplicate,
      duplicateOfRow,
      isLocationUnverified: !locationCheck.isConfirmed,
      missingFields,
      isExcluded: defaultExcluded,
      cleaned: {
        id: `rec-${rowNumber}`,
        date: cleanedDate,
        location: cleanedLocation,
        sector: cleanedSector,
        corridor: cleanedCorridor,
        weatherCondition: cleanedWeather,
        roadCondition: cleanedRoad,
        severity: cleanedSeverity,
        injuries: cleanedInjuries,
        fatalities: cleanedFatalities,
      },
      raw: { ...row }
    });
  });

  const total = validRows.length;
  const qualityPercentage = total > 0
    ? Math.max(0, Math.min(100, Math.round(((validCount * 1.0 + warningCount * 0.5) / total) * 100)))
    : 100;

  return {
    totalRecords: total,
    validRecords: validCount,
    warningRecords: warningCount,
    invalidRecords: invalidCount,
    duplicateRecords: duplicateCount,
    missingFieldCount: totalMissingFields,
    qualityPercentage,
    processedRecords
  };
}

