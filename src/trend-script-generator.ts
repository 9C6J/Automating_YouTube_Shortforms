import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getTrendingTopic(): Promise<string> {
  try {
    // Scrapingdog API 사용 (무료 대안: pytrends 또는 serpapi)
    const apiKey = process.env.SCRAPINGDOG_API_KEY;
    
    if (apiKey) {
      const response = await axios.get(
        `https://api.scrapingdog.com/google_trends/realtime`,
        {
          params: {
            api_key: apiKey,
            geo: 'KR', // 한국 트렌드
            category: 'all'
          }
        }
      );
      
      const trends = response.data.trending_searches || [];
      if (trends.length > 0) {
        return trends[0].title || trends[0];
      }
    }
    
    // 폴백: Gemini로 최신 트렌드 추론
    console.warn('⚠️ Google Trends API not available, using fallback method');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      `What is the top trending news or topic in South Korea right now? 
      Provide only the topic name in Korean, maximum 10 words. 
      Focus on viral, interesting, or breaking news suitable for YouTube Shorts.`
    ]);
    return result.response.text().trim();
    
  } catch (error) {
    console.error('Error fetching trending topic:', error);
    return '최신 화제의 소식'; // 기본값
  }
}

export async function generateScriptFromTrend(topic: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `Create a YouTube Shorts script in Korean based on this trending topic: "${topic}"

Requirements:
- 60-80 words total
- Structure: Hook (catchy opening) → Build-up → Climax → Ending with CTA
- Style: Conversational, casual, exciting
- Start with phrases like "이거 알고 있었어?" or "믿을 수 없는 사실!"
- Include real facts or news about this topic
- End with: "좋아요와 구독 부탁드려요!"
- Return ONLY the script text, no hashtags or meta-information

Script:`;

  const result = await model.generateContent([prompt]);
  return result.response.text().trim();
}
