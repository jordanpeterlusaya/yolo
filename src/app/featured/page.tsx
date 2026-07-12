import PropertyCard from "@/components/PropertyCard";
import { getFeaturedProperties } from "@/lib/properties";

export const metadata = {
  title: "Featured Properties",
  description: "Explore our hand-picked premium property listings.",
};

export default async function FeaturedPage() {
  const properties = await getFeaturedProperties();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <h1 className="text-3xl lg:text-4xl font-bold">Featured Properties</h1>
          <p className="text-brand-100 mt-3 max-w-2xl">
            Discover our curated selection of premium properties, hand-picked for their exceptional value and quality.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">No featured properties at the moment. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
