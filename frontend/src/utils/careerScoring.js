export function calculateRoleMatch(userSkills, requiredSkills) {
  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(requiredSkills).forEach(([skill, requiredLevel]) => {
    const userLevel = userSkills[skill] ?? 0;

    // More important skills receive more weight
    const weight = requiredLevel / 100;

    const skillRatio = Math.min(
  userLevel / requiredLevel,
  1
);

const skillMatch =
  skillRatio < 1
    ? Math.pow(skillRatio, 3)
    : 1;
    totalScore += skillMatch * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round((totalScore / totalWeight) * 100);
}

export function calculateAllRoleMatches(userSkills, roles) {
  return roles
    .map((role) => ({
      ...role,
      match: calculateRoleMatch(
        userSkills,
        role.requiredSkills
      ),
    }))
    .sort((a, b) => b.match - a.match);
}
export function calculateSkillGaps(userSkills, requiredSkills) {
  return Object.entries(requiredSkills)
    .map(([skill, requiredLevel]) => {
      const currentLevel = userSkills[skill] ?? 0;
      const gap = Math.max(requiredLevel - currentLevel, 0);

      return {
        skill,
        currentLevel,
        requiredLevel,
        gap,
      };
    })
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap);
}