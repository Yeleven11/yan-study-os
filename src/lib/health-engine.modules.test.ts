import assert from "node:assert/strict";
import test from "node:test";
import { mentalStrainFromImpulse } from "./health-engine/mental-strain";
import { clamp, robustZ } from "./health-engine/normalization";
import { physicalStrainFromImpulse } from "./health-engine/physical-strain";
import { recoveryReasonText } from "./health-engine/recovery";
import { sentenceForDriver } from "./health-engine/sleep";

test("strain modules preserve monotonic scaling and saturation", () => {
  const lowPhysical = physicalStrainFromImpulse(120, 250);
  const highPhysical = physicalStrainFromImpulse(550, 250);
  const lowMental = mentalStrainFromImpulse(100, 300);
  const highMental = mentalStrainFromImpulse(700, 300);

  assert.ok(lowPhysical < highPhysical);
  assert.ok(lowMental < highMental);
  assert.ok(highPhysical <= 100 && highPhysical >= 0);
  assert.ok(highMental <= 100 && highMental >= 0);
});

test("recovery and sleep reason modules keep canonical narratives", () => {
  assert.equal(recoveryReasonText("RECOVERY_HRV_LOW"), "HRV is below your recent baseline.");
  assert.equal(
    sentenceForDriver("negative", "duration"),
    "Sleep score is mainly limited by sleep duration relative to your current need.",
  );
});

test("normalization helpers retain clamping and robust-z guardrails", () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-2, 0, 10), 0);
  const z = robustZ(90, [70, 72, 71, 69, 70, 68, 71, 72, 73]);
  assert.ok(Number.isFinite(z));
  assert.ok(z >= -4 && z <= 4);
});
