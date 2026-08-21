export const EXPENSE_CATEGORIES = ["Alimentation", "Transport", "Logement", "Loisirs", "Santé", "Autres"] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Alimentation: "#FB7185",
  Transport: "#38BDF8",
  Logement: "#A78BFA",
  Loisirs: "#34D399",
  Santé: "#FBBF24",
  Autres: "#94A3B8"
};
