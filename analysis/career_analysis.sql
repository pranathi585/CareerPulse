-- ============================================
-- CareerPulse SQL Analysis
-- ============================================


-- 1. View all analyzed career roles
SELECT DISTINCT
    Title,
    "Job Zone"
FROM career_analysis
ORDER BY Title;


-- 2. Find the strongest skills for each role
SELECT
    Title,
    Skill,
    ROUND("Skill Importance", 2) AS skill_importance
FROM career_analysis
ORDER BY Title, "Skill Importance" DESC;


-- 3. Find roles with the highest number of
-- in-demand technologies
SELECT
    Title,
    MAX(In_Demand_Count) AS in_demand_technologies
FROM career_analysis
GROUP BY Title
ORDER BY in_demand_technologies DESC;


-- 4. Find the most technology-focused roles
SELECT
    Title,
    MAX(Technology_Count) AS technology_count
FROM career_analysis
GROUP BY Title
ORDER BY technology_count DESC;


-- 5. Find the most important skills
-- across all analyzed roles
SELECT
    Skill,
    ROUND(AVG("Skill Importance"), 2) AS average_importance
FROM career_analysis
GROUP BY Skill
ORDER BY average_importance DESC
LIMIT 10;