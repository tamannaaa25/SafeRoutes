import React from 'react';

export default function BlackspotsSection({ accidents = [] }) {
  const locationStats = React.useMemo(() => {
    const map = {};

    accidents.forEach((record) => {
      const loc = (record.location || 'Unknown').trim();
      if (!map[loc]) {
        map[loc] = {
          location: loc,
          sector: record.sector || 'Chandigarh',
          corridor: record.corridor || 'Arterial Corridor',
          crashes: 0,
          injuries: 0,
          fatalities: 0,
        };
      }
      map[loc].crashes += 1;
      map[loc].injuries += Number(record.injuries) || 0;
      map[loc].fatalities += Number(record.fatalities) || 0;
    });

    return Object.values(map)
      .sort((a, b) => b.crashes - a.crashes || b.fatalities - a.fatalities)
      .slice(0, 3);
  }, [accidents]);

  return (
    <section id="blackspots" className="blackspots-section">
      <div className="section-header">
        <h2 className="section-title">Priority Blackspot Corridors</h2>
      </div>

      <div className="blackspots-grid">
        {locationStats.length > 0 ? (
          locationStats.map((item, index) => {
            const isTop = index === 0;
            return (
              <div
                key={item.location}
                className={`card blackspot-card ${isTop ? 'blackspot-card-top' : ''}`}
              >
                <div className="blackspot-card-header">
                  <span className="blackspot-rank">#{index + 1}</span>
                  <span className={`risk-tag ${item.fatalities > 0 ? 'risk-tag-critical' : 'risk-tag-high'}`}>
                    {item.fatalities > 0 ? 'Critical' : 'High Risk'}
                  </span>
                </div>

                <div className="blackspot-body">
                  <div className="blackspot-name" title={item.location}>
                    {item.location}
                  </div>
                  <div className="blackspot-meta">
                    {[item.sector, item.corridor].filter(Boolean).join(', ')}
                  </div>
                </div>

                <div className="blackspot-stats-row">
                  <div className="blackspot-stat-item">
                    <span className="blackspot-stat-val">{item.crashes}</span>
                    <span className="blackspot-stat-lbl">Crashes</span>
                  </div>
                  <div className="blackspot-stat-item">
                    <span className="blackspot-stat-val">{item.injuries}</span>
                    <span className="blackspot-stat-lbl">Injuries</span>
                  </div>
                  <div className="blackspot-stat-item">
                    <span
                      className="blackspot-stat-val"
                      style={{ color: item.fatalities > 0 ? '#dc2626' : 'inherit' }}
                    >
                      {item.fatalities}
                    </span>
                    <span className="blackspot-stat-lbl">Fatalities</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card empty-state-box">
            No blackspot data available for the selected filters.
          </div>
        )}
      </div>
    </section>
  );
}
