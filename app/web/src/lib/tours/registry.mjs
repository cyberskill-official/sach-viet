import { translate } from "../i18n/index.mjs";

export const TOUR_IDS = Object.freeze([
  "tour.storefront",
  "tour.product_cart",
  "tour.account",
  "tour.features",
  "tour.portal_overview",
]);

export const TOUR_STATUSES = Object.freeze(["pending", "in_progress", "completed", "dismissed"]);

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
    steps: [
      { target: "[data-tour='product-add-cart']", contentKey: "tours.product_cart_pdp", placement: "left" },
      { target: "[data-tour='cart-panel']", contentKey: "tours.product_cart_cart", placement: "top" },
      { target: "[data-tour='cart-checkout']", contentKey: "tours.product_cart_checkout", placement: "top" },
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
  "tour.features": {
    id: "tour.features",
    routeHints: ["/features"],
    steps: [
      { target: "[data-tour='features-categories']", contentKey: "tours.features_categories", placement: "bottom" },
      { target: "[data-tour='features-availability']", contentKey: "tours.features_availability", placement: "bottom" },
    ],
  },
  "tour.portal_overview": {
    id: "tour.portal_overview",
    routeHints: ["/admin", "/vendor", "/employee", "/retail", "/b2b", "/institution", "/publisher", "/author"],
    steps: [
      { target: "[data-tour='portal-nav']", contentKey: "tours.portal_overview_nav", placement: "right" },
      { target: "[data-tour='portal-lang']", contentKey: "tours.portal_overview_lang", placement: "bottom" },
    ],
  },
});

export function getTourDefinition(tourId) {
  return definitions[tourId] || null;
}

export function listTourDefinitions() {
  return TOUR_IDS.map((id) => definitions[id]);
}

export function joyrideStepsFor(tourId, locale) {
  const def = getTourDefinition(tourId);
  if (!def) return [];
  return def.steps.map((step) => ({
    target: step.target,
    content: translate(locale, step.contentKey),
    placement: step.placement || "auto",
    disableBeacon: true,
  }));
}

export function isTerminalTourStatus(status) {
  return status === "completed" || status === "dismissed";
}
