
import dotenv from 'dotenv';
dotenv.config();

import axios from "axios";
import * as fs from "fs";
import { createClient } from "@deepgram/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const deepgram = createClient(process.env["DEEPGRAM_API_KEY"] || "");

// Perplexity API 설정
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_API_KEY = process.env['PERPLEXITY_API_KEY'];

// Gemini API 설정
const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY'] || "");  

export async function getWordTimestamps(audioFilePath: string){
    const {result} = await deepgram.listen.prerecorded.transcribeFile(fs.readFileSync(audioFilePath), {
		model: "nova-2",
		smart_format: true,
		language: process.env["DEEPGRAM_LANGUAGE"] || "ko",
	});

    if (result) {
        return result.results.channels[0].alternatives[0].words;
    } else {
		throw Error("transcription result is null");
    }

}

export async function generateAudio(text: string, voiceName: string, savePath: string) {
	const data = {
		model_id: "eleven_multilingual_v2",
		text: text,
	};

	const voiceId = await getVoiceByName(voiceName);

	const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, data, {
		headers: {
			"Content-Type": "application/json",
			"xi-api-key": process.env.ELEVEN_API_KEY || "",
		},
		responseType: "arraybuffer",
	});

	fs.writeFileSync(savePath, response.data);
}

async function getVoiceByName(name: string) {
	const response = await fetch("https://api.elevenlabs.io/v1/voices", {
		method: "GET",
		headers: {
			"xi-api-key": process.env.ELEVEN_API_KEY || "",
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data: any = await response.json();
	const voice = data.voices.find((voice: {name: string; voice_id: string}) => voice.name === name);
	return voice ? voice.voice_id : null;
}

export async function getVideoScript(videoTopic: string) {
  const prompt = `Create a script for a youtube short. The script should be around 60 to 80 words long and be an interesting text about the provided topic, and it should start with a catchy headline, something like "Did you know that?" or "This will blow your mind". Remember that this is for a voiceover that should be read, so things like hashtags should not be included. Now write the script for the following topic: "${videoTopic}". Now return the script and nothing else, also no meta-information - ONLY THE VOICEOVER.`;

  const response = await axios.post(PERPLEXITY_API_URL, {
    model: "sonar",
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const result = response.data.choices[0].message.content;

  if (result) {
    return result;
  } else {
    throw Error("returned text is null");
  }

}

export async function getImagePromptFromScript(script: string) {
  const prompt = `My goal is to create a Youtube Short based on the following script. To create a background image for the video, I am using a text-to-video AI model. Please write a short (not longer than a single sentence), suitable prompt for such a model based on this script: ${script}.\n\nNow return the prompt and nothing else.`;

  const response = await axios.post(PERPLEXITY_API_URL, {
    model: "sonar",
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 1.0 // high temperature for "creativeness"
  }, {
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const result = response.data.choices[0].message.content;

  if (result) {
    return result;
  } else {
    throw Error("returned text is null");
  }

}

export async function dalleGenerate(prompt: string, savePath: string, options?: { skipPromptEnhancement?: boolean }): Promise<boolean> {
	try {
		if (!process.env['OPENAI_API_KEY']) {
			console.warn("[dalleGenerate] OPENAI_API_KEY is missing. Skipping image generation.");
			return false;
		}
		let finalPrompt = prompt;
		if (!options?.skipPromptEnhancement) {
			// Gemini Pro를 사용하여 이미지 생성 프롬프트 개선
			const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
			const result = await model.generateContent([
				`Create a detailed, high-quality image generation prompt for the following description: "${prompt}". 
				The prompt should be optimized for AI image generation models like DALL-E, Midjourney, or Stable Diffusion.
				Include specific details about style, composition, lighting, and visual elements.
				Make it suitable for YouTube Shorts background images.
				Return only the improved prompt, nothing else.`
			]);
			const response = await result.response;
			finalPrompt = response.text();
			await fs.promises.writeFile(savePath.replace('.png', '_prompt.txt'), finalPrompt);
			console.log(`Improved image prompt: ${finalPrompt}`);
			console.log(`Prompt saved to: ${savePath.replace('.png', '_prompt.txt')}`);
		} else {
			console.log("Skipping prompt enhancement. Using original prompt for DALL·E.");
		}
		
		// 실제 이미지 생성을 위해 OpenAI DALL-E API 사용 (기존 코드 유지)
		// 또는 다른 이미지 생성 서비스 사용 가능
		const { default: OpenAI } = await import('openai');
		const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
		
		const imageResponse = await openai.images.generate({
			model: "dall-e-3",
			prompt: finalPrompt,
			size: "1024x1792",
			quality: "standard",
			n: 1,
		});

		if (!imageResponse.data || !imageResponse.data[0]) {
			throw new Error("No image generated");
		}

		const url = imageResponse.data[0].url;
		const responseImage = await axios.get(url || "", {
			responseType: "arraybuffer",
		});
		const buffer = Buffer.from(responseImage.data, "binary");
		
		await fs.promises.writeFile(savePath, buffer);
		console.log(`Image saved to: ${savePath}`);
		return true;
		
	} catch (error: any) {
		console.error("[dalleGenerate] Error:", error?.message || error);
		if (error?.response?.data) {
			console.error("[dalleGenerate] OpenAI response:", JSON.stringify(error.response.data));
		}
		// 폴백: Gemini 실패 시에도 원본 프롬프트로 DALL·E 시도
		try {
			if (!process.env['OPENAI_API_KEY']) {
				console.warn("[dalleGenerate] OPENAI_API_KEY is not set; skipping fallback image generation.");
				return false;
			}
			const { default: OpenAI } = await import('openai');
			const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
			const imageResponse = await openai.images.generate({
				model: "dall-e-3",
				prompt: prompt,
				size: "1024x1792",
				quality: "standard",
				n: 1,
			});
			if (!imageResponse.data || !imageResponse.data[0]) {
				return false;
			}
			const url = imageResponse.data[0].url;
			const responseImage = await axios.get(url || "", { responseType: "arraybuffer" });
			const buffer = Buffer.from(responseImage.data, "binary");
			await fs.promises.writeFile(savePath, buffer);
			console.log(`Image saved via fallback to: ${savePath}`);
			return true;
		} catch (fallbackError: any) {
			console.error("[dalleGenerate] Fallback failed:", fallbackError?.message || fallbackError);
			if (fallbackError?.response?.data) {
				console.error("[dalleGenerate] OpenAI fallback response:", JSON.stringify(fallbackError.response.data));
			}
			// 최후 폴백: Unsplash 무료 이미지 다운로드 (옵션)
			try {
				if (process.env['ENABLE_UNSPLASH_FALLBACK'] === '1' || process.env['ENABLE_UNSPLASH_FALLBACK'] === 'true') {
					const query = encodeURIComponent(prompt.replace(/[^\w\s가-힣]/g, ' ').slice(0, 80));
					const unsplashUrl = `https://source.unsplash.com/1024x1792/?${query}`;
					console.log(`[dalleGenerate] Trying Unsplash fallback: ${unsplashUrl}`);
					let success = false;
					for (let i = 0; i < 3 && !success; i++) {
						try {
							const imgResp = await axios.get(unsplashUrl, { responseType: 'arraybuffer', maxRedirects: 5 });
							await fs.promises.writeFile(savePath, Buffer.from(imgResp.data));
							success = true;
							console.log(`Image saved via Unsplash fallback to: ${savePath}`);
							return true;
						} catch (e: any) {
							console.warn(`[dalleGenerate] Unsplash attempt ${i+1} failed:`, e?.message || e);
							await new Promise(r => setTimeout(r, 1000 * (i + 1)));
						}
					}
					// Picsum 2차 폴백
					if (process.env['ENABLE_PICSUM_FALLBACK'] === '1' || process.env['ENABLE_PICSUM_FALLBACK'] === 'true') {
						const picsumUrl = `https://picsum.photos/1024/1792`;
						console.log(`[dalleGenerate] Trying Picsum fallback: ${picsumUrl}`);
						const imgResp2 = await axios.get(picsumUrl, { responseType: 'arraybuffer', maxRedirects: 5 });
						await fs.promises.writeFile(savePath, Buffer.from(imgResp2.data));
						console.log(`Image saved via Picsum fallback to: ${savePath}`);
						return true;
					}
				}
			} catch (unsplashError: any) {
				console.error('[dalleGenerate] Fallback image providers failed:', unsplashError?.message || unsplashError);
			}
			console.log("Image generation failed, but prompt was saved. Continuing with text-only mode.");
			return false;
		}
	}
}