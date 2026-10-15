// ============================================================
// Protección contra Fuerza Bruta y Limitador de Tasa (Rate Limiter)
// ============================================================

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// Mapa en memoria de intentos fallidos por clave (IP o IP+Email)
const attemptsMap = new Map<string, AttemptRecord>();

const MAX_FAILED_ATTEMPTS = 5; // Máximo 5 intentos antes de bloquear
const WINDOW_MS = 15 * 60 * 1000; // Ventana de 15 minutos
const LOCKOUT_MS = 15 * 60 * 1000; // Bloqueo de 15 minutos

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
}

export function checkLoginRateLimit(key: string): RateLimitCheckResult {
  const now = Date.now();
  const record = attemptsMap.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Verificar si está actualmente bloqueado
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingSeconds: remainingSeconds,
    };
  }

  // Si la ventana expiró, reiniciar
  if (now - record.firstAttempt > WINDOW_MS) {
    attemptsMap.delete(key);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.count),
  };
}

export function recordFailedLogin(key: string): { locked: boolean; lockoutMinutes: number } {
  const now = Date.now();
  const record = attemptsMap.get(key);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attemptsMap.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return { locked: false, lockoutMinutes: 0 };
  }

  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    return { locked: true, lockoutMinutes: Math.ceil(LOCKOUT_MS / 60000) };
  }

  return { locked: false, lockoutMinutes: 0 };
}

export function resetLoginRateLimit(key: string): void {
  attemptsMap.delete(key);
}
