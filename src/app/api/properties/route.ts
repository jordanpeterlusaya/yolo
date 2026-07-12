import { NextRequest, NextResponse } from "next/server";
import { getAllProperties, createProperty, filterProperties } from "@/lib/properties";
import { PropertyType, ListingType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const hasFilters = searchParams.has("q") ||
    searchParams.has("type") ||
    searchParams.has("listing") ||
    searchParams.has("city") ||
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice") ||
    searchParams.has("bedrooms") ||
    searchParams.has("featured");

  if (hasFilters) {
    const properties = await filterProperties({
      query: searchParams.get("q") || undefined,
      propertyType: (searchParams.get("type") as PropertyType) || "all",
      listingType: (searchParams.get("listing") as ListingType) || "all",
      city: searchParams.get("city") || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
      featured: searchParams.get("featured") === "true",
    });
    return NextResponse.json(properties);
  }

  const properties = await getAllProperties();
  return NextResponse.json(properties);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const property = await createProperty(body);
    return NextResponse.json(property, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
