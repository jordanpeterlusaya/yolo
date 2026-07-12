import Link from "next/link";
import Image from "next/image";
import { Property } from "@/lib/types";
import { formatPrice, getPropertyTypeLabel, getListingTypeLabel } from "@/lib/property-utils";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full">
            {getListingTypeLabel(property.listingType)}
          </span>
          {property.featured && (
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
              Featured
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-brand-600 text-sm font-bold rounded-lg shadow-sm">
            {formatPrice(property.price, property.listingType)}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">
            {getPropertyTypeLabel(property.propertyType)}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">{property.city}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">
          {property.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="line-clamp-1">{property.location}</span>
        </p>

        {(property.bedrooms > 0 || property.bathrooms > 0 || property.area > 0) && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                </svg>
                {property.bedrooms} bed
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                {property.bathrooms} bath
              </span>
            )}
            {property.area > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {property.area.toLocaleString()} sqft
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
