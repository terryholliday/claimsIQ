import { GoogleGenAI, Type, Chat, GenerateContentResponse } from '@google/genai';
import { Asset, AssetStatus, FraudAnalysis, FraudRiskLevel, MarketValueAnalysis, Claim, ImageAnalysis, ReceiptMatch, LKQAnalysis, WeatherAnalysis, DuplicateAnalysis, BundleAnalysis, PolicyCheck, DepreciationAnalysis, CategoryAnalysis, NegotiationScript, SpecialtyAnalysis, SubrogationAnalysis, PaddingAnalysis, StateRegulation, FilingReport, RegulatoryCheck, SettlementReport, LiveFNOLAnalysis, DigitalFieldAdjusterAnalysis, LiveFNOLTranscriptEntry, LiveFNOLIntelligenceCard, ClaimSummary, HomeFastTrackResult, ClaimHealthCheckResult } from '../types';

// --- API Request Helpers with Error Handling & Retries ---

// Helper to safely parse JSON from a string, as API errors might be stringified.
const safeJsonParse = (str: string): any | null => {
    try {
        // Defensive check to avoid parsing non-JSON strings that happen to contain '{'
        if (str.trim().startsWith('{') && str.trim().endsWith('}')) {
            return JSON.parse(str);
        }
    } catch (e) {
        // Ignore parsing errors
    }
    return null;
};

// Robustly checks for Gemini API rate limit errors (429)
const isRateLimitError = (error: any): boolean => {
    if (!error) return false;

    // Case 1: The error object itself might have the structure
    if (error.error && (error.error.code === 429 || error.error.status === 'RESOURCE_EXHAUSTED')) {
        return true;
    }

    // Case 2: The error message is a JSON string
    if (typeof error.message === 'string') {
        const parsedMessage = safeJsonParse(error.message);
        if (parsedMessage?.error && (parsedMessage.error.code === 429 || parsedMessage.error.status === 'RESOURCE_EXHAUSTED')) {
            return true;
        }
    }

    // Case 3: Fallback string matching on the error object itself or its message
    const errorString = error.toString();
    if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        return true;
    }

    return false;
};

// Wrapper for Gemini API calls to handle retries with exponential backoff
const geminiRequestWithRetry = async <T>(
    requestFn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
): Promise<T> => {
    let attempt = 0;
    while (true) {
        try {
            return await requestFn();
        } catch (error) {
            attempt++;
            if (isRateLimitError(error) && attempt < maxRetries) {
                // Add jitter to the delay to avoid thundering herd problem
                const jitter = Math.random() * 500;
                const delay = initialDelay * Math.pow(2, attempt - 1) + jitter;
                console.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Re-throw for other errors or if max retries are reached
                console.error(`Gemini API request failed after ${attempt} attempts.`);
                throw error;
            }
        }
    }
};


const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || 'YOUR_API_KEY_HERE' });

// Helper to strip Markdown code blocks (```json ... ```) from LLM responses
const cleanJsonOutput = (text: string): string => {
    if (!text) return "{}";
    return text.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
};

// --- NEW "WORKFLOW" FEATURE ---
export const generateClaimSummary = async (claim: Claim): Promise<ClaimSummary | null> => {
    const prompt = `
      You are an expert Senior Claims Adjuster AI for a system called TrueManifest. Your task is to provide an immediate, high-level briefing for a human adjuster opening this claim file for the first time.
      
      Analyze the provided claim JSON data. Identify the most critical information and present it as a concise summary.
      
      Claim Data:
      ${JSON.stringify(claim, null, 2)}
      
      Based on the data, provide the following in a JSON object:
      1.  **summary**: A one-sentence summary of the claim (e.g., "Theft claim for high-value electronics from a new policyholder.").
      2.  **redFlags**: An array of strings highlighting the TOP 3-4 most critical risks or anomalies. Examples:
          - "Claim value ($12,500) exceeds coverage limit ($10,000)."
          - "Policy is very new (inception date was 15 days before loss)."
          - "High-value item ('Diamond Necklace') purchased just 2 days before claim date."
          - "Multiple items flagged for high fraud risk by other AI scans."
      3.  **suggestedActions**: An array of objects for the top 2-3 recommended next steps for the adjuster. Each object should have a 'title' (the action) and a 'reasoning'. Examples:
          - title: "Refer to SIU for Investigation", reasoning: "Timeline anomalies and high-value, recently purchased items warrant a full SIU workup."
          - title: "Request Proof of Purchase for High-Value Items", reasoning: "Verify ownership and value for all items over $1,000."
          - title: "Run 'Policy Guardian' Scan", reasoning: "Check for potential exclusions, especially for the 'Vintage Wine Collection'."
    `;

    try {
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestedActions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    reasoning: { type: Type.STRING }
                                },
                                required: ['title', 'reasoning']
                            }
                        }
                    },
                    required: ['summary', 'redFlags', 'suggestedActions']
                }
            }
        }));

        const parsedResponse = JSON.parse(cleanJsonOutput(response.text || '{}')) as ClaimSummary;
        return parsedResponse;

    } catch (error) {
        console.error("Error generating claim summary:", error);
        return null;
    }
};


// --- NEW "WOW" FEATURE SERVICES (MOCKED FOR DEMO) ---

export const runLiveFNOL = async (
    claim: Claim,
    onUpdate: (update: Partial<LiveFNOLAnalysis>) => void
): Promise<void> => {
    onUpdate({ status: 'active' });

    const script: LiveFNOLTranscriptEntry[] = [
        { speaker: 'AI', text: `Hello ${claim.policyholderName}, this is the TrueManifest AI assistant calling to document your claim. This call is recorded. Can you please state your full name and the date of the loss?` },
        { speaker: 'Policyholder', text: `Yes, this is ${claim.policyholderName}, and the loss was... Tuesday night.` },
        { speaker: 'AI', text: "Thank you. In your own words, can you describe what happened?" },
        { speaker: 'Policyholder', text: "The fire started in the garage. I think it started after I plugged in my new e-scooter to charge." },
        { speaker: 'Policyholder', text: "It destroyed my MacBook Pro and my Sony Camera. My neighbor, Bob Smith, saw the smoke and called 911." },
    ];

    const intelligence: LiveFNOLIntelligenceCard[] = [
        { type: 'alert', text: "INCONSISTENCY: User said 'Tuesday' but claim form says 'Wednesday'." },
        { type: 'info', text: "ENTITY: Extracted 'E-Scooter' as potential cause." },
        { type: 'action', text: "SUBROGATION ALERT: Product liability potential for 'E-Scooter'. Recommend preserving for investigation." },
        { type: 'info', text: "ENTITY: Extracted 'MacBook Pro' (Asset)." },
        { type: 'info', text: "ENTITY: Extracted 'Sony Camera' (Asset)." },
        { type: 'info', text: "ENTITY: Extracted 'Bob Smith' (Third Party)." },
    ];

    const entities = [
        { type: 'Date', value: 'Tuesday night' },
        { type: 'Location', value: 'Garage' },
        { type: 'Asset', value: 'E-Scooter' },
        { type: 'Asset', value: 'MacBook Pro' },
        { type: 'Asset', value: 'Sony Camera' },
        { type: 'Third Party', value: 'Bob Smith' },
    ];

    let currentTranscript: LiveFNOLTranscriptEntry[] = [];
    let currentCards: LiveFNOLIntelligenceCard[] = [];

    for (let i = 0; i < script.length; i++) {
        await new Promise(res => setTimeout(res, 1500));
        currentTranscript.push(script[i]);
        onUpdate({ transcript: [...currentTranscript] });

        if (intelligence[i]) {
            await new Promise(res => setTimeout(res, 500));
            currentCards.push(intelligence[i]);
            onUpdate({ intelligenceCards: [...currentCards] });
        }
    }

    const summary = "Policyholder reported a fire originating in the garage, potentially caused by a charging e-scooter. Damaged items include a MacBook Pro and a Sony Camera. A neighbor, Bob Smith, was a witness. A date inconsistency was noted between the verbal statement ('Tuesday') and the written claim.";

    await new Promise(res => setTimeout(res, 2000));
    onUpdate({ status: 'complete', summary, extractedEntities: entities });
};

export const analyzeDamagePhoto = async (asset: Asset): Promise<DigitalFieldAdjusterAnalysis> => {
    // In a real app, this would be a multimodal call to Gemini
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                objectIdentified: 'Oak Hardwood Flooring Plank',
                damageType: 'Superficial Scratch / Gouge',
                severityScore: 2, // out of 10
                repairabilityIndex: 95, // out of 100
                recommendation: 'Repair',
                costEstimate: { min: 75, max: 125 },
                reasoning: "AI analysis of image pixels indicates a surface-level scratch with a depth of less than 1mm. The scratch does not cross plank seams and has not splintered the wood, indicating high repairability. This avoids a full plank replacement, which could cost over $800.",
                suggestedActionPlan: [
                    { item: 'Wood Floor Repair Kit', cost: 25 },
                    { item: 'Non-specialized Labor (1 hr)', cost: 75 },
                ]
            });
        }, 3500); // Simulate longer analysis time
    });
};

export const generateDenialLetter = async (asset: Asset, claim: Claim): Promise<string> => {
    // This is a mocked Gemini call for the demo
    return new Promise(resolve => {
        setTimeout(() => {
            const letterContent = `
[Your Insurance Company Letterhead]

Date: ${new Date().toLocaleDateString()}
Policyholder: ${claim.policyholderName}
Policy Number: ${claim.policyNumber}
Claim Number: ${claim.id}

RE: Coverage Decision Regarding Item: "${asset.name}"

Dear ${claim.policyholderName},

This letter is in regard to your recent claim for the item "${asset.name}". After a thorough review of your claim submission and the terms of your policy, we have determined that this specific item is not covered.

Coverage for this item is excluded based on the following policy provision:
[Section IV - Exclusions, Page 12, Paragraph 3b] - "${asset.policyCheck?.exclusionCategory || 'Relevant Exclusion'}"

The policy states: "${asset.policyCheck?.warningMessage || 'Coverage for this type of item is not provided under your current policy.'}"

Therefore, we are unable to provide payment for the claimed value of this item. All other items in your claim will be evaluated based on the terms of your policy.

If you have any questions or new information regarding this decision, please do not hesitate to contact me at (555) 123-4567.

Sincerely,

Alex Johnson
Senior Claims Adjuster
`;
            resolve(letterContent.trim());
        }, 1500);
    });
};


// --- EXISTING SERVICES ---

export const analyzeAssetForFraud = async (asset: Asset): Promise<FraudAnalysis> => {
    const assetDetails = `
    - Item Name: ${asset.name}
    - Category: ${asset.category}
    - Claimed Value: $${asset.claimedValue}
    - Purchase Date: ${asset.purchaseDate}
  `;

    const prompt = `You are a senior insurance fraud detection expert for a system called TrueManifest. Your task is to analyze asset data from an insurance claim and identify potential fraud.

  Analyze the following asset for inconsistencies. Consider these factors:
  - Is the claimed value reasonable for the item described?
  - Is the purchase date suspiciously recent for a high-value or unusual item?
  - Is the item description generic or specific?
  - Are there any other patterns that seem suspicious?

  Asset Details:
  ${assetDetails}

  Based on your analysis, provide a fraud risk level ('Low', 'Medium', or 'High') and a brief, clear justification for your assessment. Respond only with the JSON object.`;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskLevel: {
                            type: Type.STRING,
                            enum: [FraudRiskLevel.LOW, FraudRiskLevel.MEDIUM, FraudRiskLevel.HIGH],
                            description: 'The assessed fraud risk level for the asset.',
                        },
                        reason: {
                            type: Type.STRING,
                            description: 'A brief justification for the assessed risk level.',
                        },
                    },
                    required: ['riskLevel', 'reason'],
                },
            },
        }));

        // FIX: Safely parse JSON from the response text.
        const parsedResponse = JSON.parse(cleanJsonOutput(response.text || '{}')) as FraudAnalysis;

        if (Object.values(FraudRiskLevel).includes(parsedResponse.riskLevel)) {
            return parsedResponse;
        } else {
            return {
                riskLevel: FraudRiskLevel.UNKNOWN,
                reason: "Received an invalid risk level from the analysis service."
            };
        }

    } catch (error) {
        console.error('Error analyzing asset for fraud:', error);
        return {
            riskLevel: FraudRiskLevel.UNKNOWN,
            reason: 'An error occurred during the fraud analysis process.',
        };
    }
};

export const analyzeMarketValue = async (asset: Asset): Promise<MarketValueAnalysis | null> => {
    const prompt = `
      Find the current average market replacement cost (retail price for a new or excellent condition equivalent) for the following item:
      
      Item: ${asset.name}
      Category: ${asset.category}
      
      Provide the output in the following format strictly:
      PRICE: [Numerical value only, no symbols]
      REASONING: [A brief sentence explaining the price range found]
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        }));

        // FIX: Safely handle potentially undefined text property.
        const text = response.text || '';

        const priceMatch = text.match(/PRICE:\s*(\d+(?:\.\d{1,2})?)/i);
        const reasoningMatch = text.match(/REASONING:\s*(.*)/i);

        const estimatedValue = priceMatch ? parseFloat(priceMatch[1]) : 0;
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "Could not determine market value from search results.";

        // FIX: Safely access candidates property.
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((chunk: any) => {
                if (chunk.web) {
                    return { title: chunk.web.title, uri: chunk.web.uri };
                }
                return null;
            })
            .filter((source: any) => source !== null) || [];

        const uniqueSources = sources.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => (t.uri === v.uri)) === i);

        if (estimatedValue > 0) {
            return {
                estimatedValue,
                currency: 'USD',
                reasoning,
                sources: uniqueSources,
            };
        }
        return null;

    } catch (error) {
        console.error("Error analyzing market value:", error);
        return null;
    }
};

// 1. Manifest Assistant Chat
export const createManifestAssistant = (claim: Claim): Chat => {
    const systemInstruction = `
    You are the "Manifest Assistant", an AI copilot for an insurance adjuster processing a claim on the TrueManifest portal.
    
    Here is the full context of the claim you are looking at:
    ${JSON.stringify(claim, null, 2)}

    Your goal is to help the adjuster make decisions faster. You can:
    1. Summarize the claim.
    2. Point out specific risks based on the data.
    3. Draft emails to the policyholder (e.g., asking for receipts).
    4. Answer questions about total values, dates, or categories.
    
    Be concise, professional, and helpful. Do not make up facts not present in the JSON.
  `;

    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction,
        },
    });
};

// 2. Visual Truth (Image Analysis)
export const analyzeAssetImage = async (asset: Asset, imageBase64: string): Promise<ImageAnalysis | null> => {
    const prompt = `
    Compare this image to the following asset description from an insurance claim:
    
    Name: ${asset.name}
    Category: ${asset.category}
    Claimed Condition/Value: $${asset.claimedValue} (Implies specific condition)
    
    Does the image match the description? 
    - Check for brand mismatch (e.g. claiming Rolex but image is generic watch).
    - Check for condition mismatch (e.g. claiming new but image shows heavy wear).
    - Check for item mismatch (e.g. claiming Laptop but image is a Tablet).

    Return ONLY a JSON object with this structure: { "isConsistent": boolean, "discrepancies": string[], "visualCondition": string }
  `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg', // Assuming JPEG for simplicity, but could be detected
                            data: imageBase64,
                        }
                    },
                    { text: prompt }
                ]
            },
        }));

        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(cleanJsonOutput(response.text || '{}')) as ImageAnalysis;
    } catch (error) {
        console.error("Visual Truth Error:", error);
        // Fallback for demo if CORS prevents fetching the mock image or JSON parse fails
        return {
            isConsistent: true,
            discrepancies: [],
            visualCondition: "Analysis unavailable (Demo Image/Validation Error)",
        };
    }
};

// 3. Smart Receipt Reconciliation
export const reconcileReceipt = async (receiptImageBase64: string, assets: Asset[]): Promise<ReceiptMatch[]> => {
    const assetContext = assets.map(a => ({ id: a.id, name: a.name, claimedValue: a.claimedValue }));

    const prompt = `
    I have an insurance claim with the following assets:
    ${JSON.stringify(assetContext)}

    Analyze the attached receipt image. 
    1. Identify line items on the receipt.
    2. Try to match receipt items to the Claim Assets provided above.
    3. Return a list of matches. If a receipt item matches a claim asset, link them.
    
    Only return matches where you are reasonably confident.

    Return ONLY a JSON array of objects with this structure: { "assetId": string, "receiptItemName": string, "receiptPrice": number, "receiptDate": string, "confidence": number }
  `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: receiptImageBase64 } },
                    { text: prompt }
                ]
            },
        }));

        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(cleanJsonOutput(response.text || '[]')) as ReceiptMatch[];

    } catch (error) {
        console.error("Receipt Reconciliation Error:", error);
        return [];
    }
};

// 4. LKQ (Like Kind & Quality) Analysis
export const findLKQReplacement = async (asset: Asset): Promise<LKQAnalysis | null> => {
    const prompt = `
    Analyze this item: "${asset.name}" (Category: ${asset.category}, Purchased: ${asset.purchaseDate}, Claimed Value: $${asset.claimedValue}).

    1. Determine the likely technical specifications of this older/claimed item.
    2. Identify a MODERN, CURRENTLY AVAILABLE replacement model that is "Like Kind and Quality" (equivalent specs, not necessarily same price).
    3. If the item is obsolete (e.g., Plasma TV), suggest the modern tech equivalent (e.g., LED 4K).
    
    Return JSON.
  `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        originalSpecs: { type: Type.STRING, description: "Summary of the likely specs of the original item." },
                        modernModel: { type: Type.STRING, description: "Name of the modern replacement model." },
                        modernPrice: { type: Type.NUMBER, description: "Approximate retail price of the modern model." },
                        reasoning: { type: Type.STRING, description: "Why this is a fair replacement (e.g. 'Better resolution, same brand')." },
                        savings: { type: Type.NUMBER, description: "Claimed Value minus Modern Price (if positive)." }
                    },
                    required: ['originalSpecs', 'modernModel', 'modernPrice', 'reasoning']
                }
            }
        }));

        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '{}') as LKQAnalysis;
    } catch (error) {
        console.error("LKQ Error:", error);
        return null;
    }
};

// 5. Evidence Mapper
export const mapEvidenceToAssets = async (documentText: string, assets: Asset[]): Promise<{ assetId: string, documentName: string }[]> => {
    const assetContext = assets.map(a => ({ id: a.id, name: a.name }));

    const prompt = `
    I have a document (e.g., Police Report, Bank Statement) with the following text content:
    "${documentText}"

    I need to check if any of these assets are mentioned in the document:
    ${JSON.stringify(assetContext)}

    Return a list of matches.
  `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            assetId: { type: Type.STRING, description: "The ID of the asset mentioned." },
                            documentName: { type: Type.STRING, description: "A generic name for the document type based on content (e.g., 'Police Report', 'Invoice')." }
                        },
                        required: ['assetId', 'documentName']
                    }
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '[]') as { assetId: string, documentName: string }[];
    } catch (e) {
        console.error("Evidence Mapper Error", e);
        return [];
    }
};

// 6. Weather Verification (Search Grounding)
export const verifyWeather = async (location: string, date: string): Promise<WeatherAnalysis | null> => {
    const prompt = `
    What was the weather in ${location} on ${date}? 
    Was there a significant weather event like a storm, lightning, hurricane, or flood?
    
    Format output as:
    VERIFIED: [TRUE/FALSE] (True if a significant weather event occurred, False if normal weather)
    CONDITIONS: [Brief description of weather]
    TEMP: [Approx temp]
  `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        }));

        // FIX: Safely handle potentially undefined text property.
        const text = response.text || '';
        const verifiedMatch = text.match(/VERIFIED:\s*(TRUE|FALSE)/i);
        const conditionsMatch = text.match(/CONDITIONS:\s*(.*)/i);
        const tempMatch = text.match(/TEMP:\s*(.*)/i);

        if (verifiedMatch) {
            return {
                isEventVerified: verifiedMatch[1].toUpperCase() === 'TRUE',
                conditions: conditionsMatch ? conditionsMatch[1].trim() : 'Unknown conditions',
                temperature: tempMatch ? tempMatch[1].trim() : undefined,
                reasoning: text // Keep full text for reasoning if needed
            };
        }
        return null;
    } catch (e) {
        console.error("Weather Verify Error", e);
        return null;
    }
};

// 7. Duplicate Detective
export const detectDuplicates = async (assets: Asset[]): Promise<DuplicateAnalysis | null> => {
    const assetSimplified = assets.map(a => ({ id: a.id, name: a.name, category: a.category }));
    const prompt = `
      Analyze this list of assets from an insurance claim.
      Identify any items that appear to be duplicate entries (e.g., "Sony 55 TV" and "Television - Sony").
      
      Asset List:
      ${JSON.stringify(assetSimplified)}

      Return JSON.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hasDuplicates: { type: Type.BOOLEAN, description: "True if any potential duplicates are found." },
                        duplicateGroups: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    itemIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "IDs of items that seem to be duplicates of each other." },
                                    reason: { type: Type.STRING, description: "Why these are considered duplicates." }
                                },
                                required: ['itemIds', 'reason']
                            },
                            description: "List of groups containing duplicate items."
                        }
                    },
                    required: ['hasDuplicates', 'duplicateGroups']
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '{}') as DuplicateAnalysis;
    } catch (e) {
        console.error("Duplicate Detective Error", e);
        return null;
    }
};

// 8. Bundle Breakout
export const analyzeBundles = async (assets: Asset[]): Promise<{ assetId: string, analysis: BundleAnalysis }[]> => {
    const assetSimplified = assets.map(a => ({ id: a.id, name: a.name, claimedValue: a.claimedValue }));

    const prompt = `
    Analyze this asset list for items that are vague "Bundles" or "Groups" (e.g., "Living Room Set", "Gaming Setup", "Tool Collection") instead of specific single items.
    
    For each BUNDLED item found:
    1. Estimate the individual components that likely make up that bundle based on the price and name.
    2. Provide a breakdown.
    
    Asset List:
    ${JSON.stringify(assetSimplified)}

    Return a list of bundle analyses for relevant items.
  `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            assetId: { type: Type.STRING, description: "The ID of the asset identified as a bundle." },
                            analysis: {
                                type: Type.OBJECT,
                                properties: {
                                    isBundle: { type: Type.BOOLEAN, description: "Always true for this schema." },
                                    components: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING, description: "Name of component (e.g. 'Sofa')." },
                                                estimatedValue: { type: Type.NUMBER, description: "Estimated value of this component." }
                                            }
                                        }
                                    },
                                    reasoning: { type: Type.STRING, description: "Why this was identified as a bundle." }
                                },
                                required: ['isBundle', 'components', 'reasoning']
                            }
                        },
                        required: ['assetId', 'analysis']
                    }
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '[]') as { assetId: string, analysis: BundleAnalysis }[];
    } catch (e) {
        console.error("Bundle Breakout Error", e);
        return [];
    }
};

// 9. Policy Guardian (Exclusion Check)
export const checkPolicyExclusions = async (assets: Asset[]): Promise<{ assetId: string, check: PolicyCheck }[]> => {
    const assetSimplified = assets.map(a => ({ id: a.id, name: a.name, category: a.category }));

    const prompt = `
      You are checking an insurance claim against a standard Homeowners HO-3 Policy.
      Identify items that might be EXCLUDED or SUBJECT TO SPECIAL LIMITS.
      
      Common Exclusions/Limits to watch for:
      - Motorized Vehicles (e.g., E-Bikes, Scooters, Cars) -> Excluded
      - Business Property (e.g., Commercial Printers, bulk inventory) -> Special Limit
      - Cash/Bullion -> Special Limit
      - Animals -> Excluded
      - Aircraft (Drones often limited)
      
      Asset List:
      ${JSON.stringify(assetSimplified)}
  
      Return a list of items that trigger a warning.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            assetId: { type: Type.STRING, description: "The ID of the asset." },
                            check: {
                                type: Type.OBJECT,
                                properties: {
                                    isExcluded: { type: Type.BOOLEAN, description: "True if potentially excluded or limited." },
                                    exclusionCategory: { type: Type.STRING, description: "The policy category (e.g. 'Motorized Vehicle')." },
                                    warningMessage: { type: Type.STRING, description: "Warning for the adjuster." }
                                },
                                required: ['isExcluded', 'warningMessage']
                            }
                        },
                        required: ['assetId', 'check']
                    }
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '[]') as { assetId: string, check: PolicyCheck }[];
    } catch (e) {
        console.error("Policy Guardian Error", e);
        return [];
    }
};

// 10. Smart Depreciator
export const calculateDepreciation = async (assets: Asset[]): Promise<{ assetId: string, analysis: DepreciationAnalysis }[]> => {
    const assetSimplified = assets.map(a => ({ id: a.id, name: a.name, category: a.category, purchaseDate: a.purchaseDate, claimedValue: a.claimedValue }));

    const prompt = `
    Calculate the 'Actual Cash Value' (ACV) for these insurance assets.
    
    Logic:
    1. Determine the Life Expectancy in years for the item category (e.g. Laptop=5 years, Clothes=3 years).
    2. Calculate age based on Purchase Date vs Today (assume today is 2024-07-15).
    3. Calculate Depreciation % = Age / Life Expectancy (Max 80%).
    4. ACV = Claimed Value * (1 - Depreciation %).
    
    Asset List:
    ${JSON.stringify(assetSimplified)}

    Return calculations.
  `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            assetId: { type: Type.STRING, description: "ID." },
                            analysis: {
                                type: Type.OBJECT,
                                properties: {
                                    lifeExpectancyYears: { type: Type.NUMBER, description: "Standard life expectancy." },
                                    ageYears: { type: Type.NUMBER, description: "Age in years." },
                                    depreciationPct: { type: Type.NUMBER, description: "Depreciation (0.0 to 1.0)." },
                                    actualCashValue: { type: Type.NUMBER, description: "The deprecated value." },
                                    reasoning: { type: Type.STRING, description: "Explanation of the life expectancy standard." }
                                },
                                required: ['lifeExpectancyYears', 'actualCashValue', 'reasoning']
                            }
                        },
                        required: ['assetId', 'analysis']
                    }
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '[]') as { assetId: string, analysis: DepreciationAnalysis }[];
    } catch (e) {
        console.error("Depreciation Error", e);
        return [];
    }
};

// 11. Taxonomy Auditor (Category Check)
export const auditCategories = async (assets: Asset[]): Promise<{ assetId: string, analysis: CategoryAnalysis }[]> => {
    const assetSimplified = assets.map(a => ({ id: a.id, name: a.name, category: a.category }));

    const prompt = `
      Audit the categorization of these insurance assets.
      Insurance coverage limits depend on correct categorization (e.g., Jewelry, Electronics, Firearms, Business Property).
      
      Identify items that are MISCATEGORIZED (e.g. 'Rolex' listed as 'Misc' instead of 'Jewelry').
      
      Asset List:
      ${JSON.stringify(assetSimplified)}
  
      Return audit results.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            assetId: { type: Type.STRING, description: "ID." },
                            analysis: {
                                type: Type.OBJECT,
                                properties: {
                                    isCorrect: { type: Type.BOOLEAN, description: "True if category is accurate." },
                                    suggestedCategory: { type: Type.STRING, description: "The correct category if incorrect." },
                                    reasoning: { type: Type.STRING, description: "Why it should be moved." }
                                },
                                required: ['isCorrect', 'reasoning']
                            }
                        },
                        required: ['assetId', 'analysis']
                    }
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '[]') as { assetId: string, analysis: CategoryAnalysis }[];
    } catch (e) {
        console.error("Category Audit Error", e);
        return [];
    }
};

// 12. Negotiation Genius
export const generateNegotiationScript = async (asset: Asset): Promise<NegotiationScript | null> => {
    const issues = [];
    if (asset.policyCheck?.isExcluded) issues.push(`Policy Exclusion: ${asset.policyCheck.exclusionCategory}`);
    if (asset.depreciationAnalysis) issues.push(`Depreciation applied: ${Math.round(asset.depreciationAnalysis.depreciationPct * 100)}% due to age.`);
    if (asset.fraudAnalysis?.riskLevel === FraudRiskLevel.HIGH) issues.push(`Flagged for validation concerns.`);
    if (asset.status === AssetStatus.DENIED) issues.push(`This item has been denied.`);

    const prompt = `
      Write a script for an insurance adjuster to speak to a policyholder about this item: "${asset.name}".
      
      The Issue: ${issues.join(' ')}
      
      Goal: Politely but firmly explain why the payout is lower than claimed or denied. Use empathetic language ("I understand how important this is") but stick to the facts/policy.
      Tone: Professional, Empathetic, Defensible.
      Length: 2-3 sentences max.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        script: { type: Type.STRING, description: "The spoken script for the adjuster." },
                        tone: { type: Type.STRING, description: "Description of the tone used." }
                    },
                    required: ['script', 'tone']
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '{}') as NegotiationScript;
    } catch (e) {
        console.error("Negotiation Genius Error", e);
        return null;
    }
};

// 13. Specialty Triage
export const identifySpecialtyItems = async (assets: Asset[]): Promise<{ assetId: string, analysis: SpecialtyAnalysis }[]> => {
    const assetSimplified = assets.map(a => ({ id: a.id, name: a.name, category: a.category, claimedValue: a.claimedValue }));

    const prompt = `
      Identify items in this list that require a SPECIALTY APPRAISER because they are difficult to price on the standard web (e.g., Antiques, Fine Art, Custom items, Collectibles, Autographed items).
      
      Standard items (TVs, Laptops, Clothes) should NOT be flagged.
      
      Asset List:
      ${JSON.stringify(assetSimplified)}
      
      Return list of items to flag.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            assetId: { type: Type.STRING, description: "ID." },
                            analysis: {
                                type: Type.OBJECT,
                                properties: {
                                    isSpecialty: { type: Type.BOOLEAN, description: "True if it needs an appraiser." },
                                    reasoning: { type: Type.STRING, description: "Why it's hard to price." },
                                    recommendation: { type: Type.STRING, description: "Who to send it to (e.g. 'Fine Art Expert')." }
                                },
                                required: ['isSpecialty', 'reasoning', 'recommendation']
                            }
                        },
                        required: ['assetId', 'analysis']
                    }
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '[]') as { assetId: string, analysis: SpecialtyAnalysis }[];
    } catch (e) {
        console.error("Specialty Triage Error", e);
        return [];
    }
};

// 14. Subrogation Spotter (Recovery)
export const analyzeSubrogation = async (assets: Asset[]): Promise<{ assetId: string, analysis: SubrogationAnalysis }[]> => {
    const assetContext = assets.map(a => ({ id: a.id, name: a.name }));

    const prompt = `
    Analyze this list of assets involved in an insurance claim.
    Look for any indication that a THIRD PARTY might be liable for the damage (Subrogation Potential).
    
    Keywords to infer context (even if not explicitly stated, infer from item nature if it suggests a defect):
    - Defective products (batteries, appliances that cause fires)
    - Items damaged by contractors
    - Recalled items
    
    Asset List:
    ${JSON.stringify(assetContext)}
    
    Return analysis for items with subrogation potential.
  `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            assetId: { type: Type.STRING, description: "ID." },
                            analysis: {
                                type: Type.OBJECT,
                                properties: {
                                    potentialLiability: { type: Type.BOOLEAN, description: "True if potential subrogation." },
                                    liableParty: { type: Type.STRING, description: "Who might be at fault (e.g. 'Manufacturer', 'Contractor')." },
                                    reasoning: { type: Type.STRING, description: "Why subrogation is possible." },
                                    suggestedAction: { type: Type.STRING, description: "Next step for adjuster." }
                                },
                                required: ['potentialLiability', 'reasoning', 'suggestedAction']
                            }
                        },
                        required: ['assetId', 'analysis']
                    }
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '[]') as { assetId: string, analysis: SubrogationAnalysis }[];
    } catch (e) {
        console.error("Subrogation Error", e);
        return [];
    }
};

// 15. Padding Patrol (Soft Fraud)
export const analyzeClaimPadding = async (assets: Asset[]): Promise<PaddingAnalysis | null> => {
    const assetContext = assets.map(a => ({ name: a.name, category: a.category, value: a.claimedValue }));

    const prompt = `
      Analyze this insurance claim for "Claim Padding" (Soft Fraud).
      
      Look for:
      1. Excessive numbers of low-value items (e.g., 50 pairs of socks, 20 phone chargers).
      2. Repetitive entries that seem artificially added to inflate the total.
      3. Suspiciously high volume of "Consumables" or "Misc" items.
      
      Claim Inventory:
      ${JSON.stringify(assetContext)}
      
      Return an analysis of the padding risk.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isPadded: { type: Type.BOOLEAN, description: "True if padding is detected." },
                        fluffScore: { type: Type.NUMBER, description: "0-100 Score indicating severity of padding." },
                        lowValueCount: { type: Type.NUMBER, description: "Count of suspicious low-value items." },
                        suspiciousCategories: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Categories with excessive items." },
                        reasoning: { type: Type.STRING, description: "Explanation of the findings." }
                    },
                    required: ['isPadded', 'fluffScore', 'lowValueCount', 'suspiciousCategories', 'reasoning']
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '{}') as PaddingAnalysis;
    } catch (e) {
        console.error("Padding Analysis Error", e);
        return null;
    }
};

// 16. Regulatory Research
export const researchStateRegulations = async (state: string, topic: string): Promise<StateRegulation | null> => {
    const prompt = `
        You are an expert in US State Insurance Regulation.
        Search for the specific insurance codes, statutes, and regulations for the state of ${state} regarding "${topic}".
        
        Focus on:
        - Time limits for claim handling (acknowledgement, payment).
        - Consumer protection laws.
        - Specific requirements for asset verification or depreciation.

        Return the finding in structured JSON.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        state: { type: Type.STRING },
                        regulationName: { type: Type.STRING, description: "The specific code or act name (e.g. 'Fair Claims Settlement Practices Regulations')." },
                        summary: { type: Type.STRING, description: "A summary of the relevant rules." },
                        complianceStatus: { type: Type.STRING, enum: ['Compliant', 'At Risk', 'Non-Compliant'] },
                        lastUpdated: { type: Type.STRING, description: "Effective date of regulation." }
                    },
                    required: ['state', 'regulationName', 'summary', 'complianceStatus', 'lastUpdated']
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '{}') as StateRegulation;
    } catch (e) {
        console.error("Regulatory Research Error", e);
        return null;
    }
};

// 17. Generate Filing
export const generateComplianceFiling = async (claim: Claim, regulation: StateRegulation): Promise<FilingReport | null> => {
    const prompt = `
        Generate a formal "Certificate of Compliance" document for the State Insurance Commission of ${regulation.state}.
        
        Context:
        - Claim ID: ${claim.id}
        - Policyholder: ${claim.policyholderName}
        - Regulation Cited: ${regulation.regulationName}
        - Date: ${new Date().toLocaleDateString()}
        
        Strictly follow this format structure:
        1. HEADER: [State Name] Department of Insurance - Market Conduct Division
        2. SUBHEADER: CERTIFICATE OF COMPLIANCE
        3. TO: Commissioner of Insurance
        4. FROM: TrueManifest Regulatory Engine
        5. RE: Compliance Audit for Claim #${claim.id}
        6. BODY: A formal legal statement certifying that the claim handling was audited and found to be in full compliance with the cited regulation.
        7. LIST: A bulleted list of verified compliance points (e.g., "Timely Acknowledgement", "Investigation Standards", "Fair Valuation").
        8. CONCLUSION: A final statement of adherence.
        9. SIGNATURE BLOCK.
        
        Do not use markdown symbols (like ** or #). Use plain text formatting with newlines.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        filingId: { type: Type.STRING },
                        state: { type: Type.STRING },
                        generatedDate: { type: Type.STRING },
                        content: { type: Type.STRING, description: "The body text of the filing report." },
                        status: { type: Type.STRING, enum: ['Draft', 'Filed'] }
                    },
                    required: ['filingId', 'state', 'generatedDate', 'content', 'status']
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '{}') as FilingReport;
    } catch (e) {
        console.error("Filing Generation Error", e);
        return null;
    }
};

// 18. Perform Regulatory Check
export const performRegulatoryCheck = async (claim: Claim): Promise<RegulatoryCheck | null> => {
    // In a real app, this would use Gemini to check specific statutes against the claim date.
    // For speed/demo, we'll simulate logic but structure it as if AI returned it.

    const prompt = `
        Analyze the compliance status of this claim based on general US insurance standards (e.g. 15-day acknowledgement).
        
        Claim Date: ${claim.claimDate}
        State: ${claim.location}
        
        Determine if the claim is compliant with standard timelines.
    `;

    // Simulating response for demo speed
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                state: claim.location?.split(',')[1]?.trim() || "US",
                status: 'Compliant',
                message: "Within 15-day acknowledgement window.",
                deadline: "2024-08-01"
            });
        }, 1000);
    });
};

// 19. Generate Settlement Report
export const generateSettlementReport = async (claim: Claim, assets: Asset[]): Promise<SettlementReport | null> => {
    // Only include assets that are NOT denied AND NOT flagged
    const payableAssets = assets.filter(a => a.status !== AssetStatus.DENIED && a.status !== AssetStatus.FLAGGED);
    const deniedAssets = assets.filter(a => a.status === AssetStatus.DENIED || a.status === AssetStatus.FLAGGED);

    const totalRCV = payableAssets.reduce((sum, a) => sum + a.claimedValue, 0);
    const totalACV = payableAssets.reduce((sum, a) => sum + (a.depreciationAnalysis?.actualCashValue || a.claimedValue), 0); // Use ACV if avail, else RCV
    const totalDepreciation = totalRCV - totalACV;
    const netPayment = Math.max(0, totalACV - claim.deductible);

    const prompt = `
        Generate a friendly and clear summary for a policyholder's settlement check explanation.
        
        Financials (Calculated from APPROVED items only):
        - Gross RCV: $${totalRCV}
        - Less Recoverable Depreciation: $${totalDepreciation}
        - Less Deductible: $${claim.deductible}
        - Net Check Amount: $${netPayment}
        
        Context on Excluded Items:
        The following items were explicitly excluded (Denied or Flagged for Fraud/Review) from the payment above:
        ${deniedAssets.map(a => `- ${a.name} (${a.status})`).join('\n')}
        
        Instruction:
        Write a 2-4 sentence summary explaining the payout. 
        IMPORTANT: You MUST mention that specific items were denied or flagged and thus excluded from this total if there are any denied assets listed above.
        Be professional and empathetic.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));

        return {
            grossRCV: totalRCV,
            totalDepreciation,
            deductible: claim.deductible,
            netPayment,
            // FIX: Safely handle potentially undefined text property.
            summary: (response.text || '').trim()
        };
    } catch (e) {
        console.error("Settlement Generation Error", e);
        return null;
    }
};

// 20. PROVENIQ Home Fast-Track Check
export const runHomeFastTrackCheck = async (claim: Claim): Promise<HomeFastTrackResult | null> => {
    const prompt = `
        You are the 'PROVENIQ Home Fast-Track Engine'.
        Review this incoming claim from the PROVENIQ Home app.
        
        Claim Details:
        - Policyholder: ${claim.policyholderName}
        - Total Value: ${claim.totalClaimedValue}
        - Item Count: ${claim.preLossMetadata?.preLossItemCount || 'N/A'}
        - Documented Photos: ${claim.preLossMetadata?.documentedPhotosCount || 'N/A'}
        - Vault ID: ${claim.preLossMetadata?.vaultId || 'N/A'}
        
        Logic:
        1. Compare 'Item Count' vs 'Documented Photos'. If >90% coverage, that is a positive sign.
        2. Check for high-value items vs policy limits.
        3. If 'Vault ID' is present and data is consistent, recommend FAST-TRACK.
        
        Output JSON with risk score (0-100), verdict (approve/review), summary, discrepancies, and recommendations.
    `;

    try {
        // FIX: Add explicit type to the response object to fix TS error.
        const response: GenerateContentResponse = await geminiRequestWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskScore: { type: Type.NUMBER, description: "0-100 Score. Lower is better." },
                        verdict: { type: Type.STRING, enum: ['FAST_TRACK_APPROVED', 'MANUAL_REVIEW_REQUIRED'] },
                        summary: { type: Type.STRING },
                        discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['riskScore', 'verdict', 'summary', 'discrepancies', 'recommendations']
                }
            }
        }));
        // FIX: Safely handle potentially undefined text property.
        return JSON.parse(response.text || '{}') as HomeFastTrackResult;
    } catch (e) {
        console.error("Home Fast-Track Error", e);
        return null;
    }
};


// Helper to convert URL to Base64 (for demo purposes with mock images)
export const urlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url, { referrerPolicy: "no-referrer" });
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("CORS error fetching image for demo. In production, images would be served from own backend.", e);
        throw e;
    }
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

// 21. Claim Health Check (Local Logic)
export const runClaimHealthCheck = (claim: Claim): ClaimHealthCheckResult => {
    const criticalMissingFields: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Critical Checks
    if (!claim.policyNumber) criticalMissingFields.push('Policy Number is missing');
    if (!claim.claimDate) criticalMissingFields.push('Date of Loss is missing');
    if (claim.deductible === undefined) criticalMissingFields.push('Deductible is undefined');
    if ((claim.assets || []).length === 0) criticalMissingFields.push('No assets listed in claim');

    // Warnings & Score deductions
    const unverifiedAssets = (claim.assets || []).filter(a => a.status === AssetStatus.UNVERIFIED || a.status === AssetStatus.PENDING);
    if (unverifiedAssets.length > 0) {
        warnings.push(`${unverifiedAssets.length} assets are still Unverified/Pending`);
        score -= (unverifiedAssets.length * 5);
    }

    const missingPhotos = (claim.assets || []).filter(a => !a.imageUrl);
    if (missingPhotos.length > 0) {
        warnings.push(`${missingPhotos.length} assets are missing photos`);
        score -= (missingPhotos.length * 2);
    }

    const highValueNoReceipt = (claim.assets || []).filter(a => a.claimedValue > 1000 && !a.receiptMatch);
    if (highValueNoReceipt.length > 0) {
        warnings.push(`${highValueNoReceipt.length} high-value items (> $1k) missing receipts`);
        score -= 10;
    }

    if (score < 0) score = 0;

    return {
        score,
        criticalMissingFields,
        warnings,
        readyForExport: criticalMissingFields.length === 0 && score > 70
    };
};
