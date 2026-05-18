type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export const getApiErrorMessage = (err: unknown, fallback = 'Request failed'): string => {
  const body = (err as { response?: { data?: ApiErrorBody } })?.response?.data;
  if (body?.errors) {
    const first = Object.values(body.errors).flat().find(Boolean);
    if (first) return first;
  }
  return body?.message ?? fallback;
};

export const parseOptionalAmount = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
};
