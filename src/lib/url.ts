export function appBaseUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function proofUrl(publicToken: string) {
  return `${appBaseUrl()}/v/${publicToken}`;
}
