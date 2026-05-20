import { NextResponse } from "next/server";
import { isOnline, getSyncState } from "@/lib/database/offline-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const online = await isOnline();
    const syncState = getSyncState();
    
    return NextResponse.json({
      online,
      isSyncing: syncState.isSyncing,
      queueLength: syncState.queueLength
    });
  } catch (error: any) {
    console.error("Error in sync-status endpoint:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
