"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Property, PropertyType, ListingType } from "@/lib/types";
import { formatPrice, getPropertyTypeLabel, getListingTypeLabel } from "@/lib/property-utils";

interface AdminDashboardProps {
  initialProperties: Property[];
}

const emptyForm = {
  title: "",
  description: "",
  price: 0,
  listingType: "sale" as ListingType,
  propertyType: "house" as PropertyType,
  location: "",
  city: "",
  bedrooms: 0,
  bathrooms: 0,
  area: 0,
  images: "",
  featured: false,
  contactName: "",
  contactPhone: "",
  contactEmail: "",
};

export default function AdminDashboard({ initialProperties }: AdminDashboardProps) {
  const router = useRouter();
  const [properties, setProperties] = useState(initialProperties);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (property: Property) => {
    setEditingId(property.id);
    setForm({
      title: property.title,
      description: property.description,
      price: property.price,
      listingType: property.listingType,
      propertyType: property.propertyType,
      location: property.location,
      city: property.city,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      images: property.images.join("\n"),
      featured: property.featured,
      contactName: property.contactName,
      contactPhone: property.contactPhone,
      contactEmail: property.contactEmail,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const images = form.images
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"],
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/properties/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setProperties((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        }
      } else {
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setProperties((prev) => [created, ...prev]);
        }
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-brand-600">View Site</Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Properties</h2>
            <p className="text-sm text-gray-500">{properties.length} total listings</p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors"
          >
            + Add Property
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl my-8 p-6 lg:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {editingId ? "Edit Property" : "Add New Property"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className={`${inputClass} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value as PropertyType })} className={inputClass}>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="room">Room</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Listing</label>
                    <select value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value as ListingType })} className={inputClass}>
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required min="0" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                    <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} min="0" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                    <input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} min="0" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqft)</label>
                    <input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: Number(e.target.value) })} min="0" className={inputClass} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured</label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs (one per line)</label>
                    <textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} required className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required className={inputClass} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50">
                    {loading ? "Saving..." : editingId ? "Update" : "Create"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Property</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">City</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Featured</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 line-clamp-1">{property.title}</div>
                      <div className="text-xs text-gray-500 sm:hidden">{getPropertyTypeLabel(property.propertyType)}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">
                      {getPropertyTypeLabel(property.propertyType)} · {getListingTypeLabel(property.listingType)}
                    </td>
                    <td className="px-6 py-4 font-medium text-brand-600">
                      {formatPrice(property.price, property.listingType)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{property.city}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {property.featured ? (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/properties/${property.id}`} className="text-gray-400 hover:text-brand-600" title="View">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </Link>
                        <button onClick={() => openEdit(property)} className="text-gray-400 hover:text-brand-600" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(property.id)} className="text-gray-400 hover:text-red-600" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
