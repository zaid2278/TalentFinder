export function parsePagination(query: { page?: string; pageSize?: string }) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 10));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function parseSort(sort?: string, allowed: string[] = ['createdAt', 'name']) {
  if (!sort) return { createdAt: 'desc' as const };
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  if (!allowed.includes(field)) return { createdAt: 'desc' as const };
  return { [field]: desc ? ('desc' as const) : ('asc' as const) };
}