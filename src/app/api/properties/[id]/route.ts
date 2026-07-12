import { NextRequest, NextResponse } from "next/server";
import { getPropertyById, updateProperty, deleteProperty } from "@/lib/properties";
import { isAdminAuthenticated } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  return NextResponse.json(property);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const property = await updateProperty(id, body);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteProperty(id);
  if (!deleted) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
