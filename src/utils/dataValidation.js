export function getFieldFromRow(row, possibleKeys) {
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

export function standardizeWeather(rawWeather) {
  if (!rawWeather || typeof rawWeather !== 'string') {
    return { standardized: 'Unspecified', isRecognized: false, raw: '' };
  }
  const trimmed = rawWeather.trim();
  if (!trimmed) {
    return { standardized: 'Unspecified', isRecognized: false, raw: '' };
  }
  const lower = trimmed.toLowerCase();

  if (/dense\s*fog|very\s*dense\s*fog|heavy\s*fog|thick\s*fog/.test(lower)) {
    return { standardized: 'Dense Fog', isRecognized: true, raw: trimmed };
  }
  if (/\bfog\b|foggy|mist|misty|shallow\s*fog/.test(lower)) {
    return { standardized: 'Fog', isRecognized: true, raw: trimmed };
  }
  if (/rain|rainy|drizzle|shower|thunderstorm|wet\s*weather/.test(lower)) {
    return { standardized: 'Rain', isRecognized: true, raw: trimmed };
  }
  if (/clear|sunny|fine\s*weather|fair|clear\s*sky/.test(lower)) {
    return { standardized: 'Clear', isRecognized: true, raw: trimmed };
  }
  if (/cloudy|overcast|partly\s*cloudy/.test(lower)) {
    return { standardized: 'Cloudy', isRecognized: true, raw: trimmed };
  }
  if (/haze|hazy|smog|haze\s*\/\s*smog|smoke/.test(lower)) {
    return { standardized: 'Haze / Smog', isRecognized: true, raw: trimmed };
  }
  if (/wind|windy|dust\s*storm|storm|gale/.test(lower)) {
    return { standardized: 'Windy / Dust Storm', isRecognized: true, raw: trimmed };
  }

  return { standardized: trimmed, isRecognized: false, raw: trimmed };
}

export function standardizeSeverity(rawSeverity) {
  if (!rawSeverity || typeof rawSeverity !== 'string') {
    return { standardized: 'Unclassified', isRecognized: false, raw: '' };
  }
  const trimmed = rawSeverity.trim();
  if (!trimmed) {
    return { standardized: 'Unclassified', isRecognized: false, raw: '' };
  }
  const lower = trimmed.toLowerCase();

  if (/fatal|death|killed|dead/.test(lower)) {
    return { standardized: 'Fatal', isRecognized: true, raw: trimmed };
  }
  if (/severe|grievous|major|incapacitating|critical/.test(lower)) {
    return { standardized: 'Severe', isRecognized: true, raw: trimmed };
  }
  if (/moderate|mod|medium|simple|non-grievous/.test(lower)) {
    return { standardized: 'Moderate', isRecognized: true, raw: trimmed };
  }
  if (/minor|trivial|property|slight|pdo/.test(lower)) {
    return { standardized: 'Minor', isRecognized: true, raw: trimmed };
  }

  return { standardized: trimmed, isRecognized: false, raw: trimmed };
}

export function validateDate(rawDate) {
  if (!rawDate || typeof rawDate !== 'string') {
    return { isValid: false, formatted: '', error: 'Date is missing' };
  }
  const trimmed = rawDate.trim();
  if (!trimmed) {
    return { isValid: false, formatted: '', error: 'Date is missing' };
  }

  let parsed = null;
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    parsed = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    parsed = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  } else {
    parsed = new Date(trimmed);
  }

  if (!parsed || isNaN(parsed.getTime())) {
    return { isValid: false, formatted: '', error: `Invalid date format: "${trimmed}"` };
  }

  const year = parsed.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1990 || year > currentYear + 1) {
    return { isValid: false, formatted: '', error: `Implausible year (${year})` };
  }

  if (parsed.getTime() > Date.now() + 86400000) {
    return { isValid: false, formatted: '', error: `Date cannot be in the future (${trimmed})` };
  }

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return { isValid: true, formatted: `${yyyy}-${mm}-${dd}`, error: null };
}

export function validateCasualty(val, fieldName) {
  if (val === undefined || val === null || String(val).trim() === '') {
    return { isValid: false, value: 0, isMissing: true, error: `Missing ${fieldName} count` };
  }
  const str = String(val).trim();
  const num = Number(str);
  if (isNaN(num)) {
    return { isValid: false, value: 0, isMissing: false, error: `Non-numeric ${fieldName}: "${str}"` };
  }
  if (!Number.isInteger(num)) {
    return { isValid: false, value: Math.floor(num), isMissing: false, error: `${fieldName} must be an integer` };
  }
  if (num < 0) {
    return { isValid: false, value: num, isMissing: false, error: `Negative ${fieldName} count (${num})` };
  }
  return { isValid: true, value: num, isMissing: false, error: null };
}

export function verifyChandigarhLocation(location = '', sector = '', corridor = '') {
  const combined = `${location} ${sector} ${corridor}`.toLowerCase();

  const outsideRegions = [
    'panchkula', 'mohali', 'sas nagar', 'zirakpur', 'kharar',
    'ambala', 'delhi', 'karnal', 'patiala', 'ludhiana', 'shimla',
    'pinjore', 'kalka', 'dera bassi', 'solan', 'kurukshetra', 'panipat'
  ];

  for (const outside of outsideRegions) {
    const reg = new RegExp(`\\b${outside}\\b`, 'i');
    if (reg.test(combined)) {
      return {
        isConfirmed: false,
        isOutside: true,
        matchedRegion: outside.charAt(0).toUpperCase() + outside.slice(1),
        message: `Location outside Chandigarh UT (${outside.toUpperCase()})`
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
    'isbt 43', 'railway station', 'behlana', 'attawa', 'badheri',
    'daria', 'colony no 4', 'colony no 5', 'rose garden', 'rock garden',
    'chandigarh', 'chd'
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

export function validateAndCleanDataset(rawRows = []) {
  const processedRecords = [];
  const duplicateMap = new Map();

  let validCount = 0;
  let missingInfoCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  let unverifiedLocationCount = 0;

  const validRows = rawRows.filter((r) => r && Object.values(r).some((v) => v && String(v).trim() !== ''));

  validRows.forEach((row, idx) => {
    const rowNumber = idx + 1;
    const issues = [];

    const rawDate = getFieldFromRow(row, [
      'Accident Date', 'accidentDate', 'Date of Crash', 'Crash Date', 'Date', 'date', 'CRASH_DATE'
    ]);
    const rawLocation = getFieldFromRow(row, [
      'Location', 'location', 'Black Spot', 'Blackspot', 'Chowk', 'Light Point', 'Intersection', 'Place of Occurrence', 'Road Name'
    ]);
    const rawSector = getFieldFromRow(row, [
      'Sector', 'sector', 'Area', 'Police Station', 'PS', 'Zone'
    ]);
    const rawCorridor = getFieldFromRow(row, [
      'Corridor', 'corridor', 'Arterial Road', 'Highway', 'Road'
    ]);
    const rawWeather = getFieldFromRow(row, [
      'Weather Condition', 'weatherCondition', 'Weather', 'weather', 'Atmospheric Condition'
    ]);
    const rawRoad = getFieldFromRow(row, [
      'Road Condition', 'roadCondition', 'Road Surface', 'Road'
    ]);
    const rawSeverity = getFieldFromRow(row, [
      'Severity', 'severity', 'Crash Severity', 'Injury Severity', 'Accident Classification'
    ]);
    const rawInjuries = getFieldFromRow(row, [
      'Injuries', 'injuries', 'Injured', 'Total Injuries', 'Persons Injured'
    ]);
    const rawFatalities = getFieldFromRow(row, [
      'Fatalities', 'fatalities', 'Killed', 'Deaths', 'Total Fatalities', 'Persons Killed'
    ]);

    let hasMissingInfo = false;

    if (!rawDate) {
      issues.push({ field: 'Date', severity: 'error', message: 'Missing crash date' });
      hasMissingInfo = true;
    }
    if (!rawLocation) {
      issues.push({ field: 'Location', severity: 'error', message: 'Missing location details' });
      hasMissingInfo = true;
    }
    if (!rawSeverity) {
      issues.push({ field: 'Severity', severity: 'error', message: 'Missing crash severity' });
      hasMissingInfo = true;
    }
    if (!rawSector) {
      issues.push({ field: 'Sector', severity: 'warning', message: 'Sector not specified' });
      hasMissingInfo = true;
    }
    if (!rawWeather) {
      issues.push({ field: 'Weather', severity: 'warning', message: 'Weather condition not specified' });
      hasMissingInfo = true;
    }

    const dateResult = validateDate(rawDate);
    if (!dateResult.isValid && rawDate) {
      issues.push({ field: 'Date', severity: 'error', message: dateResult.error });
    }

    const injuriesResult = validateCasualty(rawInjuries, 'Injuries');
    if (!injuriesResult.isValid) {
      if (injuriesResult.isMissing) {
        issues.push({ field: 'Injuries', severity: 'warning', message: 'Injuries not provided, counted as 0' });
        hasMissingInfo = true;
      } else {
        issues.push({ field: 'Injuries', severity: 'error', message: injuriesResult.error });
      }
    }

    const fatalitiesResult = validateCasualty(rawFatalities, 'Fatalities');
    if (!fatalitiesResult.isValid) {
      if (fatalitiesResult.isMissing) {
        issues.push({ field: 'Fatalities', severity: 'warning', message: 'Fatalities not provided, counted as 0' });
        hasMissingInfo = true;
      } else {
        issues.push({ field: 'Fatalities', severity: 'error', message: fatalitiesResult.error });
      }
    }

    const weatherResult = standardizeWeather(rawWeather);
    if (!weatherResult.isRecognized && rawWeather) {
      issues.push({
        field: 'Weather',
        severity: 'warning',
        message: `Unrecognized weather "${rawWeather}". Retained as "${weatherResult.standardized}" without assumption.`
      });
    }

    const severityResult = standardizeSeverity(rawSeverity);
    if (!severityResult.isRecognized && rawSeverity) {
      issues.push({
        field: 'Severity',
        severity: 'error',
        message: `Unrecognized severity "${rawSeverity}". Expected: Fatal, Severe, Moderate, or Minor.`
      });
    }

    const locationCheck = verifyChandigarhLocation(rawLocation || '', rawSector || '', rawCorridor || '');
    if (!locationCheck.isConfirmed) {
      unverifiedLocationCount++;
      issues.push({
        field: 'Location',
        severity: 'warning',
        message: locationCheck.message
      });
    }

    const finalDate = dateResult.isValid ? dateResult.formatted : (rawDate || '');
    const finalLocation = rawLocation ? rawLocation.trim() : 'Unspecified Location';
    const finalSector = rawSector ? rawSector.trim() : '';
    const finalCorridor = rawCorridor ? rawCorridor.trim() : '';
    const finalWeather = weatherResult.standardized;
    const finalRoad = rawRoad ? rawRoad.trim() : 'Unspecified';
    const finalSeverity = severityResult.standardized;
    const finalInjuries = injuriesResult.isValid ? injuriesResult.value : 0;
    const finalFatalities = fatalitiesResult.isValid ? fatalitiesResult.value : 0;

    let isDuplicate = false;
    let duplicateOfRow = null;
    const dupKey = `${finalDate.toLowerCase()}|${finalLocation.toLowerCase()}|${finalSeverity.toLowerCase()}|${finalInjuries}|${finalFatalities}`;

    if (finalDate && finalLocation !== 'Unspecified Location') {
      if (duplicateMap.has(dupKey)) {
        isDuplicate = true;
        duplicateOfRow = duplicateMap.get(dupKey);
        duplicateCount++;
        issues.push({
          field: 'Duplicate',
          severity: 'warning',
          message: `Potential duplicate of Row #${duplicateOfRow} (matching Date, Location, Severity, and Casualties)`
        });
      } else {
        duplicateMap.set(dupKey, rowNumber);
      }
    }

    if (hasMissingInfo) {
      missingInfoCount++;
    }

    const hasErrors = issues.some((i) => i.severity === 'error');
    const hasWarnings = issues.some((i) => i.severity === 'warning');

    let status = 'valid';
    if (hasErrors) {
      status = 'invalid';
      invalidCount++;
    } else if (hasWarnings) {
      status = 'warning';
    } else {
      validCount++;
    }

    const isDefaultIncluded = !hasErrors && !isDuplicate;

    processedRecords.push({
      id: `verified-csv-${rowNumber}-${Date.now()}`,
      rowNumber,
      status,
      issues,
      isDuplicate,
      duplicateOfRow,
      isLocationUnverified: !locationCheck.isConfirmed,
      hasMissingInfo,
      included: isDefaultIncluded,
      normalized: {
        id: `rec-${rowNumber}`,
        date: finalDate,
        location: finalLocation,
        sector: finalSector,
        corridor: finalCorridor,
        weatherCondition: finalWeather,
        roadCondition: finalRoad,
        severity: finalSeverity,
        injuries: finalInjuries,
        fatalities: finalFatalities,
      },
      raw: row
    });
  });

  return {
    totalRecords: validRows.length,
    validRecords: validCount,
    missingRecords: missingInfoCount,
    invalidRecords: invalidCount,
    duplicateRecords: duplicateCount,
    locationVerificationRecords: unverifiedLocationCount,
    processedRecords
  };
}
