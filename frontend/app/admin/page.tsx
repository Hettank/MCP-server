"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ADMIN_PASSWORD = "armoriq123";

// ─── Types ──────────────────────────────────────────────
type Tab = "guardrails" | "logs" | "approvals";
type RuleType = "BLOCK" | "APPROVAL" | "INPUT_VALIDATION" | "TOKEN_BUDGET";

interface Rule {
  id: string;
  toolName: string;
  ruleType: RuleType;
  condition: string | null;
  isActive: boolean;
  updatedAt: string;
}

interface LogEntry {
  id: string;
  conversationId: string;
  toolName: string;
  input: any;
  status: "ALLOWED" | "BLOCKED" | "PENDING_APPROVAL";
  blockedReason: string | null;
  createdAt: string;
}

interface ApprovalRequest {
  id: string;
  toolCallLogId: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  requestedAt: string;
  toolCallLog: LogEntry;
}

// ─── Password Gate ──────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onAuth();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex h-full items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Enter password to continue</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-accent/50 focus:ring-1 focus:ring-accent/25"
        />

        {error && (
          <p className="text-center text-sm text-red-400">Wrong password</p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-white transition-all hover:bg-accent-hover cursor-pointer"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────
const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: "guardrails",
    label: "Guardrails",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: "logs",
    label: "Tool Logs",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function Sidebar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
          <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-foreground">Admin</span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all cursor-pointer ${
              active === tab.id
                ? "bg-accent/10 text-accent font-medium"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <Link
          href="/chat"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted transition-all hover:bg-surface-hover hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Back to Chat
        </Link>
      </div>
    </aside>
  );
}

// ─── Guardrails Tab ─────────────────────────────────────
function GuardrailsTab() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [toolName, setToolName] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("BLOCK");
  const [condition, setCondition] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/rules`);
      const data = await res.json();
      setRules(data);
    } catch {
      console.error("Failed to fetch rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleRule = async (id: string) => {
    try {
      await fetch(`${API_URL}/rules/${id}/toggle`, { method: "PATCH" });
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch {
      console.error("Failed to toggle rule");
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await fetch(`${API_URL}/rules/${id}`, { method: "DELETE" });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      console.error("Failed to delete rule");
    }
  };

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: toolName.trim(),
          ruleType,
          condition: condition.trim() || undefined,
        }),
      });
      if (res.ok) {
        setToolName("");
        setCondition("");
        fetchRules();
      }
    } catch {
      console.error("Failed to create rule");
    } finally {
      setCreating(false);
    }
  };

  const ruleTypeColors: Record<RuleType, string> = {
    BLOCK: "bg-red-500/15 text-red-400",
    APPROVAL: "bg-amber-500/15 text-amber-400",
    INPUT_VALIDATION: "bg-blue-500/15 text-blue-400",
    TOKEN_BUDGET: "bg-emerald-500/15 text-emerald-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Guardrail Rules</h2>
        <p className="text-sm text-muted">Manage which tools the agent can call and under what conditions.</p>
      </div>

      {/* Create rule form */}
      <form
        onSubmit={createRule}
        className="rounded-xl border border-border bg-surface p-4 space-y-3"
      >
        <h3 className="text-sm font-medium text-foreground">Create New Rule</h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            placeholder="Tool name (e.g. delete_note)"
            className="flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent/50"
          />
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as RuleType)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          >
            <option value="BLOCK">Block</option>
            <option value="APPROVAL">Require Approval</option>
            <option value="INPUT_VALIDATION">Input Validation</option>
            <option value="TOKEN_BUDGET">Token Budget</option>
          </select>
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="Condition (optional)"
            className="flex-1 min-w-[150px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={creating || !toolName.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Add Rule"}
          </button>
        </div>
      </form>

      {/* Rules table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-muted">Tool Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Rule Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Condition</th>
              <th className="px-4 py-3 text-center font-medium text-muted">Active</th>
              <th className="px-4 py-3 text-center font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">Loading...</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">No rules configured yet.</td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-foreground">{rule.toolName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${ruleTypeColors[rule.ruleType]}`}>
                      {rule.ruleType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{rule.condition || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        rule.isActive ? "bg-accent" : "bg-border"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                          rule.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="rounded-md px-2 py-1 text-xs text-red-400 transition-all hover:bg-red-500/10 cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Logs Tab ───────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/logs`);
        const data = await res.json();
        setLogs(data);
      } catch {
        console.error("Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const statusColors: Record<string, string> = {
    ALLOWED: "bg-emerald-500/15 text-emerald-400",
    BLOCKED: "bg-red-500/15 text-red-400",
    PENDING_APPROVAL: "bg-amber-500/15 text-amber-400",
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Tool Call Logs</h2>
        <p className="text-sm text-muted">Recent tool calls and their policy enforcement results.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-muted">Tool Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Blocked Reason</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">No tool calls logged yet. Send a message in the chat to see logs here.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-foreground">{log.toolName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusColors[log.status] ?? "bg-zinc-500/15 text-zinc-400"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{log.blockedReason || "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(log.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Approvals Tab ──────────────────────────────────────
function ApprovalsTab() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/approvals`);
      const data = await res.json();
      setApprovals(data);
    } catch {
      console.error("Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      await fetch(`${API_URL}/approvals/${id}/${action}`, { method: "PATCH" });
      setApprovals((prev) => prev.filter((appr) => appr.id !== id));
    } catch {
      console.error(`Failed to ${action} request`);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pending Approvals</h2>
        <p className="text-sm text-muted">Review and approve or reject tool calls that require human authorization.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><p className="text-muted">Loading...</p></div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border border-dashed py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-muted">No pending approvals</p>
          <p className="mt-1 text-xs text-muted/70">
            Create an &quot;APPROVAL&quot; guardrail rule, then trigger that tool from chat.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {approvals.map((req) => (
            <div key={req.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border bg-surface-hover/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="font-mono text-sm font-medium text-foreground">{req.toolCallLog.toolName}</h3>
                </div>
                <span className="text-xs text-muted">{formatDate(req.requestedAt)}</span>
              </div>
              <div className="p-4 flex-1">
                <p className="mb-2 text-xs font-semibold text-muted uppercase tracking-wider">Arguments</p>
                <pre className="overflow-x-auto rounded-lg bg-background p-3 text-xs text-foreground/80 font-mono mb-4">
                  {JSON.stringify(req.toolCallLog.input, null, 2)}
                </pre>
                
                <div className="mt-auto flex gap-2 pt-2">
                  <button
                    onClick={() => handleAction(req.id, "reject")}
                    className="flex-1 rounded-lg border border-border bg-background py-2 text-sm font-medium text-muted transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "approve")}
                    className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("guardrails");

  if (!authenticated) {
    return <PasswordGate onAuth={() => setAuthenticated(true)} />;
  }

  return (
    <div className="flex h-full">
      <Sidebar active={activeTab} onSelect={setActiveTab} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          {activeTab === "guardrails" && <GuardrailsTab />}
          {activeTab === "logs" && <LogsTab />}
          {activeTab === "approvals" && <ApprovalsTab />}
        </div>
      </main>
    </div>
  );
}
