import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTimelineSyntheticStudySessions,
  getTimelinePlannedDayMinutes,
  getTimelinePlannedSubjectMinutes,
  TIMELINE_DAY_PLANS,
} from "@/lib/timeline";

test("timeline raw plan covers the full rebuilt plan range", () => {
  assert.equal(TIMELINE_DAY_PLANS.length, 45);
  assert.equal(TIMELINE_DAY_PLANS[0]?.date, "2026-04-06");
  assert.equal(TIMELINE_DAY_PLANS[TIMELINE_DAY_PLANS.length - 1]?.date, "2026-05-20");
});

test("timeline day entries include split sleep blocks around midnight", () => {
  const standardDay = TIMELINE_DAY_PLANS.find((day) => day.date === "2026-04-06");
  const examDay = TIMELINE_DAY_PLANS.find((day) => day.date === "2026-04-28");

  assert.ok(standardDay);
  assert.deepEqual(
    standardDay.entries
      .filter((entry) => entry.kind === "sleep")
      .map((entry) => [entry.startMinute, entry.endMinute]),
    [
      [0, 480],
      [1380, 1440],
    ],
  );

  assert.ok(examDay);
  assert.deepEqual(
    examDay.entries
      .filter((entry) => entry.kind === "sleep")
      .map((entry) => [entry.startMinute, entry.endMinute]),
    [
      [0, 405],
      [1305, 1440],
    ],
  );
});

test("planned totals match the rebuilt vault plan tables", () => {
  assert.equal(getTimelinePlannedDayMinutes()["2026-04-06"], 150);
  assert.equal(getTimelinePlannedDayMinutes()["2026-05-20"], 45);

  assert.deepEqual(getTimelinePlannedSubjectMinutes(), {
    german_lang_lit_sl: 1080,
    physics_hl: 3135,
    business_sl: 990,
    computer_science_hl: 735,
    english_lang_lit_sl: 930,
    math_aa_hl: 4170,
  });
});

test("completed timeline blocks auto-fill planned minutes into synthetic study sessions", () => {
  const entry = TIMELINE_DAY_PLANS[0]?.entries.find((candidate) => candidate.loggable);
  assert.ok(entry);

  const completed = buildTimelineSyntheticStudySessions([
    {
      blockId: entry.id,
      state: "completed",
      updatedAt: "2026-04-06T10:45:00+02:00",
    },
  ]);

  assert.equal(completed.length, 1);
  assert.equal(completed[0]?.subjectId, "physics_hl");
  assert.equal(completed[0]?.durationSec, 75 * 60);

  const partial = buildTimelineSyntheticStudySessions([
    {
      blockId: entry.id,
      state: "incomplete",
      actualMinutes: 32,
      actualSubjectId: "math_aa_hl",
      updatedAt: "2026-04-06T10:45:00+02:00",
    },
  ]);

  assert.equal(partial.length, 1);
  assert.equal(partial[0]?.subjectId, "math_aa_hl");
  assert.equal(partial[0]?.durationSec, 32 * 60);
});
