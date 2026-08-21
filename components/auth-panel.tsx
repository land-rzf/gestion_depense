"use client";

import { ArrowRight, LockKeyhole, Mail, WalletCards } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type Mode = "login" | "register";

export function AuthPanel({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "L’inscription a échoué.");
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Adresse e-mail ou mot de passe incorrect.");
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur inattendue est survenue.");
    } finally { setLoading(false); }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:p-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgb(45_212_191_/_0.14),transparent_28%),radial-gradient(circle_at_86%_74%,rgb(167_139_250_/_0.16),transparent_30%)]" />
      <div className="mx-auto flex max-w-6xl justify-end"><ThemeToggle /></div>
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-[rgb(var(--line))] bg-[rgb(var(--panel))]/80 shadow-soft backdrop-blur sm:mt-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="hidden min-h-[640px] flex-col justify-between bg-teal-800 p-12 text-teal-50 lg:flex">
          <div className="flex items-center gap-3 text-lg font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><WalletCards size={21} /></span> Dépenses</div>
          <div><p className="mb-5 text-sm font-bold uppercase tracking-[.2em] text-teal-200">Votre tableau de bord personnel</p><h1 className="max-w-md text-5xl font-black leading-[1.04] tracking-tight">Vos finances, en toute clarté.</h1><p className="mt-6 max-w-sm text-base leading-7 text-teal-100/85">Suivez vos dépenses, comprenez vos habitudes et prenez des décisions sereines.</p></div>
          <p className="text-sm text-teal-200">Simple. Privé. Pensé pour votre quotidien.</p>
        </div>
        <div className="flex min-h-[640px] items-center p-6 sm:p-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-9 lg:hidden"><div className="flex items-center gap-2 text-lg font-extrabold text-teal-700 dark:text-teal-300"><WalletCards size={23} /> Dépenses</div></div>
            <p className="text-sm font-bold uppercase tracking-[.15em] text-teal-700 dark:text-teal-300">{isRegister ? "Créer un espace privé" : "Bon retour parmi nous"}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{isRegister ? "Commencez simplement." : "Ravi de vous revoir."}</h2>
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{isRegister ? "Votre tableau de bord est prêt à recevoir vos premières dépenses." : "Connectez-vous pour accéder à votre suivi personnel."}</p>
            <form className="mt-8 space-y-5" onSubmit={submit}>
              <label><span className="label">Adresse e-mail</span><span className="relative block"><Mail className="absolute left-3.5 top-3.5 text-[rgb(var(--muted))]" size={17} /><input required type="email" autoComplete="email" className="input pl-10" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.fr" /></span></label>
              <label><span className="label">Mot de passe</span><span className="relative block"><LockKeyhole className="absolute left-3.5 top-3.5 text-[rgb(var(--muted))]" size={17} /><input required minLength={8} type="password" autoComplete={isRegister ? "new-password" : "current-password"} className="input pl-10" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caractères minimum" /></span></label>
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
              <button className="button-primary w-full" disabled={loading}>{loading ? "Patientez…" : isRegister ? "Créer mon compte" : "Se connecter"}<ArrowRight size={17} /></button>
            </form>
            <p className="mt-7 text-center text-sm text-[rgb(var(--muted))]">{isRegister ? "Vous avez déjà un compte ?" : "Vous découvrez Dépenses ?"} <Link className="font-bold text-teal-700 hover:underline dark:text-teal-300" href={isRegister ? "/login" : "/register"}>{isRegister ? "Connectez-vous" : "Créez votre compte"}</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
