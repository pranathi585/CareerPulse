# CareerPulse — Career Intelligence Platform

A data-driven platform combining O*NET occupational intelligence with U.S. Bureau of Labor Statistics (BLS) market projections to help users analyze career demand, skill requirements, technology landscapes, career pathways, and relative profile alignment.

---

## 1. Overview

Navigating strategic career decisions is often hindered by fragmented data. Job seekers and professionals are forced to consult disparate sources to answer fundamental questions regarding career growth, compensation, required technical capabilities, and transition feasibility. 

**CareerPulse** solves this challenge by integrating granular occupational taxonomy with macro labor-market indicators into a single, unified analytical interface. 

> **Important Note:** CareerPulse is an analytical decision-support and data exploration platform. It provides quantitative benchmarking and heuristic alignment indicators to assist career planning—it is **not** a hiring prediction algorithm or job placement guarantee.

---

## 2. Key Questions Answered

CareerPulse provides data-driven answers to nine core career planning questions:

1. **Labor Market Growth:** Which occupations are projected to grow fastest over the next decade?
2. **Economic Opportunity:** Which roles present the highest combination of projected growth, annual openings, wage potential, and overall market scale?
3. **Core Capabilities:** What specific skills, knowledge, and abilities are required for a target occupation?
4. **Technology Landscapes:** Which programming languages, software tools, and digital platforms are associated with specific roles?
5. **Career Comparison:** How do two occupations compare side-by-side in terms of market outlook, preparation requirements, and skill demands?
6. **Skill Overlap & Transitioning:** Which occupations share significant skill requirement overlap, indicating potential transition viability?
7. **Profile Alignment:** How does a candidate\'s self-assessed skill profile compare against baseline role requirements?
8. **Skill Gap Identification:** What are the largest skill gaps between current candidate capabilities and target benchmark thresholds?
9. **Scenario Simulation:** How does improving a specific skill alter a candidate\'s overall role alignment score?

---

## 3. Core Features

### Market Intelligence
- **Labor Indicators:** Track employment size, projected 10-year growth percentage, annual openings, and median annual wage across U.S. occupations.
- **CareerPulse Opportunity Score:** Rank roles using a composite percentile-based economic indicator.

### Skill Intelligence
- **Capability Profiles:** Analyze skill importance ratings, required proficiency levels, and occupation coverage across technical and core competencies.
- **Technology Exposure:** Identify key software tools and technologies linked to specific occupations.

### Career Explorer
- **Occupational Deep Dive:** Comprehensive breakdown of individual roles including BLS outlook, O*NET skills, technology stacks, daily work tasks, and required education levels.

### Career Comparison
- **Side-by-Side Analytics:** Direct comparative analysis of two careers evaluating preparation levels, core skill differences, shared technologies, and structural trade-offs.

### Career Pathways
- **Data-Driven Directions:** Discover related career options derived from official O*NET structural connections and skill requirement overlap algorithms.

### Career Fit & Action Plan
- **Demo Candidate Benchmarking:** Compare a baseline profile against target role requirements.
- **Skill Gap Analysis & Simulator:** Dynamically simulate how closing specific skill gaps improves role alignment scores.

---

## 4. Data Sources

CareerPulse integrates two primary public government datasets:

1. **O*NET 31.0 (Occupational Information Network)**
   - Granular occupational characteristics: skills, abilities, knowledge, tasks, work activities, work context, work styles, education/preparation, software technologies, and related occupations.
2. **U.S. Bureau of Labor Statistics (BLS 2025–2035)**
   - Macroeconomic indicators: current employment size, 10-year projected employment, projected growth percentage, projected annual openings, and median annual wage.

### Metric Distinction

| Metric | Origin / Type | Description |
| :--- | :--- | :--- |
| **Projected Growth (%)** | Official BLS Metric | 10-year national employment projection (2025–2035). |
| **Median Annual Wage ($)** | Official BLS Metric | Official median annual compensation. |
| **Annual Openings** | Official BLS Metric | Projected annual job openings due to growth & replacement. |
| **Skill Importance & Level** | Official O*NET Metric | Standardized survey ratings (0–100) of occupational requirements. |
| **Opportunity Score** | **CareerPulse-Derived** | Weighted percentile composite of market growth, openings, wage, and size. |
| **Skill Requirement Overlap** | **CareerPulse-Derived** | Weighted intersection-over-union metric measuring skill similarity. |
| **Pathway Relevance** | **CareerPulse-Derived** | Composite score combining O*NET relatedness, skill overlap, and market metrics. |
| **Relative Skill Alignment** | **CareerPulse-Derived** | Profile-to-benchmark skill similarity calculation (0–100%). |

---

## 5. Methodology & Formulas

### CareerPulse Opportunity Score
The Opportunity Score is a composite indicator (0–100) that ranks occupations using percentile-ranked market signals:

\text{Opportunity Score} = (0.30 \times \text{Growth Rank}) + (0.30 \times \text{Openings Rank}) + (0.20 \times \text{Wage Rank}) + (0.20 \times \text{Size Rank})

- **Projected Growth Rate:** 30% weight
- **Annual Job Openings:** 30% weight
- **Median Annual Wage:** 20% weight
- **Current Employment Size:** 20% weight

> *The CareerPulse Opportunity Score is a CareerPulse-derived composite indicator and is not an official BLS metric.*

### Relative Skill Alignment
Measures the match percentage between a candidate\'s self-assessed skill levels ({user}$) and benchmark occupational skill requirements ({req}$):

\text{Alignment Score} = \frac{\sum_{i} \min(S_{user, i}, S_{req, i})}{\sum_{i} S_{req, i}} \times 100

> *It represents relative alignment with the selected skill requirement profile and should not be interpreted as hiring probability.*

### CareerPulse Skill Requirement Overlap
Calculates occupational skill similarity between Role $ and Role $ using a weighted intersection-over-union heuristic based on O*NET skill importance values:

\text{Overlap}(A, B) = \frac{\sum_{i \in \text{Skills}} \min(I_{A,i}, I_{B,i})}{\sum_{i \in \text{Skills}} \max(I_{A,i}, I_{B,i})} \times 100

> *It measures similarity between occupational skill requirements. It does not represent candidate capability, hiring probability, or guaranteed career transition ease.*

---

## 6. Career Proxy Mappings

Certain common industry role titles do not map 1:1 to single official O*NET SOC taxonomy titles. In these cases, CareerPulse utilizes **CareerPulse Market Proxies** to provide robust analytical coverage:

| User-Facing Career Title | CareerPulse Market Proxy Title | Official O*NET SOC Code |
| :--- | :--- | :--- |
| **Data Analyst** | Operations Research Analysts | 15-2031.00 |
| **Business Analyst** | Management Analysts | 13-1111.00 |
| **Product Analyst** | Computer Systems Analysts | 15-1211.00 |
| **BI Analyst** | Business Intelligence Analysts | 15-1212.00 |

> *These represent analytical market proxy mappings and are not official BLS/O*NET title redefinitions.*

---

## 7. Architecture

`mermaid
flowchart TD
    A[O*NET 31.0 Raw CSVs] --> C[Python ETL Pipeline
analysis/career_analysis_v2.py]
    B[BLS 2025 OEWS & Projections] --> C
    C --> D[(SQLite Database
careerpulse_v2.db)]
    D --> E[FastAPI REST API
backend/main.py]
    E --> F[React Single Page App
frontend/src/App.jsx]
    F --> G[Recharts Data Visualizations]
`

### Technology Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Recharts, Lucide React, Vanilla CSS |
| **Backend** | FastAPI, Python 3.x, Uvicorn |
| **Database** | SQLite 3 |
| **Data Pipeline** | Pandas, OpenPyXL, NumPy |
| **Data Sources** | O*NET 31.0, U.S. BLS (OEWS & Employment Projections 2025–35) |

---

## 8. Data Pipeline Workflow

`
Raw O*NET & BLS Data
  └── Extraction & Cleaning (Pandas)
      └── SOC Taxonomy Alignment & Proxy Mapping
          └── Aggregation (Skills, Abilities, Tech, Tasks)
              └── Computation of Derived CareerPulse Metrics
                  └── Relational Loading (SQLite Schema)
                      └── REST API Serving (FastAPI)
                          └── Interactive Interface (React + Recharts)
`

1. **Extraction & Cleaning:** Parse raw multi-file O*NET CSV releases and BLS Excel projection tables.
2. **Taxonomy Mapping:** Resolve structural differences between O*NET 8-digit SOC codes and BLS 6-digit SOC codes.
3. **Metric Calculation:** Compute percentile ranks, composite Opportunity Scores, and skill overlap matrices.
4. **Relational Storage:** Export structured relational tables into datasets/processed/careerpulse_v2.db.

---

## 9. Database Schema

The analytical database (datasets/processed/careerpulse_v2.db) is structured as a star schema consisting of dimensions and fact tables:

### Dimension Tables
- dim_occupation: Occupational identifiers, titles, descriptions, and SOC codes.
- dim_skill: O*NET skill element definitions and categories.
- dim_ability: O*NET cognitive and physical ability attributes.
- dim_knowledge: O*NET domain knowledge definitions.
- dim_technology: Software tools, languages, and technical platforms.
- dim_task: Occupational task statements.

### Fact Tables
- act_occupation_skill: Skill importance and level ratings per occupation.
- act_occupation_ability: Ability importance ratings per occupation.
- act_occupation_knowledge: Knowledge importance ratings per occupation.
- act_occupation_technology: Technology pairings per occupation.
- act_occupation_task: Task relevance ratings per occupation.
- act_occupation_work_activity: Work activity ratings.
- act_occupation_work_context: Environmental and organizational context.
- act_occupation_work_style: Work style indicators.
- act_occupation_education: Required educational preparation breakdowns.
- act_related_career: O*NET related occupation mappings.
- act_market: BLS employment size and annual job openings.
- act_outlook: BLS 10-year projected growth rates and median wages.
- act_careerpulse_metrics: Pre-calculated Opportunity Scores and percentile ranks.

---

## 10. API Documentation

The backend API is implemented in ackend/main.py using FastAPI:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| /api/health | GET | Health check verifying API and database connection status. |
| /api/careers | GET | Search and list all occupations with market metrics and scores. |
| /api/careers/compare | GET | Perform side-by-side comparison of multiple career codes. |
| /api/careers/{onet_soc_code} | GET | Retrieve detailed occupational profile and market metrics. |
| /api/careers/{onet_soc_code}/skills | GET | Retrieve O*NET skill importance and level ratings for a role. |
| /api/careers/{onet_soc_code}/technology | GET | Retrieve software tools and technologies associated with a role. |
| /api/careers/{onet_soc_code}/tasks | GET | Retrieve primary occupational tasks for a role. |
| /api/careers/{onet_soc_code}/related | GET | Retrieve O*NET structurally related occupations. |
| /api/careers/{onet_soc_code}/pathways | GET | Retrieve derived career pathways with overlap & market scores. |
| /api/skills | GET | Search and list tracked skills across the market. |
| /api/technology | GET | Search and list software technologies across occupations. |
| /api/skills/{element_id}/careers | GET | Retrieve top occupations requiring a specific skill. |
| /api/technology/{element_id}/careers | GET | Retrieve top occupations utilizing a specific technology. |

---

## 11. Project Structure

`
CareerPulse/
├── analysis/
│   ├── career_analysis_v2.py    # Primary ETL pipeline script (O*NET + BLS -> SQLite)
│   ├── career_analysis.py       # Reference v1 analysis script
│   ├── career_analysis.sql      # Reference analytical SQL definitions
│   └── run_sql.py               # SQL execution helper utility
├── backend/
│   ├── main.py                  # FastAPI REST API server
│   └── requirements.txt         # Python backend dependencies
├── datasets/
│   ├── BLS/                     # Official BLS employment projection tables
│   ├── processed/
│   │   ├── careerpulse_v2.db    # Relational SQLite intelligence database
│   │   ├── career_analysis.csv
│   │   └── career_data.json
│   └── raw/                     # O*NET 31.0 & BLS OEWS raw data directories
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx              # Main React SPA component
│       ├── App.css              # Custom styling system
│       ├── components/          # React feature components
│       ├── data/                # Baseline profile & proxy configurations
│       └── utils/               # Client-side scoring & simulation algorithms
├── .gitignore                   # Version control rules
└── README.md                    # Project documentation
`

---

## 12. Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v18+ and 
pm
- **Python**: v3.9+

### 1. Backend Setup
`ash
cd backend
python -m venv venv

# Activate Virtual Environment:
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload
`
- The FastAPI REST server runs locally at http://localhost:8000.
- Interactive API documentation is available at http://localhost:8000/docs.

### 2. Frontend Setup
In a separate terminal window:
`ash
cd frontend
npm install
npm run dev
`
- The Vite development server runs locally at http://localhost:5173.
- The frontend connects directly to http://localhost:8000.

---

## 13. Project Screenshots

> *Add project screenshots here before publishing the repository.*

- **Overview / Hero Section:** Executive alignment summary, baseline distribution preview, and floating signal badges.
- **Career Snapshot:** High-level labor market KPI summary.
- **Career Insights:** Current skill level vs. benchmark target requirements matrix.
- **Career Opportunities:** Market outlook grid featuring Opportunity Scores and BLS projections.
- **Skill Intelligence:** In-demand skill coverage and technology landscape analytics.
- **Career Explorer & Comparison:** Detailed role modal and side-by-side career comparison.
- **Scenario Simulator & Action Plan:** Dynamic profile improvement simulation and prioritized action steps.

---

## 14. Project Portfolio Highlights

CareerPulse demonstrates key competencies relevant to Data Analytics and Data Engineering:

- **Multi-Source Data Integration:** Extracting, normalizing, and joining complex, disparate public government datasets (O*NET & BLS).
- **Taxonomy & Schema Modeling:** Designing a star schema relational database (SQLite) optimized for multi-dimensional querying.
- **Composite Indicator Methodology:** Formulating quantitative scoring algorithms (percentile ranking, weighted IOU similarity).
- **RESTful API Development:** Exposing analytical data products cleanly via FastAPI endpoints.
- **Interactive Visualization:** Translating complex labor-market signals into intuitive UI components and chart visualizer widgets.
- **Methodological Transparency:** Distinguishing explicitly between official metrics and derived heuristic indicators.

---

## 15. Limitations & Data Honesty

- **Analytical Heuristics:** Composite scores (Opportunity Score, Alignment Score, Overlap) are analytical heuristics to assist decision-making, not predictive models guaranteeing job offers.
- **Proxy Mappings:** Broad industry job titles are mapped to official government SOC titles; some evolving tech roles rely on market proxy approximations.
- **Occupational Averages:** O*NET and BLS data reflect national occupational averages and do not capture individual company-level variances.
- **Static Demo Profile:** The candidate fit section currently uses a self-assessed demonstration profile to illustrate gap analysis capabilities.

---

## 16. Future Enhancements

- Integration of live real-time job posting API feeds to capture emerging technical skills.
- Regional and state-level BLS wage and growth filtering.
- User authentication and persistent custom profile creation.
- Automated resume parsing to extract candidate skill profiles.

---

## 17. License & Data Attribution

- **Data Attribution:** O*NET™ is a trademark of the U.S. Department of Labor, Employment and Training Administration (ETA). Labor market data courtesy of the U.S. Bureau of Labor Statistics (BLS).
- **License Note:** A software license (e.g. MIT) can be added prior to public open-source repository distribution.
