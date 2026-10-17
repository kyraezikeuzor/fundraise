/**
 * Type roles and action styles copied from Bridge and Activities (src/styles/typography.ts)
 * so both apps look like one product. Change them in both places together.
 */
export const typography = {
  pageTitle: "text-3xl font-semibold leading-tight tracking-tight sm:text-4xl",
  sectionTitle: "text-xl font-semibold leading-snug tracking-tight",
  cardTitle: "text-base font-semibold leading-snug tracking-normal",
  body: "text-base font-normal leading-relaxed tracking-normal",
  bodySmall: "text-sm font-normal leading-relaxed tracking-normal",
  label: "text-sm font-medium leading-none tracking-normal",
  metadata: "text-sm font-normal leading-normal tracking-normal",
  helper: "text-xs font-normal leading-normal tracking-normal",
  button: "text-sm font-medium leading-none tracking-normal",
  buttonSecondary: "border border-border bg-[#F8F8F8] text-foreground hover:bg-[#F0F0F0]",
  buttonPrimary: "bg-bridge-action text-white hover:bg-bridge-action-hover",
  buttonActionQuiet: "bg-bridge-action-soft text-bridge-action-hover hover:bg-bridge-action/20",
} as const;

export const textColor = {
  primary: "text-foreground",
  card: "text-[#4A4A4A]",
  secondary: "text-muted-foreground",
} as const;
