import React from 'react';
import { 
  AbsoluteFill, 
  Audio, 
  Img, 
  useCurrentFrame, 
  useVideoConfig,
  interpolate
} from 'remotion';

interface Props {
  audioPath: string;
  imagePath: string;
  subtitles: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

export const ShortsVideo: React.FC<Props> = ({ 
  audioPath, 
  imagePath, 
  subtitles 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // 현재 시간에 표시할 자막 찾기
  const currentSubtitle = subtitles.find(
    sub => currentTime >= sub.start && currentTime <= sub.end
  );

  // 이미지 줌 애니메이션
  const scale = interpolate(
    frame,
    [0, 300],
    [1, 1.2],
    {
      extrapolateRight: 'clamp'
    }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* 배경 이미지 */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        <Img
          src={imagePath}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale})`
          }}
        />
      </AbsoluteFill>

      {/* 어두운 오버레이 */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))'
        }}
      />

      {/* 자막 */}
      {currentSubtitle && (
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 100
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontSize: 48,
              fontWeight: 'bold',
              padding: '20px 40px',
              borderRadius: 10,
              textAlign: 'center',
              maxWidth: '90%',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {currentSubtitle.word}
          </div>
        </AbsoluteFill>
      )}

      {/* 오디오 */}
      <Audio src={audioPath} />
    </AbsoluteFill>
  );
};
