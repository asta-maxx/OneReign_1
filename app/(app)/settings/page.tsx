"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "profile" | "system" | "rbac";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("rbac");

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "system", label: "System Preferences", icon: Settings },
    { id: "rbac", label: "Roles & Access", icon: Shield }
  ];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings & RBAC</h1>
        <p className="text-muted-foreground mt-1">
          Manage system configurations and user access controls.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all text-left",
                  activeTab === tab.id 
                    ? "bg-surface-elevated text-primary shadow-sm border border-hairline-soft" 
                    : "text-muted-foreground hover:bg-canvas-deep hover:text-body-strong"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "rbac" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <Card className="shadow-none border-hairline-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Invite User</CardTitle>
                </CardHeader>
                <CardContent>
                  <form 
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
                      if (emailInput && emailInput.value) {
                        toast.success(`Invite sent successfully to ${emailInput.value}`);
                        form.reset();
                      } else {
                        toast.error("Please enter a valid email address.");
                      }
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input type="email" placeholder="user@transitops.com" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Select defaultValue="dispatcher">
                          <SelectTrigger>
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="dispatcher">Dispatcher</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit">Send Invite</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="shadow-none border-hairline-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Active Users</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-hairline-soft">
                    <div className="flex items-center justify-between p-4 hover:bg-surface-elevated/50 transition-colors">
                      <div>
                        <p className="font-medium">Alice Admin</p>
                        <p className="text-xs text-muted">alice@transitops.com</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">Administrator</span>
                        <Button variant="ghost" size="sm" className="text-muted hover:text-destructive">Revoke</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-surface-elevated/50 transition-colors">
                      <div>
                        <p className="font-medium">Bob Dispatcher</p>
                        <p className="text-xs text-muted">bob@transitops.com</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs px-2 py-1 bg-surface-elevated text-muted rounded-md font-medium">Dispatcher</span>
                        <Button variant="ghost" size="sm" className="text-muted hover:text-destructive">Revoke</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <Card className="shadow-none border-hairline-soft">
                <CardHeader>
                  <CardTitle className="text-lg">My Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input defaultValue="System Admin" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input defaultValue="admin@transitops.com" disabled />
                    </div>
                    <Button>Save Changes</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <Card className="shadow-none border-hairline-soft">
                <CardHeader>
                  <CardTitle className="text-lg">System Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <Select defaultValue="utc">
                        <SelectTrigger>
                          <SelectValue placeholder="Select Timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">UTC</SelectItem>
                          <SelectItem value="est">Eastern Time (ET)</SelectItem>
                          <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Currency Formatting</label>
                      <Select defaultValue="usd">
                        <SelectTrigger>
                          <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button>Save Preferences</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
