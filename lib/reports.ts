// Kategorie nahlášení (client-safe).
export const REPORT_CATEGORIES = [
  { value: "vulgarity", label: "Vulgarismy" },
  { value: "violence", label: "Násilí / poškozování kohokoli" },
  { value: "prank", label: "Prank / zlý úmysl" },
  { value: "bad_intent", label: "Nevhodné nebo škodlivé použití" },
  { value: "other", label: "Jiné" },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]["value"];

export function reportCategoryLabel(value: string): string {
  return REPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
