"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call for now, since auth logic isn't fully wired for UI yet
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex w-1/2 bg-canvas flex-col justify-between p-12 border-r border-hairline-soft">
        <div>
          <div className="flex items-center gap-3 text-body-strong mb-12">
            <Truck className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">TransitOps</span>
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
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-body-strong mb-2">Sign In to your account</h2>
            <p className="text-muted">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-body-strong" htmlFor="email">
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
                  <label className="text-sm font-medium text-body-strong" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-sm text-primary hover:underline">
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
