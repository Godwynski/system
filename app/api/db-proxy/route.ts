import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let requestData: { table: string; chain: any[] } | null = null;
  try {
    requestData = await req.json();
    const { table, chain } = requestData!;
    
    // Create server-side Supabase client (which is wrapped in offline proxy)
    const supabase = await createClient();
    
    let query = supabase.from(table);
    
    // Execute the serialized chain of queries
    for (const step of chain) {
      const { method, args } = step;
      
      if (typeof (query as any)[method] === 'function') {
        query = (query as any)[method](...args);
      } else {
        throw new Error(`Method ${method} is not supported on the query builder`);
      }
    }
    
    // Await the query result
    let result = (await query) as any;
    
    // Check for network errors and trigger automatic offline fallback
    const isNetErr = result && result.error && (
      result.error.status === 503 ||
      String(result.error.message || '').toLowerCase().includes('network connection') ||
      String(result.error.message || '').toLowerCase().includes('offline') ||
      String(result.error.message || '').toLowerCase().includes('fetch failed')
    );

    if (isNetErr) {
      console.warn(`[DB-PROXY] Online query to ${table} failed with network error. Retrying offline fallback.`);
      const { forceOffline } = require("@/lib/database/offline-sync");
      forceOffline();
      
      const { OfflineQueryBuilder } = require("@/lib/database/supabase-proxy");
      let offlineQuery = new OfflineQueryBuilder(table);
      for (const step of chain) {
        const { method, args } = step;
        if (typeof (offlineQuery as any)[method] === 'function') {
          offlineQuery = (offlineQuery as any)[method](...args);
        }
      }
      result = await offlineQuery;
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in db-proxy endpoint:", error);
    
    // Check if error is network/offline related
    const isNetErr = 
      error.message?.includes('fetch failed') || 
      error.message?.includes('network') || 
      error.code === 'ENOTFOUND' ||
      error.cause?.message?.includes('ENOTFOUND');
      
    if (isNetErr && requestData) {
      try {
        console.warn(`[DB-PROXY] Exception in db-proxy indicates network failure. Retrying with offline cache.`);
        const { forceOffline } = require("@/lib/database/offline-sync");
        forceOffline();
        
        const { OfflineQueryBuilder } = require("@/lib/database/supabase-proxy");
        let offlineQuery = new OfflineQueryBuilder(requestData.table);
        for (const step of requestData.chain) {
          const { method, args } = step;
          if (typeof (offlineQuery as any)[method] === 'function') {
            offlineQuery = (offlineQuery as any)[method](...args);
          }
        }
        const result = await offlineQuery;
        return NextResponse.json(result);
      } catch (fallbackError) {
        console.error("DB Proxy fallback failed:", fallbackError);
      }
    }

    return NextResponse.json(
      { data: null, error: { message: error.message || "Internal db-proxy error" } },
      { status: 500 }
    );
  }
}
