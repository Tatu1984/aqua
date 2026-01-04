"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Store, Mail, Truck, CreditCard, Bell } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  group: string;
}

const settingGroups = [
  { id: "general", name: "General", icon: Store },
  { id: "email", name: "Email", icon: Mail },
  { id: "shipping", name: "Shipping", icon: Truck },
  { id: "payment", name: "Payment", icon: CreditCard },
  { id: "notifications", name: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const [activeGroup, setActiveGroup] = useState("general");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      const settingsMap: Record<string, string> = {};
      data.settings?.forEach((s: Setting) => {
        settingsMap[s.key] = s.value;
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your store settings
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-card border border-border rounded-lg p-2 space-y-1">
            {settingGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeGroup === group.id
                    ? "bg-[#00D4FF] text-[#0A1628]"
                    : "hover:bg-secondary"
                }`}
              >
                <group.icon className="h-5 w-5" />
                <span className="font-medium">{group.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-card border border-border rounded-lg p-6">
            {activeGroup === "general" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  General Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Store Name</label>
                    <input
                      type="text"
                      value={settings.store_name || ""}
                      onChange={(e) => updateSetting("store_name", e.target.value)}
                      placeholder="Aqua Store"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Store Description</label>
                    <textarea
                      value={settings.store_description || ""}
                      onChange={(e) => updateSetting("store_description", e.target.value)}
                      placeholder="Premium aquarium products and livestock"
                      rows={3}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <select
                      value={settings.currency || "INR"}
                      onChange={(e) => updateSetting("currency", e.target.value)}
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    >
                      <option value="INR">Indian Rupee (INR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select
                      value={settings.timezone || "Asia/Kolkata"}
                      onChange={(e) => updateSetting("timezone", e.target.value)}
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeGroup === "email" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">From Name</label>
                    <input
                      type="text"
                      value={settings.email_from_name || ""}
                      onChange={(e) => updateSetting("email_from_name", e.target.value)}
                      placeholder="Aqua Store"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">From Email</label>
                    <input
                      type="email"
                      value={settings.email_from_address || ""}
                      onChange={(e) => updateSetting("email_from_address", e.target.value)}
                      placeholder="noreply@aquastore.com"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Email (for notifications)</label>
                    <input
                      type="email"
                      value={settings.admin_email || ""}
                      onChange={(e) => updateSetting("admin_email", e.target.value)}
                      placeholder="admin@aquastore.com"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeGroup === "shipping" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Free Shipping Threshold</label>
                    <input
                      type="number"
                      value={settings.free_shipping_threshold || ""}
                      onChange={(e) => updateSetting("free_shipping_threshold", e.target.value)}
                      placeholder="1000"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Orders above this amount get free shipping
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Default Shipping Rate</label>
                    <input
                      type="number"
                      value={settings.default_shipping_rate || ""}
                      onChange={(e) => updateSetting("default_shipping_rate", e.target.value)}
                      placeholder="99"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeGroup === "payment" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Razorpay Key ID</label>
                    <input
                      type="text"
                      value={settings.razorpay_key_id || ""}
                      onChange={(e) => updateSetting("razorpay_key_id", e.target.value)}
                      placeholder="rzp_test_xxxx"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Razorpay Key Secret</label>
                    <input
                      type="password"
                      value={settings.razorpay_key_secret || ""}
                      onChange={(e) => updateSetting("razorpay_key_secret", e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="cod_enabled"
                      checked={settings.cod_enabled === "true"}
                      onChange={(e) => updateSetting("cod_enabled", e.target.checked ? "true" : "false")}
                      className="w-4 h-4 rounded border-border"
                    />
                    <label htmlFor="cod_enabled" className="text-sm font-medium">
                      Enable Cash on Delivery
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeGroup === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="notify_new_order"
                      checked={settings.notify_new_order === "true"}
                      onChange={(e) => updateSetting("notify_new_order", e.target.checked ? "true" : "false")}
                      className="w-4 h-4 rounded border-border"
                    />
                    <label htmlFor="notify_new_order" className="text-sm font-medium">
                      Email notification for new orders
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="notify_low_stock"
                      checked={settings.notify_low_stock === "true"}
                      onChange={(e) => updateSetting("notify_low_stock", e.target.checked ? "true" : "false")}
                      className="w-4 h-4 rounded border-border"
                    />
                    <label htmlFor="notify_low_stock" className="text-sm font-medium">
                      Email notification for low stock
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="notify_customer_register"
                      checked={settings.notify_customer_register === "true"}
                      onChange={(e) => updateSetting("notify_customer_register", e.target.checked ? "true" : "false")}
                      className="w-4 h-4 rounded border-border"
                    />
                    <label htmlFor="notify_customer_register" className="text-sm font-medium">
                      Email notification for new customer registration
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
