
import dotenv from 'dotenv';
dotenv.config();

import { getVideoScript, generateAudio, getWordTimestamps, dalleGenerate, getImagePromptFromScript } from './utils.js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

async function createAssets(topic: string, voiceName: string){
    const jobId = uuidv4();

    console.log("Generating assets...")
    const script = await getVideoScript(topic);
    console.log("script", script);

    await generateAudio(script, voiceName, `./public/${jobId}-audio.wav`);
    const words = await getWordTimestamps(`./public/${jobId}-audio.wav`);

    console.log("Generating images...")
    const skipEnhancement = process.env["SKIP_GEMINI_PROMPT"] === "1" || process.env["SKIP_GEMINI_PROMPT"] === "true";
    const imagePromises = Array.from({ length: 5 }).map(async (_, index) => {
        const imagePrompt = await getImagePromptFromScript(script);
        const ok = await dalleGenerate(imagePrompt, `./public/${jobId}-image-${index}.png`, { skipPromptEnhancement: skipEnhancement });
        return ok ? `/${jobId}-image-${index}.png` : null;
    });

    const imageFileNames = (await Promise.all(imagePromises)).filter(Boolean) as string[];
    const metadata = {
      audioUrl: `${jobId}-audio.wav`,
      images: imageFileNames,
      words: words
    };
  
    await fs.promises.writeFile(`./public/${jobId}-metadata.json`, JSON.stringify(metadata, null, 2));
}

// createAssets("The moon landing", "Sarah")
createAssets("월식 일식에 대한 이야기를 한국어로 부탁해", "Sarah")