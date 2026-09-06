import React, { useState, useEffect } from 'react';
import { X, GitCompare, ChevronRight, Info, CheckCircle2, Zap, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import CareerPathways from './CareerPathways';

export default function CareerExplorerDetail({ careerSoc, onClose, onCompareCareer, onSelectCareer }) {
  const [data, setData] = useState({
    details: null,
    skills: [],
    tech: [],
    tasks: [],
    related: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const fetchCareerDetails = async () => {
      setLoading(true);
      try {
        const [detRes, skiRes, tecRes, tskRes, relRes] = await Promise.allSettled([
          fetch(`http://localhost:8000/api/careers/${careerSoc}`),
          fetch(`http://localhost:8000/api/careers/${careerSoc}/skills`),
          fetch(`http://localhost:8000/api/careers/${careerSoc}/technology`),
          fetch(`http://localhost:8000/api/careers/${careerSoc}/tasks?limit=6`),
          fetch(`http://localhost:8000/api/careers/${careerSoc}/related`)
        ]);

        if (detRes.status === 'rejected') throw new Error('Failed to load career details');

        setData({
          details: detRes.value.ok ? await detRes.value.json() : null,
          skills: skiRes.status === 'fulfilled' && skiRes.value.ok ? await skiRes.value.json() : [],
          tech: tecRes.status === 'fulfilled' && tecRes.value.ok ? await tecRes.value.json() : [],
          tasks: tskRes.status === 'fulfilled' && tskRes.value.ok ? await tskRes.value.json() : [],
          related: relRes.status === 'fulfilled' && relRes.value.ok ? await relRes.value.json() : []
        });

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (careerSoc) {
      fetchCareerDetails();
    }
  }, [careerSoc]);

  const handleOpenCompare = () => {
    if (onCompareCareer) {
      onCompareCareer(data.details.onet_soc_code);
    }
  };

  if (loading) {
    return (
      <div className="career-modal-overlay">
        <div className="career-modal-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#647086', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity className="animate-spin" /> Loading Career Intelligence...
          </div>
        </div>
      </div>
    );
  }

  if (error || !data.details) {
    return (
      <div className="career-modal-overlay">
        <div className="career-modal-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#e53e3e', fontSize: '18px', marginBottom: '16px' }}>{error || 'Career not found'}</div>
            <button className="primary-button" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const c = data.details;
  const topSkills = [...data.skills].slice(0, 10);
  
  const inDemandTech = data.tech.filter(t => t.in_demand === 'Y');
  const hotTech = data.tech.filter(t => t.hot_technology === 'Y' && t.in_demand !== 'Y');
  const otherTech = data.tech.filter(t => t.in_demand !== 'Y' && t.hot_technology !== 'Y').slice(0, 15);

  const generateDecisionSummary = () => {
    let summary = "";
    if (c.projected_growth > 5) summary += "The BLS projection indicates strong employment growth for this occupation over the next decade. ";
    else if (c.projected_growth < 0) summary += "The BLS projection indicates a decline in employment for this occupation over the next decade. ";
    else summary += "The BLS projection indicates average or stable growth for this occupation. ";

    if (c.annual_openings > 50) summary += "Market scale is substantial, with a high volume of annual openings. ";
    else if (c.annual_openings < 5) summary += "Market scale is small, indicating fewer annual openings and higher competition. ";

    if (c.median_annual_wage > 100000) summary += "Compensation positioning is highly favorable relative to national medians. ";
    else if (c.median_annual_wage > 60000) summary += "Compensation is positioned solidly in the middle-to-upper tier. ";

    summary += `O*NET reports Job Zone ${c.job_zone || 'Unknown'}, indicating its general preparation and education level. `;
    
    if (inDemandTech.length > 5) summary += "This occupation exhibits significant exposure to in-demand technologies.";
    
    return summary;
  };

  const eduLabels = {
    1: 'Less than High School', 2: 'High School Diploma', 3: 'Post-Secondary Cert',
    4: 'Some College', 5: "Associate's", 6: "Bachelor's", 7: "Post-Baccalaureate Cert",
    8: "Master's", 9: "Post-Master's Cert", 10: 'First Professional', 11: 'Doctoral', 12: 'Post-Doctoral'
  };

  const formatEduData = () => {
    if (!c.education_distribution) return [];
    return c.education_distribution.map(e => ({
      name: eduLabels[e.category] || 'Unknown',
      percentage: e.percentage
    })).filter(e => e.percentage > 0).slice(0, 5);
  };

  return (
    <div className="career-modal-overlay">
      <div className="career-modal-container">
        
        {/* Header */}
        <header className="career-modal-header" style={{ flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ background: '#eef2ff', color: '#5b6cff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>O*NET: {c.onet_soc_code}</span>
                {c.job_zone && <span style={{ background: '#f8fafc', color: '#647086', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, border: '1px solid #e2e8f0' }}>Job Zone {c.job_zone}</span>}
              </div>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{c.title}</h1>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleOpenCompare}>
                <GitCompare size={16} /> Compare Career
              </button>
              <button aria-label="Close modal" onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                <X size={24} color="#647086" />
              </button>
            </div>
          </div>
          {/* Compact Metric Strip */}
          <div style={{ display: 'flex', gap: '32px', width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#647086', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', gap: '6px' }}>Employment <span style={{ background: '#e2e8f0', padding: '0 4px', borderRadius: '3px' }}>BLS</span></div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{c.current_employment ? (c.current_employment / 1000).toFixed(1) + 'k' : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#647086', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', gap: '6px' }}>Growth <span style={{ background: '#e2e8f0', padding: '0 4px', borderRadius: '3px' }}>BLS</span></div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{c.projected_growth ? '+' + c.projected_growth + '%' : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#647086', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', gap: '6px' }}>Median Wage <span style={{ background: '#e2e8f0', padding: '0 4px', borderRadius: '3px' }}>BLS</span></div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{c.median_annual_wage ? '$' + (c.median_annual_wage / 1000).toFixed(0) + 'k' : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#647086', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', gap: '6px' }}>Opportunity Score <span style={{ background: '#eef2ff', color: '#5b6cff', padding: '0 4px', borderRadius: '3px' }}>CareerPulse</span></div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{c.opportunity_score ? c.opportunity_score.toFixed(1) : 'N/A'}</div>
            </div>
          </div>
        </header>

        <div className="career-modal-scroll-area">
          <div className="career-modal-grid">
            
            {/* Main Column */}
            <div className="career-main-col">
              
              <section className="modal-section">
                <h3>Career Overview</h3>
                <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>{c.description}</p>
              </section>

              <section className="modal-section">
                <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "16px" }}>02 &mdash; Market Outlook</h2>
                <p className="section-subtext">BLS projected metrics for 2025–2035.</p>
                <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                  <div className="kpi-card cp-card" style={{ padding: 'var(--space-sm)', background: '#f8fafc' }}>
                    <div style={{ fontSize: '12px', color: '#647086', marginBottom: '4px' }}>BLS Employment</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{c.total_employment ? c.total_employment.toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="kpi-card cp-card" style={{ padding: 'var(--space-sm)', background: '#f8fafc' }}>
                    <div style={{ fontSize: '12px', color: '#647086', marginBottom: '4px' }}>BLS Growth (10yr)</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: c.projected_growth > 0 ? '#10b981' : '#e53e3e' }}>
                      {c.projected_growth > 0 ? '+' : ''}{c.projected_growth}%
                    </div>
                  </div>
                  <div className="kpi-card cp-card" style={{ padding: 'var(--space-sm)', background: '#f8fafc' }}>
                    <div style={{ fontSize: '12px', color: '#647086', marginBottom: '4px' }}>BLS Annual Openings</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{c.annual_openings ? c.annual_openings + 'k' : 'N/A'}</div>
                  </div>
                  <div className="kpi-card cp-card" style={{ padding: 'var(--space-sm)', background: '#f8fafc' }}>
                    <div style={{ fontSize: '12px', color: '#647086', marginBottom: '4px' }}>BLS Median Wage</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{c.median_annual_wage ? '$' + c.median_annual_wage.toLocaleString() : 'N/A'}</div>
                  </div>
                </div>
              </section>

              <section className="modal-section">
                <h3>Skill Requirements</h3>
                <p className="section-subtext">O*NET occupational measures of skill importance and required proficiency level.</p>
                {topSkills.length > 0 ? (
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Skill</th>
                          <th>O*NET Importance (1-5)</th>
                          <th>O*NET Level (0-7)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSkills.map(s => (
                          <tr key={s.element_id}>
                            <td style={{ fontWeight: 500, color: '#0f172a' }}>{s.element_name}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '30px' }}>{s.importance}</span>
                                <div style={{ height: '6px', width: '100px', background: '#e2e8f0', borderRadius: '3px' }}>
                                  <div style={{ height: '100%', width: `${(s.importance / 5) * 100}%`, background: '#5b6cff', borderRadius: '3px' }}></div>
                                </div>
                              </div>
                            </td>
                            <td>{s.level}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: '#647086' }}>No skill data available.</div>
                )}
              </section>

              <section className="modal-section">
                <h3>Technology Landscape</h3>
                <p className="section-subtext">O*NET associated technologies. Not all listed technologies are mandatory for every position.</p>
                
                {inDemandTech.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <h4 style={{ fontSize: '14px', margin: '0 0 12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> In-Demand Technology
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {inDemandTech.map(t => (
                        <span key={t.element_id} style={{ background: '#ecfdf5', color: '#047857', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 500, border: '1px solid #a7f3d0' }}>
                          {t.technology_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {hotTech.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '14px', margin: '0 0 12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} /> Hot Technology
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {hotTech.map(t => (
                        <span key={t.element_id} style={{ background: '#fffbeb', color: '#b45309', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 500, border: '1px solid #fde68a' }}>
                          {t.technology_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {otherTech.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '14px', margin: '0 0 12px', color: '#647086' }}>Other Associated Technology</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {otherTech.map(t => (
                        <span key={t.element_id} style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                          {t.technology_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.tech.length === 0 && <div style={{ color: '#647086' }}>No technology data available.</div>}
              </section>
              
              <section className="modal-section">
                <h3>What People Do</h3>
                <p className="section-subtext">Representative occupational tasks from O*NET.</p>
                {data.tasks.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', margin: 0, color: '#0f172a' }}>
                    {data.tasks.map(t => (
                      <li key={t.task_id} style={{ marginBottom: '12px', lineHeight: '1.5' }}>{t.task_statement}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: '#647086' }}>No task data available.</div>
                )}
              </section>

            </div>

            {/* Sidebar Column */}
            <div className="career-sidebar-col">
              
              <div className="sidebar-card">
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#0f172a' }}>Career Decision Summary</h4>
                <div style={{ background: '#eef2ff', padding: '16px', borderRadius: '8px', border: '1px solid #c7d2fe', color: '#312e81', fontSize: '14px', lineHeight: '1.6' }}>
                  {generateDecisionSummary()}
                </div>
              </div>

              <div className="sidebar-card">
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#0f172a' }}>CareerPulse Opportunity Score</h4>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '48px', fontWeight: 800, color: '#5b6cff', lineHeight: 1 }}>{c.opportunity_score ? c.opportunity_score.toFixed(1) : 'N/A'}</div>
                  <div style={{ fontSize: '12px', color: '#647086', marginTop: '8px' }}>Composite Opportunity Score</div>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.4' }}>
                  A CareerPulse-derived algorithm combining BLS growth, openings, wage, and market size. Not an official BLS metric.
                </div>
              </div>

              <div className="sidebar-card">
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#0f172a' }}>Education & Preparation</h4>
                <p className="section-subtext" style={{ fontSize: '12px' }}>O*NET respondent education distribution.</p>
                {formatEduData().length > 0 ? (
                  <div style={{ height: '200px', width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart data={formatEduData()} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#647086' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [`${value}%`, 'Respondents']} />
                        <Bar dataKey="percentage" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ color: '#647086', fontSize: '13px' }}>No education data available.</div>
                )}
              </div>

              <div className="sidebar-card">
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#0f172a' }}>Related Careers</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.related.length > 0 ? data.related.slice(0, 8).map(r => (
                    <div key={r.related_soc_code} style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500 }}>{r.related_title || r.related_soc_code}</span>
                      <span style={{ color: '#94a3b8' }}>Tier {r.relatedness_tier}</span>
                    </div>
                  )) : (
                    <div style={{ color: '#647086', fontSize: '13px' }}>No related careers found.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
          {/* Pathways Integration */}
          <div style={{ marginTop: '32px' }}>
            <CareerPathways 
              careerSoc={careerSoc}
              onSelectCareer={onSelectCareer}
              onCompareCareer={onCompareCareer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
