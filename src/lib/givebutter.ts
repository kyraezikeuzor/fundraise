export const GIVEBUTTER_ACCOUNT_ID =
  process.env.NEXT_PUBLIC_GIVEBUTTER_ACCOUNT_ID ?? "HxU9VtEzUYiT3cW6";

export const GIVEBUTTER_WIDGET_ID =
  process.env.NEXT_PUBLIC_GIVEBUTTER_WIDGET_ID ?? "pzex5n";

export const GIVEBUTTER_SCRIPT_SRC = `https://widgets.givebutter.com/latest.umd.cjs?acct=${GIVEBUTTER_ACCOUNT_ID}`;

export const FUNDRAISE_HOST =
  process.env.NEXT_PUBLIC_FUNDRAISE_HOST ?? "fundraise.omelora.org";

export const APPLY_URL = "https://form.fillout.com/t/2VfsyEfiduus";

export function fundraisePath(slug: string): string {
  return `/${slug}`;
}

/** Display text without protocol, e.g. fundraise.omelora.org/haleyn-jay-rec… */
export function fundraiseDisplayUrl(slug: string): string {
  return `${FUNDRAISE_HOST}/${slug}`;
}

/** Absolute URL used for copy / open-in-new-tab. */
export function fundraiseAbsoluteUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/${slug}`;
  }
  return `https://${FUNDRAISE_HOST}/${slug}`;
}
