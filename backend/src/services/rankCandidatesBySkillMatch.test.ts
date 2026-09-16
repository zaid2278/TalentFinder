import { describe, expect, it } from 'vitest';
import {
  rankCandidatesBySkillMatch,
  type RankableCandidate,
} from '../services/rankCandidatesBySkillMatch.js';

function candidate(
  id: string,
  skillIds: string[],
  extras?: Partial<RankableCandidate>,
): RankableCandidate {
  return {
    id,
    fullName: `Candidate ${id}`,
    location: 'Remote',
    experienceYears: 5,
    skills: skillIds.map((skillId) => ({
      skillId,
      skill: { id: skillId, name: `Skill-${skillId}` },
    })),
    ...extras,
  };
}

/** Byte-for-byte replica of the pre-refactor inline ranking logic. */
function legacyRank(candidates: RankableCandidate[], requiredSkillIds: string[]) {
  const requiredSet = new Set(requiredSkillIds);
  return candidates
    .map((c) => {
      const matchedSkills = c.skills
        .filter((cs) => requiredSet.has(cs.skillId))
        .map((cs) => ({ id: cs.skill.id, name: cs.skill.name }));
      return {
        candidate: {
          id: c.id,
          fullName: c.fullName,
          location: c.location,
          experienceYears: c.experienceYears,
          skills: c.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
        },
        matchedSkills,
        matchCount: matchedSkills.length,
      };
    })
    .filter((m) => m.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}

describe('rankCandidatesBySkillMatch', () => {
  const required = ['s1', 's2', 's3'];

  it('ranks a full match above a partial match', () => {
    const ranked = rankCandidatesBySkillMatch(
      [candidate('partial', ['s1', 's2']), candidate('full', ['s1', 's2', 's3'])],
      required,
    );

    expect(ranked.map((m) => m.candidate.id)).toEqual(['full', 'partial']);
    expect(ranked[0].matchCount).toBe(3);
    expect(ranked[1].matchCount).toBe(2);
  });

  it('excludes candidates with zero overlapping skills', () => {
    const ranked = rankCandidatesBySkillMatch(
      [candidate('none', ['other']), candidate('one', ['s1'])],
      required,
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0].candidate.id).toBe('one');
  });

  it('only ranks the candidates it is given (no tenant filtering inside)', () => {
    // Repository already scoped by tenant; a foreign-tenant candidate included
    // in the input would still be ranked — proving this function has no tenant logic.
    const ranked = rankCandidatesBySkillMatch(
      [
        candidate('tenant-a', ['s1', 's2']),
        candidate('tenant-b', ['s1', 's2', 's3'], {
          fullName: 'Other Tenant Candidate',
        }),
      ],
      required,
    );

    expect(ranked.map((m) => m.candidate.id)).toEqual(['tenant-b', 'tenant-a']);
  });

  it('keeps all candidates on equal match counts without throwing', () => {
    const ranked = rankCandidatesBySkillMatch(
      [candidate('a', ['s1']), candidate('b', ['s2']), candidate('c', ['s3'])],
      required,
    );

    expect(ranked).toHaveLength(3);
    expect(ranked.every((m) => m.matchCount === 1)).toBe(true);
    expect(new Set(ranked.map((m) => m.candidate.id))).toEqual(new Set(['a', 'b', 'c']));
  });

  it('returns [] for an empty candidate list', () => {
    expect(rankCandidatesBySkillMatch([], required)).toEqual([]);
  });

  it('returns [] for an empty required-skills list', () => {
    expect(rankCandidatesBySkillMatch([candidate('a', ['s1'])], [])).toEqual([]);
  });

  it('matches the pre-refactor inline algorithm byte-for-byte', () => {
    const input = [
      candidate('full', ['s1', 's2', 's3']),
      candidate('partial', ['s1']),
      candidate('none', ['x']),
      candidate('tie-1', ['s2']),
      candidate('tie-2', ['s3']),
    ];
    expect(rankCandidatesBySkillMatch(input, required)).toEqual(legacyRank(input, required));
  });
});
