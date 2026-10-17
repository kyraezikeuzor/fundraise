/** Bright avatar colors with white text that stays readable. */
const AVATAR_COLORS = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-lime-600",
  "bg-fuchsia-500",
  "bg-cyan-600",
] as const;

/** Same person, same color, on every page and every visit. */
export function avatarColor(personId: string): string {
  let hash = 0;
  for (let i = 0; i < personId.length; i++) hash = (hash * 31 + personId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
