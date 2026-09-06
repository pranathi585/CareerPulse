import { calculateAllRoleMatches } from "./careerScoring";

export function simulateSkillChange(
  userSkills,
  roles,
  skill,
  newValue
) {
  const simulatedSkills = {
    ...userSkills,
    [skill]: Number(newValue),
  };

  const currentMatches = calculateAllRoleMatches(userSkills, roles);
  const simulatedMatches = calculateAllRoleMatches(
    simulatedSkills,
    roles
  );

  return simulatedMatches.map((role) => {
    const currentRole = currentMatches.find(
      (item) => item.role === role.role
    );

    return {
      role: role.role,
      currentMatch: currentRole.match,
      simulatedMatch: role.match,
      improvement: role.match - currentRole.match,
    };
  });
}