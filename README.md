# YouTube Shorts Automation Pipeline

주제만 입력하면 AI가 자동으로 YouTube Shorts 영상을 제작하고 업로드하는 완전 자동화 파이프라인입니다.

## 특징

- 📊 **Google Trends 연동**: 실시간 트렌드 토픽 자동 추출
- ✍️ **AI 스크립트 생성**: Gemini 2.0 Flash로 60-80단어 쇼츠 대본 작성
- 🎤 **Gemini TTS**: 고품질 한국어 음성 합성 (30가지 목소리 지원)
- 🖼️ **Nanobana 이미지**: AI 기반 9:16 비율 이미지 생성
- 📝 **자동 자막**: 단어별 타이밍 정보 추출
- 🎬 **Remotion 렌더링**: 전문가 수준의 비디오 제작
- 📤 **YouTube 자동 업로드**: 완성된 영상 즉시 게시

## 자동화 흐름

```
1. Google Trends → 실시간 트렌드 토픽 추출
2. Gemini 2.0 → 토픽 기반 쇼츠 스크립트 생성
3. Gemini TTS → 스크립트를 음성 파일로 변환
4. Nanobana → 스크립트 내용에 맞는 이미지 생성
5. Gemini → 음성에서 자막 타이밍 추출
6. Remotion → 음성 + 이미지 + 자막 합성
7. YouTube API → Shorts 자동 업로드
```

## 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/9C6J/Automating_YouTube_Shortforms.git
cd Automating_YouTube_Shortforms
```

### 2. 의존성 설치

```bash
npm install
# 또는
pnpm install
```

### 3. 환경변수 설정

`.env.example`을 `.env`로 복사하고 API 키를 입력하세요:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# Google API Keys (필수)
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# YouTube API Credentials (필수)
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Google Trends API (선택 - Scrapingdog 사용시)
SCRAPINGDOG_API_KEY=your_scrapingdog_api_key_here
```

### 4. API 키 발급

#### Google AI Studio (Gemini + Nanobana)
1. [Google AI Studio](https://aistudio.google.com/) 접속
2. "Get API Key" 클릭
3. API 키 복사 후 `.env`에 설정

#### YouTube Data API
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 후 YouTube Data API v3 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. Client ID와 Client Secret을 `.env`에 설정

#### Google Trends API (선택)
- [Scrapingdog](https://www.scrapingdog.com/) 가입 (무료 플랜 제공)
- 또는 Gemini 폴백 방식 사용 (기본값)

### 5. YouTube 인증 (최초 1회)

```bash
npm run auth
```

브라우저가 열리면 Google 계정으로 로그인하고 권한을 승인하세요.

## 사용 방법

### 기본 실행

```bash
npm start
```

이 명령어는 다음을 자동으로 수행합니다:
1. Google Trends에서 한국 최신 트렌드 가져오기
2. AI로 토픽 기반 스크립트 생성
3. 음성, 이미지, 자막 생성
4. 비디오 렌더링
5. YouTube Shorts 업로드

### 개발 모드 (자동 재시작)

```bash
npm run dev
```

## 프로젝트 구조

```
Automating_YouTube_Shortforms/
├── src/
│   ├── auto-shorts-pipeline.ts      # 메인 파이프라인
│   ├── trend-script-generator.ts    # Google Trends + 스크립트 생성
│   ├── gemini-tts-generator.ts      # Gemini TTS 음성 합성
│   ├── nanobana-image-generator.ts  # Nanobana 이미지 생성
│   ├── subtitle-generator.ts        # 자막 타이밍 추출
│   ├── video-renderer.ts            # Remotion 렌더링
│   ├── youtube-uploader.ts          # YouTube 업로드
│   └── remotion/
│       ├── ShortsVideo.tsx          # 비디오 컴포넌트
│       └── index.ts
├── output/                         # 생성된 파일들
│   ├── audio/
│   ├── images/
│   └── videos/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 기술 스택

| 기능 | 서비스 | 모델 |
|------|--------|------|
| 트렌드 분석 | Google Trends API | - |
| 스크립트 생성 | Google Gemini | gemini-2.0-flash |
| 음성 합성 | Google Gemini TTS | gemini-2.5-flash-preview-tts |
| 이미지 생성 | Nanobana | gemini-2.5-flash-image |
| 자막 추출 | Google Gemini | gemini-2.0-flash |
| 비디오 렌더링 | Remotion | v4.0 |
| 업로드 | YouTube Data API | v3 |

## 비용

- **Google AI Studio**: 무료 티어 사용 가능 (Gemini + Nanobana)
- **YouTube API**: 무료 (1일 10,000 할당량)
- **Google Trends**: 무료 (또는 Scrapingdog 무료 플랜)
- **Remotion**: 오픈소스 (무료)

## 문제 해결

### YouTube 인증 오류
```bash
# 토큰 삭제 후 재인증
rm youtube-token.json
npm run auth
```

### Remotion 렌더링 실패
- FFmpeg 설치 확인: `ffmpeg -version`
- 설치: `brew install ffmpeg` (Mac) 또는 [FFmpeg 공식 사이트](https://ffmpeg.org/)

### API 키 오류
- `.env` 파일에 모든 필수 키가 설정되어 있는지 확인
- API 키에 공백이나 따옴표가 없는지 확인

## 라이센스

MIT License

## 기여

Pull Request를 환영합니다!

## 참고 자료

- [Gemini API Documentation](https://ai.google.dev/)
- [Gemini TTS Guide](https://ai.google.dev/gemini-api/docs/speech-generation)
- [Nanobana (Gemini Image)](https://aistudio.google.com/)
- [Remotion Documentation](https://remotion.dev/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
