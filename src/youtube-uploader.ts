import { google, youtube_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const OAuth2 = google.auth.OAuth2;

interface UploadOptions {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
}

export async function uploadToYouTubeShorts(
  options: UploadOptions
): Promise<string> {
  try {
    // OAuth2 클라이언트 설정
    const oauth2Client = new OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      'http://localhost:3000/oauth2callback'
    );

    // 저장된 토큰 로드 (처음 실행시 인증 필요)
    const tokenPath = path.join(__dirname, '../youtube-token.json');
    
    try {
      const token = JSON.parse(await fs.promises.readFile(tokenPath, 'utf-8'));
      oauth2Client.setCredentials(token);
    } catch (error) {
      throw new Error('YouTube authentication required. Run auth script first.');
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // 비디오 업로드
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: options.title,
          description: options.description,
          tags: options.tags,
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(options.videoPath)
      }
    });

    const videoId = response.data.id!;
    console.log(`Video uploaded successfully! ID: ${videoId}`);
    
    return videoId;
    
  } catch (error) {
    console.error('Error uploading to YouTube:', error);
    throw error;
  }
}
