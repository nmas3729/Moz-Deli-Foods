export function hasTrustedOrigin(request: Request) {
  const appBaseUrl = process.env.APP_BASE_URL;
  const origin = request.headers.get("origin");
  if (!appBaseUrl || !origin) return false;

  try {
    return new URL(origin).origin === new URL(appBaseUrl).origin;
  } catch {
    return false;
  }
}

export function logSafeError(event: string, error: unknown) {
  const kind = error instanceof Error ? error.name : "UnknownError";
  console.error(JSON.stringify({ event, kind }));
}
