import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { startBackgroundSync, refreshAllCaches } from "@/lib/database/offline-sync";

const CACHE_DIR = path.join(os.homedir(), '.lumina-lms');
const AUTH_CACHE_FILE = path.join(CACHE_DIR, 'auth-session.json');
const PROFILES_CACHE_FILE = path.join(CACHE_DIR, 'profiles.json');

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    if (action === 'login') {
      // Save user session from online login flow
      const { user } = body;
      fs.writeFileSync(AUTH_CACHE_FILE, JSON.stringify(user, null, 2));

      // Hydrate local caches with remote data immediately and await it
      await refreshAllCaches().catch(err => {
        console.error("[AUTH-PROXY] Failed to refresh caches on login:", err);
      });

      // Trigger background cache refresh/synchronization immediately
      startBackgroundSync().catch(err => {
        console.error("[AUTH-PROXY] Failed to start background sync on login:", err);
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'login-offline') {
      const { email, password } = body;

      // In offline/demo mode, we accept standard passwords
      if (password !== "Password123!") {
        return NextResponse.json(
          { data: null, error: { message: "Invalid credentials. Offline password is Password123!" } },
          { status: 401 }
        );
      }

      // Check if profiles cache exists
      if (!fs.existsSync(PROFILES_CACHE_FILE)) {
        return NextResponse.json(
          { data: null, error: { message: "Local profiles cache not found. Please log in online first to synchronize your profile." } },
          { status: 400 }
        );
      }

      // Read profiles cache to verify user
      const profilesData = JSON.parse(fs.readFileSync(PROFILES_CACHE_FILE, 'utf8'));
      const profile = profilesData.find((p: any) => p.email?.toLowerCase() === email?.toLowerCase());

      if (!profile) {
        return NextResponse.json(
          { data: null, error: { message: `No local profile found for email: ${email}. Please sign in online first.` } },
          { status: 404 }
        );
      }

      // Construct mock Supabase User and Session objects matching Supabase Auth format
      const mockUser = {
        id: profile.id,
        email: profile.email,
        role: profile.role || 'student',
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: profile.role || 'student'
        },
        user_metadata: {
          full_name: profile.full_name,
          email: profile.email
        },
        aud: 'authenticated',
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockSession = {
        access_token: `mock-offline-jwt-token-for-${profile.id}`,
        token_type: 'bearer',
        expires_in: 3600 * 24 * 365, // 1 year mock expiry
        refresh_token: `mock-offline-refresh-token-${profile.id}`,
        user: mockUser,
        expires_at: Math.floor(Date.now() / 1000) + (3600 * 24 * 365)
      };

      // Write mock user to local auth-session.json cache
      fs.writeFileSync(AUTH_CACHE_FILE, JSON.stringify(mockUser, null, 2));

      return NextResponse.json({
        user: mockUser,
        session: mockSession
      });
    }

    if (action === 'logout') {
      // Clear offline auth session cache
      if (fs.existsSync(AUTH_CACHE_FILE)) {
        fs.unlinkSync(AUTH_CACHE_FILE);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { data: null, error: { message: `Invalid action: ${action}` } },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in auth-proxy API:", error);
    return NextResponse.json(
      { data: null, error: { message: error.message || "Internal server error in auth proxy" } },
      { status: 500 }
    );
  }
}
