const START_MINUTE = 6 * 60;
const END_MINUTE = 26 * 60;
const DAY_GAME_MINUTES = END_MINUTE - START_MINUTE;
const DEFAULT_REAL_DAY_SECONDS = 15 * 60;

export function createClock(snapshot = null) {
  const day = Math.max(1, toInteger(snapshot?.day, 1));
  const minuteOfDay = clamp(
    toNumber(snapshot?.minuteOfDay, START_MINUTE),
    START_MINUTE,
    END_MINUTE
  );

  return {
    day,
    minuteOfDay,
    realDaySeconds: Math.max(60, toNumber(snapshot?.realDaySeconds, DEFAULT_REAL_DAY_SECONDS)),
    reachedDayEnd: minuteOfDay >= END_MINUTE,
  };
}

export function updateClock(clock, dt, options = {}) {
  if (!clock || options.paused || dt <= 0 || clock.reachedDayEnd) {
    return { advancedMinutes: 0, reachedDayEnd: false };
  }

  const minutesPerSecond = DAY_GAME_MINUTES / clock.realDaySeconds;
  const previousMinute = clock.minuteOfDay;
  clock.minuteOfDay = Math.min(END_MINUTE, clock.minuteOfDay + dt * minutesPerSecond);

  const reachedDayEnd = previousMinute < END_MINUTE && clock.minuteOfDay >= END_MINUTE;
  if (reachedDayEnd) {
    clock.reachedDayEnd = true;
  }

  return {
    advancedMinutes: clock.minuteOfDay - previousMinute,
    reachedDayEnd,
  };
}

export function startNextDay(clock) {
  if (!clock) return null;
  clock.day += 1;
  clock.minuteOfDay = START_MINUTE;
  clock.reachedDayEnd = false;
  return serializeClock(clock);
}

export function setClockTime(clock, hour, minute = 0) {
  if (!clock) return null;

  const normalizedHour = clamp(toInteger(hour, 6), 0, 26);
  const normalizedMinute = clamp(toInteger(minute, 0), 0, 59);
  const rawMinute = normalizedHour * 60 + normalizedMinute;
  clock.minuteOfDay = clamp(rawMinute, START_MINUTE, END_MINUTE);
  clock.reachedDayEnd = clock.minuteOfDay >= END_MINUTE;
  return serializeClock(clock);
}

export function getClockView(clock) {
  const safeClock = createClock(clock);
  const displayMinutes = safeClock.minuteOfDay % (24 * 60);
  const hour24 = Math.floor(displayMinutes / 60);
  const minute = Math.floor(displayMinutes % 60);
  const phase = getDayPhase(safeClock.minuteOfDay);

  return {
    day: safeClock.day,
    hour24,
    minute,
    timeLabel: `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    phase,
    late: safeClock.minuteOfDay >= 24 * 60,
    reachedDayEnd: safeClock.reachedDayEnd,
    progress: clamp((safeClock.minuteOfDay - START_MINUTE) / DAY_GAME_MINUTES, 0, 1),
  };
}

export function serializeClock(clock) {
  const normalized = createClock(clock);
  return {
    day: normalized.day,
    minuteOfDay: normalized.minuteOfDay,
    realDaySeconds: normalized.realDaySeconds,
  };
}

function getDayPhase(minuteOfDay) {
  if (minuteOfDay < 8 * 60) return "Dawn";
  if (minuteOfDay < 12 * 60) return "Morning";
  if (minuteOfDay < 17 * 60) return "Afternoon";
  if (minuteOfDay < 21 * 60) return "Evening";
  return "Night";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toInteger(value, fallback) {
  return Math.floor(toNumber(value, fallback));
}
