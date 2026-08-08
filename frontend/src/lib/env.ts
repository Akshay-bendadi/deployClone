const envVarName = "VITE_API_URL";

function requireEnv(value: string | undefined): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing ${envVarName}. Set it in your .env.local file.`);
  }

  return value.trim();
}

export function getApiBaseUrl(): string {
  return requireEnv(import.meta.env.VITE_API_URL);
}
