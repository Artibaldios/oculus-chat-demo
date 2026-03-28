const read = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  nextPublicSupabaseUrl: () => read("NEXT_PUBLIC_SUPABASE_URL"),
  nextPublicSupabaseAnonKey: () => read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseServiceRoleKey: () => read("SUPABASE_SERVICE_ROLE_KEY"),
  AiApiKey: () => read("AI_API_KEY"),
  AiModel: () => process.env.AI_MODEL ?? "gpt-5-nano",
};
