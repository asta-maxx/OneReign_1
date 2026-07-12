"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, User, Truck, CheckCircle2, AlertTriangle, Route } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DispatchPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b border-hairline-soft pb-6">
        <div className="p-2 border border-hairline-soft rounded-md bg-canvas">
          <Route className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip Dispatcher</h1>
          <p className="text-muted-foreground mt-1">
            Assign vehicles and drivers to new routes.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Stepper and Form */}
        <div className="flex-1 space-y-8">
          {/* Stepper */}
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-hairline-soft -z-10" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px bg-primary -z-10 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
            
            <div className="flex flex-col items-center gap-2 bg-canvas px-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors", step >= 1 ? "bg-primary text-primary-foreground" : "bg-surface-card text-muted-foreground border border-hairline-soft")}>1</div>
              <span className={cn("text-xs font-medium", step >= 1 ? "text-primary" : "text-muted-foreground")}>Route</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-canvas px-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors", step >= 2 ? "bg-primary text-primary-foreground" : "bg-surface-card text-muted-foreground border border-hairline-soft")}>2</div>
              <span className={cn("text-xs font-medium", step >= 2 ? "text-primary" : "text-muted-foreground")}>Assignment</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-canvas px-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors", step >= 3 ? "bg-primary text-primary-foreground" : "bg-surface-card text-muted-foreground border border-hairline-soft")}>3</div>
              <span className={cn("text-xs font-medium", step >= 3 ? "text-primary" : "text-muted-foreground")}>Review</span>
            </div>
          </div>

          <Card className="shadow-none border-hairline-soft bg-surface-card">
            <CardContent className="p-6">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-body-strong">Origin</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Enter pickup location" className="pl-10 h-11" defaultValue="Los Angeles, CA" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-body-strong">Destination</label>
                      <div className="relative">
                        <Navigation className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Enter dropoff location" className="pl-10 h-11" defaultValue="San Francisco, CA" />
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-11" onClick={() => setStep(2)}>Continue to Assignment</Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-body-strong">Vehicle</label>
                      <Select defaultValue="v101">
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select Vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="v101">V-101 (Sprinter Van) - Available</SelectItem>
                          <SelectItem value="v104">V-104 (Sprinter Van) - Available</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-body-strong">Driver</label>
                      <Select defaultValue="d001">
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select Driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="d001">John Doe (Rating: 4.8)</SelectItem>
                          <SelectItem value="d004">Emily Davis (Rating: 5.0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="p-4 bg-semantic-warning/10 border border-semantic-warning/20 rounded-md flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-semantic-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-semantic-warning">Driver nearing HOS limits</p>
                        <p className="text-xs text-semantic-warning/80 mt-1">
                          John Doe has 4 hours remaining on Hours of Service today. Ensure trip completes within limit.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="w-full h-11" onClick={() => setStep(1)}>Back</Button>
                    <Button className="w-full h-11" onClick={() => setStep(3)}>Review Trip</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-4 rounded-lg bg-canvas p-4 border border-hairline-soft">
                    <div className="flex justify-between items-center pb-4 border-b border-hairline-soft">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Los Angeles, CA</span>
                      </div>
                      <div className="w-8 h-px bg-hairline-soft"></div>
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">San Francisco, CA</span>
                      </div>
                    </div>
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">V-101 (Sprinter Van)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">John Doe</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="w-full h-11" onClick={() => setStep(2)}>Back</Button>
                    <Button 
                      className="w-full h-11 bg-semantic-success hover:bg-semantic-success/90 text-white" 
                      onClick={() => {
                        setIsSubmitting(true);
                        setTimeout(() => {
                          setIsSubmitting(false);
                          setStep(1);
                        }, 1500);
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Dispatching..." : "Confirm Dispatch"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Info Panel */}
        <div className="w-full md:w-80 space-y-6">
          <Card className="shadow-none border-hairline-soft bg-canvas">
            <CardHeader>
              <CardTitle className="text-lg">Dispatch Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Verify driver HOS before assignment.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Ensure vehicle maintenance is up to date.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Confirm load capacity matches vehicle class.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
