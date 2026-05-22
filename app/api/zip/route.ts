import { NextRequest, NextResponse } from "next/server";

type ZipPlace = {
  "place name": string;
  "state abbreviation": string;
  latitude: string;
  longitude: string;
};

export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get("zip")?.replace(/\D/g, "").slice(0, 5);

  if (!zip || zip.length !== 5) {
    return NextResponse.json({ error: "Valid ZIP required" }, { status: 400 });
  }

  const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
    next: { revalidate: 60 * 60 * 24 * 30 }
  });

  if (!response.ok) {
    return NextResponse.json({ error: "ZIP not found" }, { status: 404 });
  }

  const payload = await response.json();
  const place = payload.places?.[0] as ZipPlace | undefined;

  if (!place) {
    return NextResponse.json({ error: "ZIP not found" }, { status: 404 });
  }

  return NextResponse.json({
    zip,
    city: place["place name"],
    state: place["state abbreviation"],
    lat: Number(place.latitude),
    lng: Number(place.longitude)
  });
}
