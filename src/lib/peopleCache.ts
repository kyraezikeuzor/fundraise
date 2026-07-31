import { fetchAllPeople, type Person } from "@/lib/airtable";

const CACHE_TTL_MS = 5 * 60 * 1000;

/** In-memory People cache keyed by lowercased email. */
const peopleByEmail = new Map<string, Person>();

let lastRefreshedAt: number | null = null;
let refreshInFlight: Promise<number> | null = null;

export function getPeopleCacheStats() {
  return {
    size: peopleByEmail.size,
    lastRefreshedAt,
    ageMs: lastRefreshedAt === null ? null : Date.now() - lastRefreshedAt,
    isStale: isCacheStale(),
  };
}

function isCacheStale(): boolean {
  if (lastRefreshedAt === null || peopleByEmail.size === 0) return true;
  return Date.now() - lastRefreshedAt > CACHE_TTL_MS;
}

/**
 * Fetch ALL People records from Airtable and rebuild the email cache.
 * Returns the number of cached records.
 */
export async function refreshPeopleCache(): Promise<number> {
  if (refreshInFlight) {
    console.log("[peopleCache] refresh already in flight — awaiting it");
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    console.log("[peopleCache] refreshing People cache from Airtable…");
    const started = Date.now();
    const people = await fetchAllPeople();

    peopleByEmail.clear();
    for (const person of people) {
      const email = person.fields.Email?.trim().toLowerCase();
      if (!email) continue;
      peopleByEmail.set(email, person);
    }

    lastRefreshedAt = Date.now();
    const elapsed = lastRefreshedAt - started;
    console.log(
      `[peopleCache] refresh complete — cached ${peopleByEmail.size} people (${elapsed}ms)`
    );
    return peopleByEmail.size;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Look up a person by email via the in-memory cache.
 * Refreshes from Airtable when the cache is empty or older than 5 minutes.
 */
export async function getPersonByEmail(
  email: string
): Promise<Person | null> {
  const key = email.trim().toLowerCase();
  if (!key) return null;

  if (isCacheStale()) {
    console.log(
      `[peopleCache] cache miss/stale for "${key}" — refreshing before lookup`
    );
    await refreshPeopleCache();
  } else {
    console.log(`[peopleCache] cache hit path for "${key}" (no refresh needed)`);
  }

  const person = peopleByEmail.get(key) ?? null;
  if (person) {
    console.log(`[peopleCache] found "${key}" in cache`);
  } else {
    console.log(`[peopleCache] "${key}" not found in cache`);
  }
  return person;
}
