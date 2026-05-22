import "server-only";
import { getSupabaseService } from "@/lib/supabase/server";

export type FireFlareInput = {
  blueprintId: string;
  arena: string;
  turf: string;
};

export async function fire_flare({ blueprintId, arena, turf }: FireFlareInput) {
  const supabase = getSupabaseService();

  return supabase.rpc("fire_flare", {
    p_blueprint_id: blueprintId,
    p_arena: arena,
    p_turf: turf
  });
}
