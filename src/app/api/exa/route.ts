import Exa from "exa-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Ensure the API key is available
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      console.error("EXA_API_KEY is not set in environment variables.");
      return NextResponse.json(
        { error: "API key not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is missing." },
        { status: 400 }
      );
    }

    const exa = new Exa(apiKey);

    const options = {
      text: true,
      category: "linkedin profile",
      numResults: 5,
      // highlights: true,
    };

    console.log(`Searching Exa with query: "${query}" and options:`, options);

    const result = await exa.searchAndContents(query, options);

    console.log("Exa API Response:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calling Exa API:", error);
    let errorMessage = "Failed to fetch data from Exa API.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// You can add other handlers like POST if needed, for example:
// export async function POST(request: Request) {
//   const body = await request.json();
//   // Process POST request
//   return NextResponse.json({ message: "POST request received", data: body });
// } 