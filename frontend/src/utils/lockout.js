const LOCKOUT_PREFIX = 'lockout_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

function getKey(email) {
  return `${LOCKOUT_PREFIX}${email}`;
}

export function checkLockout(email) {
  const data = JSON.parse(localStorage.getItem(getKey(email)) || '{}');

  if (data.lockedUntil) {
    const remaining = data.lockedUntil - Date.now();
    if (remaining > 0) {
      return { locked: true, remainingMs: remaining, attempts: data.attempts };
    }
    // Lockout expired, clear
    localStorage.removeItem(getKey(email));
    return { locked: false, remainingMs: 0, attempts: 0 };
  }

  return { locked: false, remainingMs: 0, attempts: data.attempts || 0 };
}

export function recordFailedAttempt(email) {
  const data = JSON.parse(localStorage.getItem(getKey(email)) || '{}');
  const attempts = (data.attempts || 0) + 1;

  if (attempts >= MAX_ATTEMPTS) {
    localStorage.setItem(
      getKey(email),
      JSON.stringify({
        attempts,
        lockedUntil: Date.now() + LOCKOUT_DURATION,
      })
    );
    return { locked: true, remainingMs: LOCKOUT_DURATION, attempts };
  }

  localStorage.setItem(getKey(email), JSON.stringify({ attempts }));
  return { locked: false, remainingMs: 0, attempts };
}

export function resetAttempts(email) {
  localStorage.removeItem(getKey(email));
}

export function formatLockoutTime(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
