import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RelayModule = {
  buildCommandDashRelay: (input: Record<string, unknown>) => {
    packet: {
      packet_id: string;
      target_aeye: string;
      dispatch_class: string;
      receipt_required: string;
    };
    proof: {
      proof_path: string;
      packet_path: string;
      paste_block_path: string;
      manual_send_required: boolean;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as Record<string, unknown>;
    const relay = await import("../../../../scripts/foreman/command-dash-aeye-relay.mjs") as RelayModule;
    const result = relay.buildCommandDashRelay(input);

    return NextResponse.json({
      ok: true,
      packet_id: result.packet.packet_id,
      target_aeye: result.packet.target_aeye,
      dispatch_class: result.packet.dispatch_class,
      receipt_required: result.packet.receipt_required,
      manual_send_required: result.proof.manual_send_required,
      packet_path: result.proof.packet_path,
      paste_block_path: result.proof.paste_block_path,
      proof_path: result.proof.proof_path
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to prepare Command Dash relay"
      },
      { status: 400 }
    );
  }
}
