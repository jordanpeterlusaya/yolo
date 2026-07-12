export type PropertyType = "house" | "apartment" | "room" | "land" | "commercial";
export type ListingType = "rent" | "sale";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  propertyType: PropertyType;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  featured: boolean;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilters {
  query?: string;
  propertyType?: PropertyType | "all";
  listingType?: ListingType | "all";
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  featured?: boolean;
}

export interface PropertyFormData {
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  propertyType: PropertyType;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  featured: boolean;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}
