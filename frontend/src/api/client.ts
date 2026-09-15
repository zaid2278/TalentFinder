const API_BASE = '';

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type Tenant = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export type Skill = {
  id: string;
  name: string;
};

export type Candidate = {
  id: string;
  tenantId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  experienceYears: number;
  cvUrl?: string | null;
  createdAt: string;
  skills: Skill[];
  submissions?: Array<{
    id: string;
    status: string;
    jobOrder: { id: string; jobTitle: string; status: string };
  }>;
};

export type JobOrder = {
  id: string;
  tenantId: string;
  jobTitle: string;
  clientName?: string | null;
  location: string;
  minExperienceYears: number;
  numberOfOpenings: number;
  status: string;
  createdAt: string;
  requiredSkills: Skill[];
  submissions?: Array<{
    id: string;
    status: string;
    candidate: {
      id: string;
      fullName: string;
      location?: string | null;
      experienceYears: number;
      skills: Skill[];
    };
  }>;
};

export type Match = {
  candidate: {
    id: string;
    fullName: string;
    location?: string | null;
    experienceYears: number;
    skills: Skill[];
  };
  matchedSkills: Skill[];
  matchCount: number;
};

export type Submission = {
  id: string;
  status: string;
  createdAt: string;
  jobOrder: { id: string; jobTitle: string };
  candidate: { id: string; fullName: string };
};

export type CvParseResponse = {
  readable: boolean;
  fields: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    experienceYears?: number;
    skillIds?: string[];
  };
  rawTextLength: number;
  cvUrl: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.error ||
      (data?.fields ? Object.values(data.fields).flat().join(', ') : null) ||
      'Request failed';
    throw new Error(message);
  }
  return data as T;
}

function withTenant(path: string, tenantId: string, params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams({ tenantId });
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
  }
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${qs.toString()}`;
}

export const api = {
  getTenants: (params?: { search?: string; page?: number }) =>
    request<Paginated<Tenant>>(
      `/api/tenants?${new URLSearchParams({
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.page ? { page: String(params.page) } : {}),
      }).toString()}`,
    ),

  createTenant: (name: string) =>
    request<Tenant>('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  getSkills: () => request<Skill[]>('/api/skills'),

  getCandidates: (tenantId: string, params?: { search?: string; page?: number; sort?: string }) =>
    request<Paginated<Candidate>>(withTenant('/api/candidates', tenantId, params)),

  getCandidate: (tenantId: string, id: string) =>
    request<Candidate>(withTenant(`/api/candidates/${id}`, tenantId)),

  createCandidate: (tenantId: string, formData: FormData) =>
    request<Candidate>(withTenant('/api/candidates', tenantId), {
      method: 'POST',
      body: formData,
    }),

  updateCandidate: (tenantId: string, id: string, formData: FormData) =>
    request<Candidate>(withTenant(`/api/candidates/${id}`, tenantId), {
      method: 'PUT',
      body: formData,
    }),

  deleteCandidate: (tenantId: string, id: string) =>
    request<{ success: boolean }>(withTenant(`/api/candidates/${id}`, tenantId), {
      method: 'DELETE',
    }),

  getJobOrders: (tenantId: string, params?: { search?: string; page?: number; sort?: string }) =>
    request<Paginated<JobOrder>>(withTenant('/api/job-orders', tenantId, params)),

  getJobOrder: (tenantId: string, id: string) =>
    request<JobOrder>(withTenant(`/api/job-orders/${id}`, tenantId)),

  createJobOrder: (tenantId: string, body: Record<string, unknown>) =>
    request<JobOrder>(withTenant('/api/job-orders', tenantId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateJobOrder: (tenantId: string, id: string, body: Record<string, unknown>) =>
    request<JobOrder>(withTenant(`/api/job-orders/${id}`, tenantId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  deleteJobOrder: (tenantId: string, id: string) =>
    request<{ success: boolean }>(withTenant(`/api/job-orders/${id}`, tenantId), {
      method: 'DELETE',
    }),

  getMatches: (tenantId: string, jobOrderId: string) =>
    request<Match[]>(withTenant(`/api/job-orders/${jobOrderId}/matches`, tenantId)),

  getMatchInsights: (tenantId: string, jobOrderId: string) =>
    request<{ insights: Array<{ candidateId: string; insight: string }> }>(
      withTenant(`/api/job-orders/${jobOrderId}/matches/insights`, tenantId),
    ),

  shortlist: (tenantId: string, jobOrderId: string, candidateId: string) =>
    request(withTenant(`/api/job-orders/${jobOrderId}/shortlist`, tenantId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    }),

  unshortlist: (tenantId: string, jobOrderId: string, candidateId: string) =>
    request(withTenant(`/api/job-orders/${jobOrderId}/shortlist`, tenantId), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    }),

  getSubmissions: (tenantId: string, params?: { search?: string; page?: number; sort?: string }) =>
    request<Paginated<Submission>>(withTenant('/api/submissions', tenantId, params)),

  parseCv: (file: File) => {
    const formData = new FormData();
    formData.append('cv', file);
    return request<CvParseResponse>('/api/candidates/parse-cv', {
      method: 'POST',
      body: formData,
    });
  },
};