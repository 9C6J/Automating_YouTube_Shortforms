import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs/promises';
import axios from 'axios';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
});

export async function generateImageWithNanobana(
  script: string,
  savePath: string
): Promise<void> {
  try {
    // 1단계: 스크립트에서 이미지 프롬프트 생성
    const imagePrompt = await generateImagePrompt(script);
    console.log(`Image prompt: ${imagePrompt}`);
    
    // 2단계: Nanobana로 이미지 생성
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nanobana 모델
      contents: [{ 
        parts: [{ 
          text: `Generate a vibrant, eye-catching image for YouTube Shorts: ${imagePrompt}. 
          Style: Cinematic, high quality, vertical 9:16 ratio, bright colors, engaging composition.` 
        }] 
      }]
    });

    // 이미지 데이터 추출
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      part => part.inlineData?.mimeType?.startsWith('image/')
    );
    
    if (!imagePart?.inlineData?.data) {
      throw new Error('No image data received from Nanobana');
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    await fs.writeFile(savePath, imageBuffer);
    
    console.log(`Image generated successfully: ${savePath}`);
  } catch (error) {
    console.error('Error generating image with Nanobana:', error);
    throw error;
  }
}

async function generateImagePrompt(script: string): Promise<string> {
  const model = ai.models.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const result = await model.generateContent([
    `Based on this YouTube Shorts script, create a short image generation prompt (one sentence, max 20 words):
    
    Script: ${script}
    
    Prompt should describe a visually striking scene that represents the main topic.
    Return only the prompt, nothing else.`
  ]);
  
  return result.response.text().trim();
}
