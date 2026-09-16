export type MatchInsightInput = {
  jobOrderId: string;
  jobOrder: {
    jobTitle: string;
    requiredSkills: Array<{ name: string }>;
  };
  matches: Array<{
    candidateId: string;
    fullName: string;
    experienceYears: number;
    matchedSkills: Array<{ name: string }>;
    matchCount: number;
  }>;
};

export type MatchInsight = {
  candidateId: string;
  insight: string;
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Groq retired llama-3.1-8b-instant on many accounts; override with GROQ_MODEL if needed.
const MODEL = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';
// gpt-oss models spend many completion tokens on hidden reasoning; keep headroom for JSON.
// Cap below Groq free-tier TPM (8k) so one insights call still fits with the prompt.
const MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS) || 4000;
const TIMEOUT_MS = 25000;
const CACHE_TTL_MS = 30 * 60 * 1000;

type CacheEntry = {
  insights: MatchInsight[];
  fingerprint: string;
  cachedAt: number;
};

const insightCache = new Map<string, CacheEntry>();

function matchFingerprint(
  matches: MatchInsightInput['matches'],
): string {
  return matches
    .map((m) => `${m.candidateId}:${m.matchCount}`)
    .sort()
    .join('|');
}

function getCachedInsights(
  jobOrderId: string,
  fingerprint: string,
): MatchInsight[] | null {
  const entry = insightCache.get(jobOrderId);
  if (!entry) return null;
  if (entry.fingerprint !== fingerprint) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    insightCache.delete(jobOrderId);
    return null;
  }
  return entry.insights;
}

function setCachedInsights(
  jobOrderId: string,
  fingerprint: string,
  insights: MatchInsight[],
) {
  insightCache.set(jobOrderId, {
    insights,
    fingerprint,
    cachedAt: Date.now(),
  });
}

function buildPrompt(input: MatchInsightInput): string {
  const required = input.jobOrder.requiredSkills.map((s) => s.name).join(', ') || 'none listed';
  const candidates = input.matches.map((m) => ({
    candidateId: m.candidateId,
    name: m.fullName,
    experienceYears: m.experienceYears,
    matchCount: m.matchCount,
    matchedSkills: m.matchedSkills.map((s) => s.name),
  }));

  return `You are helping a recruiter skim fit explanations for a job order.

Job title: ${input.jobOrder.jobTitle}
Required skills: ${required}

Candidates (already ranked by exact skill overlap — do not reorder or invent matches):
${JSON.stringify(candidates, null, 2)}

Return ONLY valid JSON (no markdown fences) shaped as:
{"insights":[{"candidateId":"<id>","insight":"<one sentence under 25 words>"}]}

Each insight should briefly explain why that candidate is a strong fit, referencing their matched skills and experience for a recruiter. One entry per candidate.`;
}

function salvagePartialInsights(text: string): { insights: Array<{ candidateId: string; insight: string }> } {
  const insights: Array<{ candidateId: string; insight: string }> = [];
  const re =
    /\{\s*"candidateId"\s*:\s*"([^"]+)"\s*,\s*"insight"\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/g;
  for (const match of text.matchAll(re)) {
    insights.push({
      candidateId: match[1],
      insight: match[2].replace(/\\"/g, '"').replace(/\\n/g, ' ').trim(),
    });
  }
  return { insights };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through and try salvage strategies below
  }

  try {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
  } catch {
    // truncated object — salvage complete insight entries below
  }

  try {
    const arrStart = trimmed.indexOf('[');
    const arrEnd = trimmed.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      return JSON.parse(trimmed.slice(arrStart, arrEnd + 1));
    }
  } catch {
    // truncated array — salvage below
  }

  const partial = salvagePartialInsights(trimmed);
  if (partial.insights.length) return partial;

  throw new Error('No JSON found');
}

function normalizeInsights(raw: unknown, validIds: Set<string>): MatchInsight[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object' && Array.isArray((raw as { insights?: unknown }).insights)) {
    list = (raw as { insights: unknown[] }).insights;
  } else {
    return [];
  }

  const results: MatchInsight[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const candidateId = String((item as { candidateId?: unknown }).candidateId ?? '');
    const insight = String((item as { insight?: unknown }).insight ?? '').trim();
    if (!candidateId || !insight || !validIds.has(candidateId)) continue;
    results.push({ candidateId, insight: insight.slice(0, 220) });
  }
  return results;
}

export const matchInsightService = {
  async getMatchInsights(input: MatchInsightInput): Promise<MatchInsight[]> {
    if (!input.matches.length) return [];

    const fingerprint = matchFingerprint(input.matches);
    const cached = getCachedInsights(input.jobOrderId, fingerprint);
    if (cached) {
      console.log(`[matchInsight] cache hit jobOrderId=${input.jobOrderId}`);
      return cached;
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) return [];

    console.log(`[matchInsight] cache miss — calling Groq jobOrderId=${input.jobOrderId}`);

    const validIds = new Set(input.matches.map((m) => m.candidateId));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.3,
          max_tokens: MAX_TOKENS,
          messages: [
            {
              role: 'system',
              content:
                'You write brief recruiter-facing match explanations. Respond with JSON only. Keep reasoning minimal.',
            },
            { role: 'user', content: buildPrompt(input) },
          ],
        }),
      });

      if (!response.ok) {
        // Keep ranking UX unbroken; log enough to debug model/key issues without secrets
        const errBody = await response.text().catch(() => '');
        console.warn(
          `[matchInsight] Groq ${response.status}: ${errBody.slice(0, 200)} (model=${MODEL})`,
        );
        return [];
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.warn(`[matchInsight] empty content from Groq (model=${MODEL})`);
        return [];
      }

      try {
        const parsed = extractJson(content);
        const insights = normalizeInsights(parsed, validIds);
        setCachedInsights(input.jobOrderId, fingerprint, insights);
        return insights;
      } catch (err) {
        console.warn(
          `[matchInsight] JSON parse failed (finish=${data.choices?.[0]?.finish_reason}, len=${content.length}):`,
          err instanceof Error ? err.message : err,
        );
        return [];
      }
    } catch (err) {
      console.warn(
        `[matchInsight] request failed:`,
        err instanceof Error ? err.message : err,
      );
      return [];
    } finally {
      clearTimeout(timer);
    }
  },
};
