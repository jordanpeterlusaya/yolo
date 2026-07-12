import { Suspense } from "react";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import { filterProperties } from "@/lib/properties";
import { PropertyType, ListingType } from "@/lib/types";

export const metadata = {
  title: "Browse Properties",
  description: "Search and filter houses, apartments, rooms, land, and commercial properties for rent or sale.",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    listing?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const properties = await filterProperties({
    query: params.q,
    propertyType: (params.type as PropertyType) || "all",
    listingType: (params.listing as ListingType) || "all",
    city: params.city,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    bedrooms: params.bedrooms ? Number(params.bedrooms) : undefined,
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Browse Properties</h1>
          <p className="text-gray-500 mt-2">
            {properties.length} {properties.length === 1 ? "property" : "properties"} found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 shrink-0">
            <Suspense fallback={<div className="h-96 bg-white rounded-2xl animate-pulse" />}>
              <PropertyFilters />
            </Suspense>
          </aside>

          <div className="flex-1">
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
