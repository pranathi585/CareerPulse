import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

export default function CareerComparison({ initialCareerA, onClose }) {
  const [careerA, setCareerA] = useState(initialCareerA || '');
  const [careerB, setCareerB] = useState('');
  const [allCareers, setAllCareers] = useState([]);
  
  const [compareData, setCompareData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/careers')
      .then(r => r.json())
      .then(d => setAllCareers(d))
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);


  useEffect(() => {
    if (careerA && careerB) {
      setLoading(true);
      setError(null);
      fetch(`http://localhost:8000/api/careers/compare?codes=${careerA}&codes=${careerB}`)
        .then(r => r.json())
        .then(d => {
          setCompareData(d);
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setError('Failed to load comparison data.');
          setLoading(false);
        });
    } else {
      setCompareData([]);
    }
  }, [careerA, careerB]);

  const generateMarketTradeoffs = (dataA, dataB) => {
    if (!dataA || !dataB) return null;
    let tradeoffs = [];
    if (dataA.projected_growth > dataB.projected_growth && dataB.current_employment > dataA.current_employment) {
      tradeoffs.push(`${dataA.title} has stronger projected growth, while ${dataB.title} has a larger employment base.`);
    } else if (dataB.projected_growth > dataA.projected_growth && dataA.current_employment > dataB.current_employment) {
      tradeoffs.push(`${dataB.title} has stronger projected growth, while ${dataA.title} has a larger employment base.`);
    }
    
    if (dataB.annual_openings > dataA.annual_openings && dataA.median_wage > dataB.median_wage) {
      tradeoffs.push(`${dataB.title} has more annual openings, while ${dataA.title} has a higher median wage.`);
    } else if (dataA.annual_openings > dataB.annual_openings && dataB.median_wage > dataA.median_wage) {
      tradeoffs.push(`${dataA.title} has more annual openings, while ${dataB.title} has a higher median wage.`);
    }

    if (tradeoffs.length === 0) {
      return 'The two careers show similar market indicators across the selected measures.';
    }
    return tradeoffs.join(' ');
  };

  const calculateSkillOverlap = (dataA, dataB) => {
    if (!dataA || !dataB || !dataA.top_skills || !dataB.top_skills) return { percentage: 0, shared: [], diffA: [], diffB: [], interpretation: 'No skill data available.' };
    
    let sumOverlap = 0;
    let sumTotal = 0;
    
    const skillsA = {};
    dataA.top_skills.forEach(s => skillsA[s.name] = s.importance);
    
    const skillsB = {};
    dataB.top_skills.forEach(s => skillsB[s.name] = s.importance);
    
    const allSkillNames = new Set([...Object.keys(skillsA), ...Object.keys(skillsB)]);
    
    const shared = [];
    const diffA = [];
    const diffB = [];

    allSkillNames.forEach(name => {
      const impA = skillsA[name] || 0;
      const impB = skillsB[name] || 0;
      
      sumOverlap += Math.min(impA, impB);
      sumTotal += Math.max(impA, impB);
      
      if (impA > 0 && impB > 0) {
        shared.push({ name, impA, impB });
      } else if (impA > 0) {
        diffA.push({ name, impA });
      } else if (impB > 0) {
        diffB.push({ name, impB });
      }
    });

    const percentage = sumTotal > 0 ? Math.round((sumOverlap / sumTotal) * 100) : 0;
    
    let interpretation = '';
    if (percentage >= 70) interpretation = 'The two careers share a strong set of important skill requirements.';
    else if (percentage >= 40) interpretation = 'The careers share several important skill requirements, but meaningful differences remain.';
    else interpretation = 'The careers have limited overlap in important skill requirements.';

    shared.sort((a, b) => Math.max(b.impA, b.impB) - Math.max(a.impA, a.impB));
    diffA.sort((a, b) => b.impA - a.impA);
    diffB.sort((a, b) => b.impB - a.impB);

    return { percentage, shared, diffA, diffB, interpretation };
  };

  const dataA = compareData.find(d => d.onet_soc_code === careerA);
  const dataB = compareData.find(d => d.onet_soc_code === careerB);
  
  const tradeoffs = generateMarketTradeoffs(dataA, dataB);
  const overlap = calculateSkillOverlap(dataA, dataB);

  const formatEdu = (edu) => {
    if (!edu || edu.length === 0) return 'Not available';
    const cat = edu[0].category;
    const mapping = {
      1: 'Less than High School', 2: 'High School Diploma', 3: 'Post-Secondary Cert',
      4: 'Some College', 5: "Associate's Degree", 6: "Bachelor's Degree", 7: "Post-Baccalaureate Cert",
      8: "Master's Degree", 9: "Post-Master's Cert", 10: 'First Professional', 11: 'Doctoral Degree', 12: 'Post-Doctoral'
    };
    return mapping[cat] || `Level ${cat}`;
  };

  return (
    <div className="career-modal-overlay">
      <div className="career-modal-container" style={{ maxWidth: '1000px' }}>
        <header className="career-modal-header">
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>Career Comparison</h1>
            <p style={{ margin: '8px 0 0 0', color: '#647086' }}>Compare career paths by market opportunity, skills, technology exposure, and preparation.</p>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={24} color="#647086" />
          </button>
        </header>

        <div className="career-modal-scroll-area" style={{ padding: 'var(--space-md)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', background: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', color: '#647086', fontWeight: 700 }}>Career A</label>
              <select style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 500, color: '#0f172a' }} value={careerA} onChange={e => setCareerA(e.target.value)}>
                <option value="">-- Select Career A --</option>
                {allCareers.map(c => <option key={c.onet_soc_code} value={c.onet_soc_code}>{c.title}</option>)}
              </select>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '24px' }}>VS</div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', color: '#647086', fontWeight: 700 }}>Career B</label>
              <select style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 500, color: '#0f172a' }} value={careerB} onChange={e => setCareerB(e.target.value)}>
                <option value="">-- Select Career B --</option>
                {allCareers.map(c => <option key={c.onet_soc_code} value={c.onet_soc_code}>{c.title}</option>)}
              </select>
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#647086' }}>Loading comparison...</div>}
          
          {dataA && dataB && !loading && (
            <div className="compare-results-grid">
              
              <section className="modal-section" style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "16px", marginTop: "40px" }}>01 &mdash; Market Outlook</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Metric</th>
                      <th style={{ width: '35%', color: '#5b6cff' }}>{dataA.title}</th>
                      <th style={{ width: '35%', color: '#10b981' }}>{dataB.title}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>BLS Employment</td>
                      <td>{dataA.current_employment?.toLocaleString() || 'N/A'}</td>
                      <td>{dataB.current_employment?.toLocaleString() || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>BLS Projected Growth</td>
                      <td style={{ color: dataA.projected_growth > 0 ? '#10b981' : '#e53e3e' }}>{dataA.projected_growth > 0 ? '+' : ''}{dataA.projected_growth}%</td>
                      <td style={{ color: dataB.projected_growth > 0 ? '#10b981' : '#e53e3e' }}>{dataB.projected_growth > 0 ? '+' : ''}{dataB.projected_growth}%</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>BLS Annual Openings</td>
                      <td>{dataA.annual_openings ? dataA.annual_openings + 'k' : 'N/A'}</td>
                      <td>{dataB.annual_openings ? dataB.annual_openings + 'k' : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>BLS Median Wage</td>
                      <td>{dataA.median_wage ? '$' + dataA.median_wage.toLocaleString() : 'N/A'}</td>
                      <td>{dataB.median_wage ? '$' + dataB.median_wage.toLocaleString() : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>CareerPulse Opportunity Score</td>
                      <td style={{ fontWeight: 700, color: '#5b6cff' }}>{dataA.opportunity_score?.toFixed(1) || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>{dataB.opportunity_score?.toFixed(1) || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="modal-section cp-card" style={{ marginBottom: 'var(--space-md)' }}>
                <h3 className="cp-title" style={{ marginBottom: 'var(--space-sm)' }}>Market Trade-offs</h3>
                <div style={{ padding: 'var(--space-sm)', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', lineHeight: 1.5 }}>
                  <Info size={18} color="#5b6cff" style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} />
                  {tradeoffs}
                </div>
              </section>

              <section className="modal-section cp-card" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "16px", marginTop: "40px" }}>02 &mdash; Preparation</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Requirement</th>
                      <th style={{ width: '35%' }}>{dataA.title}</th>
                      <th style={{ width: '35%' }}>{dataB.title}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>O*NET Job Zone</td>
                      <td>{dataA.job_zone || 'Not available'}</td>
                      <td>{dataB.job_zone || 'Not available'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Primary Education</td>
                      <td>{formatEdu(dataA.education_distribution)}</td>
                      <td>{formatEdu(dataB.education_distribution)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="modal-section cp-card" style={{ marginBottom: 'var(--space-md)' }}>
                <h3 className="cp-title">Career Transition</h3>
                <p className="section-subtext" style={{ marginBottom: 'var(--space-md)' }}>See how closely two career paths overlap in their occupational skill requirements.</p>
                
                <div style={{ padding: 'var(--space-md)', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#647086', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CareerPulse Skill Requirement Overlap</div>
                  <div style={{ fontSize: '48px', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>{overlap.percentage}%</div>
                  <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 500, marginBottom: '12px' }}>{overlap.interpretation}</div>
                  <div style={{ fontSize: '12px', color: '#647086', maxWidth: '600px', margin: '0 auto', lineHeight: '1.4' }}>
                    Derived from O*NET skill-importance ratings. This measures similarity in occupational skill requirements, not hiring probability or guaranteed transition ease.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: 'var(--space-sm)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#5b6cff' }}>More important in {dataA.title}</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569' }}>
                      {overlap.diffA.slice(0, 5).map(s => <li key={s.name} style={{ marginBottom: '6px' }}>{s.name} <span style={{ color: '#94a3b8' }}>({s.impA})</span></li>)}
                      {overlap.diffA.length === 0 && <li>None</li>}
                    </ul>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: 'var(--space-sm)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a' }}>Important in Both</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569' }}>
                      {overlap.shared.slice(0, 5).map(s => <li key={s.name} style={{ marginBottom: '6px' }}>{s.name}</li>)}
                      {overlap.shared.length === 0 && <li>None</li>}
                    </ul>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: 'var(--space-sm)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#10b981' }}>More important in {dataB.title}</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569' }}>
                      {overlap.diffB.slice(0, 5).map(s => <li key={s.name} style={{ marginBottom: '6px' }}>{s.name} <span style={{ color: '#94a3b8' }}>({s.impB})</span></li>)}
                      {overlap.diffB.length === 0 && <li>None</li>}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="modal-section" style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "16px", marginTop: "40px" }}>03 &mdash; Core Skills</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ color: '#5b6cff', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>{dataA.title}</h4>
                    {dataA.top_skills?.slice(0,8).map(s => (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                        <span>{s.name}</span>
                        <span style={{ color: '#647086' }}>Imp: {s.importance} | Lvl: {s.level}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ color: '#10b981', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>{dataB.title}</h4>
                    {dataB.top_skills?.slice(0,8).map(s => (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                        <span>{s.name}</span>
                        <span style={{ color: '#647086' }}>Imp: {s.importance} | Lvl: {s.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="modal-section" style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "16px", marginTop: "40px" }}>04 &mdash; Technology Exposure</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ color: '#5b6cff', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>{dataA.title}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {dataA.top_technologies?.map(t => (
                        <span key={t.name} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, background: t.in_demand === 'Y' ? '#f59e0b' : (t.hot_technology === 'Y' ? '#eef2ff' : '#f1f5f9'), color: t.in_demand === 'Y' ? '#fff' : (t.hot_technology === 'Y' ? '#5b6cff' : '#475569'), border: t.hot_technology === 'Y' && t.in_demand !== 'Y' ? '1px solid #c7d2fe' : 'none' }}>
                          {t.name} {t.in_demand === 'Y' ? '(In-Demand)' : (t.hot_technology === 'Y' ? '(Hot)' : '')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ color: '#10b981', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>{dataB.title}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {dataB.top_technologies?.map(t => (
                        <span key={t.name} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, background: t.in_demand === 'Y' ? '#f59e0b' : (t.hot_technology === 'Y' ? '#d1fae5' : '#f1f5f9'), color: t.in_demand === 'Y' ? '#fff' : (t.hot_technology === 'Y' ? '#10b981' : '#475569'), border: t.hot_technology === 'Y' && t.in_demand !== 'Y' ? '1px solid #a7f3d0' : 'none' }}>
                          {t.name} {t.in_demand === 'Y' ? '(In-Demand)' : (t.hot_technology === 'Y' ? '(Hot)' : '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
