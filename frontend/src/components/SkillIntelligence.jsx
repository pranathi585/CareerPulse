import React, { useState, useEffect, useMemo } from 'react';
import { Target, Layers, Zap, Briefcase, Search, Info } from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis
} from 'recharts';
import { API_BASE_URL } from '../api';

const SkillIntelligence = ({ onSelectCareer }) => {
  const [skills, setSkills] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillCareers, setSkillCareers] = useState([]);
  const [loadingSkillCareers, setLoadingSkillCareers] = useState(false);
  
  const [selectedTech, setSelectedTech] = useState(null);
  const [techCareers, setTechCareers] = useState([]);
  const [loadingTechCareers, setLoadingTechCareers] = useState(false);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const [skillsRes, techRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/skills`),
          fetch(`${API_BASE_URL}/api/technology`)
        ]);
        
        if (!skillsRes.ok || !techRes.ok) throw new Error('Failed to fetch intelligence data');
        
        const skillsData = await skillsRes.json();
        const techData = await techRes.json();
        
        setSkills(skillsData);
        setTechnologies(techData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalData();
  }, []);

  const handleSelectSkill = async (skill) => {
    setSelectedSkill(skill);
    setLoadingSkillCareers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills/${skill.element_id}/careers`);
      const data = await res.json();
      setSkillCareers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSkillCareers(false);
    }
  };

  const handleSelectTech = async (tech) => {
    setSelectedTech(tech);
    setLoadingTechCareers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/technology/${tech.element_id}/careers`);
      const data = await res.json();
      setTechCareers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTechCareers(false);
    }
  };

  if (loading) {
    return (
      <section className="market-overview-section" id="skill-intelligence">
        <div style={{ padding: '60px', textAlign: 'center', color: '#647086' }}>
          Loading Skills & Technology Intelligence...
        </div>
      </section>
    );
  }

  if (error || skills.length === 0) {
    return (
      <section className="market-overview-section" id="skill-intelligence">
        <div style={{ padding: '60px', textAlign: 'center', color: '#e53e3e' }}>
          Unable to load intelligence data.
        </div>
      </section>
    );
  }

  const careerRelevantSkills = [...skills]
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);
  const mostImportantSkills = [...skills].sort((a, b) => b.avg_importance - a.avg_importance).slice(0, 5);

  const topRepresentedTech = [...technologies].sort((a, b) => b.occupation_count - a.occupation_count).slice(0, 5);
  const inDemandTech = [...technologies].sort((a, b) => b.in_demand_count - a.in_demand_count).slice(0, 5);

  const CustomSkillTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: '1px solid #e4e8f2', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100 }}>
          <strong style={{ display: 'block', color: '#151d2e', marginBottom: '8px' }}>{p.name}</strong>
          <div style={{ fontSize: '12px', color: '#647086', marginBottom: '4px' }}>Occupations Represented: <span style={{ color: '#151d2e', fontWeight: 600 }}>{p.occupation_count}</span></div>
          <div style={{ fontSize: '12px', color: '#647086', marginBottom: '4px' }}>Avg Importance: <span style={{ color: '#151d2e', fontWeight: 600 }}>{p.avg_importance}</span></div>
          <div style={{ fontSize: '12px', color: '#647086' }}>Avg Level: <span style={{ color: '#151d2e', fontWeight: 600 }}>{p.avg_level}</span></div>
        </div>
      );
    }
    return null;
  };

  const totalOccupations = skills.length > 0 ? Math.max(...skills.map(s => s.occupation_count || 0)) : 0;

  return (
    <section className="market-overview-section cp-container" id="skill-intelligence" style={{ marginBottom: 'var(--space-section)' }}>
      <div className="section-heading">
        <div>
          <span className="section-label">SKILL INTELLIGENCE</span>
          <h2>What capabilities matter across the career market?</h2>
        </div>
        <p>
          Analysis of O*NET skills and technologies across {totalOccupations} market occupations.
        </p>
      </div>

      <div style={{ background: '#f8fafc', borderLeft: '4px solid #5b6cff', padding: '24px', borderRadius: '0 8px 8px 0', marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#647086', fontWeight: 700, marginBottom: '12px', letterSpacing: '0.5px' }}>Landscape Observations</div>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '14px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <li><strong>{careerRelevantSkills[0]?.name || 'Top Skill'}</strong> has the highest career-relevance score, indicating it is critical across high-opportunity occupations.</li>
          <li><strong>{mostImportantSkills[0]?.name || 'Top Important Skill'}</strong> commands the highest average importance ({mostImportantSkills[0]?.avg_importance || 0}) across the roles that require it.</li>
          <li><strong>{inDemandTech[0]?.name}</strong> has a strong in-demand presence across the occupation landscape ({inDemandTech[0]?.in_demand_count} roles).</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* 1. Skill Landscape */}
        <div className="market-matrix-section cp-card" style={{ marginBottom: 0 }}>
          <h3 className="cp-title" style={{ margin: '0 0 8px', fontSize: '16px', color: '#151d2e' }}>Overall Skill Landscape</h3>
          <p style={{ margin: '0 0 var(--space-md)', fontSize: '13px', color: '#647086' }}>
            Broad skills appear across hundreds of occupations, while technical skills are concentrated.
          </p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e8f2" />
                <XAxis type="number" dataKey="occupation_count" name="Occupations Represented" stroke="#a0a8b7" fontSize={12} tickLine={false} axisLine={{ stroke: '#e4e8f2' }} />
                <YAxis type="number" dataKey="avg_importance" name="Avg Importance" stroke="#a0a8b7" fontSize={12} tickLine={false} axisLine={false} domain={[1, 5]} />
                <RechartsTooltip content={<CustomSkillTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={skills} fill="#5b6cff" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Importance vs Level */}
        <div className="market-matrix-section cp-card" style={{ marginBottom: 0 }}>
          <h3 className="cp-title" style={{ margin: '0 0 8px', fontSize: '16px', color: '#151d2e' }}>Importance vs. Level</h3>
          <p style={{ margin: '0 0 var(--space-md)', fontSize: '13px', color: '#647086' }}>
            Importance measures necessity for performance. Level measures required proficiency.
          </p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e8f2" />
                <XAxis type="number" dataKey="avg_importance" name="Avg Importance" stroke="#a0a8b7" fontSize={12} tickLine={false} axisLine={{ stroke: '#e4e8f2' }} domain={[1, 5]} />
                <YAxis type="number" dataKey="avg_level" name="Avg Level" stroke="#a0a8b7" fontSize={12} tickLine={false} axisLine={false} domain={[0, 7]} />
                <RechartsTooltip content={<CustomSkillTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={skills} fill="#10b981" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="market-rankings-grid" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="ranking-card">
          <h4>
            Career-Relevant Skills
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: '#647086', marginTop: '4px', lineHeight: 1.3 }}>
              Career relevance combines O*NET skill importance with CareerPulse Opportunity Score across high-opportunity occupations. It is an analytical ranking, not an official BLS ranking.
            </span>
          </h4>
          {careerRelevantSkills.map(r => (
            <div className="ranking-item" key={r.element_id} style={{ cursor: 'pointer' }} onClick={() => handleSelectSkill(r)}>
              <span title={r.name}>{r.name}</span>
              <strong style={{ color: '#5b6cff' }}>{r.relevance_score} score</strong>
            </div>
          ))}
        </div>
        <div className="ranking-card">
          <h4>Highest Average Importance</h4>
          {mostImportantSkills.map(r => (
            <div className="ranking-item" key={r.element_id} style={{ cursor: 'pointer' }} onClick={() => handleSelectSkill(r)}>
              <span title={r.name}>{r.name}</span>
              <strong style={{ color: '#10b981' }}>{r.avg_importance} avg</strong>
            </div>
          ))}
        </div>
        <div className="ranking-card">
          <h4>In-Demand Technology Flags</h4>
          {inDemandTech.map(r => (
            <div className="ranking-item" key={r.element_id} style={{ cursor: 'pointer' }} onClick={() => handleSelectTech(r)}>
              <span title={r.name}>{r.name}</span>
              <strong style={{ color: '#f59e0b' }}>{r.in_demand_count} in-demand</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="market-kpi-grid">
        {/* Skill Explorer */}
        <div className="market-search-section cp-card" style={{ margin: 0, padding: "24px" }}>
          <h3 className="cp-title" style={{ margin: '0 0 8px', fontSize: '18px', color: '#151d2e' }}>Skill → Career Explorer</h3>
          <p style={{ margin: '0 0 var(--space-md)', fontSize: '14px', color: '#647086' }}>
            Select a skill from the rankings above to see how it connects to specific career paths and market outcomes.
          </p>
          
          {selectedSkill ? (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', display: 'block' }}>Careers associated with {selectedSkill.name}</strong>
              </div>
              <div className="data-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Occupation</th>
                      <th>Importance</th>
                      <th>Level</th>
                      <th>Median Wage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSkillCareers ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading careers...</td></tr>
                    ) : skillCareers.length > 0 ? (
                      skillCareers.map(c => (
                        <tr key={c.onet_soc_code} onClick={() => onSelectCareer && onSelectCareer(c.onet_soc_code)} style={{ cursor: "pointer" }} className="hover-row">
                          <td style={{ fontWeight: 500 }}>{c.occupation}</td>
                          <td>{c.importance}</td>
                          <td>{c.level}</td>
                          <td>{c.median_wage ? '$' + c.median_wage.toLocaleString() : 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center' }}>No careers found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
              Click a skill above to explore its career connections.
            </div>
          )}
        </div>

        {/* Tech Explorer */}
        <div className="market-search-section cp-card" style={{ margin: 0, padding: "24px" }} style={{ margin: 0 }}>
          <h3 className="cp-title" style={{ margin: '0 0 8px', fontSize: '18px', color: '#151d2e' }}>Technology → Career Explorer</h3>
          <p style={{ margin: '0 0 var(--space-md)', fontSize: '14px', color: '#647086' }}>
            Select a technology from the rankings above to view roles where it is utilized and requested.
          </p>

          {selectedTech ? (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', display: 'block' }}>Careers associated with {selectedTech.name}</strong>
              </div>
              <div className="data-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Occupation</th>
                      <th>In Demand</th>
                      <th>Hot Tech</th>
                      <th>Annual Openings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTechCareers ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading careers...</td></tr>
                    ) : techCareers.length > 0 ? (
                      techCareers.map(c => (
                        <tr key={c.onet_soc_code} onClick={() => onSelectCareer && onSelectCareer(c.onet_soc_code)} style={{ cursor: "pointer" }} className="hover-row">
                          <td style={{ fontWeight: 500 }}>{c.occupation}</td>
                          <td style={{ color: c.in_demand === 'Y' ? '#10b981' : '#94a3b8' }}>{c.in_demand}</td>
                          <td style={{ color: c.hot_technology === 'Y' ? '#f59e0b' : '#94a3b8' }}>{c.hot_technology}</td>
                          <td>{c.annual_openings ? c.annual_openings + 'k' : 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center' }}>No careers found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
              Click a technology above to explore its career connections.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SkillIntelligence;
