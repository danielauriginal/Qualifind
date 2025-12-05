import { GoogleGenAI, Type } from "@google/genai";
import { Lead, CallAnalysis } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper to robustly parse JSON from LLM output, handling markdown fences and common errors.
 */
const cleanAndParseJSON = (text: string) => {
  if (!text) return null;
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt to extract JSON object or array from the text using regex
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch (e2) {}
    }
    
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e2) {}
    }
    
    console.warn("Failed to parse JSON from response:", text.substring(0, 100) + "...");
    return null;
  }
};

/**
 * Uses the Google Maps tool to find businesses matching the criteria.
 * Supports excluding existing names to find "more" results.
 */
export const searchBusinesses = async (
  industry: string,
  location: string,
  limit: number = 5,
  excludeNames: string[] = []
): Promise<Partial<Lead>[]> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash"; 

  // Truncate exclude list if it's too long to prevent context window issues, 
  // keeping the most recent ones which are likely to be top of list duplicates.
  const recentExclusions = excludeNames.slice(0, 50).join(", ");
  
  const exclusionPrompt = recentExclusions.length > 0 
    ? `Do NOT include the following businesses in the result: ${recentExclusions}.` 
    : "";

  const prompt = `Find at least ${limit} unique ${industry} businesses in or near ${location}.
  ${exclusionPrompt}
  For each business, you MUST provide:
  1. Name
  2. Address
  3. Website URL (Crucial: Hunt for the official website. If not found, leave null).
  4. Phone Number
  5. Rating
  6. Review Count
  
  IMPORTANT: Return the result as a raw JSON array of objects with the following keys:
  - name (string)
  - address (string)
  - website (string or null)
  - phone (string or null)
  - rating (number)
  - reviewCount (number)
  
  Do not include any markdown formatting (like \`\`\`json). Just return the raw JSON string.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              // Defaulting to a central location if we don't have user geo.
              latitude: 40.7128, 
              longitude: -74.0060 
            }
          }
        },
      },
    });

    const parsed = cleanAndParseJSON(response.text || "[]");
    
    if (!parsed || !Array.isArray(parsed)) {
      return [];
    }
    
    // Map response to our Lead structure
    return parsed.map((item: any) => ({
      name: item.name,
      address: item.address,
      website: item.website || null,
      phone: item.phone || null,
      rating: item.rating,
      reviewCount: item.reviewCount,
      sourceUrl: null, // We'll let the UI generate a Maps search link
    }));
  } catch (error) {
    console.error("Error searching businesses:", error);
    return [];
  }
};

/**
 * "Imprint Scraper" Module
 * Uses Google Search grounding to "enrich" the lead with CEO, Email, and Company Description.
 */
export const enrichLeadData = async (lead: Partial<Lead>): Promise<Partial<Lead>> => {
  const ai = getClient();
  const modelId = "gemini-3-pro-preview"; 

  let prompt = "";
  
  if (lead.website) {
    prompt = `
      You are an expert Data Scraper and Researcher.
      
      TARGET:
      Business: "${lead.name}"
      Website: ${lead.website}
      
      INSTRUCTIONS:
      1. Search specifically for the "Imprint", "Impressum", "Legal Notice", "Contact", "About Us", or "Team" pages OF THE WEBSITE ${lead.website}.
      
      2. EXTRACT CEO / OWNER:
         - Find the full name of the CEO, Owner, Managing Director, or Founder.
         
      3. EXTRACT & VALIDATE EMAIL:
         - Look for a valid contact email address.
         - Check footer, contact forms, and legal text.
         - PRIORITIZE specific emails like "ceo@...", "hello@...", "info@...".
         - If found directly on the page, status is "Validated".
         - If you infer an email (e.g. based on name patterns), status is "Guessed".
         
      4. EXTRACT COMPANY DESCRIPTION:
         - Write a brief 1-sentence description of what this company primarily sells or does.
      
      OUTPUT FORMAT:
      Return ONLY a raw JSON object with these keys: 
      - "ceo" (string | null)
      - "email" (string | null)
      - "emailStatus" ("Validated" | "Guessed" | null)
      - "companyDescription" (string | null)
      
      Do not use markdown.
    `;
  } else {
    // FALLBACK: General Discovery (Lead has no website yet)
    prompt = `
      Research the business "${lead.name}" located at "${lead.address}".
      
      Find the following information from public web sources:
      1. Official Website URL (Very Important: Try to find the company's homepage).
      2. CEO / Owner Name.
      3. Generic contact email (e.g. info@).
      4. A 1-sentence description of what the company does.
      
      OUTPUT FORMAT:
      Return ONLY a raw JSON object with keys: 
      - "website" (string | null)
      - "ceo" (string | null)
      - "email" (string | null)
      - "emailStatus" ("Validated" | "Guessed" | null)
      - "companyDescription" (string | null)
      
      If email is found on a verified listing, set emailStatus to "Validated".
      Do not use markdown formatting.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType/Schema not supported with googleSearch
      }
    });

    const data = cleanAndParseJSON(response.text || "{}") || {};
    
    // Extract grounding source URLs
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let foundSourceUrl = null;

    if (chunks && chunks.length > 0) {
      // Prioritize chunks that might contain "imprint", "contact", "about" or "team" in the title or uri
      const bestChunk = chunks.find((c: any) => {
        const url = (c.web?.uri || "").toLowerCase();
        const title = (c.web?.title || "").toLowerCase();
        return url.includes("imprint") || url.includes("impressum") || url.includes("contact") || title.includes("team");
      });

      if (bestChunk && bestChunk.web?.uri) {
        foundSourceUrl = bestChunk.web.uri;
      } else if (chunks[0].web?.uri) {
        foundSourceUrl = chunks[0].web.uri;
      }
    }

    // Simple validation
    const email = data.email && data.email.includes('@') ? data.email.toLowerCase().trim() : null;

    return {
      ...lead,
      // If we didn't have a website before, use the one found in JSON.
      website: lead.website || data.website || null,
      ceo: data.ceo || lead.ceo,
      email: email || lead.email,
      emailStatus: email ? (data.emailStatus || 'Validated') : lead.emailStatus, // Default to validated if LLM found it but didn't tag it
      companyDescription: data.companyDescription || lead.companyDescription,
      sourceUrl: foundSourceUrl || lead.sourceUrl
    };

  } catch (error) {
    console.warn(`Failed to enrich lead ${lead.name}`, error);
    return lead;
  }
};

/**
 * Generates a cold call script using Gemini based on lead details.
 */
export const generateColdCallScript = async (
  goal: string,
  tone: string = "Professional yet conversational",
  leadContext?: string
): Promise<string> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash";

  const prompt = `
    Write a cold call script for a sales development representative.
    
    GOAL: ${goal}
    TONE: ${tone}
    ${leadContext ? `CONTEXT: ${leadContext}` : ''}
    
    Use variables in double curly braces like {{leadName}}, {{companyName}}, {{category}}, {{ceoName}} where appropriate.
    
    Structure:
    1. Opener (Break the ice)
    2. Value Proposition (Why us?)
    3. Qualifying Question
    4. Call to Action (Meeting/Demo)
    
    Return ONLY the script text. No markdown explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Script generation failed", error);
    return "Hi {{leadName}}, this is {{myName}} calling. Do you have a moment?";
  }
};

/**
 * Simulates an AI analysis of a sales call.
 * In a real app, this would process the audio transcript.
 * Here, we generate plausible metrics based on the outcome and basic lead info.
 */
export const generateCallAnalysis = async (
  outcome: string,
  leadName: string
): Promise<CallAnalysis> => {
  // Simulate network delay for "uploading and processing"
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Base random values
  let baseScore = 50;
  let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';
  let adherence = Math.floor(Math.random() * (98 - 75) + 75); // 75-98%

  if (outcome.includes('Appointment')) {
    baseScore = 95;
    sentiment = 'Positive';
    confidence = 'High';
  } else if (outcome.includes('Interested')) {
    baseScore = 80;
    sentiment = 'Positive';
    confidence = 'High';
  } else if (outcome.includes('No Answer') || outcome.includes('Gatekeeper')) {
    baseScore = 40;
    sentiment = 'Neutral';
    confidence = 'Medium';
    adherence = 100; // Script doesn't matter much if no one answers
  } else if (outcome.includes('Not Interested')) {
    baseScore = 60;
    sentiment = 'Negative';
    confidence = 'Medium';
  }

  // Add some variance
  const score = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 10 - 5)));

  return {
    callScore: score,
    scriptAdherence: adherence,
    confidence,
    sentiment,
    keyTakeaways: [
      "Speaker spoke clearly.",
      outcome.includes('Appointment') ? "Strong closing technique used." : "Objection handling could be improved.",
      "Pacing was appropriate."
    ]
  };
};