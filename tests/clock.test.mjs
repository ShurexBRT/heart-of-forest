import test from "node:test";
import assert from "node:assert/strict";

import {
  createClock,
  getClockView,
  serializeClock,
  setClockTime,
  startNextDay,
  updateClock,
} from "../systems/clock.js";

test("clock starts on day one at 06:00", () => {
  const clock = createClock();
  assert.deepEqual(getClockView(clock), {
    day: 1,
    hour24: 6,
    minute: 0,
    timeLabel: "06:00",
    phase: "Dawn",
    late: false,
    reachedDayEnd: false,
    progress: 0,
  });
});

test("a fifteen minute real day advances twenty game hours", () => {
  const clock = createClock();
  const result = updateClock(clock, 15 * 60);

  assert.equal(result.reachedDayEnd, true);
  assert.equal(clock.minuteOfDay, 26 * 60);
  assert.equal(getClockView(clock).timeLabel, "02:00");
});

test("paused clock does not advance", () => {
  const clock = createClock();
  updateClock(clock, 30, { paused: true });
  assert.equal(clock.minuteOfDay, 6 * 60);
});

test("starting the next day resets time and clears day end", () => {
  const clock = createClock({ day: 4, minuteOfDay: 26 * 60 });
  startNextDay(clock);

  assert.equal(clock.day, 5);
  assert.equal(clock.minuteOfDay, 6 * 60);
  assert.equal(clock.reachedDayEnd, false);
});

test("clock snapshot is normalized and serializable", () => {
  const clock = createClock({ day: -3, minuteOfDay: 99999, realDaySeconds: 1 });
  setClockTime(clock, 18, 45);

  assert.deepEqual(serializeClock(clock), {
    day: 1,
    minuteOfDay: 18 * 60 + 45,
    realDaySeconds: 60,
  });
});
