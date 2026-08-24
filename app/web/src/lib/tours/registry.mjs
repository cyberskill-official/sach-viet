import { translate } from "../i18n/index.mjs";

/** Role portals that must each have a dedicated tour id (supplier included, retired UI). */
export const PORTAL_TOUR_ROLES = Object.freeze([
  "admin",
  "vendor",
  "employee",
  "retail",
  "b2b",
  "institution",
  "publisher",
  "author",
  "supplier",
]);

export const TOUR_IDS = Object.freeze([
  "tour.storefront",
  "tour.product_cart",
  "tour.orders",
  "tour.account",
  "tour.wishlist",
  "tour.support",
  "tour.features",
  "tour.auth",
  "tour.portal_overview",
  ...PORTAL_TOUR_ROLES.map((role) => `tour.portal_${role}`),
]);

export const TOUR_STATUSES = Object.freeze(["pending", "in_progress", "completed", "dismissed"]);

const shellSteps = Object.freeze([
  { target: "[data-tour='portal-nav']", contentKey: "tours.portal_overview_nav", placement: "auto" },
  { target: "[data-tour='portal-lang']", contentKey: "tours.portal_overview_lang", placement: "bottom" },
]);

function portalDefinition(role, panelContentKey, actionContentKey) {
  return {
    id: `tour.portal_${role}`,
    routeHints: [`/${role}`],
    steps: [
      ...shellSteps,
      { target: "[data-tour='portal-panel']", contentKey: panelContentKey, placement: "top" },
      { target: "[data-tour='portal-primary']", contentKey: actionContentKey, placement: "top" },
    ],
  };
}

const definitions = Object.freeze({
  "tour.storefront": {
    id: "tour.storefront",
    routeHints: ["/", "/ecom"],
    steps: [
      { target: "[data-tour='storefront-brand']", contentKey: "tours.storefront_welcome", placement: "bottom" },
      { target: "[data-tour='storefront-search']", contentKey: "tours.storefront_search", placement: "bottom" },
      { target: "[data-tour='storefront-nav']", contentKey: "tours.storefront_nav", placement: "bottom" },
    ],
  },
  "tour.product_cart": {
    id: "tour.product_cart",
    routeHints: ["/products", "/ecom/cart"],
    /** Multi-route: only steps whose targets exist on the current page are shown. */
    multiRoute: true,
    steps: [
      { target: "[data-tour='product-add-cart']", contentKey: "tours.product_cart_pdp", placement: "auto" },
      { target: "[data-tour='cart-panel']", contentKey: "tours.product_cart_cart", placement: "top" },
      { target: "[data-tour='cart-checkout']", contentKey: "tours.product_cart_checkout", placement: "top" },
    ],
  },
  "tour.orders": {
    id: "tour.orders",
    routeHints: ["/ecom/orders"],
    steps: [
      { target: "[data-tour='orders-heading']", contentKey: "tours.orders_heading", placement: "bottom" },
      { target: "[data-tour='orders-list']", contentKey: "tours.orders_list", placement: "top" },
    ],
  },
  "tour.account": {
    id: "tour.account",
    routeHints: ["/account"],
    steps: [
      { target: "[data-tour='account-profile']", contentKey: "tours.account_profile", placement: "bottom" },
      { target: "[data-tour='account-locale']", contentKey: "tours.account_locale", placement: "bottom" },
    ],
  },
  "tour.wishlist": {
    id: "tour.wishlist",
    routeHints: ["/wishlist"],
    steps: [
      { target: "[data-tour='wishlist-heading']", contentKey: "tours.wishlist_heading", placement: "bottom" },
      { target: "[data-tour='wishlist-list']", contentKey: "tours.wishlist_list", placement: "top" },
    ],
  },
  "tour.support": {
    id: "tour.support",
    routeHints: ["/support"],
    steps: [
      { target: "[data-tour='support-heading']", contentKey: "tours.support_heading", placement: "bottom" },
      { target: "[data-tour='support-ticket-form']", contentKey: "tours.support_ticket", placement: "top" },
    ],
  },
  "tour.features": {
    id: "tour.features",
    routeHints: ["/features"],
    steps: [
      { target: "[data-tour='features-availability']", contentKey: "tours.features_availability", placement: "bottom" },
      { target: "[data-tour='features-categories']", contentKey: "tours.features_categories", placement: "bottom" },
      { target: "[data-tour='features-tour-index']", contentKey: "tours.features_tour_index", placement: "top" },
    ],
  },
  "tour.auth": {
    id: "tour.auth",
    routeHints: ["/login", "/register"],
    /** Manual / Features-only by default — TourProvider skips auto-start for this id. */
    autoStart: false,
    steps: [
      { target: "[data-tour='auth-form']", contentKey: "tours.auth_form", placement: "auto" },
      { target: "[data-tour='auth-lang']", contentKey: "tours.auth_lang", placement: "bottom" },
    ],
  },
  "tour.portal_overview": {
    id: "tour.portal_overview",
    routeHints: PORTAL_TOUR_ROLES.map((role) => `/${role}`),
    steps: [...shellSteps],
  },
  "tour.portal_admin": portalDefinition("admin", "tours.portal_admin_panel", "tours.portal_admin_primary"),
  "tour.portal_vendor": portalDefinition("vendor", "tours.portal_vendor_panel", "tours.portal_vendor_primary"),
  "tour.portal_employee": portalDefinition("employee", "tours.portal_employee_panel", "tours.portal_employee_primary"),
  "tour.portal_retail": portalDefinition("retail", "tours.portal_retail_panel", "tours.portal_retail_primary"),
  "tour.portal_b2b": portalDefinition("b2b", "tours.portal_b2b_panel", "tours.portal_b2b_primary"),
  "tour.portal_institution": portalDefinition("institution", "tours.portal_institution_panel", "tours.portal_institution_primary"),
  "tour.portal_publisher": portalDefinition("publisher", "tours.portal_publisher_panel", "tours.portal_publisher_primary"),
  "tour.portal_author": portalDefinition("author", "tours.portal_author_panel", "tours.portal_author_primary"),
  "tour.portal_supplier": {
    id: "tour.portal_supplier",
    routeHints: ["/supplier"],
    steps: [
      ...shellSteps,
      { target: "[data-tour='portal-panel']", contentKey: "tours.portal_supplier_panel", placement: "top" },
    ],
  },
});

export function getTourDefinition(tourId) {
  return definitions[tourId] || null;
}

export function listTourDefinitions() {
  return TOUR_IDS.map((id) => definitions[id]);
}

export function tourIdForPortal(portal) {
  const id = `tour.portal_${portal}`;
  return TOUR_IDS.includes(id) ? id : "tour.portal_overview";
}

export function listPortalTourIds() {
  return PORTAL_TOUR_ROLES.map((role) => `tour.portal_${role}`);
}

/**
 * Most-specific tour for a pathname. Portal role tours beat the shared overview.
 */
export function resolveTourIdForPath(pathname) {
  const path = typeof pathname === "string" ? pathname.split("?")[0] : "";
  if (!path) return null;

  if (path === "/" || path === "/ecom") return "tour.storefront";
  if (path.startsWith("/products")) return "tour.product_cart";
  if (path.startsWith("/ecom/cart")) return "tour.product_cart";
  if (path.startsWith("/ecom/orders")) return "tour.orders";
  if (path.startsWith("/account")) return "tour.account";
  if (path.startsWith("/wishlist")) return "tour.wishlist";
  if (path.startsWith("/support")) return "tour.support";
  if (path.startsWith("/features")) return "tour.features";
  if (path.startsWith("/login") || path.startsWith("/register")) return "tour.auth";

  for (const role of PORTAL_TOUR_ROLES) {
    if (path === `/${role}` || path.startsWith(`/${role}/`)) return tourIdForPortal(role);
  }
  return null;
}

/** Primary route to open when launching a tour from another page (Features index, etc.). */
export function pathForTourId(tourId) {
  const def = getTourDefinition(tourId);
  if (!def?.routeHints?.length) return null;
  return def.routeHints[0];
}

export function shouldAutoStartTour(tourId) {
  const def = getTourDefinition(tourId);
  if (!def) return false;
  return def.autoStart !== false;
}

function targetExists(selector) {
  if (typeof document === "undefined") return true;
  try {
    return Boolean(document.querySelector(selector));
  } catch {
    return false;
  }
}

/** Map registry placement to driver.js popover `side` (omit for auto/default). */
function mapPlacement(placement) {
  if (placement === "top" || placement === "bottom" || placement === "left" || placement === "right") {
    return placement;
  }
  return undefined;
}

/**
 * Build driver.js DriveStep[] for a tour id.
 * Filters missing DOM targets for multi-route tours (product_cart, optional portal CTAs).
 */
export function driverStepsFor(tourId, locale, options = {}) {
  const def = getTourDefinition(tourId);
  if (!def) return [];
  const filterMissing = options.onlyPresent !== false && typeof document !== "undefined";
  return def.steps
    .filter((step) => !filterMissing || targetExists(step.target))
    .map((step) => {
      const side = mapPlacement(step.placement);
      const popover = {
        description: translate(locale, step.contentKey),
        align: "start",
      };
      if (side) popover.side = side;
      return {
        element: step.target,
        popover,
      };
    });
}

export function isTerminalTourStatus(status) {
  return status === "completed" || status === "dismissed";
}

export function tourTitleKey(tourId) {
  const short = String(tourId || "").replace(/^tour\./, "");
  return `tours.title_${short}`;
}
