"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight, Plus, Trash2, Edit2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({});

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/account/addresses");
      return;
    }

    if (user) {
      fetchAddresses();
    }
  }, [user, isLoading, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/addresses`, {
        credentials: "include",
      });
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...formData } : formData;

      await fetch(`${API_URL}/api/user/addresses`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      fetchAddresses();
      setShowForm(false);
      setEditingId(null);
      setFormData({});
    } catch (error) {
      console.error("Failed to save address:", error);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await fetch(`${API_URL}/api/user/addresses?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete address:", error);
    }
  };

  const editAddress = (address: Address) => {
    setFormData(address);
    setEditingId(address.id);
    setShowForm(true);
  };

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/account" className="hover:text-primary">
            Account
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>Addresses</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Addresses</h1>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({}); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">
              {editingId ? "Edit Address" : "New Address"}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={formData.firstName || ""}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName || ""}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
              <Input
                placeholder="Phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                placeholder="Postal Code"
                value={formData.postalCode || ""}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                required
              />
              <Input
                placeholder="Address Line 1"
                value={formData.addressLine1 || ""}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="md:col-span-2"
                required
              />
              <Input
                placeholder="Address Line 2 (optional)"
                value={formData.addressLine2 || ""}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="md:col-span-2"
              />
              <Input
                placeholder="City"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
              <Input
                placeholder="State"
                value={formData.state || ""}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault || false}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              />
              <label htmlFor="isDefault">Set as default address</label>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit">{editingId ? "Update" : "Save"} Address</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {addresses.length === 0 && !showForm ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No addresses saved</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    {address.isDefault && (
                      <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded mb-2">
                        Default
                      </span>
                    )}
                    <p className="font-medium">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-muted-foreground text-sm">{address.phone}</p>
                    <p className="text-sm mt-2">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => editAddress(address)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteAddress(address.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
