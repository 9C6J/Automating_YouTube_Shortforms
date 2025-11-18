import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs/promises';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
});

export async function generateSubtitles(
  audioPath: string,
  script: string
): Promise<any[]> {
  try {
    // Gemini로 오디오 분석 및 타임스탬프 생성
    const audioBuffer = await fs.readFile(audioPath);
    const base64Audio = audioBuffer.toString('base64');
    
    const model = ai.models.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const response = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/wav',
          data: base64Audio
        }
      },
      {
        text: `Transcribe this Korean audio and provide word-level timestamps.
        Expected text: ${script}
        
        Return JSON array format:
        [
          {"word": "단어", "start": 0.0, "end": 0.5},
          {"word": "다음단어", "start": 0.5, "end": 1.0}
        ]
        
        Only return the JSON array, no markdown or explanation.`
      }
    ]);
    
    const text = response.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const subtitles = JSON.parse(jsonMatch[0]);
      return subtitles;
    }
    
    // 폴백: 스크립트를 균등하게 분할
    return generateFallbackSubtitles(script);
    
  } catch (error) {
    console.error('Error generating subtitles:', error);
    return generateFallbackSubtitles(script);
  }
}

function generateFallbackSubtitles(script: string): any[] {
  const words = script.split(' ');
  const duration = 60; // 기본 60초 영상
  const timePerWord = duration / words.length;
  
  return words.map((word, index) => ({
    word,
    start: index * timePerWord,
    end: (index + 1) * timePerWord
  }));
}
