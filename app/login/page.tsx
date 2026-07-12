"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid credentials");
      }
      // Honour a ?redirect= set by the auth middleware, else go to the dashboard.
      // Hard navigation so the new auth cookie is applied on a fresh page load.
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      window.location.assign(redirect || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            <span>Real-time Fleet Analytics</span>
          </div>
          <div className="flex items-center gap-3 text-body">
            <CheckCircle2 className="w-5 h-5 text-semantic-success" />
            <span>Predictive Maintenance</span>
          </div>
          <div className="flex items-center gap-3 text-body">
            <CheckCircle2 className="w-5 h-5 text-semantic-success" />
            <span>Driver Safety Profiles</span>
          </div>
        </div>
        
        <div className="text-sm text-muted-soft">
          &copy; {new Date().getFullYear()} OneReign. All rights reserved.
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-surface-card p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left border-b border-hairline pb-4">
            <h2 className="text-5xl font-display uppercase tracking-tight text-foreground mb-1">Sign In</h2>
            <p className="text-mute uppercase tracking-widest text-xs font-semibold">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-widest" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-widest" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-xs text-foreground hover:underline uppercase tracking-widest font-semibold">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-xs uppercase tracking-widest font-semibold text-mute">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-foreground hover:underline">
                Create one
              </Link>
            </p>
          </form>

          <p className="text-center text-sm text-muted mt-8">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-body-strong">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-body-strong">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
