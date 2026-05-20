import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';
import { createClient } from '@supabase/supabase-js';

// Setup directories
const CACHE_DIR = path.join(os.homedir(), '.lumina-lms');
const MUTATION_QUEUE_FILE = path.join(CACHE_DIR, 'mutation-queue.json');

// Ensure cache directory exists
if (typeof window === 'undefined') {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  if (!fs.existsSync(MUTATION_QUEUE_FILE)) {
    fs.writeFileSync(MUTATION_QUEUE_FILE, JSON.stringify([]));
  }
}

export interface Mutation {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
}

// 1. Connectivity Check
let lastKnownOnlineStatus = true;
let lastOnlineCheckTime = 0;
const ONLINE_CHECK_CACHE_MS = 10000; // 10 seconds cache

export function isSystemOnlineSync(): boolean {
  return lastKnownOnlineStatus;
}

export async function isOnline(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const online = navigator.onLine;
    lastKnownOnlineStatus = online;
    return online;
  }
  
  const now = Date.now();
  if (now - lastOnlineCheckTime < ONLINE_CHECK_CACHE_MS) {
    return lastKnownOnlineStatus;
  }
  
  lastOnlineCheckTime = now;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      lastKnownOnlineStatus = false;
      return false;
    }
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2 seconds timeout is plenty for HEAD ping
    
    const res = await fetch(supabaseUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(id);
    lastKnownOnlineStatus = res.ok || res.status === 404 || res.status === 400 || res.status === 401 || res.status === 403;
    return lastKnownOnlineStatus;
  } catch (e) {
    lastKnownOnlineStatus = false;
    return false;
  }
}

export function forceOffline() {
  lastKnownOnlineStatus = false;
}

// Check if running in Electron local offline mode
export function isLocalOfflineMode(): boolean {
  if (process.env.ELECTRON_MODE !== 'true') {
    return false;
  }
  // Server-side check
  return typeof window === 'undefined';
}

// 2. Cache Helpers
export function writeCache(table: string, data: any) {
  if (typeof window !== 'undefined') return;
  const filePath = path.join(CACHE_DIR, `${table}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function readCache(table: string): any[] {
  if (typeof window !== 'undefined') return [];
  const filePath = path.join(CACHE_DIR, `${table}.json`);
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`Failed to read cache for ${table}:`, e);
    return [];
  }
}

// 3. Mutation Queue Management
export function getMutationQueue(): Mutation[] {
  if (typeof window !== 'undefined') return [];
  try {
    const content = fs.readFileSync(MUTATION_QUEUE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to read mutation queue:', e);
    return [];
  }
}

export function saveMutationQueue(queue: Mutation[]) {
  if (typeof window !== 'undefined') return;
  fs.writeFileSync(MUTATION_QUEUE_FILE, JSON.stringify(queue, null, 2));
}

export function enqueueMutation(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
  if (typeof window !== 'undefined') return;
  const queue = getMutationQueue();
  const newMutation: Mutation = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    table,
    action,
    payload,
    timestamp: new Date().toISOString()
  };
  queue.push(newMutation);
  saveMutationQueue(queue);

  // Apply mutation to local cache immediately so reads reflect the write
  applyMutationToLocalCache(newMutation);
}

function applyMutationToLocalCache(mutation: Mutation) {
  const { table, action, payload } = mutation;
  const cacheData = readCache(table);

  if (action === 'INSERT') {
    cacheData.push(payload);
  } else if (action === 'UPDATE') {
    const index = cacheData.findIndex((item: any) => item.id === payload.id);
    if (index !== -1) {
      cacheData[index] = { ...cacheData[index], ...payload };
    }
  } else if (action === 'DELETE') {
    const filtered = cacheData.filter((item: any) => item.id !== payload.id);
    writeCache(table, filtered);
    return;
  }

  writeCache(table, cacheData);
}

// 4. Synchronization Logic
let isSyncing = false;

export function getSyncState() {
  return {
    isSyncing,
    queueLength: typeof window === 'undefined' ? getMutationQueue().length : 0
  };
}

export async function startBackgroundSync() {
  if (typeof window !== 'undefined') return;
  if (isSyncing) return;
  
  isSyncing = true;
  
  try {
    const online = await isOnline();
    if (!online) {
      isSyncing = false;
      return;
    }

    const queue = getMutationQueue();
    if (queue.length === 0) {
      // If queue is empty, fetch latest catalogs to refresh cache
      await refreshAllCaches();
      isSyncing = false;
      return;
    }

    console.info(`🔄 Syncing ${queue.length} offline mutations to Supabase...`);

    // Create a Supabase admin client using server env variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const successfullyProcessed: string[] = [];

    for (const mutation of queue) {
      try {
        const { table, action, payload } = mutation;
        
        if (action === 'INSERT') {
          const { error } = await supabase.from(table).insert(payload);
          if (error) throw error;
        } else if (action === 'UPDATE') {
          const { error } = await supabase.from(table).update(payload).eq('id', payload.id);
          if (error) throw error;
        } else if (action === 'DELETE') {
          const { error } = await supabase.from(table).delete().eq('id', payload.id);
          if (error) throw error;
        }
        
        successfullyProcessed.push(mutation.id);
      } catch (err: any) {
        console.error(`❌ Failed to sync mutation ${mutation.id} on table ${mutation.table}:`, err.message);
        // Stop processing subsequent mutations to maintain consistency/order
        break;
      }
    }

    if (successfullyProcessed.length > 0) {
      const remainingQueue = getMutationQueue().filter(m => !successfullyProcessed.includes(m.id));
      saveMutationQueue(remainingQueue);
      console.info(`✅ Successfully synced ${successfullyProcessed.length} mutations.`);
    }

    // Refresh local cache with latest remote database state
    await refreshAllCaches();
  } catch (e) {
    console.error('Error during database synchronization:', e);
  } finally {
    isSyncing = false;
  }
}

// 5. Cache Refreshing
export async function refreshAllCaches() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    console.error('[OFFLINE-SYNC] Cannot refresh cache: SUPABASE_SERVICE_ROLE_KEY is missing');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const tablesToCache = [
    'profiles',
    'library_cards',
    'books',
    'book_copies',
    'attendance',
    'borrowing_records',
    'audit_logs',
    'categories',
    'reservations',
    'system_settings',
    'notifications',
    'ui_preferences',
    'announcements',
    'renewals',
    'reports',
    'fines',
    'violations'
  ];

  for (const table of tablesToCache) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(2000);
      if (error) throw error;
      writeCache(table, data);
    } catch (e: any) {
      console.error(`Failed to refresh cache for table ${table}:`, e.message);
    }
  }
}

// Setup a periodic sync loop every 30 seconds if running in Electron mode
if (typeof window === 'undefined' && process.env.ELECTRON_MODE === 'true') {
  setInterval(() => {
    startBackgroundSync();
  }, 30000);
}
