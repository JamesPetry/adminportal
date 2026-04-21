import { getSupabaseEnvOrNull } from "@/lib/supabase/env";

export const isSupabaseEnabled = Boolean(getSupabaseEnvOrNull());
