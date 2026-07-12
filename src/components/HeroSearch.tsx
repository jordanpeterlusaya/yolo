"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [listingType, setListingType] = useState("all");
  const [propertyType, setPropertyType] = useState("all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (listingType !== "all") params.set("listing", listingType);
    if (propertyType !== "all") params.set("type", propertyType);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
      <div className="flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by location, city, or keyword..."
          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none rounded-xl text-sm"
        />
      </div>
      <select
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
        className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="all">All Types</option>
        <option value="house">House</option>
        <option value="apartment">Apartment</option>
        <option value="room">Room</option>
        <option value="land">Land</option>
        <option value="commercial">Commercial</option>
      </select>
      <select
        value={listingType}
        onChange={(e) => setListingType(e.target.value)}
        className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="all">Rent & Sale</option>
        <option value="rent">For Rent</option>
        <option value="sale">For Sale</option>
      </select>
      <button
        type="submit"
        className="px-8 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25 whitespace-nowrap"
      >
        Search
      </button>
    </form>
  );
}
