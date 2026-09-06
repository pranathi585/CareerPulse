import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, CheckCircle2, TrendingUp, Users, DollarSign, Briefcase } from 'lucide-react';

export default function CareerPathways({ careerSoc, onSelectCareer, onCompareCareer }) {
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    if (!careerSoc) return;
    
    setLoading(true);
    setError(null);
    setExpandedCard(null);
    
    fetch(`http://localhost:8000/api/careers/${careerSoc}/pathways`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load pathways');
        return r.json();
      })
      .then(data => {
        setPathways(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [careerSoc]);

  const getInterpretation = (percentage) => {
    if (percentage >= 70) return "High skill-requirement overlap";
    if (percentage >= 40) return "Moderate skill-requirement overlap";
    return "Limited skill-requirement overlap";
  };

  const getMarketInterpretation = (pathway) => {
    if (pathway.opportunity_score && pathway.opportunity_score > 75 && pathway.skill_overlap_pct >= 70) {
      return `${pathway.title} combines strong skill overlap with a higher Opportunity Score.`;
    }
    if (pathway.projected_growth_pct > 8 && pathway.skill_overlap_pct >= 60) {
      return `Offers strong projected growth (+${pathway.projected_growth_pct}%) alongside solid skill overlap.`;
    }
    return null;
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#647086' }}>Loading pathways...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#e53e3e' }}>Error: {error}</div>;
  if (pathways.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#647086' }}>No pathways found for this career.</div>;

  return (
    <div className="career-pathways-section" style={{ marginTop: '48px', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <h2 className="cp-title" style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Career Pathways</h2>
        <p style={{ margin: 0, color: '#647086' }}>Explore related career directions and see how their skill requirements and market signals compare.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-md)' }}>
        {pathways.map((p, idx) => {
          const isExpanded = expandedCard === p.onet_soc_code;
          const marketObservation = getMarketInterpretation(p);
          
          return (
            <div key={p.onet_soc_code} className="cp-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5b6cff', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Pathway {idx + 1}
                </div>
                <h3 className="cp-title" style={{ margin: '0 0 var(--space-sm) 0', fontSize: '18px', color: '#0f172a', lineHeight: 1.3 }}>{p.title}</h3>
                
                <div style={{ background: '#f8fafc', padding: 'var(--space-sm)', borderRadius: '6px', textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{p.skill_overlap_pct}%</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>CareerPulse Skill Requirement Overlap</div>
                  <div style={{ fontSize: '12px', color: '#647086' }}>{getInterpretation(p.skill_overlap_pct)}</div>
                </div>

                {marketObservation && (
                  <div style={{ fontSize: '13px', color: '#0f172a', background: '#eef2ff', padding: '12px', borderRadius: '6px', marginBottom: '16px', borderLeft: '3px solid #5b6cff' }}>
                    {marketObservation}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: '#647086', marginBottom: '2px' }}>Employment</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.employment ? p.employment.toLocaleString() : 'Not available'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#647086', marginBottom: '2px' }}>Growth</div>
                    <div style={{ fontWeight: 600, color: p.projected_growth_pct > 0 ? '#10b981' : '#e53e3e' }}>
                      {p.projected_growth_pct ? (p.projected_growth_pct > 0 ? `+${p.projected_growth_pct}%` : `${p.projected_growth_pct}%`) : 'Not available'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#647086', marginBottom: '2px' }}>Annual Openings</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.annual_openings ? `${p.annual_openings}k` : 'Not available'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#647086', marginBottom: '2px' }}>Median Wage</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.median_wage ? `$${p.median_wage.toLocaleString()}` : 'Not available'}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 var(--space-md)' }}>
                <button 
                  onClick={() => setExpandedCard(isExpanded ? null : p.onet_soc_code)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '13px', fontWeight: 500 }}
                >
                  <span>Skill Breakdown</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {isExpanded && (
                  <div style={{ paddingBottom: 'var(--space-sm)', fontSize: '13px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>Top Shared Skills</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: '#475569' }}>
                        {p.shared_skills.slice(0, 4).map(s => <li key={s.name}>{s.name} <span style={{color: '#94a3b8'}}>({s.importance_target})</span></li>)}
                        {p.shared_skills.length === 0 && <li>None</li>}
                      </ul>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>More important in {p.title}</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: '#475569' }}>
                        {p.skills_more_important_in_target.slice(0, 4).map(s => <li key={s.name}>{s.name} <span style={{color: '#94a3b8'}}>({s.importance})</span></li>)}
                        {p.skills_more_important_in_target.length === 0 && <li>None</li>}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: 'var(--space-sm) var(--space-md)', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <button 
                  className="primary-button" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                  onClick={() => onSelectCareer(p.onet_soc_code)}
                >
                  Explore Career
                </button>
                <button 
                  className="secondary-button" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#0f172a', fontWeight: 600 }}
                  onClick={() => onCompareCareer(p.onet_soc_code)}
                >
                  Compare
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: 'var(--space-md)', fontSize: '12px', color: '#647086', textAlign: 'center' }}>
        Derived from O*NET skill-importance ratings. This is a similarity signal, not a prediction of transition or hiring success.
      </div>
    </div>
  );
}
