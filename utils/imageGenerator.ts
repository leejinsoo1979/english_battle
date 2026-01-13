// @ts-ignore
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function generateImageWithGemini(prompt: string): Promise<GenerateImageResponse> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PLACEHOLDER_API_KEY') {
    return {
      success: false,
      error: 'Gemini API 키가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 설정하세요.',
    };
  }

  try {
    // Gemini 2.0 Flash with image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Create a simple, colorful, child-friendly illustration for a phonics learning app. The image should clearly show: ${prompt}. Style: bright colors, cartoon-like, educational, suitable for children ages 4-8. No text in the image.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API 요청 실패');
    }

    const data = await response.json();

    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          const imageUrl = `data:${mimeType};base64,${base64Data}`;
          return { success: true, imageUrl };
        }
      }
    }

    return {
      success: false,
      error: '이미지를 생성하지 못했습니다. 다른 프롬프트를 시도해보세요.',
    };
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.',
    };
  }
}

// Fallback: Use Unsplash API for image search
export async function searchUnsplashImage(query: string): Promise<GenerateImageResponse> {
  try {
    // Using Unsplash Source (no API key required, but limited)
    const imageUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(query)},illustration,colorful`;

    // Verify the image loads
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => resolve({ success: true, imageUrl });
      img.onerror = () => resolve({
        success: false,
        error: '이미지를 찾을 수 없습니다.',
      });
      img.src = imageUrl;

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve({ success: true, imageUrl });
      }, 5000);
    });
  } catch (error) {
    return {
      success: false,
      error: '이미지 검색 중 오류가 발생했습니다.',
    };
  }
}
