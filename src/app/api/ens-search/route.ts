import { NextRequest, NextResponse } from "next/server";

// ENS Subgraph endpoint (The Graph - decentralized)
const ENS_SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/ensdomains/ens";

// Backup: ENS public subgraph
const ENS_SUBGRAPH_BACKUP =
  "https://gateway.thegraph.com/api/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH";

interface SubgraphDomain {
  id: string;
  name: string;
  labelName: string | null;
  owner: { id: string };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json([]);
  }

  // Clean the search query - remove .eth if typed
  const searchTerm = query.toLowerCase().replace(/\.eth$/, "");

  try {
    // Query ENS Subgraph for matching names
    // We search for names that start with the query
    const graphqlQuery = `
      query SearchENS($search: String!) {
        domains(
          first: 10
          where: { 
            name_starts_with: $search
            name_ends_with: ".eth"
          }
          orderBy: name
          orderDirection: asc
        ) {
          id
          name
          labelName
          owner {
            id
          }
        }
      }
    `;

    const response = await fetch(ENS_SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { search: searchTerm },
      }),
    });

    if (!response.ok) {
      throw new Error("Subgraph request failed");
    }

    const data = await response.json();

    if (data.errors) {
      console.error("Subgraph errors:", data.errors);
      throw new Error("Subgraph query error");
    }

    const domains: SubgraphDomain[] = data.data?.domains || [];

    // Format response with relevant info
    const results = domains.map((domain) => ({
      name: domain.name,
      label: domain.labelName || domain.name.replace(".eth", ""),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("ENS search error:", error);
    
    // Return empty array on error (graceful degradation)
    return NextResponse.json([]);
  }
}
