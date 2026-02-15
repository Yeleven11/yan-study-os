import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDayHoverModel,
  classifyCalendarDayState,
  computeTooltipPlacement,
} from "./calendar-tooltip";

test("tooltip prefers below when there is space", () => {
  const placement = computeTooltipPlacement({
    anchorRect: { left: 140, top: 60, width: 20, height: 20 },
    containerRect: { left: 0, top: 0, width: 320, height: 300 },
    tooltipRect: { width: 180, height: 80 },
  });

  assert.equal(placement.placement, "below");
  assert.ok(placement.top > 60);
});

test("tooltip flips above near container bottom", () => {
  const placement = computeTooltipPlacement({
    anchorRect: { left: 150, top: 250, width: 20, height: 20 },
    containerRect: { left: 0, top: 0, width: 320, height: 300 },
    tooltipRect: { width: 180, height: 90 },
  });

  assert.equal(placement.placement, "above");
  assert.ok(placement.top < 250);
});

test("tooltip clamps horizontally inside container", () => {
  const leftEdge = computeTooltipPlacement({
    anchorRect: { left: 0, top: 120, width: 18, height: 18 },
    containerRect: { left: 0, top: 0, width: 280, height: 240 },
    tooltipRect: { width: 220, height: 90 },
  });
  const rightEdge = computeTooltipPlacement({
    anchorRect: { left: 270, top: 120, width: 18, height: 18 },
    containerRect: { left: 0, top: 0, width: 280, height: 240 },
    tooltipRect: { width: 220, height: 90 },
  });

  assert.ok(leftEdge.left >= 8);
  assert.ok(rightEdge.left <= 52);
});

test("day state classification is stable", () => {
  assert.equal(classifyCalendarDayState("2026-02-10", "2026-02-15"), "past");
  assert.equal(classifyCalendarDayState("2026-02-15", "2026-02-15"), "today");
  assert.equal(classifyCalendarDayState("2026-02-16", "2026-02-15"), "future");
});

test("future day with no entities and no health data resolves to no-data model", () => {
  const model = buildDayHoverModel({
    dateKey: "2026-02-20",
    todayKey: "2026-02-15",
    workouts: [],
    tests: [],
    todos: [],
  });

  assert.equal(model.state, "future");
  assert.equal(model.hasAnyData, false);
  assert.equal(model.sleepScore, undefined);
});
