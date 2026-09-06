import pandas as pd
from pathlib import Path


# -----------------------------
# File locations
# -----------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets"
OUTPUT_DIR = DATA_DIR / "processed"

OUTPUT_DIR.mkdir(exist_ok=True)


# -----------------------------
# Load O*NET data
# -----------------------------

occupation_data = pd.read_csv(
    DATA_DIR / "occupation_data.csv"
)

essential_skills = pd.read_csv(
    DATA_DIR / "essential_skills.csv"
)

transferable_skills = pd.read_csv(
    DATA_DIR / "transferable_skills.csv"
)

software_skills = pd.read_csv(
    DATA_DIR / "software_skills.csv"
)

job_zones = pd.read_csv(
    DATA_DIR / "job_zones.csv"
)


# -----------------------------
# Select relevant occupations
# -----------------------------

target_roles = [
    "Data Analysts",
    "Business Intelligence Analysts",
    "Management Analysts",
    "Market Research Analysts",
    "Operations Research Analysts",
    "Computer Systems Analysts",
]

roles = occupation_data[
    occupation_data["Title"].isin(target_roles)
].copy()


# -----------------------------
# Prepare essential skills
# -----------------------------

essential = essential_skills[
    essential_skills["Scale ID"] == "IM"
].copy()

essential = essential[
    essential["Recommend Suppress"] != "Y"
]

essential["Data Value"] = pd.to_numeric(
    essential["Data Value"],
    errors="coerce"
)

essential = essential[
    ["O*NET-SOC Code", "Title", "Element Name", "Data Value"]
]

essential = essential.rename(
    columns={
        "Element Name": "Skill",
        "Data Value": "Skill Importance",
    }
)


# -----------------------------
# Prepare transferable skills
# -----------------------------

transferable = transferable_skills[
    transferable_skills["Scale ID"] == "IM"
].copy()

transferable = transferable[
    transferable["Recommend Suppress"] != "Y"
]

transferable["Data Value"] = pd.to_numeric(
    transferable["Data Value"],
    errors="coerce"
)

transferable = transferable[
    ["O*NET-SOC Code", "Title", "Element Name", "Data Value"]
]

transferable = transferable.rename(
    columns={
        "Element Name": "Transferable Skill",
        "Data Value": "Importance",
    }
)


# -----------------------------
# Prepare software signals
# -----------------------------

software = software_skills.copy()

software["Hot Technology"] = (
    software["Hot Technology"]
    .fillna("N")
)

software["In Demand"] = (
    software["In Demand"]
    .fillna("N")
)

software["Demand Signal"] = (
    software["In Demand"].eq("Y").astype(int)
    + software["Hot Technology"].eq("Y").astype(int)
)


# -----------------------------
# Prepare job zones
# -----------------------------

zones = job_zones[
    ["O*NET-SOC Code", "Title", "Job Zone"]
].copy()
# -----------------------------
# Load BLS employment data
# -----------------------------

BLS_DIR = DATA_DIR / "BLS"

bls = pd.read_excel(
    BLS_DIR / "occupation.xlsx",
    sheet_name="Table 1.2",
    header=1
)

crosswalk = pd.read_excel(
    BLS_DIR / "nem-onet-to-soc-crosswalk.xlsx",
    header=4
)


# -----------------------------
# Clean BLS column names
# -----------------------------

bls.columns = bls.columns.astype(str).str.strip()
crosswalk.columns = crosswalk.columns.astype(str).str.strip()


# -----------------------------
# Select BLS employment fields
# -----------------------------

bls = bls[
    [
        "2025 National Employment Matrix code",
        "2025 National Employment Matrix title",
        "Employment, 2025",
        "Employment, 2035",
        "Employment change, percent, 2025–35",
        "Occupational openings, 2025–35 annual average",
        "Median annual wage, dollars, 2025",
    ]
].copy()

bls = bls.rename(
    columns={
        "2025 National Employment Matrix code": "NEM Code",
        "2025 National Employment Matrix title": "BLS Title",
        "Employment, 2025": "Employment 2025",
        "Employment, 2035": "Employment 2035",
        "Employment change, percent, 2025-35": "Projected Growth",
        "Occupational openings, 2025-35 annual average": "Annual Openings",
        "Median annual wage, dollars, 2025": "Median Wage",
    }
)


# -----------------------------
# Clean crosswalk
# -----------------------------

crosswalk = crosswalk[
    [
        "O*NET-SOC code",
        "NEM Code",
        "NEM title",
    ]
].copy()

crosswalk = crosswalk.rename(
    columns={
        "O*NET-SOC code": "O*NET-SOC Code",
        "NEM title": "NEM Title",
    }
)


# -----------------------------
# Connect O*NET to BLS
# -----------------------------

onet_bls = crosswalk.merge(
    bls,
    on="NEM Code",
    how="left"
)


# -----------------------------
# Add BLS information to roles
# -----------------------------

roles_with_bls = roles.merge(
    onet_bls[
      [
    "O*NET-SOC Code",
    "NEM Code",
    "BLS Title",
    "Employment 2025",
    "Employment 2035",
    "Employment change, percent, 2025–35",
    "Occupational openings, 2025–35 annual average",
    "Median Wage",
]
    ],
    on="O*NET-SOC Code",
    how="left"
)


# -----------------------------
# Combine role information
# -----------------------------

role_skills = essential.merge(
    roles[
        ["O*NET-SOC Code", "Title", "Description"]
    ],
    on=["O*NET-SOC Code", "Title"],
    how="inner",
)

role_skills = role_skills.merge(
    zones,
    on=["O*NET-SOC Code", "Title"],
    how="left",
)


# -----------------------------
# Top skills per occupation
# -----------------------------

role_skills["Skill Rank"] = role_skills.groupby(
    "O*NET-SOC Code"
)["Skill Importance"].rank(
    ascending=False,
    method="first"
)

top_skills = role_skills[
    role_skills["Skill Rank"] <= 10
].copy()


# -----------------------------
# Technology demand summary
# -----------------------------

technology_summary = software.groupby(
    ["O*NET-SOC Code", "Title"]
).agg(
    Technology_Count=("Workplace Example", "count"),
    In_Demand_Count=("In Demand", lambda x: (x == "Y").sum()),
    Hot_Technology_Count=("Hot Technology", lambda x: (x == "Y").sum()),
).reset_index()


# -----------------------------
# Final career analysis table
# -----------------------------

career_analysis = top_skills.merge(
    technology_summary,
    on=["O*NET-SOC Code", "Title"],
    how="left",
)

career_analysis = career_analysis.merge(
  roles_with_bls[
    [
        "O*NET-SOC Code",
        "Title",
        "Description",
        "NEM Code",
        "BLS Title",
        "Employment 2025",
        "Employment 2035",
        "Employment change, percent, 2025–35",
        "Occupational openings, 2025–35 annual average",
        "Median Wage",
    ]
],
    on=["O*NET-SOC Code", "Title"],
    how="left",
    suffixes=("", "_duplicate"),
)

# -----------------------------
# Clean final columns
# -----------------------------

career_analysis = career_analysis[
    [
        "O*NET-SOC Code",
        "Title",
        "Description",
        "Skill",
        "Skill Importance",
        "Job Zone",
        "Technology_Count",
        "In_Demand_Count",
        "Hot_Technology_Count",
        "NEM Code",
        "BLS Title",
        "Employment 2025",
        "Employment 2035",
        "Employment change, percent, 2025–35",
        "Occupational openings, 2025–35 annual average",
        "Median Wage",
    ]
].drop_duplicates()


# -----------------------------
# Export
# -----------------------------

output_file = OUTPUT_DIR / "career_analysis.csv"

career_analysis.to_csv(
    output_file,
    index=False
)


print("Career analysis completed.")
print(f"Roles found: {roles['Title'].nunique()}")
print(f"Rows generated: {len(career_analysis)}")
print(f"Output: {output_file}")
# -----------------------------
# Create SQLite database
# -----------------------------

import sqlite3

database_file = OUTPUT_DIR / "careerpulse.db"

connection = sqlite3.connect(database_file)

career_analysis.to_sql(
    "career_analysis",
    connection,
    if_exists="replace",
    index=False
)

connection.close()

print(f"SQLite database created: {database_file}")
# -----------------------------
# Export data for React
# -----------------------------

react_data = (
    career_analysis
    .groupby("Title")
    .agg(
        job_zone=("Job Zone", "first"),
        technology_count=("Technology_Count", "first"),
        in_demand_count=("In_Demand_Count", "first"),
        top_skill=("Skill", "first"),
        skill_importance=("Skill Importance", "first"),
        employment_2025=("Employment 2025", "first"),
        employment_2035=("Employment 2035", "first"),
        projected_growth=("Employment change, percent, 2025–35", "first"),
        annual_openings=("Occupational openings, 2025–35 annual average", "first"),
        median_wage=("Median Wage", "first"),
    )
    .reset_index()
)

react_output = OUTPUT_DIR / "career_data.json"

react_data.to_json(
    react_output,
    orient="records",
    indent=2
)

print(f"React data created: {react_output}")