// Resolve production API base URL from Vite environment variable or fallback to relative '/api'
const rawApiBase = (import.meta.env?.VITE_API_BASE_URL || '/api').trim();
const normalizeApiBase = (url) => {
  const clean = (url || '/api').trim().replace(/\/+$/, '');
  if (clean.startsWith('http') && !clean.endsWith('/api')) {
    return `${clean}/api`;
  }
  return clean || '/api';
};
const API_BASE = normalizeApiBase(rawApiBase);

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error (${res.status}): ${errBody || res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    if (endpoint !== '/health' && endpoint !== '/database/status') {
      console.warn(`SafeRoutes API call to ${endpoint} failed:`, error.message);
    }
    throw error;
  }
}

export async function checkBackendHealth() {
  return fetchJson('/health');
}

export async function getDatabaseStatus() {
  return fetchJson('/database/status');
}

export async function getDatasets() {
  return fetchJson('/datasets');
}

export async function getDatasetDetails(datasetId) {
  return fetchJson(`/datasets/${datasetId}`);
}

export async function getDatasetQualityReport(datasetId) {
  return fetchJson(`/datasets/${datasetId}/quality-report`);
}

export async function getDatasetRecords(datasetId, params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchJson(`/datasets/${datasetId}/records${query ? `?${query}` : ''}`);
}

export async function getAnalyticsOverview(datasetId = null, severity = 'All') {
  const params = new URLSearchParams();
  if (datasetId) params.append('dataset_id', datasetId);
  if (severity) params.append('severity', severity);
  const q = params.toString();
  const res = await fetchJson(`/analytics/overview${q ? `?${q}` : ''}`);
  return res && res.data ? res.data : res;
}

export async function getMonthlyAnalytics(datasetId = null, severity = 'All') {
  const params = new URLSearchParams();
  if (datasetId) params.append('dataset_id', datasetId);
  if (severity) params.append('severity', severity);
  const q = params.toString();
  const res = await fetchJson(`/analytics/monthly${q ? `?${q}` : ''}`);
  return res && res.data ? res.data : res;
}

export async function getSeverityAnalytics(datasetId = null) {
  const params = new URLSearchParams();
  if (datasetId) params.append('dataset_id', datasetId);
  const q = params.toString();
  const res = await fetchJson(`/analytics/severity${q ? `?${q}` : ''}`);
  return res && res.data ? res.data : res;
}

export async function getLocationAnalytics(datasetId = null, limit = 10) {
  const params = new URLSearchParams();
  if (datasetId) params.append('dataset_id', datasetId);
  if (limit) params.append('limit', limit);
  const q = params.toString();
  const res = await fetchJson(`/analytics/locations${q ? `?${q}` : ''}`);
  return res && res.data ? res.data : res;
}

export async function getWeatherAnalytics(datasetId = null) {
  const params = new URLSearchParams();
  if (datasetId) params.append('dataset_id', datasetId);
  const q = params.toString();
  const res = await fetchJson(`/analytics/weather${q ? `?${q}` : ''}`);
  return res && res.data ? res.data : res;
}

export async function getInvestigationRecommendations(datasetId = null) {
  const params = new URLSearchParams();
  if (datasetId) params.append('dataset_id', datasetId);
  const q = params.toString();
  const res = await fetchJson(`/analytics/recommendations${q ? `?${q}` : ''}`);
  return res && res.data ? res.data : res;
}

export async function getAiSafetyInsights(datasetId = null, severityFilter = 'All') {
  return fetchJson('/ai/insights', {
    method: 'POST',
    body: JSON.stringify({
      dataset_id: datasetId ? Number(datasetId) : null,
      severity_filter: severityFilter,
      include_recommendations: true,
    }),
  });
}

export async function uploadDatasetFile(file, datasetName = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (datasetName) {
    formData.append('dataset_name', datasetName);
  }

  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${err}`);
  }

  return await res.json();
}
