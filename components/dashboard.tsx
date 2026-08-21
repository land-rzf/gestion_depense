"use client";

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, CircleDollarSign, CreditCard, Edit3, FileText, LogOut, Menu, MoreHorizontal, Plus, SlidersHorizontal, Trash2, WalletCards, X, type LucideIcon } from "lucide-react";
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

type Expense = { id: string; amount: number; category: ExpenseCategory; description: string; date: string; createdAt: string };
type Summary = { currentMonth: string; currentTotal: number; byCategory: { name: ExpenseCategory; value: number }[]; evolution: { month: string; total: number }[]; recentExpenses: Expense[] };
type Draft = Omit<Expense, "id" | "createdAt">;

const euro = new Intl.NumberFormat("fr-MG", { style: "currency", currency: "MGA", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function displayMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function getErrorMessage(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : fallback;
}

function friendlyError(cause: unknown, fallback: string) {
  const message = cause instanceof Error ? cause.message : "";
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "La connexion est momentanément indisponible. Vérifiez votre réseau puis réessayez.";
  }
  return message || fallback;
}

const categoryIcons: Record<ExpenseCategory, LucideIcon> = {
  Alimentation: CircleDollarSign,
  Transport: CreditCard,
  Logement: WalletCards,
  Loisirs: CircleDollarSign,
  Santé: CircleDollarSign,
  Autres: MoreHorizontal
};

function ExpenseModal({ expense, onClose, onSaved }: { expense: Expense | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<Draft>(() => expense ? { amount: expense.amount, category: expense.category, description: expense.description, date: expense.date } : { amount: 0, category: "Alimentation", description: "", date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const editMode = Boolean(expense);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(expense ? `/api/expenses/${expense.id}` : "/api/expenses", { method: expense ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data, "Impossible d’enregistrer la dépense."));
      await onSaved();
      onClose();
    } catch (cause) {
      setError(friendlyError(cause, "Une erreur inattendue est survenue."));
    } finally { setSaving(false); }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title" className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-5">
      <div className="w-full max-w-lg rounded-t-[1.8rem] border border-[rgb(var(--line))] bg-[rgb(var(--panel))] p-6 shadow-soft sm:rounded-[1.8rem] sm:p-7">
        <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-teal-700 dark:text-teal-300">Dépenses</p><h2 id="expense-dialog-title" className="mt-1 text-2xl font-black tracking-tight">{editMode ? "Modifier la dépense" : "Nouvelle dépense"}</h2></div><button className="grid h-9 w-9 place-items-center rounded-xl text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel-muted))]" onClick={onClose} aria-label="Fermer"><X size={19} /></button></div>
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label><span className="label">Montant</span><span className="relative block"><input className="input pr-11 text-base font-bold" required min="1" step="1" inputMode="numeric" type="number" value={draft.amount || ""} onChange={(event) => setDraft((value) => ({ ...value, amount: Number(event.target.value) }))} placeholder="0" /><span className="absolute right-4 top-3.5 text-sm font-bold text-[rgb(var(--muted))]">MGA</span></span></label>
          <div className="grid gap-5 sm:grid-cols-2"><label><span className="label">Catégorie</span><select className="input appearance-none" value={draft.category} onChange={(event) => setDraft((value) => ({ ...value, category: event.target.value as ExpenseCategory }))}>{EXPENSE_CATEGORIES.map((category) => <option value={category} key={category}>{category}</option>)}</select></label><label><span className="label">Date</span><input className="input" required type="date" value={draft.date} onChange={(event) => setDraft((value) => ({ ...value, date: event.target.value }))} /></label></div>
          <label><span className="label">Description</span><input className="input" required maxLength={240} value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} placeholder="Ex. Courses du marché" /></label>
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button className="button-secondary" type="button" onClick={onClose}>Annuler</button><button className="button-primary" disabled={saving}>{saving ? "Enregistrement…" : editMode ? "Enregistrer les modifications" : "Ajouter la dépense"}</button></div>
        </form>
      </div>
    </div>
  );
}

function ChartEmpty({ text }: { text: string }) { return <div className="grid h-full place-items-center text-center text-sm text-[rgb(var(--muted))]"><span>{text}</span></div>; }

function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  return (
    <section className="surface mx-4 mt-5 p-5 sm:mx-7 sm:p-6 lg:mx-10">
      <div className="flex items-center justify-between gap-4"><div><h2 className="font-black tracking-tight">Dernières dépenses ajoutées</h2><p className="mt-1 text-sm text-[rgb(var(--muted))]">Vos cinq mouvements les plus récents.</p></div><span className="rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">Récent</span></div>
      {expenses.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{expenses.map((expense) => { const Icon = categoryIcons[expense.category]; return <article key={expense.id} className="rounded-2xl border border-[rgb(var(--line))] bg-[rgb(var(--panel-muted))] p-4"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${CATEGORY_COLORS[expense.category]}18`, color: CATEGORY_COLORS[expense.category] }}><Icon size={17} /></span><strong className="whitespace-nowrap text-sm">{euro.format(expense.amount)}</strong></div><p className="mt-4 truncate text-sm font-extrabold">{expense.description}</p><p className="mt-1 text-xs font-medium text-[rgb(var(--muted))]">{expense.category} · {dateFormatter.format(new Date(`${expense.date}T12:00:00`))}</p></article>; })}</div> : <div className="mt-5 rounded-2xl bg-[rgb(var(--panel-muted))] px-5 py-8 text-center text-sm text-[rgb(var(--muted))]">Vos dernières dépenses apparaîtront ici dès votre première saisie.</div>}
    </section>
  );
}

export function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState<"all" | ExpenseCategory>("all");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalExpense, setModalExpense] = useState<Expense | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true); setError("");
    try {
      const query = new URLSearchParams({ month });
      if (category !== "all") query.set("category", category);
      const [expensesResponse, summaryResponse] = await Promise.all([fetch(`/api/expenses?${query}`), fetch("/api/dashboard/summary")]);
      const expensesBody: unknown = await expensesResponse.json();
      const summaryBody: unknown = await summaryResponse.json();
      if (!expensesResponse.ok) throw new Error(getErrorMessage(expensesBody, "Impossible de charger les dépenses."));
      if (!summaryResponse.ok) throw new Error(getErrorMessage(summaryBody, "Impossible de charger le tableau de bord."));
      setExpenses((expensesBody as { expenses: Expense[] }).expenses);
      setSummary(summaryBody as Summary);
    } catch (cause) { setError(friendlyError(cause, "Une erreur inattendue est survenue.")); }
    finally { setLoading(false); }
  }, [category, month, session?.user?.id]);

  useEffect(() => { if (status === "unauthenticated") router.replace("/login"); }, [router, status]);
  useEffect(() => { void load(); }, [load]);

  const name = useMemo(() => session?.user?.name || session?.user?.email?.split("@")[0] || "vous", [session]);
  const filteredTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  async function remove(expense: Expense) {
    if (!window.confirm(`Supprimer « ${expense.description} » ? Cette action est irréversible.`)) return;
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(body, "Impossible de supprimer la dépense."));
      await load();
    } catch (cause) { setError(friendlyError(cause, "Impossible de supprimer la dépense.")); }
  }

  if (status === "loading" || status === "unauthenticated") return <div className="grid min-h-screen place-items-center bg-[rgb(var(--bg))]"><div className="h-9 w-9 animate-spin rounded-full border-4 border-teal-500/20 border-t-teal-600" /></div>;

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--ink))]">
      <div className="mx-auto flex max-w-[1540px]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-[rgb(var(--line))] bg-[rgb(var(--panel))] p-6 lg:flex">
          <div className="flex items-center gap-3 px-2 text-lg font-black tracking-tight text-teal-700 dark:text-teal-300"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-700 text-white shadow-lg shadow-teal-700/20 dark:bg-teal-400 dark:text-slate-950"><WalletCards size={21} /></span>Dépenses</div>
          <nav className="mt-12 space-y-2"><a className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 text-sm font-extrabold text-teal-800 dark:bg-teal-400/10 dark:text-teal-300" href="#tableau-de-bord"><CircleDollarSign size={19} />Tableau de bord</a><a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--panel-muted))] hover:text-[rgb(var(--ink))]" href="#depenses"><FileText size={19} />Mes dépenses</a></nav>
          <div className="mt-auto rounded-2xl bg-[rgb(var(--panel-muted))] p-4"><p className="text-xs font-bold text-[rgb(var(--muted))]">Votre espace</p><p className="mt-1 truncate text-sm font-extrabold">{session?.user?.email}</p><button className="mt-4 flex items-center gap-2 text-sm font-bold text-[rgb(var(--muted))] transition hover:text-rose-600" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={16} />Se déconnecter</button></div>
        </aside>
        <section className="min-w-0 flex-1 px-4 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-10 lg:pt-9">
          <header className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 lg:hidden"><button onClick={() => setMenuOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--panel))]" aria-label="Ouvrir le menu"><Menu size={19} /></button><div className="font-black tracking-tight text-teal-700 dark:text-teal-300">Dépenses</div></div><div className="hidden lg:block"><p className="text-sm font-bold text-[rgb(var(--muted))]">{new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p></div><div className="ml-auto flex items-center gap-2"><ThemeToggle /><button className="button-primary hidden sm:inline-flex" onClick={() => setModalExpense(null)}><Plus size={17} />Ajouter une dépense</button><button className="grid h-10 w-10 place-items-center rounded-xl bg-teal-700 text-white shadow-sm sm:hidden dark:bg-teal-400 dark:text-slate-950" onClick={() => setModalExpense(null)} aria-label="Ajouter une dépense"><Plus size={19} /></button></div></header>
          {menuOpen && <div className="surface mt-3 p-2 lg:hidden"><a onClick={() => setMenuOpen(false)} href="#tableau-de-bord" className="block rounded-lg px-3 py-2 text-sm font-bold hover:bg-[rgb(var(--panel-muted))]">Tableau de bord</a><a onClick={() => setMenuOpen(false)} href="#depenses" className="block rounded-lg px-3 py-2 text-sm font-bold hover:bg-[rgb(var(--panel-muted))]">Mes dépenses</a><button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"><LogOut size={15} />Se déconnecter</button></div>}
          <section id="tableau-de-bord" className="mt-9"><p className="text-sm font-bold uppercase tracking-[.15em] text-teal-700 dark:text-teal-300">Vue d’ensemble</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Bonjour, {name}.</h1><p className="mt-2 text-sm text-[rgb(var(--muted))]">Voici le rythme de vos dépenses ce mois-ci.</p></div><div className="rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--panel))] px-3 py-2 text-sm font-bold text-[rgb(var(--muted))]"><CalendarDays className="mr-2 inline-block h-4 w-4 text-teal-600 dark:text-teal-300" />{summary ? displayMonth(summary.currentMonth) : "Chargement…"}</div></div></section>
          {error && <div role="alert" className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300"><span>{error}</span><button className="font-bold underline" onClick={() => void load()}>Réessayer</button></div>}
          <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,.88fr)]"><div className="overflow-hidden rounded-[1.45rem] bg-teal-800 p-6 text-teal-50 shadow-soft sm:p-7 dark:bg-teal-400 dark:text-slate-950"><p className="text-sm font-bold text-teal-100/80 dark:text-slate-700">Total de vos dépenses</p><div className="mt-3 flex items-end justify-between gap-4"><div><p className="text-4xl font-black tracking-tight sm:text-5xl">{summary ? euro.format(summary.currentTotal) : "—"}</p><p className="mt-2 text-sm font-medium text-teal-100/75 dark:text-slate-700">pour {summary ? displayMonth(summary.currentMonth) : "ce mois"}</p></div><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/12 dark:bg-slate-950/10"><WalletCards size={27} /></span></div><div className="mt-7 h-1.5 rounded-full bg-white/15 dark:bg-slate-950/15"><div className="h-full w-[72%] rounded-full bg-teal-200 dark:bg-teal-700" /></div></div><div className="surface flex min-h-[175px] flex-col justify-between p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-[rgb(var(--muted))]">Dépenses filtrées</p><p className="mt-2 text-3xl font-black tracking-tight">{euro.format(filteredTotal)}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-400/10"><SlidersHorizontal size={19} /></span></div><p className="text-sm text-[rgb(var(--muted))]">{expenses.length} dépense{expenses.length > 1 ? "s" : ""} correspondante{expenses.length > 1 ? "s" : ""}.</p></div></section>
          <section className="mt-5 grid gap-5 xl:grid-cols-2"><article className="surface p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-black tracking-tight">Répartition par catégorie</h2><p className="mt-1 text-sm text-[rgb(var(--muted))]">Ce mois-ci</p></div><span className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">{summary?.byCategory.length ?? 0} catégorie{(summary?.byCategory.length ?? 0) > 1 ? "s" : ""}</span></div><div className="mt-4 h-64">{summary?.byCategory.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summary.byCategory} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={5}>{summary.byCategory.map((entry) => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />)}</Pie><Tooltip formatter={(value) => euro.format(Number(value))} contentStyle={{ borderRadius: 14, border: "1px solid rgb(226 232 240)", boxShadow: "0 12px 32px rgba(15, 23, 42, .12)" }} /></PieChart></ResponsiveContainer> : <ChartEmpty text="Ajoutez des dépenses pour visualiser votre répartition." />}</div>{summary?.byCategory.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[rgb(var(--line))] pt-4">{summary.byCategory.map((item) => <div key={item.name} className="flex min-w-0 items-center justify-between gap-2 text-xs font-bold"><span className="flex min-w-0 items-center gap-2 truncate"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[item.name] }} />{item.name}</span><span>{euro.format(item.value)}</span></div>)}</div> : null}</article>
            <article className="surface p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-black tracking-tight">Évolution des dépenses</h2><p className="mt-1 text-sm text-[rgb(var(--muted))]">Sur les six derniers mois</p></div><span className="rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">6 mois</span></div><div className="mt-5 h-64">{summary && summary.evolution.some((item) => item.total > 0) ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={summary.evolution} margin={{ top: 10, left: -18, right: 4, bottom: 0 }}><defs><linearGradient id="totalGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#14B8A6" stopOpacity={.35} /><stop offset="100%" stopColor="#14B8A6" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={.08} /><XAxis dataKey="month" tickFormatter={(value) => value.slice(5)} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} /><YAxis tickFormatter={(value) => `${value} Ar`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} /><Tooltip labelFormatter={(value) => displayMonth(String(value))} formatter={(value) => [euro.format(Number(value)), "Total"]} contentStyle={{ borderRadius: 14, border: "1px solid rgb(226 232 240)", boxShadow: "0 12px 32px rgba(15, 23, 42, .12)" }} /><Area type="monotone" dataKey="total" stroke="#14B8A6" strokeWidth={3} fill="url(#totalGradient)" activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer> : <ChartEmpty text="Ajoutez des dépenses pour visualiser votre évolution." />}</div></article></section>
          <section id="depenses" className="surface mt-5 overflow-hidden"><div className="flex flex-col justify-between gap-5 border-b border-[rgb(var(--line))] p-5 sm:flex-row sm:items-center sm:p-6"><div><h2 className="font-black tracking-tight">Vos dépenses</h2><p className="mt-1 text-sm text-[rgb(var(--muted))]">Retrouvez et organisez chaque mouvement.</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><label className="relative"><span className="sr-only">Filtrer par mois</span><input className="input h-10 py-2 pr-2 text-xs font-bold" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label><label className="relative"><span className="sr-only">Filtrer par catégorie</span><select className="input h-10 appearance-none py-2 pr-8 text-xs font-bold" value={category} onChange={(event) => setCategory(event.target.value as "all" | ExpenseCategory)}><option value="all">Toutes catégories</option>{EXPENSE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-3 text-[rgb(var(--muted))]" size={14} /></label></div></div>
            <div className="overflow-x-auto">{loading ? <div className="space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-[rgb(var(--panel-muted))]" />)}</div> : expenses.length ? <table className="min-w-[680px] w-full text-left"><thead className="bg-[rgb(var(--panel-muted))] text-xs font-bold uppercase tracking-wide text-[rgb(var(--muted))]"><tr><th className="px-6 py-4">Dépense</th><th className="px-4 py-4">Catégorie</th><th className="px-4 py-4">Date</th><th className="px-4 py-4 text-right">Montant</th><th className="px-6 py-4"><span className="sr-only">Actions</span></th></tr></thead><tbody>{expenses.map((expense) => { const Icon = categoryIcons[expense.category]; return <tr key={expense.id} className="border-t border-[rgb(var(--line))] transition hover:bg-[rgb(var(--panel-muted))]/55"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${CATEGORY_COLORS[expense.category]}18`, color: CATEGORY_COLORS[expense.category] }}><Icon size={18} /></span><span className="font-bold">{expense.description}</span></div></td><td className="px-4 py-4"><span className="rounded-lg bg-[rgb(var(--panel-muted))] px-2.5 py-1 text-xs font-bold text-[rgb(var(--muted))]">{expense.category}</span></td><td className="px-4 py-4 text-sm font-medium text-[rgb(var(--muted))]">{dateFormatter.format(new Date(`${expense.date}T12:00:00`))}</td><td className="px-4 py-4 text-right font-black">{euro.format(expense.amount)}</td><td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => setModalExpense(expense)} className="grid h-9 w-9 place-items-center rounded-lg text-[rgb(var(--muted))] transition hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-400/10 dark:hover:text-teal-300" aria-label={`Modifier ${expense.description}`}><Edit3 size={16} /></button><button onClick={() => void remove(expense)} className="grid h-9 w-9 place-items-center rounded-lg text-[rgb(var(--muted))] transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" aria-label={`Supprimer ${expense.description}`}><Trash2 size={16} /></button></div></td></tr>; })}</tbody></table> : <div className="grid min-h-64 place-items-center px-6 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300"><WalletCards size={22} /></span><h3 className="mt-4 font-black">Aucune dépense à afficher</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[rgb(var(--muted))]">Ajustez vos filtres ou ajoutez votre première dépense pour commencer le suivi.</p><button className="button-primary mt-5" onClick={() => setModalExpense(null)}><Plus size={16} />Ajouter une dépense</button></div></div>}</div>
          </section>
        </section>
      </div>
      <RecentExpenses expenses={summary?.recentExpenses ?? []} />
      {modalExpense !== undefined && <ExpenseModal expense={modalExpense} onClose={() => setModalExpense(undefined)} onSaved={load} />}
    </main>
  );
}
