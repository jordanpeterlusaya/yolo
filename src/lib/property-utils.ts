export function formatPrice(price: number, listingType: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
  return listingType === "rent" ? `${formatted}/mo` : formatted;
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    house: "House",
    apartment: "Apartment",
    room: "Room",
    land: "Land",
    commercial: "Commercial",
  };
  return labels[type] || type;
}

export function getListingTypeLabel(type: string): string {
  return type === "rent" ? "For Rent" : "For Sale";
}
