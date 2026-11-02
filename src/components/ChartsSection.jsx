import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const WEATHER_COLORS = {
  Clear: '#3b82f6',
  'Dense Fog': '#475569',
  Fog: '#94a3b8',
  Rain: '#1d4ed8',
  Cloudy: '#0284c7',
  Haze: '#cbd5e1',
  'Haze / Smog': '#64748b',
  Unknown: '#e2e8f0',
};

const DEFAULT_WEATHER_COLORS = ['#3b82f6', '#475569', '#1d4ed8', '#0284c7', '#94a3b8', '#64748b', '#cbd5e1'];

const SEVERITY_COLORS = {
  Minor: '#0284c7',
  Moderate: '#d97706',
  Severe: '#ea580c',
  Fatal: '#dc2626',
};

const CustomTooltip = ({ active, payload, label, unit = 'crashes' }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="custom-tooltip">
        <span className="custom-tooltip-label">{label || item.name}</span>
        <span className="custom-tooltip-value">
          {item.value} {unit}
        </span>
      </div>
    );
  }
  return null;
};

export default function ChartsSection({
  monthlyData = [],
  dayOfWeekData = [],
  weatherData = [],
  severityData = [],
}) {
  return (
    <section id="analytics" className="charts-section">
      <div className="charts-grid">
        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Accidents by Month</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <Tooltip content={<CustomTooltip unit="crashes" />} />
                <Bar dataKey="accidents" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Accidents by Day of Week</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <Tooltip content={<CustomTooltip unit="crashes" />} />
                <Bar dataKey="accidents" fill="#475569" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Weather Distribution</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={weatherData}
                  cx="50%"
                  cy="46%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {weatherData.map((entry, index) => (
                    <Cell
                      key={`weather-cell-${index}`}
                      fill={WEATHER_COLORS[entry.name] || DEFAULT_WEATHER_COLORS[index % DEFAULT_WEATHER_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip unit="crashes" />} />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Severity Breakdown</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="46%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {severityData.map((entry) => (
                    <Cell
                      key={`severity-cell-${entry.name}`}
                      fill={SEVERITY_COLORS[entry.name] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip unit="crashes" />} />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
