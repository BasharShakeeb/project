import { useEffect, useState } from "react";
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
}

export function FinancePage() {
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => { fetchTransactions(); }, []);

  async function fetchTransactions() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
    setTransactions((data as Transaction[]) || []);
    setLoading(false);
  }

  function resetForm() {
    setType("expense"); setAmount(""); setCategory(""); setDate(new Date().toISOString().split("T")[0]);
  }

  function openCreate(t: "income" | "expense" = "expense") {
    resetForm(); setType(t); setDialogOpen(true);
  }

  async function handleSave() {
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (!category.trim()) { toast.error("Category is required"); return; }

    const payload = {
      type,
      amount: Number(amount),
      category: category.trim(),
      date,
    };
    
    if (!supabase) return;
    const { error } = await supabase.from("transactions").insert(payload);
    if (error) { toast.error(error.message); return; }
    
    toast.success(t.finance.save);
    setDialogOpen(false); resetForm(); fetchTransactions();
  }

  async function deleteTransaction(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchTransactions();
  }

  const totalIncome = transactions.filter(t => t.type === "income").reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.finance.title}</h1>
          <p className="text-sm text-muted-foreground">{t.finance.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openCreate("expense")} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">
            <ArrowDownRight className="h-4 w-4 text-destructive" /> Expense
          </button>
          <button onClick={() => openCreate("income")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <ArrowUpRight className="h-4 w-4" /> Income
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Wallet className="h-5 w-5" />
              <h3 className="font-medium">{t.finance.balance}</h3>
            </div>
            <div className={cn("text-3xl font-bold", balance < 0 ? "text-destructive" : "")}>
              ${balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              <h3 className="font-medium">{t.finance.income}</h3>
            </div>
            <div className="text-3xl font-bold text-emerald-500">
              ${totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <ArrowDownRight className="h-5 w-5 text-destructive" />
              <h3 className="font-medium">{t.finance.expense}</h3>
            </div>
            <div className="text-3xl font-bold text-destructive">
              ${totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Wallet className="h-10 w-10 mb-3 opacity-20" />
            <p>No transactions yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 font-semibold">{t.finance.date}</th>
                <th className="p-4 font-semibold">{t.finance.category}</th>
                <th className="p-4 font-semibold text-right">{t.finance.amount}</th>
                <th className="p-4 w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tr) => (
                <tr key={tr.id} className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="p-4 text-muted-foreground">{new Date(tr.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium">{tr.category}</td>
                  <td className={cn("p-4 text-right font-bold", tr.type === "income" ? "text-emerald-500" : "")}>
                    {tr.type === "income" ? "+" : "-"}${Number(tr.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="p-4">
                    <button onClick={() => deleteTransaction(tr.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-accent rounded-lg flex items-center justify-center transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDialogOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.finance.newTransaction}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  onClick={() => setType("expense")}
                  className={cn("flex-1 rounded-md py-1.5 text-sm font-medium transition-colors", type === "expense" ? "bg-card shadow text-foreground" : "text-muted-foreground")}
                >
                  {t.finance.expense}
                </button>
                <button
                  onClick={() => setType("income")}
                  className={cn("flex-1 rounded-md py-1.5 text-sm font-medium transition-colors", type === "income" ? "bg-card shadow text-foreground" : "text-muted-foreground")}
                >
                  {t.finance.income}
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.finance.amount}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value) || "")} className="h-10 w-full rounded-lg border border-border bg-background ps-8 pe-3 font-bold outline-none focus:border-primary" autoFocus placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.finance.category}</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" placeholder="e.g. Groceries, Salary..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.finance.date}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">{t.finance.cancel}</button>
              <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{t.finance.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
