export type RankableCandidate = {
  id: string;
  fullName: string;
  location: string | null;
  experienceYears: number;
  skills: Array<{
    skillId: string;
    skill: { id: string; name: string };
  }>;
};

export type RankedMatch = {
  candidate: {
    id: string;
    fullName: string;
    location: string | null;
    experienceYears: number;
    skills: Array<{ id: string; name: string }>;
  };
  matchedSkills: Array<{ id: string; name: string }>;
  matchCount: number;
};

/**
 * Pure skill-intersection ranking. Tenant filtering is the repository's job —
 * this only ranks the candidates it is given.
 */
export function rankCandidatesBySkillMatch(
  candidates: RankableCandidate[],
  requiredSkillIds: string[],
): RankedMatch[] {
  const requiredSet = new Set(requiredSkillIds);

  return candidates
    .map((candidate) => {
      const matchedSkills = candidate.skills
        .filter((cs) => requiredSet.has(cs.skillId))
        .map((cs) => ({ id: cs.skill.id, name: cs.skill.name }));

      return {
        candidate: {
          id: candidate.id,
          fullName: candidate.fullName,
          location: candidate.location,
          experienceYears: candidate.experienceYears,
          skills: candidate.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
        },
        matchedSkills,
        matchCount: matchedSkills.length,
      };
    })
    .filter((m) => m.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}
