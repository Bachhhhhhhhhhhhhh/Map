
import { GoogleGenAI, Type } from "@google/genai";
import { Place } from "../types";

const API_KEY = process.env.API_KEY || '';

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Tạo hình ảnh đặc tả chính xác cho một địa điểm dựa trên tên và mô tả thực tế.
 */
async function generateSpecificImage(placeName: string, description: string): Promise<string> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Professional architectural and lifestyle photography of "${placeName}" in Hanoi. ${description}. High resolution, pinterest style, aesthetic lighting, realistic textures, cinematic composition.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error(`Error generating image for ${placeName}:`, error);
  }
  // Fallback nếu lỗi
  return `https://picsum.photos/seed/${placeName.replace(/\s/g, '')}/600/800`;
}

export const searchPlacesInHanoi = async (query: string): Promise<{ places: Place[], groundings: any[] }> => {
  const ai = getGeminiClient();
  
  // Lấy vị trí hiện tại hoặc mặc định Hà Nội
  let latLng = { latitude: 21.0285, longitude: 105.8542 };
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
    });
    latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch (e) {
    console.debug("Using default Hanoi coordinates");
  }

  // Bước 1: Tìm kiếm thông tin thực tế
  const searchResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Suggest 6 real and famous places in Hanoi for: ${query}. For each place, provide accurate coordinates and a very detailed visual description of its architecture/vibe.`,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: { latLng }
      }
    },
  });

  const groundings = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  // Bước 2: Trích xuất dữ liệu cấu trúc
  const structuredResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Based on your recent search about "${query}" in Hanoi, return a JSON list of 6 places. 
    Format: [{"title": string, "description": string, "category": string, "rating": number, "location": string, "lat": number, "lng": number, "visualPrompt": string}]
    The "visualPrompt" should be a 1-sentence description of what the place looks like specifically (colors, materials, vibe).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            rating: { type: Type.NUMBER },
            location: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            visualPrompt: { type: Type.STRING }
          },
          required: ["title", "description", "category", "lat", "lng", "visualPrompt"]
        }
      }
    }
  });

  try {
    const rawPlaces = JSON.parse(structuredResponse.text);
    
    // Bước 3: Tạo ảnh AI thực tế cho từng địa điểm song song
    const placesWithImages = await Promise.all(rawPlaces.map(async (p: any) => {
      const imageUrl = await generateSpecificImage(p.title, p.visualPrompt);
      return {
        ...p,
        id: Math.random().toString(36).substr(2, 9),
        imageUrl,
        sources: groundings.map((g: any) => ({
          title: g.maps?.title || g.web?.title || 'Source',
          uri: g.maps?.uri || g.web?.uri || '#'
        })).filter((s: any) => s.uri !== '#').slice(0, 3)
      };
    }));

    return { places: placesWithImages, groundings };
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return { places: [], groundings: [] };
  }
};

export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const checkVeoKey = async () => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return true;
};

export const openVeoKeySelector = async () => {
  if (typeof (window as any).aistudio?.openSelectKey === 'function') {
    await (window as any).aistudio.openSelectKey();
  }
};
