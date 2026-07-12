"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, CheckCircle2 } from "lucide-react";

const ROLES = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("Fleet Manager");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, inviteCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex w-1/2 bg-canvas flex-col justify-between p-12 border-r border-hairline-soft">
        <div>
          <div className="flex items-center gap-3 text-foreground mb-12">
            <Truck className="w-10 h-10 text-foreground" />
            <span className="text-4xl font-display uppercase tracking-tight">TransitOps</span>
          </div>
          <p className="text-muted text-lg max-w-md">
            The next-generation platform for intelligent fleet operations and maintenance.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-body">
            <CheckCircle2 className="w-5 h-5 text-semantic-success" />
            <span>Role-based access for your whole team</span>
          </div>
          <div className="flex items-center gap-3 text-body">
            <CheckCircle2 className="w-5 h-5 text-semantic-success" />
            <span>Invite-only, secure onboarding</span>
          </div>
          <div className="flex items-center gap-3 text-body">
            <CheckCircle2 className="w-5 h-5 text-semantic-success" />
            <span>Live operations visibility</span>
          </div>
        </div>
        <div className="text-sm text-muted-soft">
          &copy; {new Date().getFullYear()} OneReign. All rights reserved.
        </div>
      </div>

      {/* Right Pane - Register Form */}
      <div className="flex-1 flex items-center justify-center bg-surface-card p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left border-b border-hairline pb-4">
            <h2 className="text-5xl font-display uppercase tracking-tight text-foreground mb-1">Create Account</h2>
            <p className="text-mute uppercase tracking-widest text-xs font-semibold">Sign up with your team&apos;s invite code</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5 mt-8">
            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
                Account created! Redirecting to sign in…
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-widest" htmlFor="name">Full name</label>
              <Input id="name" type="text" placeholder="Jane Doe" value={name}
                onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-widest" htmlFor="email">Email</label>
              <Input id="email" type="email" placeholder="jane@transitops.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-widest" htmlFor="password">Password</label>
              <Input id="password" type="password" placeholder="At least 8 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-widest" htmlFor="role">Role</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-none border border-hairline bg-canvas px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-widest" htmlFor="inviteCode">Invite code</label>
              <Input id="inviteCode" type="text" placeholder="Team invite code" value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-center text-xs uppercase tracking-widest font-semibold text-mute">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
