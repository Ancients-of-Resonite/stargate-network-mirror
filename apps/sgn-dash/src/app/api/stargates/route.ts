import { auth } from "@/lib/auth";
import { db } from "database/src/db";
import { stargate } from "database/src/schema";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const apikey =
    request.headers.get("x-api-key") ??
    request.nextUrl.searchParams.get("apikey");
  const format = request.nextUrl.searchParams.get("format");
  const session = await auth.api.getSession({
    headers: new Headers({
      "x-api-key": apikey ?? "",
    }),
  });

  const isAdmin = session?.user.tags.includes("admin");

  const stargates = (
    await db
      .select({
        id: stargate.id,
        ...(isAdmin ? { user_id: stargate.user_id } : {}),
        gate_address: stargate.gate_address,
        gate_code: stargate.gate_code,
        gate_status: stargate.gate_status,
        owner_name: stargate.owner_name,
        session_name: stargate.session_name,
        session_url: stargate.session_url,
        active_users: stargate.active_users,
        max_users: stargate.max_users,
        public_gate: stargate.public_gate,
        is_headless: stargate.is_headless,
        iris_state: stargate.iris_state,
        created: stargate.created,
      })
      .from(stargate)
  )
    .filter((v) => {
      if (isAdmin) return true;
      return v.public_gate;
    })
    .sort((a, b) => b.created!.getTime() - a.created!.getTime());

  if (format === "resonite") {
    let gates: string = "";

    stargates.map((g, i) => {
      gates = `${gates}${g.gate_address},${g.gate_code},${g.gate_status},${g.owner_name},${g.session_name},${g.active_users},${g.max_users},${g.is_headless},${g.public_gate}${i === stargates.length - 1 ? "" : "\n"}`;
    });

    return new Response(gates);
  }

  return Response.json([...stargates]);
}
