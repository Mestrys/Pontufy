// Camada de persistência offline (IndexedDB) com isolamento multi-tenant.
//
// REGRA DE ESCOPO: toda chave de registro é prefixada por `scope` =
// `${tenantId}:${userId}`. Nunca há dados misturados entre empresas ou
// utilizadores no mesmo navegador — ao trocar de conta o escopo anterior
// deve ser removido via clearScope().

export interface CachedCourse {
  key: string;
  scope: string;
  id: string;
  data: unknown;
}

export interface CachedLesson {
  key: string;
  scope: string;
  id: string;
  data: unknown;
}

export interface PendingLessonCompletion {
  key: string; // `${scope}:${lessonId}`
  scope: string;
  lessonId: string;
  courseId: string;
  completedAt: string;
  attempts: number;
  createdAt: number;
}

const DB_NAME = 'pontufy-offline';
const DB_VERSION = 1;
const STORE_COURSES = 'courses';
const STORE_LESSONS = 'lessons';
const STORE_QUEUE = 'pendingCompletions';
const SCOPE_INDEX = 'by_scope';

export function buildScope(tenantId: string, userId: string): string {
  return `${tenantId}:${userId}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB indisponível.'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of [STORE_COURSES, STORE_LESSONS, STORE_QUEUE]) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'key' });
          store.createIndex(SCOPE_INDEX, 'scope', { unique: false });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function run<T>(storeName: string, mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = op(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
      }),
  );
}

function getByScope<T extends { scope: string }>(storeName: string, scope: string): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const index = transaction.objectStore(storeName).index(SCOPE_INDEX);
        const request = index.getAll(IDBKeyRange.only(scope));
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
      }),
  );
}

async function removeAllByScope(storeName: string, scope: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const index = transaction.objectStore(storeName).index(SCOPE_INDEX);
    const keysRequest = index.getAllKeys(IDBKeyRange.only(scope));
    keysRequest.onsuccess = () => {
      const keys = keysRequest.result as IDBValidKey[];
      const store = transaction.objectStore(storeName);
      for (const key of keys) store.delete(key);
      resolve();
    };
    keysRequest.onerror = () => reject(keysRequest.error);
  });
}

// ── Cursos (cache de leitura offline) ───────────────────────────────────

export async function cacheCourse(scope: string, id: string, data: unknown): Promise<void> {
  await run(STORE_COURSES, 'readwrite', (store) => store.put({ key: `${scope}:${id}`, scope, id, data } as CachedCourse));
}

export async function getCachedCourse(scope: string, id: string): Promise<CachedCourse | undefined> {
  return run(STORE_COURSES, 'readonly', (store) => store.get(`${scope}:${id}`));
}

export async function getCachedCourses(scope: string): Promise<CachedCourse[]> {
  return getByScope<CachedCourse>(STORE_COURSES, scope);
}

// ── Aulas (cache de leitura offline) ────────────────────────────────────

export async function cacheLesson(scope: string, id: string, data: unknown): Promise<void> {
  await run(STORE_LESSONS, 'readwrite', (store) => store.put({ key: `${scope}:${id}`, scope, id, data } as CachedLesson));
}

export async function getCachedLesson(scope: string, id: string): Promise<CachedLesson | undefined> {
  return run(STORE_LESSONS, 'readonly', (store) => store.get(`${scope}:${id}`));
}

export async function getCachedLessons(scope: string): Promise<CachedLesson[]> {
  return getByScope<CachedLesson>(STORE_LESSONS, scope);
}

// ── Fila de conclusões offline ──────────────────────────────────────────

// Idempotente por aula: a chave é `${scope}:${lessonId}` — completar a mesma
// aula duas vezes offline nunca gera duas entradas na fila.
export async function enqueueLessonCompletion(
  scope: string,
  lessonId: string,
  courseId: string,
  completedAt: string,
): Promise<void> {
  const key = `${scope}:${lessonId}`;
  const existing = await run<PendingLessonCompletion | undefined>(STORE_QUEUE, 'readonly', (store) => store.get(key));

  await run(STORE_QUEUE, 'readwrite', (store) =>
    store.put({
      key,
      scope,
      lessonId,
      courseId,
      completedAt,
      attempts: existing?.attempts ?? 0,
      createdAt: existing?.createdAt ?? Date.now(),
    } as PendingLessonCompletion),
  );
}

export async function getPendingCompletions(scope: string): Promise<PendingLessonCompletion[]> {
  return getByScope<PendingLessonCompletion>(STORE_QUEUE, scope);
}

export async function removePendingCompletion(key: string): Promise<void> {
  await run(STORE_QUEUE, 'readwrite', (store) => store.delete(key));
}

export async function markPendingFailed(key: string): Promise<void> {
  const existing = await run<PendingLessonCompletion | undefined>(STORE_QUEUE, 'readonly', (store) => store.get(key));
  if (!existing) return;
  await run(STORE_QUEUE, 'readwrite', (store) =>
    store.put({ ...existing, attempts: existing.attempts + 1 } as PendingLessonCompletion),
  );
}

// ── Limpeza por escopo (troca de conta / logout) ────────────────────────

export async function clearScope(scope: string): Promise<void> {
  await Promise.all([
    removeAllByScope(STORE_COURSES, scope),
    removeAllByScope(STORE_LESSONS, scope),
    removeAllByScope(STORE_QUEUE, scope),
  ]);
}
