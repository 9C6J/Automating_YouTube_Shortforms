import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs/promises';
import * as wav from 'wav';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
});

export async function generateAudioWithGeminiTTS(
  text: string, 
  savePath: string
): Promise<void> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ 
        parts: [{ 
          text: `Say in an energetic and exciting voice: ${text}` 
        }] 
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { 
              voiceName: 'Puck' // 경쾌한 톤 (한국어 지원)
            }
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio data received from Gemini TTS');
    }

    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // WAV 파일로 저장
    await saveWaveFile(savePath, audioBuffer);
    
    console.log(`Audio generated successfully: ${savePath}`);
  } catch (error) {
    console.error('Error generating audio with Gemini TTS:', error);
    throw error;
  }
}

async function saveWaveFile(
  filename: string,
  pcmData: Buffer,
  channels: number = 1,
  rate: number = 24000,
  sampleWidth: number = 2
): Promise<void> {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8
    });
    
    writer.on('finish', resolve);
    writer.on('error', reject);
    writer.write(pcmData);
    writer.end();
  });
}

export async function getWordTimestampsFromAudio(
  audioPath: string
): Promise<any[]> {
  // Gemini Audio API로 타임스탬프 추출
  const model = ai.models.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  // 오디오 파일을 base64로 인코딩
  const audioBuffer = await fs.readFile(audioPath);
  const base64Audio = audioBuffer.toString('base64');
  
  const response = await model.generateContent([
    {
      inlineData: {
        mimeType: 'audio/wav',
        data: base64Audio
      }
    },
    {
      text: 'Transcribe this audio and provide word-level timestamps in JSON format: [{word: string, start: number, end: number}]'
    }
  ]);
  
  const timestamps = JSON.parse(response.response.text());
  return timestamps;
}
