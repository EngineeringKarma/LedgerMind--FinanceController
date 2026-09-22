"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ThemeSelector from "@/components/ThemeSelector";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [apiKey, setApiKey] = useState("sk-••••••••••••••••••••••••");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [anomalyNotifications, setAnomalyNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRegenerateKey = () => {
    setApiKey("sk-" + Math.random().toString(36).substring(2, 26));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight font-display">Settings</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage your account preferences and configuration
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="glass-card glass-card-hover p-6">
            <h2 className="settings-section-title">Profile</h2>
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-border flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-hover transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-hover transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="glass-card glass-card-hover p-6">
            <h2 className="settings-section-title">Appearance</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Theme</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Choose Light or Dark mode
                </p>
              </div>
              <ThemeSelector variant="cards" />
            </div>
          </div>

          {/* API Keys Section */}
          <div className="glass-card glass-card-hover p-6">
            <h2 className="settings-section-title">API Keys</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  LLM Provider Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-bg-base border border-border rounded-lg text-text-primary text-sm font-mono"
                  />
                  <button
                    onClick={handleRegenerateKey}
                    className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-surface-hover transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="text-xs text-text-dim mt-1.5">
                  Used for AI-powered transaction categorization
                </p>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="glass-card glass-card-hover p-6">
            <h2 className="settings-section-title">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Email Alerts</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Receive email notifications for important updates
                  </p>
                </div>
                <button
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`toggle-switch ${emailAlerts ? "active" : ""}`}
                  aria-label="Toggle email alerts"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Anomaly Notifications</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Get notified when suspicious transactions are detected
                  </p>
                </div>
                <button
                  onClick={() => setAnomalyNotifications(!anomalyNotifications)}
                  className={`toggle-switch ${anomalyNotifications ? "active" : ""}`}
                  aria-label="Toggle anomaly notifications"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
            {saved && (
              <span className="text-sm text-state-verified">Settings saved!</span>
            )}
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}