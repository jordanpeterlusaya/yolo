import fs from "fs/promises";
import path from "path";
import { Property, PropertyFilters, PropertyFormData } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "properties.json");

async function readProperties(): Promise<Property[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data) as Property[];
  } catch {
    return [];
  }
}

async function writeProperties(properties: Property[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(properties, null, 2));
}

export async function getAllProperties(): Promise<Property[]> {
  return readProperties();
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  const properties = await readProperties();
  return properties.find((p) => p.id === id);
}

export async function getFeaturedProperties(): Promise<Property[]> {
  const properties = await readProperties();
  return properties.filter((p) => p.featured);
}

export async function filterProperties(filters: PropertyFilters): Promise<Property[]> {
  let properties = await readProperties();

  if (filters.query) {
    const q = filters.query.toLowerCase();
    properties = properties.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }

  if (filters.propertyType && filters.propertyType !== "all") {
    properties = properties.filter((p) => p.propertyType === filters.propertyType);
  }

  if (filters.listingType && filters.listingType !== "all") {
    properties = properties.filter((p) => p.listingType === filters.listingType);
  }

  if (filters.city) {
    properties = properties.filter((p) =>
      p.city.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }

  if (filters.minPrice !== undefined) {
    properties = properties.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    properties = properties.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
    properties = properties.filter((p) => p.bedrooms >= filters.bedrooms!);
  }

  if (filters.featured) {
    properties = properties.filter((p) => p.featured);
  }

  return properties.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createProperty(data: PropertyFormData): Promise<Property> {
  const properties = await readProperties();
  const now = new Date().toISOString();
  const newProperty: Property = {
    ...data,
    id: String(Date.now()),
    createdAt: now,
    updatedAt: now,
  };
  properties.push(newProperty);
  await writeProperties(properties);
  return newProperty;
}

export async function updateProperty(
  id: string,
  data: Partial<PropertyFormData>
): Promise<Property | null> {
  const properties = await readProperties();
  const index = properties.findIndex((p) => p.id === id);
  if (index === -1) return null;

  properties[index] = {
    ...properties[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await writeProperties(properties);
  return properties[index];
}

export async function deleteProperty(id: string): Promise<boolean> {
  const properties = await readProperties();
  const filtered = properties.filter((p) => p.id !== id);
  if (filtered.length === properties.length) return false;
  await writeProperties(filtered);
  return true;
}
