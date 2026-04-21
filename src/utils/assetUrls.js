export const resolveAssetUrl = (rawUrl, fallback = '') => {
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const candidate = trimmed || fallback;
  if (!candidate) return '';

  if (/^(https?:|data:|blob:|\/\/)/i.test(candidate)) {
    return candidate;
  }

  const base = import.meta.env.BASE_URL || '/';
  const clean = candidate.startsWith('/') ? candidate.slice(1) : candidate;
  return base.endsWith('/') ? `${base}${clean}` : `${base}/${clean}`;
};
