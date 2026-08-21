import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

const validIsoDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const emailSchema = z.string().trim().toLowerCase().email("Veuillez saisir une adresse e-mail valide.");
export const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(72, "Le mot de passe est trop long.");
export const registerSchema = z.object({ email: emailSchema, password: passwordSchema });
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit respecter le format AAAA-MM-JJ.").refine(validIsoDate, "La date n’est pas valide.");
export const expenseInputSchema = z.object({
  amount: z.coerce.number().finite("Le montant est invalide.").int("Le montant doit être exprimé en ariary entier.").positive("Le montant doit être supérieur à zéro.").max(1_000_000_000, "Le montant est trop élevé."),
  category: z.enum(EXPENSE_CATEGORIES, { errorMap: () => ({ message: "La catégorie sélectionnée est invalide." }) }),
  description: z.string().trim().min(1, "La description est obligatoire.").max(240, "La description ne peut pas dépasser 240 caractères."),
  date: dateSchema
});
export const expenseUpdateSchema = expenseInputSchema.partial().refine((value) => Object.keys(value).length > 0, "Au moins un champ doit être fourni.");
export const expenseFilterSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Le mois doit respecter le format AAAA-MM.").optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional()
});
