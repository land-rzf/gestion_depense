import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export function getRedis() {
  if (client) return client;
  const url = "https://major-swan-72955.upstash.io";
  const token = "gQAAAAAAARz7AAIgcDJjNjlkYTNjM2QxN2I0NDkyOTdlMzE0MmMyNzFkZDcxMw";
  if (!url || !token) throw new Error("La connexion à Upstash Redis n’est pas configurée. Vérifiez vos variables d’environnement.");
  client = new Redis({ url, token });
  return client;
}

export const redisKeys = {
  user: (userId: string) => `user:${userId}`,
  userEmail: (email: string) => `user:email:${email}`,
  userExpenses: (userId: string) => `user:${userId}:expenses`,
  expense: (expenseId: string) => `expense:${expenseId}`,
  monthTotal: (userId: string, month: string) => `user:${userId}:total:${month}`
};
