import { neon } from '@neondatabase/serverless';
import { mockDb } from './mock-store';

const databaseUrl = process.env.DATABASE_URL || '';
const isPlaceholder =
  !databaseUrl ||
  databaseUrl.includes('placeholder') ||
  databaseUrl.includes('dummy') ||
  databaseUrl.includes('ep-ejemplo');

let rawSql: any = null;
if (!isPlaceholder) {
  try {
    rawSql = neon(databaseUrl);
  } catch (err) {
    console.warn('[DB] Fallback a base de datos Demo local:', (err as Error).message);
  }
}

function assembleQuery(strings: TemplateStringsArray, values: any[]) {
  let queryText = '';
  for (let i = 0; i < strings.length; i++) {
    queryText += strings[i];
    if (i < values.length) {
      queryText += `$${i + 1}`;
    }
  }
  return queryText;
}

export interface SqlQuery {
  <T = Record<string, any>[]>(strings: TemplateStringsArray, ...values: any[]): Promise<T>;
  transaction: (queries: any[] | ((txn: any) => any[])) => Promise<any[]>;
  unsafe: (rawSQL: string) => { sql: string };
  query: (queryWithPlaceholders: string, params?: any[]) => Promise<any[]>;
}

const executeSql: any = async (strings: TemplateStringsArray, ...values: any[]) => {
  if (rawSql && !isPlaceholder) {
    try {
      return await rawSql(strings, ...values);
    } catch (err: any) {
      console.warn('[DB] Neon Postgres no respondió, usando datos Demo locales:', err.message);
    }
  }
  const queryText = assembleQuery(strings, values);
  return mockDb.handleQuery(queryText, values);
};

executeSql.transaction = async (queries: any[] | ((txn: any) => any[])) => {
  if (rawSql && !isPlaceholder) {
    try {
      return await rawSql.transaction(queries);
    } catch (err: any) {
      console.warn('[DB] Error en transacción Neon, usando datos Demo locales:', err.message);
    }
  }
  if (typeof queries === 'function') {
    const list = queries(executeSql);
    return Promise.all(list);
  }
  return Promise.all(queries);
};

executeSql.unsafe = (rawSQL: string) => ({ sql: rawSQL });

executeSql.query = async (queryWithPlaceholders: string, params: any[] = []) => {
  if (rawSql && !isPlaceholder) {
    try {
      return await rawSql.query(queryWithPlaceholders, params);
    } catch (err: any) {
      console.warn('[DB] Neon query error, usando datos Demo locales:', err.message);
    }
  }
  return mockDb.handleQuery(queryWithPlaceholders, params);
};

export const sql = executeSql as SqlQuery;

export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  return executeSql(strings, ...values) as Promise<T[]>;
}
