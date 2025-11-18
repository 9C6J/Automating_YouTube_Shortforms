import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import * as path from 'path';
import * as fs from 'fs/promises';

interface RenderOptions {
  audioPath: string;
  imagePath: string;
  subtitles: any[];
  outputPath: string;
}

export async function renderVideoWithRemotion(options: RenderOptions): Promise<void> {
  try {
    // Remotion 프로젝트 번들링
    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, './remotion/index.ts'),
      webpackOverride: (config) => config
    });

    // Composition 선택
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'ShortsVideo',
      inputProps: {
        audioPath: options.audioPath,
        imagePath: options.imagePath,
        subtitles: options.subtitles
      }
    });

    // 비디오 렌더링
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: options.outputPath,
      inputProps: {
        audioPath: options.audioPath,
        imagePath: options.imagePath,
        subtitles: options.subtitles
      },
      onProgress: ({ progress }) => {
        console.log(`Rendering progress: ${(progress * 100).toFixed(1)}%`);
      }
    });

    console.log(`Video rendered successfully: ${options.outputPath}`);
  } catch (error) {
    console.error('Error rendering video:', error);
    throw error;
  }
}
