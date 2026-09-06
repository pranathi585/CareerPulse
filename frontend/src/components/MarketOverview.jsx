import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Briefcase, DollarSign, LineChart, Target, Info, Search 
} from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';

const MarketOverview = ({ onSelectCareer }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/careers');
        if (!response.ok) throw new Error('Failed to fetch market data');
        const json = await response.json();
        
        // Filter out records with totally missing critical market data to keep charts clean
        const validData = json.filter(d => 
          d.current_employment != null && 
          d.projected_growth != null && 
          d.annual_openings != null
        );
        
        setData(validData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(d => 
      d.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  if (loading) {
    return (
      <section className="market-overview-section" id="market-overview">
        <div style={{ padding: '60px', textAlign: 'center', color: '#647086' }}>
          Loading Market Intelligence Data...
        </div>
      </section>
    );
  }

  if (error || data.length === 0) {
    return (
      <section className="market-overview-section" id="market-overview">
        <div style={{ padding: '60px', textAlign: 'center', color: '#e53e3e' }}>
          Unable to load market data. Please ensure the CareerPulse API is running.
        </div>
      </section>
    );
  }

  // 1. KPIs
  const totalBenchmarks = data.length;
  const topGrowth = [...data].sort((a, b) => b.projected_growth - a.projected_growth)[0];
  const topOpenings = [...data].sort((a, b) => b.annual_openings - a.annual_openings)[0];
  const topWage = [...data].sort((a, b) => (b.median_wage || 0) - (a.median_wage || 0))[0];

  // 2. Rankings (Top 5)
  const growthRanking = [...data].sort((a, b) => b.projected_growth - a.projected_growth).slice(0, 5);
  const openingsRanking = [...data].sort((a, b) => b.annual_openings - a.annual_openings).slice(0, 5);
  const wageRanking = [...data].sort((a, b) => (b.median_wage || 0) - (a.median_wage || 0)).slice(0, 5);

  // Custom Tooltip for Scatter Chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: '1px solid #e4e8f2', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <strong style={{ display: 'block', color: '#151d2e', marginBottom: '8px' }}>{p.title}</strong>
          <div style={{ fontSize: '12px', color: '#647086', marginBottom: '4px' }}>Growth: <span style={{ color: '#151d2e', fontWeight: 600 }}>{p.projected_growth}%</span></div>
          <div style={{ fontSize: '12px', color: '#647086', marginBottom: '4px' }}>Openings: <span style={{ color: '#151d2e', fontWeight: 600 }}>{p.annual_openings}k / yr</span></div>
          <div style={{ fontSize: '12px', color: '#647086' }}>Employed: <span style={{ color: '#151d2e', fontWeight: 600 }}>{(p.current_employment / 1000).toFixed(1)}k</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="market-overview-section cp-container" id="market-overview" style={{ marginBottom: 'var(--space-section)' }}>
      <div className="section-heading">
        <div>
          <span className="section-label">CAREER INTELLIGENCE</span>
          <h2>Market Intelligence</h2>
        </div>
        <p>
          Understand where career demand, growth, and opportunity are concentrated.
        </p>
      </div>

      {/* 1. KPIs */}
      <div className="market-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="market-kpi-card" style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#647086', fontWeight: 700, marginBottom: '8px' }}>Careers Tracked</div>
          <h3 style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>{totalBenchmarks}</h3>
          <p style={{ fontSize: '12px', color: '#647086', margin: '4px 0 0' }}>O*NET / BLS matched</p>
        </div>
        <div className="market-kpi-card" style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#647086', fontWeight: 700, marginBottom: '8px' }}>Highest Growth</div>
          <h3 style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>+{topGrowth.projected_growth}%</h3>
          <p style={{ fontSize: '12px', color: '#647086', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topGrowth.title}</p>
        </div>
        <div className="market-kpi-card" style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#647086', fontWeight: 700, marginBottom: '8px' }}>Most Openings</div>
          <h3 style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>{topOpenings.annual_openings}k <span style={{ fontSize: '14px', fontWeight: 500 }}>/yr</span></h3>
          <p style={{ fontSize: '12px', color: '#647086', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topOpenings.title}</p>
        </div>
        <div className="market-kpi-card" style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div className="kpi-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#647086', fontWeight: 700, marginBottom: '8px' }}>Highest Wage</div>
          <h3 style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>${(topWage.median_wage / 1000).toFixed(0)}k</h3>
          <p style={{ fontSize: '12px', color: '#647086', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topWage.title}</p>
        </div>
      </div>

      {/* 7. Insights */}
      <div className="market-insights">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600, color: '#151d2e' }}>
          <Info size={18} color="#5b6cff" /> Career Market Insights
        </div>
        <ul>
          <li><strong>{topGrowth.title}</strong> has the highest projected growth at +{topGrowth.projected_growth}%, suggesting strong emerging demand.</li>
          <li><strong>{topOpenings.title}</strong> offers the largest absolute volume of opportunity with {topOpenings.annual_openings}k annual openings.</li>
          <li><strong>{topWage.title}</strong> leads the tracked benchmarks in compensation with a median wage of ${topWage.median_wage?.toLocaleString()}.</li>
          <li>High percentage growth does not always mean high total jobs. Review the opportunity matrix below to identify careers balancing strong growth with large opening volume.</li>
        </ul>
      </div>

      {/* 2. Opportunity Matrix */}
      <div className="market-matrix-section cp-card" style={{ marginBottom: 'var(--space-md)' }}>
        <h3 className="cp-title" style={{ margin: '0 0 8px', fontSize: '18px', color: '#151d2e' }}>Career Opportunity Matrix</h3>
        <p style={{ margin: '0 0 var(--space-md)', fontSize: '14px', color: '#647086' }}>
          Visualizing the relationship between projected growth and annual openings. Bubble size represents total current employment.
        </p>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e8f2" />
              <XAxis type="number" dataKey="projected_growth" name="Growth" unit="%" stroke="#a0a8b7" fontSize={12} tickLine={false} axisLine={{ stroke: '#e4e8f2' }} />
              <YAxis type="number" dataKey="annual_openings" name="Openings" stroke="#a0a8b7" fontSize={12} tickLine={false} axisLine={false} />
              <ZAxis type="number" dataKey="current_employment" range={[50, 400]} name="Employment" />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill="#5b6cff" fillOpacity={0.6} stroke="#4658e5" strokeWidth={1} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Rankings */}
      <div className="market-rankings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }}>
        <div className="ranking-card">
          <h4>Fastest Growing (2025-35)</h4>
          {growthRanking.map(r => (
            <div className="ranking-item" key={r.onet_soc_code}>
              <span title={r.title}>{r.title}</span>
              <strong>+{r.projected_growth}%</strong>
            </div>
          ))}
        </div>
        <div className="ranking-card">
          <h4>Most Annual Openings</h4>
          {openingsRanking.map(r => (
            <div className="ranking-item" key={r.onet_soc_code}>
              <span title={r.title}>{r.title}</span>
              <strong>{r.annual_openings}k</strong>
            </div>
          ))}
        </div>
        <div className="ranking-card">
          <h4>Highest Median Wage</h4>
          {wageRanking.map(r => (
            <div className="ranking-item" key={r.onet_soc_code}>
              <span title={r.title}>{r.title}</span>
              <strong>${(r.median_wage / 1000).toFixed(0)}k</strong>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Opportunity Score & 5/6 Search Table */}
      <div className="market-search-section cp-card">
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#151d2e' }}>Career Explorer</h3>
        <p style={{ margin: '0 0 var(--space-md)', fontSize: '14px', color: '#647086' }}>
          <strong>CareerPulse Opportunity Score:</strong> A CareerPulse-derived composite based on projected growth, annual openings, median wage, and employment scale. Not an official BLS metric.
        </p>

        <div className="search-controls">
          <Search size={20} color="#a0a8b7" style={{ position: 'absolute', margin: '10px 14px' }} />
          <input 
            type="text" 
            placeholder="Search careers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        <div className="data-table-wrapper">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: '#647086' }}>Occupation</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: '#647086' }}>Employment</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: '#647086' }}>Growth</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: '#647086' }}>Annual Openings</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: '#647086' }}>Median Wage</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', color: '#5b6cff' }}>CareerPulse Opportunity Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 50).map(career => (
                <tr 
                  key={career.onet_soc_code} 
                  onClick={() => onSelectCareer && onSelectCareer(career.onet_soc_code)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                  className="hover-row"
                >
                  <td style={{ fontWeight: 500, padding: '12px 16px', color: '#0f172a' }}>{career.title}</td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', color: '#475569' }}>{career.current_employment ? (career.current_employment / 1000).toFixed(1) + 'k' : 'N/A'}</td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', color: career.projected_growth > 0 ? '#10b981' : '#ef4444' }}>
                    {career.projected_growth > 0 ? '+' : ''}{career.projected_growth}%
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', color: '#475569' }}>{career.annual_openings ? career.annual_openings + 'k' : 'N/A'}</td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', color: '#475569' }}>{career.median_wage ? '$' + career.median_wage.toLocaleString() : 'N/A'}</td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#5b6cff' }}>
                    {career.opportunity_score ? career.opportunity_score.toFixed(1) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length > 50 && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#647086', fontSize: '13px' }}>
              Showing top 50 results. Use search to find specific careers.
            </div>
          )}
        </div>
      </div>

    </section>
  );
};

export default MarketOverview;
