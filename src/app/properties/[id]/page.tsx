import { notFound } from "next/navigation";
import Link from "next/link";
import ImageGallery from "@/components/ImageGallery";
import WhatsAppButton from "@/components/WhatsAppButton";
import { formatPrice, getPropertyTypeLabel, getListingTypeLabel } from "@/lib/property-utils";
import { getPropertyById } from "@/lib/properties";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) return { title: "Property Not Found" };
  return {
    title: property.title,
    description: property.description.slice(0, 160),
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span>/</span>
            <Link href="/properties" className="hover:text-brand-600">Properties</Link>
            <span>/</span>
            <span className="text-gray-900 truncate">{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <ImageGallery images={property.images} title={property.title} />

            <div className="mt-8 bg-white rounded-2xl p-6 lg:p-8 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            <div className="mt-6 bg-white rounded-2xl p-6 lg:p-8 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Type", value: getPropertyTypeLabel(property.propertyType) },
                  { label: "Listing", value: getListingTypeLabel(property.listingType) },
                  { label: "City", value: property.city },
                  ...(property.bedrooms > 0 ? [{ label: "Bedrooms", value: String(property.bedrooms) }] : []),
                  ...(property.bathrooms > 0 ? [{ label: "Bathrooms", value: String(property.bathrooms) }] : []),
                  ...(property.area > 0 ? [{ label: "Area", value: `${property.area.toLocaleString()} sqft` }] : []),
                ].map((detail) => (
                  <div key={detail.label} className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500">{detail.label}</div>
                    <div className="font-semibold text-gray-900 mt-1">{detail.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-brand-50 text-brand-600 text-xs font-semibold rounded-full">
                    {getListingTypeLabel(property.listingType)}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                    {getPropertyTypeLabel(property.propertyType)}
                  </span>
                  {property.featured && (
                    <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">
                      Featured
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>

                <p className="text-gray-500 mt-2 flex items-start gap-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {property.location}
                </p>

                <div className="text-3xl font-bold text-brand-600 mt-6">
                  {formatPrice(property.price, property.listingType)}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <WhatsAppButton
                    phone={property.contactPhone}
                    propertyTitle={property.title}
                    className="w-full"
                  />
                  <a
                    href={`tel:${property.contactPhone}`}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Agent
                  </a>
                  <a
                    href={`mailto:${property.contactEmail}?subject=Inquiry: ${property.title}`}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Agent</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-600 font-bold text-lg">
                      {property.contactName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{property.contactName}</div>
                    <div className="text-sm text-gray-500">{property.contactPhone}</div>
                    <div className="text-sm text-gray-500">{property.contactEmail}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
