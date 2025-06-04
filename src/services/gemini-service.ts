import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { IItem } from "../models/item_model";

type IItemWithTimestamps = IItem & {
  createdAt?: Date;
  updatedAt?: Date;
};

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBuhqOtRNZq2954QjKMsI66vbbwCNIjsfU";
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  
 
  async evaluateMatch(
    lostItem: IItem, 
    foundItem: IItem,
  ): Promise<{ confidenceScore: number; reasoning: string }> {
    try {
      const prompt = `
You are an expert match evaluator for a Lost & Found platform.

Your task is to analyze whether a lost item and a found item are likely the same, based on **all provided data**.

You must consider:
- Descriptions: semantic similarity, details (e.g., color, brand, condition, shape, etc.)
- Categories: exact or related category
- Time and Date: found must be after lost, and should be reasonably close
- Location: evaluate distance and how plausible it is that the item moved
- **Vision Data**: Compare the two vision API responses (labelAnnotations, colors, objects) and analyze how visually similar the two items are based on detected elements (like colors, objects, labels, etc.)
- **Brand**: If both items mention the same brand, or one mentions a known variant/model of the brand, this is a **strong indicator** of a match.
- **Condition**: If both items are in similar or identical condition (e.g., "like new", "scratched", "used"), this is a **moderately strong match factor**.
- **Flaws**: Shared flaws (e.g., "crack on screen", "torn handle") are helpful, but are **optional** and often missing; match only if explicitly similar.
- **Material**: Consider only if there's a conflict (e.g., one is “metal” and the other “fabric”) — otherwise treat this feature as **low-weight**, since many items are mixed-material.
- **Colors**: Compare the colors of the lost and found items. **strong indicators**

Your evaluation must consider all aspects holistically. You may perform internal comparisons between the vision data – for example, how many shared labels, visual elements, or colors exist between the two items.

Confidence Score should be between 0 and 100:
   - A **score of 100** should only be given when **every aspect** aligns: descriptions(), categories, visual data, time, and location — with *no significant discrepancies*.
   - A score between **90–99** reflects high confidence with minor imperfections.
   - A score below 90 indicates moderate or low confidence.
   
Return ONLY valid JSON in this exact format:
{"confidenceScore": number, "reasoning": "your explanation"}

LOST ITEM:
Description: ${lostItem.description || 'N/A'}
Category: ${lostItem.category || 'N/A'}
Location: ${JSON.stringify(lostItem.location) || 'N/A'}
Date Lost: ${(lostItem as IItemWithTimestamps).createdAt?.toLocaleString() || 'N/A'}
Vision API Data: ${JSON.stringify(lostItem.visionApiData || {}, null, 2)}
Colors: ${lostItem.colors?.join(', ') || 'N/A'}
Brand: ${lostItem.brand || 'N/A'}
Condition: ${lostItem.condition || 'N/A'}
Flaws: ${lostItem.flaws || 'N/A'}
Material: ${lostItem.material || 'N/A'}

FOUND ITEM:
Description: ${foundItem.description || 'N/A'}
Category: ${foundItem.category || 'N/A'}
Location: ${JSON.stringify(foundItem.location) || 'N/A'}
Date Found: ${(foundItem as IItemWithTimestamps).createdAt?.toLocaleString() || 'N/A'}
Vision API Data: ${JSON.stringify(foundItem.visionApiData || {}, null, 2)}
Colors: ${foundItem.colors?.join(', ') || 'N/A'}
Brand: ${foundItem.brand || 'N/A'}
Condition: ${foundItem.condition || 'N/A'}
Flaws: ${foundItem.flaws || 'N/A'}
Material: ${foundItem.material || 'N/A'}
`;
      

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      try {
        let cleanedResponse = responseText;
        cleanedResponse = cleanedResponse.replace(/```json\s+|\s+```|```/g, '');
        cleanedResponse = cleanedResponse.replace(/`/g, '');
        
        const parsedResponse = JSON.parse(cleanedResponse);
        
        if (typeof parsedResponse.confidenceScore !== 'number' || typeof parsedResponse.reasoning !== 'string') {
          console.error("Invalid response structure from Gemini:", parsedResponse);
          return { confidenceScore: 0, reasoning: "" };
        }
        
        const confidenceScore = Math.min(100, Math.max(0, parsedResponse.confidenceScore));
        return { confidenceScore, reasoning: parsedResponse.reasoning };
      } catch (error) {
        console.error("Error parsing Gemini response:", error);
        console.error("Raw response:", responseText);
        return { confidenceScore: 0, reasoning: "" };
      }
    } catch (error) {
      console.error("Error in evaluateMatch:", error);
      return { confidenceScore: 0, reasoning: "" };
    }
  }
}

const geminiService = new GeminiService();

export default geminiService;
