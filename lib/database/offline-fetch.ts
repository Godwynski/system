/**
 * Browser-safe and server-safe fetch wrapper for Supabase client.
 * Intercepts network-level failures (like DNS ENOTFOUND or connection errors when offline)
 * and returns a standard mock HTTP 503 response. This prevents Supabase client background tasks
 * from throwing unhandled "TypeError: fetch failed" errors.
 */
export async function offlineFriendlyFetch(
  url: RequestInfo | URL,
  options?: RequestInit
): Promise<Response> {
  const isBrowserOffline = typeof window !== 'undefined' && !navigator.onLine;

  if (isBrowserOffline) {
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Application is currently offline.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable (Offline)',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    return await fetch(url, options);
  } catch (err: any) {
    // Check if we are running in Electron and are offline on the server-side
    // or if the host cannot be resolved
    const isElectron = 
      process.env.ELECTRON_MODE === 'true' || 
      process.env.NEXT_PUBLIC_ELECTRON_MODE === 'true';

    const isNetworkError = 
      isElectron ||
      err.code === 'ENOTFOUND' || 
      err.code === 'ECONNREFUSED' || 
      err.message?.includes('fetch failed') ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('getaddrinfo') ||
      err.cause?.code === 'ENOTFOUND' || 
      err.cause?.code === 'ECONNREFUSED' || 
      err.cause?.message?.includes('ENOTFOUND') ||
      err.cause?.message?.includes('getaddrinfo');

    if (isNetworkError) {
      return new Response(
        JSON.stringify({
          error: 'offline_network_error',
          message: 'Network connection unavailable.',
          details: err.message || err,
        }),
        {
          status: 503,
          statusText: 'Service Unavailable (Network Error)',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Otherwise rethrow or handle normally
    throw err;
  }
}
