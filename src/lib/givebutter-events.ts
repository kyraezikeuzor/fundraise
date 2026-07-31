/**
 * Givebutter's modern widgets loader does not expose window.Givebutter.
 * The donation iframe still posts Element-style events to the parent page
 * (givebutter: true, event: "donation.complete", …). This bridge listens for
 * those postMessages and exposes the documented command API:
 *
 *   window.Givebutter('addEventListener', window.Givebutter.EVENT.DONATION.COMPLETE, cb)
 *
 * LIMITATION (from Givebutter docs): donation.complete is fired in the browser
 * and could be faked. Acceptable here for low-stakes volunteer credit tracking,
 * not for financial-grade verification of money movement.
 */

export type GivebutterDonationEvent = {
  givebutter?: boolean;
  dataFormat?: number;
  event?: string;
  total?: number;
  amount?: number;
  donated?: number;
  frequency?: string;
  method?: string;
  currency?: string;
  comment?: string;
  message?: string;
  note?: string;
  sessionId?: string;
  donor?: {
    name?: string;
    email?: string;
    [key: string]: unknown;
  };
  campaign?: {
    code?: string;
    title?: string;
    url?: string;
  };
  [key: string]: unknown;
};

type GivebutterListener = (donationObj: GivebutterDonationEvent) => void;

type GivebutterApi = {
  (
    command: "addEventListener",
    event: string,
    callback: GivebutterListener
  ): void;
  (command: string, ...args: unknown[]): void;
  EVENT: {
    READY: string;
    DONATION: {
      STARTED: string;
      PAYING: string;
      COMPLETE: string;
    };
  };
  __omeloraBridge?: true;
};

declare global {
  interface Window {
    Givebutter?: GivebutterApi;
  }
}

const ALLOWED_ORIGINS = [
  "https://givebutter.com",
  "https://demo.givebutter.com",
  "https://givebutter.test",
];

const EVENT = {
  READY: "ready",
  DONATION: {
    STARTED: "donation.started",
    PAYING: "donation.paying",
    COMPLETE: "donation.complete",
  },
} as const;

export function ensureGivebutterEventBridge(): GivebutterApi {
  if (typeof window === "undefined") {
    throw new Error("Givebutter event bridge is client-only");
  }

  const existing = window.Givebutter;
  if (existing?.__omeloraBridge) {
    return existing;
  }

  const listeners: Record<string, GivebutterListener[]> = {};

  const api = ((command: string, ...args: unknown[]) => {
    if (command === "addEventListener") {
      const event = args[0];
      const callback = args[1];
      if (typeof event !== "string" || typeof callback !== "function") return;
      (listeners[event] ||= []).push(callback as GivebutterListener);
      return;
    }
  }) as GivebutterApi;

  api.EVENT = EVENT;
  api.__omeloraBridge = true;

  window.addEventListener("message", (messageEvent) => {
    if (!ALLOWED_ORIGINS.includes(messageEvent.origin)) return;

    const data = messageEvent.data as GivebutterDonationEvent | string | null;
    if (!data || typeof data !== "object") return;
    if (!data.givebutter || typeof data.event !== "string") return;

    for (const callback of listeners[data.event] ?? []) {
      try {
        callback(data);
      } catch (error) {
        console.error("[givebutter] listener error for", data.event, error);
      }
    }
  });

  window.Givebutter = api;
  return api;
}

export function extractDonationAmount(
  donationObj: GivebutterDonationEvent
): number | null {
  // Prefer documented `total`; fall back to other amount-like keys if needed.
  for (const key of ["total", "amount", "donated"] as const) {
    const value: unknown = donationObj[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
  }
  return null;
}

/**
 * Prefer donationObj.comment (requested field). Also try common aliases until
 * a real donation.complete payload confirms the exact key.
 */
export function extractDonationComment(
  donationObj: GivebutterDonationEvent
): string | undefined {
  for (const key of ["comment", "message", "note"] as const) {
    const value = donationObj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  const dedication = donationObj.dedication;
  if (dedication && typeof dedication === "object") {
    const record = dedication as Record<string, unknown>;
    for (const key of ["message", "comment", "note"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  return undefined;
}

/**
 * Prefer donationObj.donor?.name (requested field). Also try flat name aliases
 * until a real donation.complete payload confirms the exact shape.
 */
export function extractDonorName(
  donationObj: GivebutterDonationEvent
): string | undefined {
  const donor = donationObj.donor;
  if (donor && typeof donor === "object") {
    const name = donor.name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }

  for (const key of ["donorName", "donor_name", "name"] as const) {
    const value = donationObj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return undefined;
}
