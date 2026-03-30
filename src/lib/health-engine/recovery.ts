export function recoveryReasonText(code: string): string {
  if (code === "RECOVERY_HRV_LOW") {
    return "HRV is below your recent baseline.";
  }
  if (code === "RECOVERY_RHR_HIGH") {
    return "Resting HR is above your recent baseline.";
  }
  if (code === "RECOVERY_RR_HIGH") {
    return "Respiratory rate is above your recent baseline.";
  }
  if (code === "RECOVERY_SLEEP_LOW") {
    return "Sleep score is currently low.";
  }
  if (code === "RECOVERY_LOAD_PENALTY") {
    return "Yesterday’s physical or mental strain applied a recovery penalty.";
  }
  if (code === "RECOVERY_DATA_SPARSE") {
    return "Missing physiology channels reduced certainty in recovery scoring.";
  }
  return code;
}
