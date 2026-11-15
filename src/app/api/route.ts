import { NextRequest, NextResponse } from "next/server";

// Replace this with your actual API key from AgroMonitoring
const API_KEY = "b9e2b0c179d433ef94b48a04d116d9d8";

// Define types for our request body and polygon data
interface RequestBody {
  coordinates: [number, number][];
  allowDuplicates?: boolean;
}

interface PolygonData {
  name: string;
  geo_json: {
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: {
      type: "Polygon";
      coordinates: [number, number][][];
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { coordinates, allowDuplicates }: RequestBody = await request.json();

    // Validate the coordinates input (should be an array of 4 coordinates)
    if (!coordinates || coordinates.length !== 4) {
      return NextResponse.json(
        { error: "You must provide exactly 4 coordinates" },
        { status: 400 }
      );
    }

    // Ensure the polygon is closed by repeating the first coordinate at the end
    const closedCoordinates = [...coordinates, coordinates[0]];

    // Create the payload for the polygon API request
    const polygonData: PolygonData = {
      name: "Test Polygon",
      geo_json: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [closedCoordinates],
        },
      },
    };

    // Define the AgroMonitoring API URL and add duplicated flag if necessary
    let url = `http://api.agromonitoring.com/agro/1.0/polygons?appid=${API_KEY}`;

    if (allowDuplicates) {
      url += "&duplicated=true";
    }

    // Make the API request to AgroMonitoring to create the polygon
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(polygonData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle the API response and send data back to the client
    return NextResponse.json(
      { message: "Polygon created successfully!", data },
      { status: 201 }
    );
  } catch (error) {
    // Handle any errors that occur during the request
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
