const configuredUrl = process.env.APP_BASE_URL?.trim()
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const siteUrl = new URL(configuredUrl);
