export const ALLOWED_EXTERNAL_ORIGINS = new Set<string>([
  'https://github.com',
  'https://openai.com',
  'https://openrouter.ai',
]);

export function isUrlAllowed(url: string): boolean {
  try {
    const { origin } = new URL(url);
    return ALLOWED_EXTERNAL_ORIGINS.has(origin);
  } catch {
    return false;
  }
}
