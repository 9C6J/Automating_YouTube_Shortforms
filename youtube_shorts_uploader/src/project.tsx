import {Audio, Img, makeScene2D, Txt, Rect, Layout} from '@revideo/2d';
import {all, createRef, waitFor, useScene, Reference, createSignal, makeProject} from '@revideo/core';
import metadata from './metadata.json';
import './global.css';

interface Word {
  punctuated_word: string;
  start: number;
  end: number;
}

interface captionSettings {
  fontSize: number;
  textColor: string;
  fontWeight: number;
  fontFamily: string;
  numSimultaneousWords: number;
  stream: boolean;
  textAlign: "center" | "left";
  textBoxWidthInPercent: number;
  borderColor?: string;
  borderWidth?: number;
  currentWordColor?: string;
  currentWordBackgroundColor?: string;
  shadowColor?: string;
  shadowBlur?: number;
  fadeInAnimation?: boolean;
}

const textSettings: captionSettings = {
  fontSize: 80, // 자막 글자 크기
  numSimultaneousWords: 3, // 동시에 표시할 최대 단어 수
  textColor: "white", // 자막 기본 글자 색상
  fontWeight: 800, // 자막 글자 두께
  fontFamily: "Mulish", // 자막 글꼴
  stream: false, // true면 단어가 하나씩 순차적으로 나타남
  textAlign: "center", // 자막 정렬(가운데 정렬)
  textBoxWidthInPercent: 70, // 자막 박스의 너비(비율)
  fadeInAnimation: true, // 자막이 서서히 나타나는 애니메이션 사용 여부
  
  //📌 수정된 코드
  currentWordColor: "orange", // 현재 단어 강조 색상
  currentWordBackgroundColor: "", // 현재 단어 배경 강조 색상
  
  shadowColor: "black", // 자막 그림자 색상
  shadowBlur: 30 // 자막 그림자 번짐 정도
}

/**
 * The Revideo scene
 */
const scene = makeScene2D('scene', function* (view) {
  const images = useScene().variables.get('images', [])();
  const audioUrl = useScene().variables.get('audioUrl', 'none')();
  const words = useScene().variables.get('words', [])();

  const duration = words[words.length-1].end + 0.5;

  const headerRef = createRef<Layout>();
  const imageContainer = createRef<Layout>();
  const textContainer = createRef<Layout>();

  yield view.add(
    <>
      {/* 📌 수정된 코드 */}
      {/* 메인 레이아웃 */}
      <Layout
        layout
        size={["100%", "100%"]}
        direction={"column"}
        gap={0}
        padding={0}
        justifyContent={"start"}
        alignItems={"stretch"}
      >
        {/* 헤더 영역 - 25% */}
        <Layout
          layout
          ref={headerRef}
          size={["100%", "25%"]}
          padding={0}
          justifyContent={"center"}
          alignItems={"center"}
        >
        </Layout>
        {/* 본문 영역 - 55% */}
        <Layout
          layout
          ref={imageContainer}
          size={["100%", "55%"]}
          padding={0}
          justifyContent={"center"}
          alignItems={"center"}
        >
        </Layout>
        {/* 푸터 영역 - 20% */}
        <Layout
          layout
          ref={textContainer}
          size={["100%", "20%"]}
          padding={0}
          justifyContent={"center"}
          alignItems={"center"}
        >
        </Layout>
        {/* 하단 여백 - 10% */}
        <Layout
          layout
          size={["100%", "10%"]}
          padding={0}
        >
        </Layout>
      </Layout>
      <Audio
        src={audioUrl}
        play={true}
      />
      <Audio
        src={"https://revideo-example-assets.s3.amazonaws.com/chill-beat-2.mp3"}
        play={true}
        volume={0.1}
      />
    </>
  );
	
  // 📌 수정된 코드
  // 헤더에 텍스트 추가 (예시)
  headerRef().add(
    <Txt
      fontSize={60} // 헤더 글자 크기
      fontWeight={700} // 헤더 글자 두께
      fill="white" // 헤더 글자 색상
      textAlign="center" // 가운데 정렬
    >
      숏츠 제목 //📌이 곳에 원하는 숏츠 제목 입력

    </Txt>
  );

  yield* all(
    displayImages(imageContainer, images, duration),
    displayWords(
      textContainer,
      words,
      textSettings
    )
  )
});

function* displayImages(container: Reference<Layout>, images: string[], totalDuration: number){
  for(const img of images){
    const ref = createRef<Img>();
    container().add(<Img 
      src={img}
      size={["100%", "100%"]}
      ref={ref}
      zIndex={0}
    /> 
    )
    yield* waitFor(totalDuration/images.length);
  }
}

function* displayWords(container: Reference<Layout>, words: Word[], settings: captionSettings){
  let waitBefore = words[0].start;

  for (let i = 0; i < words.length; i += settings.numSimultaneousWords) {
    const currentBatch = words.slice(i, i + settings.numSimultaneousWords);
    const nextClipStart =
      i < words.length - 1 ? words[i + settings.numSimultaneousWords]?.start || null : null;
    const isLastClip = i + settings.numSimultaneousWords >= words.length;
    const waitAfter = isLastClip ? 1 : 0;
    const textRef = createRef<Txt>();
    yield* waitFor(waitBefore);

    if(settings.stream){
      let nextWordStart = 0;
      yield container().add(<Txt width={`${settings.textBoxWidthInPercent}%`} textWrap={true} zIndex={2} textAlign={settings.textAlign} ref={textRef}/>);

      for(let j = 0; j < currentBatch.length; j++){
        const word = currentBatch[j];
        yield* waitFor(nextWordStart);
        const optionalSpace = j === currentBatch.length-1? "" : " ";
        const backgroundRef = createRef<Rect>();
        const wordRef = createRef<Txt>();
        const opacitySignal = createSignal(settings.fadeInAnimation ? 0.5 : 1);
        textRef().add(
          <Txt
            fontSize={settings.fontSize}
            fontWeight={settings.fontWeight}
            fontFamily={settings.fontFamily}
            textWrap={true}
            textAlign={settings.textAlign}
            fill={settings.currentWordColor}
            ref={wordRef}
            lineWidth={settings.borderWidth}
            shadowBlur={settings.shadowBlur}
            shadowColor={settings.shadowColor}
            zIndex={2}
            stroke={settings.borderColor}
            opacity={opacitySignal}
          >
            {word.punctuated_word}
          </Txt>
        );
        textRef().add(<Txt fontSize={settings.fontSize}>{optionalSpace}</Txt>);
        // 텍스트가 완전히 렌더링된 후 배경 추가
        yield;
        container().add(<Rect fill={settings.currentWordBackgroundColor} zIndex={1} size={wordRef().size} position={wordRef().position} radius={10} padding={10} ref={backgroundRef} />);
        yield* all(waitFor(word.end-word.start), opacitySignal(1, Math.min((word.end-word.start)*0.5, 0.1)));
        wordRef().fill(settings.textColor);
        backgroundRef().remove();
        nextWordStart = currentBatch[j+1]?.start - word.end || 0;
      }
      textRef().remove();

    } else {
      yield container().add(<Txt width={`${settings.textBoxWidthInPercent}%`} textAlign={settings.textAlign} ref={textRef} textWrap={true} zIndex={2}/>);

      const wordRefs = [];
      const opacitySignal = createSignal(settings.fadeInAnimation ? 0.5 : 1);
      for(let j = 0; j < currentBatch.length; j++){
        const word = currentBatch[j];
        const optionalSpace = j === currentBatch.length-1? "" : " ";
        const wordRef = createRef<Txt>();
        textRef().add(
          <Txt
            fontSize={settings.fontSize}
            fontWeight={settings.fontWeight}
            ref={wordRef}
            fontFamily={settings.fontFamily}
            textWrap={true}
            textAlign={settings.textAlign}
            fill={settings.textColor}
            zIndex={2}
            stroke={settings.borderColor}
            lineWidth={settings.borderWidth}
            shadowBlur={settings.shadowBlur}
            shadowColor={settings.shadowColor}
            opacity={opacitySignal}
          >
            {word.punctuated_word}
          </Txt>
        );
        textRef().add(<Txt fontSize={settings.fontSize}>{optionalSpace}</Txt>);

        // we have to yield once to await the first word being aligned correctly
        if(j===0 && i === 0){
          yield;
        }
        wordRefs.push(wordRef);
      }

      yield* all(
        opacitySignal(1, Math.min(0.1, (currentBatch[0].end-currentBatch[0].start)*0.5)),
        highlightCurrentWordSequentially(container, currentBatch, wordRefs, settings.currentWordColor, settings.currentWordBackgroundColor),
        waitFor(currentBatch[currentBatch.length-1].end - currentBatch[0].start + waitAfter), 
      );
      textRef().remove();
    }
    waitBefore = nextClipStart !== null ? nextClipStart - currentBatch[currentBatch.length-1].end : 0;
  }
}

function* highlightCurrentWordSequentially(container: Reference<Layout>, currentBatch: Word[], wordRefs: Reference<Txt>[], wordColor: string, backgroundColor: string){
  let nextWordStart = 0;

  for(let i = 0; i < currentBatch.length; i++){
    yield* waitFor(nextWordStart);
    const word = currentBatch[i];
    const originalColor = wordRefs[i]().fill();
    nextWordStart = currentBatch[i+1]?.start - word.end || 0;
    wordRefs[i]().text(wordRefs[i]().text());
    wordRefs[i]().fill(wordColor);

    const backgroundRef = createRef<Rect>();
    if(backgroundColor){
      // 텍스트가 완전히 렌더링된 후 배경 추가
      yield;
      container().add(<Rect fill={backgroundColor} zIndex={1} size={wordRefs[i]().size} position={wordRefs[i]().position} radius={10} padding={10} ref={backgroundRef} />);
    }

    yield* waitFor(word.end-word.start);
    wordRefs[i]().text(wordRefs[i]().text());
    wordRefs[i]().fill(originalColor);

    if(backgroundColor){
      backgroundRef().remove();
    }
  }
}

/**
 * The final revideo project
 */
export default makeProject({
  scenes: [scene],
  variables: metadata,
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});