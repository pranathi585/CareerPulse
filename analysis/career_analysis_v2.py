import pandas as pd
import sqlite3
from pathlib import Path
import numpy as np

# -----------------------------
# Configuration
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets"
ONET_DIR = DATA_DIR / "raw" / "onet_31"
BLS_DIR = DATA_DIR / "raw" / "bls_oews_2025"
BLS_PROJ_DIR = DATA_DIR / "BLS"
OUTPUT_DIR = DATA_DIR / "processed"
DB_FILE = OUTPUT_DIR / "careerpulse_v2.db"

OUTPUT_DIR.mkdir(exist_ok=True)

# -----------------------------
# Utility Functions
# -----------------------------
def load_onet(filename):
    return pd.read_csv(ONET_DIR / filename)

def df_to_sql(df, table_name, conn, index=False):
    df.to_sql(table_name, conn, if_exists="replace", index=index)

print("Starting Career Intelligence Pipeline v2...")

# 1. OCCUPATION FOUNDATION
print("Processing Occupations...")
occ_data = load_onet("occupation_data.csv")
job_zones = load_onet("job_zones.csv")

# Map ONET SOC to BLS SOC (Simple prefix mapping, plus we'll use crosswalk)
occ_data["bls_soc_code"] = occ_data["O*NET-SOC Code"].apply(lambda x: str(x).split(".")[0])

dim_occupation = occ_data[["O*NET-SOC Code", "Title", "Description", "bls_soc_code"]].copy()
dim_occupation.columns = ["onet_soc_code", "title", "description", "bls_soc_code"]

jz = job_zones[["O*NET-SOC Code", "Job Zone"]].copy()
jz.columns = ["onet_soc_code", "job_zone"]
dim_occupation = dim_occupation.merge(jz, on="onet_soc_code", how="left")

# 2. SKILL INTELLIGENCE
print("Processing Skills...")
essential = load_onet("essential_skills.csv")
transferable = load_onet("transferable_skills.csv")

# Combine skill definitions
dim_skill_ess = essential[["Element ID", "Element Name"]].drop_duplicates().assign(type="Essential")
dim_skill_trans = transferable[["Element ID", "Element Name"]].drop_duplicates().assign(type="Transferable")
dim_skill = pd.concat([dim_skill_ess, dim_skill_trans]).drop_duplicates(subset=["Element ID"])
dim_skill.columns = ["element_id", "element_name", "type"]

# Pivot Importance (IM) and Level (LV)
def pivot_skills(df):
    df = df[df["Recommend Suppress"] != "Y"].copy()
    df["Data Value"] = pd.to_numeric(df["Data Value"], errors="coerce")
    
    im = df[df["Scale ID"] == "IM"][["O*NET-SOC Code", "Element ID", "Data Value"]].rename(columns={"Data Value": "importance"})
    lv = df[df["Scale ID"] == "LV"][["O*NET-SOC Code", "Element ID", "Data Value"]].rename(columns={"Data Value": "level"})
    
    fact = pd.merge(im, lv, on=["O*NET-SOC Code", "Element ID"], how="outer")
    return fact

fact_ess = pivot_skills(essential)
fact_trans = pivot_skills(transferable)
fact_occupation_skill = pd.concat([fact_ess, fact_trans])
fact_occupation_skill.columns = ["onet_soc_code", "element_id", "importance", "level"]

# 3. ABILITY AND KNOWLEDGE INTELLIGENCE
print("Processing Abilities and Knowledge...")
abilities = load_onet("abilities.csv")
knowledge = load_onet("knowledge.csv")

def process_ak(df):
    df = df[df["Recommend Suppress"] != "Y"].copy()
    df["Data Value"] = pd.to_numeric(df["Data Value"], errors="coerce")
    res = df[["O*NET-SOC Code", "Element ID", "Scale ID", "Data Value"]].copy()
    res.columns = ["onet_soc_code", "element_id", "scale_id", "data_value"]
    return res

fact_occupation_ability = process_ak(abilities)
fact_occupation_knowledge = process_ak(knowledge)

dim_ability = abilities[["Element ID", "Element Name"]].drop_duplicates()
dim_ability.columns = ["element_id", "element_name"]
dim_knowledge = knowledge[["Element ID", "Element Name"]].drop_duplicates()
dim_knowledge.columns = ["element_id", "element_name"]

# 4. TECHNOLOGY INTELLIGENCE
print("Processing Technology...")
software = load_onet("software_skills.csv")

dim_technology = software[["Element ID", "Element Name"]].drop_duplicates()
dim_technology.columns = ["element_id", "element_name"]

fact_occupation_technology = software[["O*NET-SOC Code", "Element ID", "Workplace Example", "Hot Technology", "In Demand"]].copy()
fact_occupation_technology.columns = ["onet_soc_code", "element_id", "workplace_example", "hot_technology", "in_demand"]

# 5. TASK AND WORK INTELLIGENCE
print("Processing Tasks and Work...")
task_statements = load_onet("task_statements.csv")
dim_task = task_statements[["Task ID", "Task", "Task Type"]].drop_duplicates()
dim_task.columns = ["task_id", "task", "task_type"]

task_ratings = load_onet("task_ratings.csv")
fact_occupation_task = task_ratings[["O*NET-SOC Code", "Task ID", "Scale ID", "Category", "Data Value"]].copy()
fact_occupation_task.columns = ["onet_soc_code", "task_id", "scale_id", "category", "data_value"]

work_activities = load_onet("work_activities.csv")
fact_occupation_work_activity = process_ak(work_activities)

work_context = load_onet("work_context.csv")
fact_occupation_work_context = work_context[["O*NET-SOC Code", "Element ID", "Scale ID", "Category", "Data Value"]].copy()
fact_occupation_work_context.columns = ["onet_soc_code", "element_id", "scale_id", "category", "data_value"]

work_styles = load_onet("work_styles.csv")
fact_occupation_work_style = work_styles[["O*NET-SOC Code", "Element ID", "Scale ID", "Data Value"]].copy()
fact_occupation_work_style.columns = ["onet_soc_code", "element_id", "scale_id", "data_value"]

# 6. EDUCATION AND TRAINING
print("Processing Education and Training...")
education = load_onet("education.csv")
fact_occupation_education = education[["O*NET-SOC Code", "Category", "Data Value"]].copy()
fact_occupation_education.columns = ["onet_soc_code", "category", "data_value"]

# 7. CAREER RELATIONSHIPS
print("Processing Career Relationships...")
related = load_onet("related_occupations.csv")
fact_related_career = related[["O*NET-SOC Code", "Related O*NET-SOC Code", "Relatedness Tier"]].copy()
fact_related_career.columns = ["onet_soc_code", "related_soc_code", "relatedness_tier"]

# 8. BLS CURRENT MARKET
print("Processing BLS Current Market...")
bls_current = pd.read_excel(BLS_DIR / "national_M2025_dl.xlsx")

# Filter out aggregates, keep detailed occupations
bls_current = bls_current[bls_current["O_GROUP"] == "detailed"].copy()

fact_market = bls_current[["OCC_CODE", "OCC_TITLE", "TOT_EMP", "H_MEAN", "A_MEAN", "H_MEDIAN", "A_MEDIAN", "A_PCT10", "A_PCT90"]].copy()
fact_market.columns = ["bls_soc_code", "title", "total_employment", "mean_hourly_wage", "mean_annual_wage", "median_hourly_wage", "median_annual_wage", "wage_10th", "wage_90th"]

for col in ["total_employment", "mean_annual_wage", "median_annual_wage", "wage_10th", "wage_90th"]:
    fact_market[col] = pd.to_numeric(fact_market[col].astype(str).str.replace("*", "").str.replace("#", ""), errors="coerce")

# 9. BLS FUTURE OUTLOOK
print("Processing BLS Future Outlook...")
bls_proj = pd.read_excel(BLS_PROJ_DIR / "occupation.xlsx", sheet_name="Table 1.2", header=1)
crosswalk = pd.read_excel(BLS_PROJ_DIR / "nem-onet-to-soc-crosswalk.xlsx", header=4)

bls_proj.columns = bls_proj.columns.astype(str).str.strip()
crosswalk.columns = crosswalk.columns.astype(str).str.strip()

bls_proj = bls_proj[[
    "2025 National Employment Matrix code",
    "Employment, 2025",
    "Employment, 2035",
    "Employment change, percent, 2025–35",
    "Occupational openings, 2025–35 annual average",
]].copy()

bls_proj.columns = ["nem_code", "employment_2025", "employment_2035", "projected_growth", "annual_openings"]

cw = crosswalk[["O*NET-SOC code", "NEM Code"]].copy()
cw.columns = ["onet_soc_code", "nem_code"]

fact_outlook = cw.merge(bls_proj, on="nem_code", how="left")

# 10. DERIVED CAREERPULSE METRICS
print("Calculating Derived Metrics...")
# Composite Opportunity Score
# We join fact_outlook and fact_market by bls_soc_code (which maps to NEM roughly or ONET)
metrics_df = dim_occupation[["onet_soc_code", "bls_soc_code"]].copy()

# Add Outlook
metrics_df = metrics_df.merge(fact_outlook, on="onet_soc_code", how="left")

# Add Market
metrics_df = metrics_df.merge(fact_market[["bls_soc_code", "total_employment", "median_annual_wage"]], on="bls_soc_code", how="left")

# Clean metrics for scoring
for col in ["projected_growth", "annual_openings", "total_employment", "median_annual_wage"]:
    metrics_df[col] = pd.to_numeric(metrics_df[col], errors="coerce").fillna(0)

# Rank-based Scoring (0-100)
# Defensible methodology: Percentile ranking of each metric across all valid occupations
def calculate_score(series):
    return (series.rank(pct=True) * 100).round(1)

metrics_df["market_size_score"] = calculate_score(metrics_df["total_employment"])
metrics_df["growth_score"] = calculate_score(metrics_df["projected_growth"])
metrics_df["opening_score"] = calculate_score(metrics_df["annual_openings"])
metrics_df["wage_score"] = calculate_score(metrics_df["median_annual_wage"])

# Composite Opportunity Score: Weighted average of Growth (30%), Openings (30%), Wage (20%), Size (20%)
metrics_df["opportunity_score"] = (
    metrics_df["growth_score"] * 0.3 +
    metrics_df["opening_score"] * 0.3 +
    metrics_df["wage_score"] * 0.2 +
    metrics_df["market_size_score"] * 0.2
).round(1)

fact_careerpulse_metrics = metrics_df[["onet_soc_code", "market_size_score", "growth_score", "opening_score", "wage_score", "opportunity_score"]].copy()

# 12. DATABASE EXPORT
print("Exporting to SQLite...")
conn = sqlite3.connect(DB_FILE)

tables = {
    "dim_occupation": dim_occupation,
    "dim_skill": dim_skill,
    "dim_ability": dim_ability,
    "dim_knowledge": dim_knowledge,
    "dim_technology": dim_technology,
    "dim_task": dim_task,
    "fact_occupation_skill": fact_occupation_skill,
    "fact_occupation_ability": fact_occupation_ability,
    "fact_occupation_knowledge": fact_occupation_knowledge,
    "fact_occupation_technology": fact_occupation_technology,
    "fact_occupation_task": fact_occupation_task,
    "fact_occupation_work_activity": fact_occupation_work_activity,
    "fact_occupation_work_context": fact_occupation_work_context,
    "fact_occupation_work_style": fact_occupation_work_style,
    "fact_occupation_education": fact_occupation_education,
    "fact_related_career": fact_related_career,
    "fact_market": fact_market,
    "fact_outlook": fact_outlook,
    "fact_careerpulse_metrics": fact_careerpulse_metrics,
}

for table_name, df in tables.items():
    df_to_sql(df, table_name, conn)

# Validation Queries
total_onet = len(dim_occupation)
total_bls = len(fact_market)
mapped_to_bls = dim_occupation[dim_occupation["bls_soc_code"].isin(fact_market["bls_soc_code"])]["onet_soc_code"].nunique()
unmapped = total_onet - mapped_to_bls

print("\n--- CareerPulse V2 Data Validation Report ---")
print(f"Total O*NET Occupations: {total_onet}")
print(f"Total BLS Market Records: {total_bls}")
print(f"O*NET Occupations Mapped to BLS: {mapped_to_bls} ({(mapped_to_bls/total_onet)*100:.1f}%)")
print(f"O*NET Occupations Without BLS Mapping: {unmapped}")
print(f"Skills: {len(dim_skill)}")
print(f"Technologies: {len(dim_technology)}")
print(f"Abilities: {len(dim_ability)}")
print(f"Knowledge Records: {len(dim_knowledge)}")
print(f"Tasks: {len(dim_task)}")
print(f"Related-Career Relationships: {len(fact_related_career)}")

conn.close()
print(f"\nPipeline completed successfully. Database saved to {DB_FILE}")
