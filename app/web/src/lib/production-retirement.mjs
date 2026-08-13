/**
 * Production retirement gates (TASK-OPS-001 / PKG-10).
 *
 * WordPress apply and admin AI HTTP surfaces return 410 when NODE_ENV is
 * production. Local/test (including NODE_ENV=test) keep fixture import and
 * AI cores for REBUILD-021 and unit tests. Supplier portal is retired in
 * every environment — the proxy matcher returns 410.
 */

export function isProductionRuntime(environment = process.env) {
  return environment.NODE_ENV === "production";
}

export function productionRetiredMessage(surface) {
  return `${surface} is retired on Production.`;
}

export function assertNotProductionRetired(surface, environment = process.env) {
  if (isProductionRuntime(environment)) {
    throw new Error(productionRetiredMessage(surface));
  }
}

export function isRetiredSupplierPath(pathname) {
  if (typeof pathname !== "string" || pathname === "") return false;
  return pathname === "/supplier" || pathname.startsWith("/supplier/");
}
