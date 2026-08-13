/**
 * Commerce mutation kill-switch (TASK-GOV-001 / TASK-COM-001).
 *
 * Unset or any value other than 0/false/off → mutations allowed (Production
 * stays working until an operator deploys COMMERCE_MUTATIONS_ENABLED=0).
 */
export function commerceMutationsEnabled(environment = process.env) {
  const raw = environment.COMMERCE_MUTATIONS_ENABLED;
  if (raw == null || String(raw).trim() === "") return true;
  const normalized = String(raw).trim().toLowerCase();
  return normalized !== "0" && normalized !== "false" && normalized !== "off";
}

export function commerceMutationsDisabledMessage() {
  return "Commerce mutations are frozen.";
}
