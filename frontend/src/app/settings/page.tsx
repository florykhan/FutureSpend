"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [name, setName] = useState("Alex Demo");
  const [email, setEmail] = useState("alex@example.com");
  const [monthlyBudget, setMonthlyBudget] = useState("1000");
  const [alertsBeforeEvents, setAlertsBeforeEvents] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);

  return (
    <PageShell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">Profile and preferences</p>
        </div>

        <div className="max-w-xl space-y-6">
          <Card>
            <CardHeader>Profile</CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-slate-700">
                  Monthly budget (CAD)
                </label>
                <input
                  id="budget"
                  type="number"
                  min="0"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>Notifications</CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm text-slate-700">Alerts before high-spend events</span>
                <input
                  type="checkbox"
                  checked={alertsBeforeEvents}
                  onChange={(e) => setAlertsBeforeEvents(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm text-slate-700">Weekly summary email</span>
                <input
                  type="checkbox"
                  checked={weeklySummary}
                  onChange={(e) => setWeeklySummary(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>Privacy</CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Your calendar and transaction data are used only to generate your spending forecast
                and insights. We do not sell your data. You can disconnect calendars and delete
                uploaded data at any time from this page. For the demo, all data is stored locally
                and not sent to any server.
              </p>
            </CardContent>
          </Card>

          <Button onClick={() => {}}>Save changes (mock)</Button>
        </div>
      </div>
    </PageShell>
  );
}
