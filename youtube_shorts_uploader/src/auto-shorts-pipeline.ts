import dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  getTrendingTopic, 
  generateScriptFromTrend 
} from './trend-script-generator';
import { 
  generateAudioWithGeminiTTS, 
  getWordTimestampsFromAudio 
} from './gemini-tts-generator';
import { 
  generateImageWithNanobana 
} from './nanobana-image-generator';
import { 
  generateSubtitles 
} from './subtitle-generator';
import { 
  renderVideoWithRemotion 
} from './video-renderer';
import { 
  uploadToYouTubeShorts 
} from './youtube-uploader';

interface VideoMetadata {
  topic: string;
  script: string;
  audioPath: string;
  imagePath: string;
  subtitles: any[];
  videoPath: string;
}

export async function createAutomatedShorts() {
  console.log('🚀 Starting automated YouTube Shorts creation...');
  
  try {
    // 1단계: Google Trends에서 실시간 트렌드 가져오기
    console.log('📊 Step 1: Fetching trending topics from Google Trends...');
    const trendingTopic = await getTrendingTopic();
    console.log(`✅ Trending topic: ${trendingTopic}`);
    
    // 2단계: AI로 스크립트 생성
    console.log('✍️ Step 2: Generating script with AI...');
    const script = await generateScriptFromTrend(trendingTopic);
    console.log(`✅ Script generated (${script.split(' ').length} words)`);
    
    // 3단계: Gemini TTS로 음성 합성
    console.log('🎤 Step 3: Generating audio with Gemini TTS...');
    const audioPath = path.join(__dirname, '../output/audio', `${Date.now()}.wav`);
    await fs.mkdir(path.dirname(audioPath), { recursive: true });
    await generateAudioWithGeminiTTS(script, audioPath);
    console.log(`✅ Audio saved: ${audioPath}`);
    
    // 4단계: Nanobana로 이미지 생성
    console.log('🖼️ Step 4: Generating image with Nanobana...');
    const imagePath = path.join(__dirname, '../output/images', `${Date.now()}.png`);
    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    await generateImageWithNanobana(script, imagePath);
    console.log(`✅ Image saved: ${imagePath}`);
    
    // 5단계: 자막 생성 (음성에서 타이밍 추출)
    console.log('📝 Step 5: Generating subtitles...');
    const subtitles = await generateSubtitles(audioPath, script);
    console.log(`✅ Subtitles generated (${subtitles.length} segments)`);
    
    // 6단계: Remotion으로 비디오 렌더링
    console.log('🎬 Step 6: Rendering video with Remotion...');
    const videoPath = path.join(__dirname, '../output/videos', `shorts_${Date.now()}.mp4`);
    await fs.mkdir(path.dirname(videoPath), { recursive: true });
    await renderVideoWithRemotion({
      audioPath,
      imagePath,
      subtitles,
      outputPath: videoPath
    });
    console.log(`✅ Video rendered: ${videoPath}`);
    
    // 7단계: YouTube Shorts에 업로드
    console.log('📤 Step 7: Uploading to YouTube Shorts...');
    const videoId = await uploadToYouTubeShorts({
      videoPath,
      title: `${trendingTopic.slice(0, 80)} #Shorts`,
      description: script.slice(0, 200),
      tags: ['shorts', trendingTopic.split(' ')[0]]
    });
    console.log(`✅ Video uploaded! Video ID: ${videoId}`);
    console.log(`🎉 Watch at: https://youtube.com/shorts/${videoId}`);
    
    return {
      success: true,
      videoId,
      videoPath
    };
    
  } catch (error) {
    console.error('❌ Error in automated shorts creation:', error);
    throw error;
  }
}

// 메인 실행
if (require.main === module) {
  createAutomatedShorts()
    .then(() => {
      console.log('✨ Automation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Automation failed:', error);
      process.exit(1);
    });
}
