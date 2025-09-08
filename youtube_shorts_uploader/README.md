

youtube_shorts_uploader/
├── src/
│   ├── get-assets.ts   # 이미지/스크립트/오디오 생성 관련 유틸함수 파일
│   ├── global.css      # 전체 프로젝트에 적용되는 전역 스타일 파일
│   ├── metadata.json   # 에셋 정보 저장 파일
│   ├── project.tsx     # 동영상 생성 부분
│   ├── render.ts       # 렌더링 관련 함수 & 진입점파일
│   ├── utils.ts       	# 유틸리티 함수들
│   └── metadata/       # 영상 스크립트 데이터
├── public/             # 정적 파일들
├── output/             # 생성된 영상 출력
├── package.json        # 실행 scripts명령어 및 프로젝트 패키지 관리
├── .env                # 환경변수 파일
└── .gitignore          #



getWordTimestamps(audioFilePath: string)
오디오 파일을 받아서, Deepgram API로 음성 인식(자막) 결과의 단어별 타임스탬프를 반환합니다.
반환값: 각 단어의 시작/끝 시간 정보 배열
오디오 파일에서 단어별 시간 정보를 추출합니다.

generateAudio(text: string, voiceName: string, savePath: string)
텍스트와 목소리 이름을 받아, ElevenLabs API로 음성 파일을 생성하고 지정한 경로에 저장합니다.
내부적으로 getVoiceByName을 호출해 voiceName에 맞는 voiceId를 찾습니다.
텍스트를 AI 목소리로 변환해 오디오 파일로 저장합니다.

getVoiceByName(name: string)
ElevenLabs API에서 등록된 목소리 목록을 받아와, 이름이 일치하는 voiceId를 반환합니다.
일치하는 목소리가 없으면 null 반환
원하는 목소리 이름에 맞는 voiceId를 찾아줍니다.

getVideoScript(videoTopic: string)
주제를 받아, Perplexity API로 유튜브 쇼츠용 흥미로운 스크립트를 생성합니다.
60~80단어, 캐치프레이즈로 시작, 해시태그/메타정보 없이 순수 대본만 반환
주제에 맞는 유튜브 쇼츠 대본을 AI로 생성합니다.

getImagePromptFromScript(script: string)
스크립트를 받아, 해당 내용에 어울리는 AI 이미지 생성 프롬프트(한 문장)를 Perplexity API로 생성합니다.
반환값: 텍스트-투-이미지 모델에 적합한 짧은 프롬프트
대본에 어울리는 AI 이미지 프롬프트를 만들어줍니다.

dalleGenerate(prompt: string, savePath: string)
프롬프트를 받아, Gemini API로 프롬프트를 개선한 후 OpenAI DALL·E 3로 이미지를 생성하고 지정한 경로에 저장합니다.
개선된 프롬프트는 별도 텍스트 파일로도 저장됩니다.
프롬프트를 개선하여 더 고품질의 AI 이미지를 생성합니다.

## 환경변수 설정

프로젝트를 실행하기 전에 `.env` 파일을 생성하고 다음 환경변수들을 설정해야 합니다:

```env
# Perplexity API 설정 (필수 - 텍스트 생성용)
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Gemini API 설정 (필수 - 이미지 프롬프트 개선용)
GEMINI_API_KEY=your_gemini_api_key_here

# Deepgram API 설정 (필수 - 음성 인식용)
DEEPGRAM_API_KEY=your_deepgram_api_key_here
# Deepgram 언어 힌트(선택, 기본 ko)
DEEPGRAM_LANGUAGE=ko

# ElevenLabs API 설정 (필수 - 음성 합성용)
ELEVEN_API_KEY=your_elevenlabs_api_key_here

# OpenAI API 설정 (필수 - 이미지 생성용)
# Gemini로 개선된 프롬프트를 사용하여 DALL-E로 이미지 생성
OPENAI_API_KEY=your_openai_api_key_here

# Gemini 프롬프트 개선을 건너뛰고 바로 DALL·E 호출(선택)
# 1 또는 true 로 설정하면 프롬프트 개선 스킵
SKIP_GEMINI_PROMPT=1
```

### API 키 발급 방법

1. **Perplexity API**: https://www.perplexity.ai/ 에서 계정 생성 후 API 키 발급
2. **Gemini API**: https://aistudio.google.com/ 에서 계정 생성 후 API 키 발급
3. **Deepgram API**: https://deepgram.com/ 에서 계정 생성 후 API 키 발급
4. **ElevenLabs API**: https://elevenlabs.io/ 에서 계정 생성 후 API 키 발급
5. **OpenAI API**: https://platform.openai.com/ 에서 계정 생성 후 API 키 발급 (이미지 생성용)

### 주의사항

- **이미지 생성 과정**: Gemini API로 이미지 프롬프트를 개선한 후, OpenAI DALL-E API로 실제 이미지를 생성합니다.
- **API 비용**: 모든 API는 사용량에 따라 과금되므로, 사용 전 요금제를 확인하세요.
- **Gemini API**: 이미지 생성 프롬프트 개선에 사용되며, 실제 이미지 생성은 DALL-E를 사용합니다.