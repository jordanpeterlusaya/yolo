import Link from "next/link";
import HeroSearch from "@/components/HeroSearch";
import PropertyCard from "@/components/PropertyCard";
import { getFeaturedProperties, getAllProperties } from "@/lib/properties";

export default async function HomePage() {
  const [featured, allProperties] = await Promise.all([
    getFeaturedProperties(),
    getAllProperties(),
  ]);

  const stats = [
    { label: "Properties Listed", value: `${allProperties.length}+` },
    { label: "Cities Covered", value: `${new Set(allProperties.map((p) => p.city)).size}+` },
    { label: "Happy Clients", value: "500+" },
    { label: "Years Experience", value: "10+" },
  ];

  const categories = [
    { type: "house", label: "Houses", icon: "🏠", count: allProperties.filter((p) => p.propertyType === "house").length },
    { type: "apartment", label: "Apartments", icon: "🏢", count: allProperties.filter((p) => p.propertyType === "apartment").length },
    { type: "room", label: "Rooms", icon: "🛏️", count: allProperties.filter((p) => p.propertyType === "room").length },
    { type: "land", label: "Land", icon: "🌳", count: allProperties.filter((p) => p.propertyType === "land").length },
    { type: "commercial", label: "Commercial", icon: "🏪", count: allProperties.filter((p) => p.propertyType === "commercial").length },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Find Your Perfect
              <span className="block text-brand-100">Property Today</span>
            </h1>
            <p className="text-lg sm:text-xl text-brand-100 leading-relaxed">
              Discover exceptional homes, apartments, and commercial spaces.
              YOLO Real Estate connects you with properties you&apos;ll love.
            </p>
          </div>
          <HeroSearch />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-brand-500">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Browse by Category</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              Whether you&apos;re looking to rent or buy, we have the perfect property type for you.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.type}
                href={`/properties?type=${cat.type}`}
                className="group bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-brand-300 hover:shadow-lg transition-all"
              >
                <span className="text-4xl block mb-3">{cat.icon}</span>
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{cat.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{cat.count} listings</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Featured Properties</h2>
              <p className="text-gray-500 mt-3">Hand-picked premium listings just for you.</p>
            </div>
            <Link
              href="/featured"
              className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              View All Featured
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featured.slice(0, 6).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to List Your Property?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Reach thousands of potential buyers and renters. List your property with YOLO Real Estate today and get maximum exposure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/list-property"
              className="px-8 py-3.5 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
            >
              List Your Property
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3.5 border border-gray-600 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
