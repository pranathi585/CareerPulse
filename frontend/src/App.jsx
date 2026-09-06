import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Compass,
  Sliders,
  Sparkles,
  Target,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react'

import './App.css'
import ScenarioSimulator from './components/ScenarioSimulator'
import MarketOverview from './components/MarketOverview'
import SkillIntelligence from './components/SkillIntelligence'
import CareerComparison from './components/CareerComparison'
import { useState } from 'react';
import CareerExplorerDetail from './components/CareerExplorerDetail'
import { careerRoles, userSkills } from "./data/careerData";
import {
  calculateAllRoleMatches,
  calculateSkillGaps,
} from './utils/careerScoring'
import careerAnalysis from './data/career_data.json'

function App() {
  const [selectedCareerSoc, setSelectedCareerSoc] = useState(null)
  const [compareModeActive, setCompareModeActive] = useState(false)
  const [compareCareerA, setCompareCareerA] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const roleMatches = calculateAllRoleMatches(userSkills, careerRoles)
  const topRole = roleMatches[0]

  const skillGaps = topRole
    ? calculateSkillGaps(userSkills, topRole.requiredSkills)
    : []

  const careerActions = topRole
    ? [
        {
          priority: "01",
          status: "High Priority",
          title: `Strengthen ${skillGaps[0]?.skill ?? "Core Skills"}`,
          description: `Closing the ${skillGaps[0]?.gap ?? 0}% gap in ${skillGaps[0]?.skill ?? "this skill"} provides the highest immediate lift to your ${topRole.role} alignment.`,
          tag: "Primary skill gap",
        },
        {
          priority: "02",
          status: "Secondary Focus",
          title: `Develop ${skillGaps[1]?.skill ?? "Secondary Skills"}`,
          description: `Addressing the ${skillGaps[1]?.gap ?? 0}% gap in ${skillGaps[1]?.skill ?? "this area"} further reinforces your competitive profile.`,
          tag: "Growth area",
        },
        {
          priority: "03",
          status: "Target Direction",
          title: `Focus on ${topRole.role} Opportunities`,
          description: `Your candidate profile displays its strongest relative alignment (${topRole.match}%) with ${topRole.role} benchmark requirements.`,
          tag: "Target career path",
        },
      ]
    : [];

  const readiness = Math.round(
    Object.values(userSkills).reduce((sum, value) => sum + value, 0) /
    Object.keys(userSkills).length
  );

  return (
    <div className="app">
      {/* Navigation */}
      <header className="navbar cp-container">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={17} strokeWidth={2.4} />
          </div>
          <span>CareerPulse</span>
        </div>

        <nav className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <a href="#overview" onClick={() => setIsMobileMenuOpen(false)}>Overview</a>
          <a href="#snapshot" onClick={() => setIsMobileMenuOpen(false)}>Snapshot</a>
          <a href="#insights" onClick={() => setIsMobileMenuOpen(false)}>Insights</a>
          <a href="#careers" onClick={() => setIsMobileMenuOpen(false)}>Opportunities</a>
          <a href="#skills" onClick={() => setIsMobileMenuOpen(false)}>Skills</a>
          <a href="#simulator" onClick={() => setIsMobileMenuOpen(false)}>Simulator</a>
          <a href="#action-plan" onClick={() => setIsMobileMenuOpen(false)}>Action Plan</a>
        </nav>

        <div className="nav-actions">
          <button className="profile-button" title="Demo Candidate Profile">
            <CircleUserRound size={19} />
            <span className="profile-text">Demo Candidate Profile</span>
          </button>
          
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* HERO SECTION */}
        <section className="hero-section cp-container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot"></span>
              Demo Candidate Profile · Career Intelligence Explorer
            </div>

            <h1>
              Turn your career data
              <span> into your next move.</span>
            </h1>

            <p>
              CareerPulse analyzes your current skill profile against industry role benchmarks, 
              identifies critical skill gaps, integrates U.S. BLS labor market trends, 
              and simulates how improving key skills alters your career alignment.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() =>
                  document.getElementById("careers")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Career Alignment
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Analytical Hero Preview Visual */}
          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="analytics-card">
              <div className="card-top">
                <div>
                  <p className="card-label">Demo Candidate Alignment</p>
                  <h2>{topRole?.match ?? 0}%</h2>
                  <span className="card-sublabel">Top Match (Market Proxy): {topRole?.role}</span>
                </div>

                <div className="trend-badge">
                  <Target size={15} />
                  {skillGaps.length} Skill Gaps Identified
                </div>
              </div>

              {/* Data-Driven Skill Distribution Visualizer */}
              <div className="hero-skills-overview">
                <p className="overview-title">Baseline Skill Profile vs Target Thresholds</p>
                <div className="hero-skill-bars">
                  {Object.entries(userSkills).slice(0, 5).map(([skill, val]) => (
                    <div className="hero-skill-row" key={skill}>
                      <div className="hero-skill-info">
                        <span>{skill}</span>
                        <strong>{val}%</strong>
                      </div>
                      <div className="hero-bar-track">
                        <div className="hero-bar-fill" style={{ width: `${val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-footer">
                <span>Profile: Sample Candidate</span>
                <span>Analytic Baseline</span>
                <span>O*NET & BLS Data</span>
              </div>
            </div>

            <div className="floating-card skills-card">
              <div className="floating-icon">
                <BarChart3 size={17} />
              </div>
              <div>
                <strong>Strongest Match</strong>
                <span>{topRole?.role} ({topRole?.match}%)</span>
              </div>
            </div>

            <div className="floating-card opportunity-card">
              <div className="floating-icon">
                <BriefcaseBusiness size={17} />
              </div>
              <div>
                <strong>Benchmark Roles</strong>
                <span>{roleMatches.length} Roles Analyzed</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE STRIP */}
        <section className="feature-strip cp-container" id="overview">
          <div className="feature-item">
            <div className="feature-icon">
              <BarChart3 size={19} />
            </div>
            <div>
              <strong>Skill Alignment Analytics</strong>
              <p>Compare skills against role thresholds</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Compass size={19} />
            </div>
            <div>
              <strong>BLS Market Intelligence</strong>
              <p>2025–35 US employment projections</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Sliders size={19} />
            </div>
            <div>
              <strong>Scenario Simulator</strong>
              <p>Simulate skill improvement impact</p>
            </div>
          </div>

          <a className="explore-link" href="#market-overview">
            Explore Market Data
            <ChevronRight size={18} />
          </a>
        </section>

        
        

        {/* 1. CAREER SNAPSHOT */}
        <section className="snapshot cp-container" id="snapshot" style={{ marginBottom: "64px" }}>
          <div className="section-heading">
            <div>
              <span className="section-label">PART II: INDIVIDUAL CAREER FIT (1. WHO AM I)</span>
              <h2>Career Snapshot</h2>
            </div>

            <p>
              A quick summary of the candidate's current profile metrics and tracking baselines.
            </p>
          </div>

          <div className="snapshot-grid">
            <div className="snapshot-card">
              <span>Average Skill Score</span>
              <strong>{readiness}%</strong>
              <small>Across tracked technical & core skills</small>
            </div>

            <div className="snapshot-card">
              <span>Skills Tracked</span>
              <strong>{Object.keys(userSkills).length}</strong>
              <small>Self-assessed baseline skills</small>
            </div>

            <div className="snapshot-card">
              <span>In-Demand Tech Signals</span>
              <strong>
                {careerAnalysis.reduce(
                  (sum, role) => sum + (role.in_demand_count || 0),
                  0
                )}
              </strong>
              <small>Software demand signals across benchmark roles</small>
            </div>

            <div className="snapshot-card">
              <span>Career Matches</span>
              <strong>{roleMatches.length}</strong>
              <small>Industry benchmark roles evaluated</small>
            </div>
          </div>
        </section>

        {/* 2. CAREER INSIGHTS */}
        <section className="insights-section cp-container" id="insights" style={{ marginBottom: "64px" }}>
          <div className="section-heading">
            <div>
              <span className="section-label">2. WHY DO THEY FIT?</span>
              <h2>Career Insights</h2>
            </div>

            <p>
              Direct analytical comparison between current candidate skill levels and target role benchmarks for your top career match.
            </p>
          </div>

          <div className="insights-container">
            {/* Top Match Focus Card */}
            <div className="insight-top-role-header">
              <div className="top-role-title-group">
                <span className="primary-tag">Primary Career Direction</span>
                <h3>{topRole?.role}</h3>
                <p>{topRole?.description}</p>
              </div>

              <div className="top-role-score-box">
                <span className="score-label">Skill Alignment Score</span>
                <span className="score-value">{topRole?.match}%</span>
                <span className="score-note">Weighted Profile Match</span>
              </div>
            </div>

            {/* Current vs Required Skill Matrix */}
            <div className="skill-matrix-panel">
              <div className="matrix-header">
                <h4>Candidate Skill Level vs. Target Benchmark Requirements</h4>
                <p>Analyzing key skill gaps for the <strong>{topRole?.role}</strong> role baseline.</p>
              </div>

              <div className="matrix-table">
                <div className="matrix-table-header">
                  <span>Skill Name</span>
                  <span>Current Level</span>
                  <span>Required Level</span>
                  <span>Gap / Status</span>
                  <span>Visual Comparison</span>
                </div>

                {topRole && Object.entries(topRole.requiredSkills).map(([skillName, reqLevel]) => {
                  const currentLevel = userSkills[skillName] ?? 0;
                  const gap = reqLevel - currentLevel;
                  const isGap = gap > 0;

                  return (
                    <div className="matrix-row" key={skillName}>
                      <div className="skill-name-col">
                        <strong>{skillName}</strong>
                      </div>

                      <div className="current-col">
                        <span className="level-badge current">{currentLevel}%</span>
                      </div>

                      <div className="required-col">
                        <span className="level-badge required">{reqLevel}%</span>
                      </div>

                      <div className="status-col">
                        {isGap ? (
                          <span className="gap-badge warning">
                            -{gap}% Gap
                          </span>
                        ) : (
                          <span className="gap-badge success">
                            <CheckCircle2 size={13} /> Met (+{Math.abs(gap)}%)
                          </span>
                        )}
                      </div>

                      <div className="visual-bar-col">
                        <div className="range-bar-track">
                          {/* Current fill */}
                          <div
                            className={`range-fill ${isGap ? 'fill-warning' : 'fill-success'}`}
                            style={{ width: `${Math.min(currentLevel, 100)}%` }}
                          ></div>
                          {/* Target marker */}
                          <div
                            className="target-marker"
                            style={{ left: `${Math.min(reqLevel, 100)}%` }}
                            title={`Target Requirement: ${reqLevel}%`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="matrix-footer-note">
                <p>
                  * Threshold values represent benchmark requirements for candidate comparison. 
                  Green bars indicate met requirements, while amber highlights priority focus areas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CAREER OPPORTUNITIES */}
        <section className="opportunities-section cp-container" id="careers" style={{ marginBottom: "64px" }}>
          <div className="section-heading-grid">
            <div className="left-col">
              <span className="eyebrow">3. WHAT CAREERS FIT ME & MARKET OUTLOOK</span>
              <h2>Career Opportunities</h2>
            </div>
            <div className="right-col">
              Compare role alignment against official U.S. Bureau of Labor Statistics (BLS 2025-35) employment outlook data.
            </div>
          </div>

          <div className="alignment-disclaimer-banner">
            <p>
              ℹ️ <strong>Score Distinction:</strong> The <strong>Skill Alignment Score</strong> evaluates how closely a candidate's current skills align with reference role benchmarks. It is a <em>relative skill profile score</em> and does <strong>not</strong> represent a hiring probability or job guarantee.
            </p>
          </div>

          <div className="opportunities-grid">
              {roleMatches.map((role) => {
                const market = careerAnalysis.find(
                  (item) => item.Title === role.blsTitle
                );
  
                return (
                  <div className="opportunity-card cp-card" key={role.role} style={{ display: 'flex', flexDirection: 'column', padding: '24px', height: '100%' }}>
                    <div className="opportunity-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                      <span className="role-title-tag" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, paddingRight: '8px' }}>{role.role}</span>
                      <span className="match-badge" style={{ fontSize: '11px', fontWeight: 700, color: '#5b6cff', background: '#eef2ff', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                        {role.match}% alignment
                      </span>
                    </div>
  
                    <p className="role-desc" style={{ margin: '0 0 18px 0', color: '#475569', fontSize: '14px', lineHeight: 1.5 }}>{role.description}</p>
  
                    <div className="role-alignment-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                      <span className="box-heading" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>Skill Alignment Baseline</span>
                      <div className="skills-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {Object.entries(role.requiredSkills).slice(0, 4).map(([sk, req]) => (
                          <span className="skill-chip" key={sk} style={{ fontSize: '12px', color: '#1e293b', background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px' }}>
                            {sk}: {req}%
                          </span>
                        ))}
                      </div>
                    </div>
  
                    <div className="market-outlook-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                      <span className="box-heading" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>BLS Market Outlook (2025-35)</span>
                      {market ? (
                        <div className="opportunity-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Proj. Growth</span>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>+{market.projected_growth}%</strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Openings</span>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{market.annual_openings}k</strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Median Wage</span>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>${market.median_wage.toLocaleString()}</strong>
                          </div>
                        </div>
                      ) : (
                        <p className="no-market" style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>BLS Data Benchmark: {role.blsTitle}</p>
                      )}
                    </div>
  
                    <div className="market-source" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                      Source: U.S. BLS Projections<br/>Benchmark: {role.blsTitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <MarketOverview data={careerAnalysis} onSelectCareer={(soc) => setSelectedCareerSoc(soc)} />
          <SkillIntelligence onSelectCareer={(soc) => setSelectedCareerSoc(soc)} />


        {/* 4. SCENARIO SIMULATOR */}
        <section className="simulator cp-container" id="simulator" style={{ marginBottom: "64px" }}>
          <ScenarioSimulator />
        </section>

        {/* 5. SKILLS & DEVELOPMENT */}
        <section className="skills-section cp-container" id="skills" style={{ marginBottom: "64px" }}>
          <div className="section-heading">
            <div>
              <span className="section-label">5. WHAT SKILLS AM I MISSING?</span>
              <h2>Skills & Development</h2>
            </div>

            <p>
              Detailed breakdown of candidate skill strengths and high-priority skill gaps.
            </p>
          </div>

          <div className="skills-layout">
            {/* Candidate Skill Strengths */}
            <div className="skills-card">
              <div className="skills-card-header">
                <div>
                  <span>Self-Assessed Skill Profile</span>
                  <h3>Current Skill Strengths</h3>
                </div>
                <span className="profile-tag">Demo Candidate</span>
              </div>

              {Object.entries(userSkills).map(([skill, value]) => (
                <div className="skill-row" key={skill}>
                  <div className="skill-label">
                    <span>{skill}</span>
                    <strong>{value}%</strong>
                  </div>
                  <div className="skill-track">
                    <div
                      className="skill-fill"
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended Skill Focus */}
            <div className="development-card">
              <span className="development-label">Recommended Skill Focus</span>
              <h3>
                Close Gaps in {skillGaps.slice(0, 2).map((item) => item.skill).join(" & ")}
              </h3>

              <p>
                These represent the largest skill gaps for your top matched market proxy (<strong>{topRole?.role}</strong>). 
                Building proficiency here yields the highest score gain.
              </p>

              <div className="development-items">
                {skillGaps.slice(0, 3).map((item) => (
                  <div key={item.skill} className="gap-item">
                    <div className="gap-item-info">
                      <strong>{item.skill}</strong>
                      <span>Current: {item.currentLevel}% | Target: {item.requiredLevel}%</span>
                    </div>
                    <span className="gap-value-badge">-{item.gap}% Gap</span>
                  </div>
                ))}
              </div>

              <a href="#action-plan" className="development-button">
                View Career Action Plan →
              </a>
            </div>
          </div>
        </section>

        {/* 6. CAREER ACTION PLAN */}
        <section className="action-section cp-container" id="action-plan" style={{ marginBottom: "64px" }}>
                    <div className="section-heading-grid">
            <div className="left-col">
              <span className="eyebrow">CAREER INTELLIGENCE</span>
              <h2>Action Plan</h2>
            </div>
            <div className="right-col">
              Actionable recommendations derived dynamically from current profile gaps and stated market preferences.
            </div>
          </div>

          <div className="action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }}>
                        {careerActions.map((action) => (
              <div className="action-card cp-card" key={action.priority} style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#94a3b8' }}>0{action.priority}</span>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: action.status === 'Immediate' ? '#ef4444' : action.status === 'Short-term' ? '#f59e0b' : '#5b6cff', background: action.status === 'Immediate' ? '#fef2f2' : action.status === 'Short-term' ? '#fffbeb' : '#eef2ff', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                    {action.priority === 1 ? 'PRIORITY' : action.priority === 2 ? 'NEXT' : 'EXPLORE'}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', margin: '0 0 10px 0', color: '#0f172a' }}>{action.title}</h3>
                <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>{action.description}</p>
                <div style={{ marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', color: '#647086', fontWeight: 600, border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{action.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. CAREER READINESS / ALIGNMENT STATUS */}
        <section className="readiness-section cp-container" id="readiness" style={{ marginBottom: "64px" }}>
          <div className="readiness-card">
            <div className="readiness-content">
              <span className="eyebrow">CareerPulse Assessment Summary</span>

              <h2>
                Strong foundation for analytics & intelligence roles.
              </h2>

              <p>
                Your candidate profile shows robust alignment with analytical positions, 
                led by strong ratings in Excel ({userSkills.Excel}%), PowerBI ({userSkills.PowerBI}%), and SQL ({userSkills.SQL}%). 
                Focusing on target skill gaps will further enhance your alignment.
              </p>

              <a href="#careers" className="readiness-button">
                Review Role Opportunities →
              </a>
            </div>

            <div className="readiness-score">
              <span>Overall Skill Baseline</span>
              <strong>{readiness}%</strong>
              <small>
                {readiness >= 80
                  ? "Strong Alignment Foundation"
                  : readiness >= 70
                  ? "Solid Skill Profile"
                  : "Developing Profile"}
              </small>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final-cta cp-container" style={{ marginBottom: "64px" }}>
          <div>
            <span className="eyebrow">Data Analytics Portfolio Project</span>
            <h2>Explore Career Intelligence with CareerPulse</h2>
            <p>
              A data-driven explorer combining O*NET skill benchmarks, U.S. BLS market projections, 
              and dynamic scenario simulation.
            </p>
          </div>

          <a href="#simulator" className="cta-button">
            Try Skill Impact Simulator
            <ArrowRight size={18} />
          </a>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <p>© 2026 CareerPulse · Built with O*NET & U.S. BLS Data Pipelines</p>

          <div className="footer-links">
            <a href="#overview">Overview</a>
            <a href="#snapshot">Snapshot</a>
            <a href="#insights">Insights</a>
            <a href="#careers">Opportunities</a>
            <a href="#simulator">Simulator</a>
            <a href="#action-plan">Action Plan</a>
          </div>
        </div>
      </footer>
      {selectedCareerSoc && !compareModeActive && (
        <CareerExplorerDetail 
          careerSoc={selectedCareerSoc} 
          onClose={() => setSelectedCareerSoc(null)}
          onSelectCareer={(soc) => {
            // When navigating from Pathways back to a new Detail
            setSelectedCareerSoc(soc);
          }}
          onCompareCareer={(soc) => {
            setCompareCareerA(soc);
            setCompareModeActive(true);
            setSelectedCareerSoc(null);
          }}
        />
      )}

      {compareModeActive && (
        <CareerComparison
          initialCareerA={compareCareerA}
          onClose={() => {
            setCompareModeActive(false);
            setCompareCareerA('');
          }}
        />
      )}
    </div>
  )
}

export default App
