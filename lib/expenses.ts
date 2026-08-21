import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/constants";
import { getRedis, redisKeys } from "@/lib/redis";
import type { z } from "zod";
import type { expenseInputSchema, expenseUpdateSchema } from "@/lib/validations";

export type Expense = {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: string;
};

type StoredExpense = Omit<Expense, "id" | "amount" | "category"> & { amount: string; category: string };
type ExpenseInput = z.infer<typeof expenseInputSchema>;
type ExpenseUpdate = z.infer<typeof expenseUpdateSchema>;

function isCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

function toExpense(id: string, data: StoredExpense | null): Expense | null {
  if (!data || !data.userId || !data.date || !data.createdAt || !data.description || !isCategory(data.category)) return null;
  const amount = Number(data.amount);
  if (!Number.isFinite(amount)) return null;
  return { id, userId: data.userId, amount, category: data.category, description: data.description, date: data.date, createdAt: data.createdAt };
}

export async function getExpenseForUser(userId: string, expenseId: string) {
  const data = (await getRedis().hgetall(redisKeys.expense(expenseId))) as StoredExpense | null;
  const expense = toExpense(expenseId, data);
  return expense?.userId === userId ? expense : null;
}

export async function listExpenses(userId: string, filters: { month?: string; category?: ExpenseCategory } = {}) {
  const redis = getRedis();
  const ids = await redis.smembers<string[]>(redisKeys.userExpenses(userId));
  const records = await Promise.all(ids.map(async (id) => toExpense(id, (await redis.hgetall(redisKeys.expense(id))) as StoredExpense | null)));
  return records
    .filter((expense): expense is Expense => expense !== null && expense.userId === userId)
    .filter((expense) => !filters.month || expense.date.startsWith(filters.month))
    .filter((expense) => !filters.category || expense.category === filters.category)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function refreshMonthTotal(userId: string, month: string) {
  const expenses = await listExpenses(userId, { month });
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  await getRedis().set(redisKeys.monthTotal(userId, month), total.toFixed(2));
  return total;
}

export async function createExpense(userId: string, input: ExpenseInput) {
  const redis = getRedis();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expense: Expense = { id, userId, ...input, createdAt };
  await redis.hset(redisKeys.expense(id), { userId, amount: String(input.amount), category: input.category, description: input.description, date: input.date, createdAt });
  await redis.sadd(redisKeys.userExpenses(userId), id);
  await refreshMonthTotal(userId, input.date.slice(0, 7));
  return expense;
}

export async function updateExpense(userId: string, id: string, input: ExpenseUpdate) {
  const existing = await getExpenseForUser(userId, id);
  if (!existing) return null;
  const next = { ...existing, ...input };
  await getRedis().hset(redisKeys.expense(id), { amount: String(next.amount), category: next.category, description: next.description, date: next.date });
  const oldMonth = existing.date.slice(0, 7);
  const newMonth = next.date.slice(0, 7);
  await refreshMonthTotal(userId, oldMonth);
  if (newMonth !== oldMonth) await refreshMonthTotal(userId, newMonth);
  return next;
}

export async function deleteExpense(userId: string, id: string) {
  const existing = await getExpenseForUser(userId, id);
  if (!existing) return false;
  const redis = getRedis();
  await redis.srem(redisKeys.userExpenses(userId), id);
  await redis.del(redisKeys.expense(id));
  await refreshMonthTotal(userId, existing.date.slice(0, 7));
  return true;
}

export async function getDashboardSummary(userId: string) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const currentMonth = months.at(-1)!;
  const allExpenses = await listExpenses(userId);
  const currentExpenses = allExpenses.filter((expense) => expense.date.startsWith(currentMonth));
  const cachedTotal = await getRedis().get<string>(redisKeys.monthTotal(userId, currentMonth));
  const currentTotal = cachedTotal === null ? await refreshMonthTotal(userId, currentMonth) : Number(cachedTotal);
  const byCategory = EXPENSE_CATEGORIES.map((category) => ({ name: category, value: currentExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0) })).filter((item) => item.value > 0);
  const evolution = months.map((month) => ({ month, total: allExpenses.filter((expense) => expense.date.startsWith(month)).reduce((sum, expense) => sum + expense.amount, 0) }));
  return { currentMonth, currentTotal: Number.isFinite(currentTotal) ? currentTotal : 0, byCategory, evolution, recentExpenses: allExpenses.slice(0, 5) };
}
