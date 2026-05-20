import { readCache, enqueueMutation, isOnline, isSystemOnlineSync } from './offline-sync';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_DIR = path.join(os.homedir(), '.lumina-lms');
const AUTH_CACHE_FILE = path.join(CACHE_DIR, 'auth-session.json');

// Save the authenticated user session to a local file for offline access
export function cacheAuthSession(userData: any) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sb-session', JSON.stringify(userData));
    } catch {}
    return;
  }
  fs.writeFileSync(AUTH_CACHE_FILE, JSON.stringify(userData, null, 2));
}

// Retrieve the authenticated user session from cache when offline
export function getCachedAuthSession(): any | null {
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && (parsed.user || parsed.currentSession?.user)) {
              return parsed.user || parsed.currentSession?.user;
            }
          }
        }
      }
      const sessionStr = localStorage.getItem('sb-session');
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch {
      return null;
    }
  }
  if (!fs.existsSync(AUTH_CACHE_FILE)) return null;
  try {
    const content = fs.readFileSync(AUTH_CACHE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    current = current[part];
    if (current === undefined || current === null) return undefined;
  }
  return current;
}

export interface SelectNode {
  columns: string[];
  joins: {
    [key: string]: {
      node: SelectNode;
      relationName: string;
      originalName: string;
    };
  };
}

export function parseSelectString(str: string): SelectNode {
  const root: SelectNode = { columns: [], joins: {} };
  let currentStr = '';
  let depth = 0;
  let parenStart = -1;
  let joinName = '';
  
  const cleanStr = str.replace(/\s+/g, ' ').trim();
  
  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];
    if (char === '(') {
      if (depth === 0) {
        parenStart = i;
        joinName = currentStr.trim();
        currentStr = '';
      }
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0) {
        const subQuery = cleanStr.substring(parenStart + 1, i);
        let alias = '';
        let targetTable = joinName;
        if (joinName.includes(':')) {
          const parts = joinName.split(':');
          alias = parts[0].trim();
          targetTable = parts[1].trim();
        }
        targetTable = targetTable.split('!')[0].trim();
        if (!alias) {
          alias = targetTable;
        }
        
        root.joins[alias] = {
          node: parseSelectString(subQuery),
          relationName: targetTable,
          originalName: joinName
        };
        joinName = '';
      }
    } else if (char === ',' && depth === 0) {
      const col = currentStr.trim();
      if (col && !col.includes('(')) {
        root.columns.push(col);
      }
      currentStr = '';
    } else {
      if (depth === 0) {
        currentStr += char;
      }
    }
  }
  
  const finalCol = currentStr.trim();
  if (finalCol) {
    root.columns.push(finalCol);
  }
  
  return root;
}

export const RELATIONSHIPS: Record<string, Record<string, { parentKey: string; childKey: string; isArray: boolean; table: string }>> = {
  'profiles': {
    'library_cards': { parentKey: 'id', childKey: 'user_id', isArray: true, table: 'library_cards' },
    'borrowing_records': { parentKey: 'id', childKey: 'user_id', isArray: true, table: 'borrowing_records' },
    'attendance': { parentKey: 'id', childKey: 'user_id', isArray: true, table: 'attendance' },
    'reservations': { parentKey: 'id', childKey: 'user_id', isArray: true, table: 'reservations' },
    'notifications': { parentKey: 'id', childKey: 'user_id', isArray: true, table: 'notifications' }
  },
  'library_cards': {
    'profiles': { parentKey: 'user_id', childKey: 'id', isArray: false, table: 'profiles' }
  },
  'book_copies': {
    'books': { parentKey: 'book_id', childKey: 'id', isArray: false, table: 'books' },
    'reservations': { parentKey: 'id', childKey: 'copy_id', isArray: true, table: 'reservations' },
    'borrowing_records': { parentKey: 'id', childKey: 'book_copy_id', isArray: true, table: 'borrowing_records' }
  },
  'books': {
    'categories': { parentKey: 'category_id', childKey: 'id', isArray: false, table: 'categories' },
    'book_copies': { parentKey: 'id', childKey: 'book_id', isArray: true, table: 'book_copies' },
    'reservations': { parentKey: 'id', childKey: 'book_id', isArray: true, table: 'reservations' }
  },
  'categories': {
    'books': { parentKey: 'id', childKey: 'category_id', isArray: true, table: 'books' }
  },
  'attendance': {
    'profiles': { parentKey: 'user_id', childKey: 'id', isArray: false, table: 'profiles' }
  },
  'borrowing_records': {
    'book_copies': { parentKey: 'book_copy_id', childKey: 'id', isArray: false, table: 'book_copies' },
    'profiles': { parentKey: 'user_id', childKey: 'id', isArray: false, table: 'profiles' }
  },
  'reservations': {
    'books': { parentKey: 'book_id', childKey: 'id', isArray: false, table: 'books' },
    'profiles': { parentKey: 'user_id', childKey: 'id', isArray: false, table: 'profiles' },
    'book_copies': { parentKey: 'copy_id', childKey: 'id', isArray: false, table: 'book_copies' }
  },
  'notifications': {
    'profiles': { parentKey: 'user_id', childKey: 'id', isArray: false, table: 'profiles' },
    'books': { parentKey: 'book_id', childKey: 'id', isArray: false, table: 'books' }
  }
};

export function resolveRelation(parentTable: string, relationName: string, alias: string): { parentKey: string; childKey: string; isArray: boolean; table: string } | null {
  if (RELATIONSHIPS[parentTable]?.[alias]) {
    return RELATIONSHIPS[parentTable][alias];
  }
  if (RELATIONSHIPS[parentTable]?.[relationName]) {
    return RELATIONSHIPS[parentTable][relationName];
  }
  
  const nameToUse = relationName || alias;
  let isArray = nameToUse.endsWith('s');
  let targetTable = nameToUse;
  
  const singularParent = parentTable.endsWith('s') ? parentTable.slice(0, -1) : parentTable;
  const singularRelation = nameToUse.endsWith('s') ? nameToUse.slice(0, -1) : nameToUse;
  
  if (isArray) {
    return {
      parentKey: 'id',
      childKey: `${singularParent}_id`,
      isArray: true,
      table: targetTable
    };
  } else {
    return {
      parentKey: `${singularRelation}_id`,
      childKey: 'id',
      isArray: false,
      table: targetTable
    };
  }
}

export function pruneFields(item: any, node: SelectNode): any {
  if (!item) return item;
  
  const hasWildcard = node.columns.includes('*') || node.columns.length === 0;
  const pruned: any = {};
  
  if (hasWildcard) {
    for (const key of Object.keys(item)) {
      if (typeof item[key] !== 'object' || item[key] === null || Array.isArray(item[key])) {
        pruned[key] = item[key];
      }
    }
  } else {
    for (const col of node.columns) {
      pruned[col] = item[col];
    }
  }
  
  for (const alias of Object.keys(node.joins)) {
    const joinInfo = node.joins[alias];
    const relationData = item[alias];
    
    if (Array.isArray(relationData)) {
      pruned[alias] = relationData.map(r => pruneFields(r, joinInfo.node));
    } else if (relationData) {
      pruned[alias] = pruneFields(relationData, joinInfo.node);
    } else {
      pruned[alias] = null;
    }
  }
  
  return pruned;
}

export class OfflineQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderByField: string | null = null;
  private orderAscending = true;
  private limitValue: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private selectNode: SelectNode | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    this.selectNode = parseSelectString(columns);
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(item => {
      const val = getNestedValue(item, column);
      if (val === undefined) {
        return item[column] === value;
      }
      return val === value;
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(item => {
      const val = getNestedValue(item, column) ?? item[column];
      return val !== value;
    });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push(item => {
      const val = getNestedValue(item, column) ?? item[column];
      return val >= value;
    });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push(item => {
      const val = getNestedValue(item, column) ?? item[column];
      return val <= value;
    });
    return this;
  }

  ilike(column: string, value: string) {
    const pattern = value.replace(/%/g, '');
    this.filters.push(item => {
      const val = getNestedValue(item, column) ?? item[column];
      if (typeof val !== 'string') return false;
      return val.toLowerCase().includes(pattern.toLowerCase());
    });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push(item => {
      const val = getNestedValue(item, column) ?? item[column];
      return values.includes(val);
    });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push(item => {
      const val = getNestedValue(item, column) ?? item[column];
      return val === value;
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByField = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  or(filters: string, options?: { referencedTable?: string }) {
    const conditions = filters.split(',').map(cond => {
      const parts = cond.split('.');
      const operators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'cs', 'cd'];
      let opIndex = parts.findIndex(p => operators.includes(p));
      
      if (opIndex === -1) {
        opIndex = parts.length - 2;
      }
      
      const column = parts.slice(0, opIndex).join('.');
      const operator = parts[opIndex];
      const value = parts.slice(opIndex + 1).join('.');
      
      return { column, operator, value };
    });

    this.filters.push(item => {
      return conditions.some(cond => {
        let val;
        let columnPath = cond.column;
        if (options?.referencedTable) {
          columnPath = `${options.referencedTable}.${columnPath}`;
        }
        val = getNestedValue(item, columnPath);
        
        if (cond.operator === 'ilike') {
          const pattern = cond.value.replace(/%/g, '').toLowerCase();
          return typeof val === 'string' && val.toLowerCase().includes(pattern);
        }
        if (cond.operator === 'eq') {
          return String(val) === cond.value;
        }
        if (cond.operator === 'in') {
          const listStr = cond.value.replace(/^\(|\)$/g, '');
          const list = listStr.split(',');
          return list.includes(String(val));
        }
        return false;
      });
    });
    return this;
  }

  maybeSingle() {
    return this.then(
      (res: any) => ({ data: res.data ? (res.data[0] || null) : null, error: null }),
      (err: any) => ({ data: null, error: err })
    );
  }

  single() {
    return this.then(
      (res: any) => {
        if (!res.data || res.data.length === 0) {
          return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
        }
        return { data: res.data[0], error: null };
      },
      (err: any) => ({ data: null, error: err })
    );
  }

  private resolveJoinsForItem(item: any, parentTable: string, selectNode: SelectNode): any {
    if (!item) return item;
    const itemCopy = { ...item };
    
    for (const alias of Object.keys(selectNode.joins)) {
      const joinInfo = selectNode.joins[alias];
      const rel = resolveRelation(parentTable, joinInfo.relationName, alias);
      
      if (rel) {
        const relationData = readCache(rel.table);
        if (rel.isArray) {
          const matches = relationData.filter(r => r[rel.childKey] === itemCopy[rel.parentKey]);
          itemCopy[alias] = matches.map(m => this.resolveJoinsForItem(m, rel.table, joinInfo.node));
        } else {
          const match = relationData.find(r => r[rel.childKey] === itemCopy[rel.parentKey]);
          itemCopy[alias] = match ? this.resolveJoinsForItem(match, rel.table, joinInfo.node) : null;
        }
      } else {
        itemCopy[alias] = null;
      }
    }
    
    return itemCopy;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      let data = readCache(this.table);

      // Perform dynamic joins if selectNode has joins
      if (this.selectNode) {
        data = data.map(item => this.resolveJoinsForItem(item, this.table, this.selectNode!));
      }

      // Filter local cache
      for (const filter of this.filters) {
        data = data.filter(filter);
      }

      // Sort
      if (this.orderByField) {
        data.sort((a, b) => {
          const valA = getNestedValue(a, this.orderByField!);
          const valB = getNestedValue(b, this.orderByField!);
          if (valA === undefined || valB === undefined) {
            const rawA = a[this.orderByField!];
            const rawB = b[this.orderByField!];
            if (rawA < rawB) return this.orderAscending ? -1 : 1;
            if (rawA > rawB) return this.orderAscending ? 1 : -1;
            return 0;
          }
          if (valA < valB) return this.orderAscending ? -1 : 1;
          if (valA > valB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }

      const totalCount = data.length;

      // Limit
      if (this.limitValue !== null) {
        data = data.slice(0, this.limitValue);
      }

      // Range
      if (this.rangeFrom !== null && this.rangeTo !== null) {
        data = data.slice(this.rangeFrom, this.rangeTo + 1);
      }

      // Prune fields at the end
      if (this.selectNode) {
        data = data.map(item => pruneFields(item, this.selectNode!));
      }

      const response = { data, error: null, count: totalCount };
      return onfulfilled ? onfulfilled(response) : response;
    } catch (e: any) {
      const errRes = { data: null, error: e, count: 0 };
      return onrejected ? onrejected(errRes) : errRes;
    }
  }

  insert(values: any) {
    const payload = Array.isArray(values) ? values : [values];
    const records = payload.map(item => ({
      id: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      ...item
    }));

    for (const record of records) {
      enqueueMutation(this.table, 'INSERT', record);
    }

    return Promise.resolve({
      data: Array.isArray(values) ? records : records[0],
      error: null
    });
  }

  update(values: any) {
    return {
      eq: (column: string, value: any) => {
        const cacheData = readCache(this.table);
        const matches = cacheData.filter((item: any) => item[column] === value);
        
        for (const match of matches) {
          const updatedPayload = { ...match, ...values, id: match.id };
          enqueueMutation(this.table, 'UPDATE', updatedPayload);
        }

        return Promise.resolve({
          data: matches.map(m => ({ ...m, ...values })),
          error: null
        });
      },
      in: (column: string, valuesList: any[]) => {
        const cacheData = readCache(this.table);
        const matches = cacheData.filter((item: any) => valuesList.includes(item[column]));
        
        for (const match of matches) {
          const updatedPayload = { ...match, ...values, id: match.id };
          enqueueMutation(this.table, 'UPDATE', updatedPayload);
        }

        return Promise.resolve({
          data: matches.map(m => ({ ...m, ...values })),
          error: null
        });
      }
    };
  }

  delete() {
    return {
      eq: (column: string, value: any) => {
        const cacheData = readCache(this.table);
        const matches = cacheData.filter((item: any) => item[column] === value);

        for (const match of matches) {
          enqueueMutation(this.table, 'DELETE', { id: match.id });
        }

        return Promise.resolve({
          data: matches,
          error: null
        });
      }
    };
  }
}

// Proxied Client Object Creator
// Simulated RPC handler when offline
async function simulateRpcOffline(fn: string, args: any): Promise<{ data: any; error: any }> {
  console.log(`[OFFLINE-RPC] Simulating offline RPC: ${fn}`, args);
  const now = new Date().toISOString();

  try {
    if (fn === 'process_qr_checkout') {
      const { p_librarian_id, p_card_qr, p_book_qr, p_preview_only } = args;

      // 1. Resolve library card
      const cards = readCache('library_cards');
      const card = cards.find(c => c.card_number === p_card_qr.trim());
      if (!card) {
        return { data: { ok: false, code: 'CARD_NOT_FOUND', message: 'Library card not found.' }, error: null };
      }

      if (String(card.status).toUpperCase() !== 'ACTIVE') {
        return { data: { ok: false, code: 'CARD_INACTIVE', message: 'Library card is not active.' }, error: null };
      }

      // 2. Resolve profile
      const profiles = readCache('profiles');
      const profile = profiles.find(p => p.id === card.user_id);
      if (!profile) {
        return { data: { ok: false, code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' }, error: null };
      }

      if (String(profile.status).toUpperCase() !== 'ACTIVE') {
        return { data: { ok: false, code: 'ACCOUNT_INACTIVE', message: 'Student account is not active.' }, error: null };
      }

      // 3. Check borrow limits
      const settings = readCache('system_settings');
      const limitSetting = settings.find(s => s.key === 'max_borrow_limit');
      const maxLimit = limitSetting ? parseInt(limitSetting.value, 10) : 5;

      const borrowingRecords = readCache('borrowing_records');
      const activeBorrows = borrowingRecords.filter(b => b.user_id === card.user_id && b.status === 'ACTIVE').length;

      if (activeBorrows >= maxLimit) {
        return { data: { ok: false, code: 'LIMIT_EXCEEDED', message: 'Borrow limit reached.' }, error: null };
      }

      // 4. Resolve book copy
      const copies = readCache('book_copies');
      const copy = copies.find(c => c.qr_string === p_book_qr.trim());
      if (!copy) {
        return { data: { ok: false, code: 'COPY_NOT_FOUND', message: 'Book copy not found.' }, error: null };
      }

      if (copy.status === 'RESERVED') {
        const reservations = readCache('reservations');
        const userRes = reservations.find(r => r.copy_id === copy.id && r.user_id === card.user_id && r.status === 'READY');
        if (!userRes) {
          return { data: { ok: false, code: 'COPY_UNAVAILABLE', message: 'This copy is reserved for another student.' }, error: null };
        }
      } else if (copy.status !== 'AVAILABLE') {
        return { data: { ok: false, code: 'COPY_UNAVAILABLE', message: 'This copy is not available for checkout.' }, error: null };
      }

      // 5. Get loan days setting
      const loanSetting = settings.find(s => s.key === 'loan_period_days');
      const loanDays = loanSetting ? parseInt(loanSetting.value, 10) : 14;
      const dueDate = new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000);

      // Resolve book title
      const books = readCache('books');
      const book = books.find(b => b.id === copy.book_id);
      const bookTitle = book ? book.title : 'Unknown Book';

      if (p_preview_only) {
        return {
          data: {
            ok: true,
            preview: true,
            student_name: profile.full_name,
            book_title: bookTitle,
            due_date: dueDate.toISOString()
          },
          error: null
        };
      }

      // 6. Generate UUIDs and process checkout
      const newBorrowingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Update book copy
      enqueueMutation('book_copies', 'UPDATE', { id: copy.id, status: 'BORROWED', updated_at: now });

      // Create borrowing record
      enqueueMutation('borrowing_records', 'INSERT', {
        id: newBorrowingId,
        user_id: card.user_id,
        book_copy_id: copy.id,
        processed_by: p_librarian_id,
        borrowed_at: now,
        due_date: dueDate.toISOString(),
        status: 'ACTIVE',
        created_at: now,
        updated_at: now
      });

      // Fulfill reservation if matching
      const reservations = readCache('reservations');
      const matchingRes = reservations.find(r => r.copy_id === copy.id && r.user_id === card.user_id && r.status === 'READY');
      if (matchingRes) {
        enqueueMutation('reservations', 'UPDATE', { id: matchingRes.id, status: 'FULFILLED', updated_at: now });
      }

      return {
        data: {
          ok: true,
          borrowing_id: newBorrowingId,
          student_name: profile.full_name,
          book_title: bookTitle,
          due_date: dueDate.toISOString()
        },
        error: null
      };
    }

    if (fn === 'process_qr_return') {
      const { p_book_qr, p_preview_only } = args;

      // 1. Resolve book copy
      const copies = readCache('book_copies');
      const copy = copies.find(c => c.qr_string === p_book_qr.trim());
      if (!copy) {
        return { data: { ok: false, code: 'COPY_NOT_FOUND', message: 'Book copy not found.' }, error: null };
      }

      // 2. Find active borrowing record
      const borrowingRecords = readCache('borrowing_records');
      const activeBorrow = borrowingRecords
        .filter(b => b.book_copy_id === copy.id && b.status === 'ACTIVE')
        .sort((a, b) => new Date(b.borrowed_at).getTime() - new Date(a.borrowed_at).getTime())[0];

      if (!activeBorrow) {
        return { data: { ok: false, code: 'NOT_BORROWED', message: 'No active borrow record found for this copy.' }, error: null };
      }

      const profiles = readCache('profiles');
      const profile = profiles.find(p => p.id === activeBorrow.user_id);
      const studentName = profile ? profile.full_name : 'Student';

      const books = readCache('books');
      const book = books.find(b => b.id === copy.book_id);
      const bookTitle = book ? book.title : 'Unknown Book';

      if (p_preview_only) {
        return {
          data: {
            ok: true,
            preview: true,
            book_title: bookTitle,
            student_name: studentName
          },
          error: null
        };
      }

      // 3. Mark returned
      enqueueMutation('borrowing_records', 'UPDATE', {
        id: activeBorrow.id,
        status: 'RETURNED',
        returned_at: now,
        updated_at: now
      });

      // 4. Check for next reservation in queue
      const reservations = readCache('reservations');
      const nextRes = reservations
        .filter(r => r.book_id === copy.book_id && r.status === 'ACTIVE')
        .sort((a, b) => {
          if (a.queue_position !== b.queue_position) {
            return (a.queue_position || 0) - (b.queue_position || 0);
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })[0];

      if (nextRes) {
        const settings = readCache('system_settings');
        const holdSetting = settings.find(s => s.key === 'hold_expiry_days');
        const holdDays = holdSetting ? parseInt(holdSetting.value, 10) : 7;
        const holdExpiry = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);

        enqueueMutation('reservations', 'UPDATE', {
          id: nextRes.id,
          status: 'READY',
          copy_id: copy.id,
          fulfilled_at: now,
          hold_expires_at: holdExpiry.toISOString(),
          updated_at: now
        });

        enqueueMutation('book_copies', 'UPDATE', {
          id: copy.id,
          status: 'RESERVED',
          updated_at: now
        });

        const reservedProfile = profiles.find(p => p.id === nextRes.user_id);
        const reservedStudentName = reservedProfile ? reservedProfile.full_name : 'Reserved Student';

        return {
          data: {
            ok: true,
            book_title: bookTitle,
            returned_at: now,
            student_name: studentName,
            reservation_ready: true,
            reserved_for: reservedStudentName
          },
          error: null
        };
      } else {
        enqueueMutation('book_copies', 'UPDATE', {
          id: copy.id,
          status: 'AVAILABLE',
          updated_at: now
        });

        return {
          data: {
            ok: true,
            book_title: bookTitle,
            returned_at: now,
            student_name: studentName,
            reservation_ready: false
          },
          error: null
        };
      }
    }

    if (fn === 'compress_reservation_queue') {
      const { p_book_id } = args;
      const reservations = readCache('reservations');
      const activeRes = reservations
        .filter(r => r.book_id === p_book_id && r.status === 'ACTIVE')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      activeRes.forEach((res, index) => {
        const newPos = index + 1;
        if (res.queue_position !== newPos) {
          enqueueMutation('reservations', 'UPDATE', {
            id: res.id,
            queue_position: newPos,
            updated_at: now
          });
        }
      });

      return { data: null, error: null };
    }

    if (fn === 'create_reservation_atomic') {
      const { p_actor_id, p_book_id, p_target_user_id } = args;
      const targetUserId = p_target_user_id || p_actor_id;

      const profiles = readCache('profiles');
      const profile = profiles.find(p => p.id === targetUserId);
      if (profile && profile.status === 'SUSPENDED') {
        return { data: { ok: false, code: 'SUSPENDED', message: 'User account is suspended.' }, error: null };
      }

      const reservations = readCache('reservations');
      const hasDuplicate = reservations.some(r => r.user_id === targetUserId && r.book_id === p_book_id && ['ACTIVE', 'READY'].includes(r.status));
      if (hasDuplicate) {
        return { data: { ok: false, code: 'DUPLICATE', message: 'You already have an active reservation for this book.' }, error: null };
      }

      const copies = readCache('book_copies');
      const availableCopy = copies.find(c => c.book_id === p_book_id && c.status === 'AVAILABLE');

      const resId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (availableCopy) {
        const settings = readCache('system_settings');
        const holdSetting = settings.find(s => s.key === 'hold_expiry_days');
        const holdDays = holdSetting ? parseInt(holdSetting.value, 10) : 3;
        const holdExpiry = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);

        enqueueMutation('book_copies', 'UPDATE', { id: availableCopy.id, status: 'RESERVED', updated_at: now });
        enqueueMutation('reservations', 'INSERT', {
          id: resId,
          user_id: targetUserId,
          book_id: p_book_id,
          copy_id: availableCopy.id,
          queue_position: 1,
          status: 'READY',
          hold_expires_at: holdExpiry.toISOString(),
          created_at: now,
          updated_at: now
        });

        return {
          data: {
            ok: true,
            reservation_id: resId,
            status: 'READY',
            copy_id: availableCopy.id,
            hold_expires_at: holdExpiry.toISOString()
          },
          error: null
        };
      } else {
        const activeRes = reservations.filter(r => r.book_id === p_book_id && r.status === 'ACTIVE');
        const nextQueuePos = activeRes.length + 1;

        enqueueMutation('reservations', 'INSERT', {
          id: resId,
          user_id: targetUserId,
          book_id: p_book_id,
          queue_position: nextQueuePos,
          status: 'ACTIVE',
          created_at: now,
          updated_at: now
        });

        return {
          data: {
            ok: true,
            reservation_id: resId,
            status: 'ACTIVE',
            queue_position: nextQueuePos
          },
          error: null
        };
      }
    }

    return { data: null, error: { message: `Simulated RPC not implemented for ${fn}.` } };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Error simulating RPC offline.' } };
  }
}

// Proxied Client Object Creator
export function wrapWithOfflineProxy<T extends object>(originalClient: T): T {
  return new Proxy(originalClient, {
    get(target, prop, receiver) {
      // Intercept auth checks
      if (prop === 'auth') {
        const originalAuth = (target as any).auth;
        return new Proxy(originalAuth, {
          get(authTarget, authProp) {
            if (authProp === 'getUser') {
              return async function getUser() {
                const online = await isOnline();
                if (online) {
                  try {
                    const res = await authTarget.getUser();
                    if (res.data?.user) {
                      cacheAuthSession(res.data.user);
                      return res;
                    }
                    const isNetErr = res.error && (
                      res.error.status === 503 ||
                      res.error.name === 'AuthRetryableFetchError' ||
                      res.error.constructor?.name === 'AuthRetryableFetchError' ||
                      String(res.error.message || '').toLowerCase().includes('fetch failed')
                    );
                    if (isNetErr) {
                      const cachedUser = getCachedAuthSession();
                      if (cachedUser) {
                        return { data: { user: cachedUser }, error: null };
                      }
                    }
                    return res;
                  } catch (err) {
                    console.warn('[SUPABASE-PROXY] getUser online request failed, falling back to cache:', err);
                    const cachedUser = getCachedAuthSession();
                    if (cachedUser) {
                      return { data: { user: cachedUser }, error: null };
                    }
                    return { data: { user: null }, error: { message: 'Authentication verification failed due to network status.', status: 400 } };
                  }
                } else {
                  const cachedUser = getCachedAuthSession();
                  if (cachedUser) {
                    return { data: { user: cachedUser }, error: null };
                  }
                  return { data: { user: null }, error: { message: 'Authentication verification failed due to network status.', status: 400 } };
                }
              };
            }
            if (authProp === 'getSession') {
              return async function getSession() {
                const online = await isOnline();
                if (online) {
                  try {
                    const res = await authTarget.getSession();
                    if (res.data?.session?.user) {
                      return res;
                    }
                    const isNetErr = res.error && (
                      res.error.status === 503 ||
                      res.error.name === 'AuthRetryableFetchError' ||
                      res.error.constructor?.name === 'AuthRetryableFetchError' ||
                      String(res.error.message || '').toLowerCase().includes('fetch failed')
                    );
                    if (isNetErr) {
                      const cachedUser = getCachedAuthSession();
                      if (cachedUser) {
                        return { data: { session: { user: cachedUser } }, error: null };
                      }
                    }
                    return res;
                  } catch (err) {
                    console.warn('[SUPABASE-PROXY] getSession online request failed, falling back to cache:', err);
                    const cachedUser = getCachedAuthSession();
                    if (cachedUser) {
                      return { data: { session: { user: cachedUser } }, error: null };
                    }
                    return { data: { session: null }, error: err };
                  }
                } else {
                  const cachedUser = getCachedAuthSession();
                  if (cachedUser) {
                    return { data: { session: { user: cachedUser } }, error: null };
                  }
                  return { data: { session: null }, error: null };
                }
              };
            }
            return Reflect.get(authTarget, authProp);
          }
        });
      }

      // Intercept RPCs
      if (prop === 'rpc') {
        return function rpc(fn: string, args: any) {
          const isElectron = process.env.ELECTRON_MODE === 'true' || process.env.NEXT_PUBLIC_ELECTRON_MODE === 'true';
          if (isElectron && !isSystemOnlineSync()) {
            return simulateRpcOffline(fn, args);
          }
          return (target as any).rpc(fn, args);
        };
      }

      // Intercept database tables queries
      if (prop === 'from') {
        return function from(table: string) {
          const isElectron = process.env.ELECTRON_MODE === 'true' || process.env.NEXT_PUBLIC_ELECTRON_MODE === 'true';
          if (isElectron && !isSystemOnlineSync()) {
            return new OfflineQueryBuilder(table);
          }
          return (target as any).from(table);
        };
      }

      return Reflect.get(target, prop, receiver);
    }
  }) as T;
}
