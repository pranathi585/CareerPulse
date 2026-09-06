from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path
from typing import List, Optional

app = FastAPI(title="CareerPulse Intelligence API")

# Configure CORS for local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path resolution
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "datasets" / "processed" / "careerpulse_v2.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/careers")
def get_careers(search: Optional[str] = None, limit: int = 1500):
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            MIN(o.onet_soc_code) as onet_soc_code, 
            m.title as title, 
            MAX(o.description) as description, 
            MAX(o.job_zone) as job_zone, 
            m.bls_soc_code,
            m.total_employment as current_employment,
            m.median_annual_wage as median_wage,
            ol.projected_growth,
            ol.annual_openings,
            MAX(cp.opportunity_score) as opportunity_score
        FROM fact_market m
        JOIN dim_occupation o ON m.bls_soc_code = o.bls_soc_code
        LEFT JOIN fact_outlook ol ON m.bls_soc_code = ol.nem_code OR o.onet_soc_code = ol.onet_soc_code
        LEFT JOIN fact_careerpulse_metrics cp ON o.onet_soc_code = cp.onet_soc_code
    """
    
    params = []
    if search:
        query += " WHERE m.title LIKE ? OR o.title LIKE ?"
        params.extend([f"%{search}%", f"%{search}%"])
        
    query += " GROUP BY m.bls_soc_code"
        
    query += " LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@app.get("/api/careers/compare")
def compare_careers(codes: List[str] = Query(...)):
    if not codes:
        raise HTTPException(status_code=400, detail="No occupation codes provided for comparison.")
        
    conn = get_db()
    cursor = conn.cursor()
    
    placeholders = ",".join("?" * len(codes))
    query = f"""
        SELECT 
            o.onet_soc_code, 
            o.title,
            o.description,
            o.bls_soc_code,
            o.job_zone,
            m.total_employment as current_employment,
            m.median_annual_wage as median_wage,
            ol.projected_growth,
            ol.annual_openings,
            cp.opportunity_score
        FROM dim_occupation o
        LEFT JOIN fact_market m ON o.bls_soc_code = m.bls_soc_code
        LEFT JOIN fact_outlook ol ON o.bls_soc_code = ol.nem_code OR o.onet_soc_code = ol.onet_soc_code
        LEFT JOIN fact_careerpulse_metrics cp ON o.onet_soc_code = cp.onet_soc_code
        WHERE o.onet_soc_code IN ({placeholders})
        GROUP BY o.onet_soc_code
    """
    
    cursor.execute(query, codes)
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        details = dict(row)
        onet_soc_code = details['onet_soc_code']
        
        # Education
        edu_query = """
            SELECT category, data_value as percentage
            FROM fact_occupation_education
            WHERE onet_soc_code = ?
            ORDER BY data_value DESC
        """
        cursor.execute(edu_query, (onet_soc_code,))
        details['education_distribution'] = [dict(r) for r in cursor.fetchall()]
        
        # Skills
        query_skills = """
            SELECT 
                s.element_id,
                s.element_name as name,
                fs.importance,
                fs.level
            FROM fact_occupation_skill fs
            JOIN dim_skill s ON fs.element_id = s.element_id
            WHERE fs.onet_soc_code = ?
            ORDER BY fs.importance DESC
            LIMIT 10
        """
        cursor.execute(query_skills, (onet_soc_code,))
        details['top_skills'] = [dict(r) for r in cursor.fetchall()]
        
        # Tech
        query_tech = """
            SELECT 
                t.element_id,
                t.element_name as name,
                MAX(ft.hot_technology) as hot_technology,
                MAX(ft.in_demand) as in_demand
            FROM fact_occupation_technology ft
            JOIN dim_technology t ON ft.element_id = t.element_id
            WHERE ft.onet_soc_code = ?
            GROUP BY t.element_id, t.element_name
            ORDER BY MAX(ft.in_demand) DESC, MAX(ft.hot_technology) DESC, t.element_name ASC
            LIMIT 10
        """
        cursor.execute(query_tech, (onet_soc_code,))
        details['top_technologies'] = [dict(r) for r in cursor.fetchall()]
        
        results.append(details)
        
    conn.close()
    
    return results

@app.get("/api/careers/{onet_soc_code}")
def get_career_details(onet_soc_code: str):
    conn = get_db()
    cursor = conn.cursor()
    
    # Base occupation details
    query = """
        SELECT 
            o.onet_soc_code, 
            o.title, 
            o.description, 
            o.job_zone, 
            o.bls_soc_code,
            m.total_employment,
            m.mean_annual_wage,
            m.median_annual_wage,
            m.wage_10th,
            m.wage_90th,
            ol.employment_2025,
            ol.employment_2035,
            ol.projected_growth,
            ol.annual_openings,
            cp.market_size_score,
            cp.growth_score,
            cp.opening_score,
            cp.wage_score,
            cp.opportunity_score
        FROM dim_occupation o
        LEFT JOIN fact_market m ON o.bls_soc_code = m.bls_soc_code
        LEFT JOIN fact_outlook ol ON o.bls_soc_code = ol.nem_code OR o.onet_soc_code = ol.onet_soc_code
        LEFT JOIN fact_careerpulse_metrics cp ON o.onet_soc_code = cp.onet_soc_code
        WHERE o.onet_soc_code = ?
    """
    cursor.execute(query, (onet_soc_code,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Occupation not found")
        
    details = dict(row)
    
    # Add education/training summary
    edu_query = """
        SELECT category, data_value as percentage
        FROM fact_occupation_education
        WHERE onet_soc_code = ?
        ORDER BY data_value DESC
    """
    cursor.execute(edu_query, (onet_soc_code,))
    details['education_distribution'] = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return details

@app.get("/api/careers/{onet_soc_code}/skills")
def get_career_skills(onet_soc_code: str):
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            s.element_id,
            s.element_name,
            s.type as skill_type,
            fs.importance,
            fs.level
        FROM fact_occupation_skill fs
        JOIN dim_skill s ON fs.element_id = s.element_id
        WHERE fs.onet_soc_code = ?
        ORDER BY fs.importance DESC
    """
    cursor.execute(query, (onet_soc_code,))
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No skills found for this occupation")
        
    return [dict(row) for row in rows]

@app.get("/api/careers/{onet_soc_code}/technology")
def get_career_technology(onet_soc_code: str):
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            t.element_id,
            t.element_name as technology_name,
            ft.workplace_example,
            ft.hot_technology,
            ft.in_demand
        FROM fact_occupation_technology ft
        JOIN dim_technology t ON ft.element_id = t.element_id
        WHERE ft.onet_soc_code = ?
        ORDER BY ft.in_demand DESC, ft.hot_technology DESC, t.element_name ASC
    """
    cursor.execute(query, (onet_soc_code,))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@app.get("/api/careers/{onet_soc_code}/tasks")
def get_career_tasks(onet_soc_code: str, limit: int = 15):
    conn = get_db()
    cursor = conn.cursor()
    
    # Fetch representative tasks (ordered by importance/relevance if available, else standard)
    query = """
        SELECT 
            t.task_id,
            t.task as task_statement,
            t.task_type,
            ft.category,
            ft.data_value as rating_value
        FROM fact_occupation_task ft
        JOIN dim_task t ON ft.task_id = t.task_id
        WHERE ft.onet_soc_code = ? AND ft.scale_id = 'IM'
        ORDER BY ft.data_value DESC
        LIMIT ?
    """
    cursor.execute(query, (onet_soc_code, limit))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@app.get("/api/careers/{onet_soc_code}/related")
def get_related_careers(onet_soc_code: str):
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            r.related_soc_code,
            o.title as related_title,
            r.relatedness_tier
        FROM fact_related_career r
        LEFT JOIN dim_occupation o ON r.related_soc_code = o.onet_soc_code
        WHERE r.onet_soc_code = ?
        ORDER BY r.relatedness_tier ASC
    """
    cursor.execute(query, (onet_soc_code,))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]



@app.get("/api/skills")
def get_skills(search: Optional[str] = None, limit: int = 150):
    conn = get_db()
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            ds.element_id,
            ds.element_name as name,
            COUNT(DISTINCT CASE WHEN fos.importance >= 3.0 THEN fos.onet_soc_code END) as occupation_count,
            ROUND(AVG(fos.importance), 2) as avg_importance,
            ROUND(AVG(fos.level), 2) as avg_level,
            ROUND(SUM(CASE WHEN cp.opportunity_score >= 60 AND fos.importance >= 3.0 THEN (fos.importance * cp.opportunity_score) ELSE 0 END) / 100, 2) as relevance_score
        FROM dim_skill ds
        JOIN fact_occupation_skill fos ON ds.element_id = fos.element_id
        LEFT JOIN fact_careerpulse_metrics cp ON fos.onet_soc_code = cp.onet_soc_code
    '''
    
    params = []
    if search:
        query += " WHERE ds.element_name LIKE ?"
        params.append(f"%{search}%")
        
    query += " GROUP BY ds.element_id ORDER BY occupation_count DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/api/technology")
def get_technology(search: Optional[str] = None, limit: int = 150):
    conn = get_db()
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            dt.element_id,
            dt.element_name as name,
            COUNT(DISTINCT fot.onet_soc_code) as occupation_count,
            COUNT(DISTINCT CASE WHEN fot.hot_technology = 'Y' THEN fot.onet_soc_code END) as hot_technology_count,
            COUNT(DISTINCT CASE WHEN fot.in_demand = 'Y' THEN fot.onet_soc_code END) as in_demand_count
        FROM dim_technology dt
        JOIN fact_occupation_technology fot ON dt.element_id = fot.element_id
    '''
    
    params = []
    if search:
        query += " WHERE dt.element_name LIKE ?"
        params.append(f"%{search}%")
        
    query += " GROUP BY dt.element_id ORDER BY occupation_count DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/api/skills/{element_id}/careers")
def get_skill_careers(element_id: str):
    conn = get_db()
    cursor = conn.cursor()
    query = '''
        SELECT 
            o.onet_soc_code,
            o.title as occupation,
            o.job_zone,
            fos.importance,
            fos.level,
            m.total_employment as current_employment,
            ol.projected_growth,
            m.median_annual_wage as median_wage,
            ol.annual_openings
        FROM fact_occupation_skill fos
        JOIN dim_occupation o ON fos.onet_soc_code = o.onet_soc_code
        LEFT JOIN fact_market m ON o.bls_soc_code = m.bls_soc_code
        LEFT JOIN fact_outlook ol ON o.bls_soc_code = ol.nem_code OR o.onet_soc_code = ol.onet_soc_code
        WHERE fos.element_id = ?
        GROUP BY o.onet_soc_code
        ORDER BY fos.importance DESC
    '''
    cursor.execute(query, (element_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/api/technology/{element_id}/careers")
def get_technology_careers(element_id: str):
    conn = get_db()
    cursor = conn.cursor()
    query = '''
        SELECT 
            o.onet_soc_code,
            o.title as occupation,
            o.job_zone,
            fot.hot_technology,
            fot.in_demand,
            m.total_employment as current_employment,
            ol.projected_growth,
            m.median_annual_wage as median_wage,
            ol.annual_openings
        FROM fact_occupation_technology fot
        JOIN dim_occupation o ON fot.onet_soc_code = o.onet_soc_code
        LEFT JOIN fact_market m ON o.bls_soc_code = m.bls_soc_code
        LEFT JOIN fact_outlook ol ON o.bls_soc_code = ol.nem_code OR o.onet_soc_code = ol.onet_soc_code
        WHERE fot.element_id = ?
        GROUP BY o.onet_soc_code
        ORDER BY fot.in_demand DESC, fot.hot_technology DESC
    '''
    cursor.execute(query, (element_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/api/careers/{onet_soc_code}/pathways")
def get_career_pathways(onet_soc_code: str):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Get all related SOC codes
    cursor.execute("""
        SELECT related_soc_code, relatedness_tier 
        FROM fact_related_career 
        WHERE onet_soc_code = ?
    """, (onet_soc_code,))
    related_rows = cursor.fetchall()
    
    if not related_rows:
        conn.close()
        return []

    # 2. Get source skills
    cursor.execute("""
        SELECT s.element_name, fs.importance
        FROM fact_occupation_skill fs
        JOIN dim_skill s ON fs.element_id = s.element_id
        WHERE fs.onet_soc_code = ?
    """, (onet_soc_code,))
    source_skills = {row['element_name']: row['importance'] for row in cursor.fetchall()}

    pathways = []
    
    # 3. For each related, compute overlap and fetch market data
    for r in related_rows:
        rel_soc = r['related_soc_code']
        
        # Get market & general data
        cursor.execute("""
            SELECT 
                o.onet_soc_code, 
                o.title,
                o.description,
                m.total_employment as employment,
                m.median_annual_wage as median_wage,
                ol.projected_growth as projected_growth_pct,
                ol.annual_openings,
                ol.employment_2035 as projected_employment,
                cp.opportunity_score
            FROM dim_occupation o
            LEFT JOIN fact_market m ON o.bls_soc_code = m.bls_soc_code
            LEFT JOIN fact_outlook ol ON o.bls_soc_code = ol.nem_code OR o.onet_soc_code = ol.onet_soc_code
            LEFT JOIN fact_careerpulse_metrics cp ON o.onet_soc_code = cp.onet_soc_code
            WHERE o.onet_soc_code = ?
            GROUP BY o.onet_soc_code
        """, (rel_soc,))
        career_info = cursor.fetchone()
        
        if not career_info:
            continue
            
        career_dict = dict(career_info)
        career_dict['relationship_info'] = r['relatedness_tier']
        
        # Compute skill overlap
        cursor.execute("""
            SELECT s.element_name, fs.importance
            FROM fact_occupation_skill fs
            JOIN dim_skill s ON fs.element_id = s.element_id
            WHERE fs.onet_soc_code = ?
        """, (rel_soc,))
        target_skills = {row['element_name']: row['importance'] for row in cursor.fetchall()}
        
        sum_overlap = 0
        sum_total = 0
        all_skills = set(source_skills.keys()).union(set(target_skills.keys()))
        
        shared_skills = []
        more_in_source = []
        more_in_target = []
        
        for sk in all_skills:
            impA = source_skills.get(sk, 0)
            impB = target_skills.get(sk, 0)
            sum_overlap += min(impA, impB)
            sum_total += max(impA, impB)
            
            if impA > 0 and impB > 0:
                shared_skills.append({'name': sk, 'importance_source': impA, 'importance_target': impB})
            elif impA > 0:
                more_in_source.append({'name': sk, 'importance': impA})
            elif impB > 0:
                more_in_target.append({'name': sk, 'importance': impB})
                
        overlap_pct = round((sum_overlap / sum_total) * 100) if sum_total > 0 else 0
        career_dict['skill_overlap_pct'] = overlap_pct
        
        # Pathway relevance score: 70% Overlap, 30% Opp Score
        # Opp score is 0-100, overlap is 0-100.
        opp_score = career_dict['opportunity_score']
        if opp_score is not None:
            rel_score = (0.7 * overlap_pct) + (0.3 * opp_score)
        else:
            rel_score = overlap_pct  # fallback
            
        career_dict['pathway_relevance_score'] = round(rel_score, 1)
        
        # Sort shared/diff skills
        shared_skills.sort(key=lambda x: max(x['importance_source'], x['importance_target']), reverse=True)
        more_in_source.sort(key=lambda x: x['importance'], reverse=True)
        more_in_target.sort(key=lambda x: x['importance'], reverse=True)
        
        career_dict['shared_skills'] = shared_skills
        career_dict['skills_more_important_in_source'] = more_in_source
        career_dict['skills_more_important_in_target'] = more_in_target
        
        pathways.append(career_dict)
        
    conn.close()
    
    # Sort and return top 8
    pathways.sort(key=lambda x: x['pathway_relevance_score'], reverse=True)
    return pathways[:8]
