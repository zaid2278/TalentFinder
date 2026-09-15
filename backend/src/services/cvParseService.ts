import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { skillRepository } from '../repositories/skillRepository.js';

export type CvParseFields = {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  experienceYears?: number;
  skillIds?: string[];
};

export type CvParseResult = {
  readable: boolean;
  fields: CvParseFields;
  rawTextLength: number;
};

function normalizeExt(mimeOrExt: string): string {
  const lower = mimeOrExt.toLowerCase().trim();
  if (lower.includes('pdf') || lower.endsWith('.pdf')) return '.pdf';
  if (lower.includes('wordprocessingml') || lower.endsWith('.docx')) return '.docx';
  if (lower.includes('msword') || lower.endsWith('.doc')) return '.doc';
  return path.extname(lower) || lower;
}

async function extractText(filePath: string, ext: string): Promise<string | null> {
  if (ext === '.doc') return null;

  if (ext === '.pdf') {
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text || '';
    } finally {
      await parser.destroy();
    }
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  return null;
}

function looksLikeName(line: string): boolean {
  const cleaned = line.replace(/[^a-zA-Z\s\-'.]/g, '').trim();
  if (cleaned.length < 3 || cleaned.length > 60) return false;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  if (/^(resume|curriculum|cv|profile|objective|experience|education|skills)$/i.test(cleaned)) {
    return false;
  }
  return words.every((w) => /^[A-Z][a-zA-Z'-]*$/.test(w) || /^[A-Z]+$/.test(w));
}

function extractFullName(text: string): string | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (looksLikeName(line)) return line.replace(/\s+/g, ' ').trim();
  }
  return undefined;
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
}

function extractPhone(text: string): string | undefined {
  const match = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/,
  );
  return match?.[0]?.trim();
}

function extractLocation(text: string): string | undefined {
  const cityState = text.match(
    /\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?),\s*([A-Z]{2})\b/,
  );
  if (cityState) return `${cityState[1]}, ${cityState[2]}`;

  const labeled = text.match(
    /(?:Location|Based in|Address)\s*[:\-]\s*([^\n,]{2,40}(?:,\s*[A-Z]{2})?)/i,
  );
  if (labeled) return labeled[1].trim();

  return undefined;
}

function extractExperienceYears(text: string): number | undefined {
  const patterns = [
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp\.?)/i,
    /(?:experience|exp\.?)\s*[:\-]?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/i,
    /over\s+(\d{1,2})\s*(?:years?|yrs?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const years = Number(match[1]);
      if (Number.isFinite(years) && years >= 0 && years <= 50) return years;
    }
  }
  return undefined;
}

async function extractSkillIds(text: string): Promise<string[]> {
  const skills = await skillRepository.findAll();
  const lower = text.toLowerCase();
  const matched: string[] = [];

  // Longer names first so "Node.js" wins over "Node" if both existed
  const sorted = [...skills].sort((a, b) => b.name.length - a.name.length);
  for (const skill of sorted) {
    const name = skill.name.toLowerCase();
    if (name.length < 2) continue;
    // Word-boundary-ish match; allow punctuation in skill names like C++
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
    if (re.test(lower) || lower.includes(name)) {
      matched.push(skill.id);
    }
  }
  return matched;
}

export const cvParseService = {
  async parseCv(filePath: string, mimeOrExt: string): Promise<CvParseResult> {
    const ext = normalizeExt(mimeOrExt || path.extname(filePath));

    let text: string | null = null;
    try {
      text = await extractText(filePath, ext);
    } catch {
      return { readable: false, fields: {}, rawTextLength: 0 };
    }

    if (text === null) {
      return { readable: false, fields: {}, rawTextLength: 0 };
    }

    const cleaned = text.replace(/\s+/g, ' ').trim();
    const rawTextLength = cleaned.length;
    if (rawTextLength < 20) {
      return { readable: false, fields: {}, rawTextLength };
    }

    const fields: CvParseFields = {};
    const fullName = extractFullName(text);
    const email = extractEmail(text);
    const phone = extractPhone(text);
    const location = extractLocation(text);
    const experienceYears = extractExperienceYears(text);
    const skillIds = await extractSkillIds(text);

    if (fullName) fields.fullName = fullName;
    if (email) fields.email = email;
    if (phone) fields.phone = phone;
    if (location) fields.location = location;
    if (experienceYears !== undefined) fields.experienceYears = experienceYears;
    if (skillIds.length > 0) fields.skillIds = skillIds;

    return { readable: true, fields, rawTextLength };
  },
};
