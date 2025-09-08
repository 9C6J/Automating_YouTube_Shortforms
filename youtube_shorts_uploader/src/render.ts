import {renderVideo} from '@revideo/renderer';

async function sleep(ms: number){
  return new Promise(r => setTimeout(r, ms));
}

async function render() {
  console.log('Rendering video...');

  let lastError: any = null;
  for(let attempt = 1; attempt <= 3; attempt++){
    try {
      const file = await renderVideo({
        projectFile: './src/project.tsx',
        settings: {logProgress: true},
      });
      console.log(`Rendered video to ${file}`);
      return;
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err);
      console.warn(`Render attempt ${attempt} failed: ${msg}`);
      if (attempt < 3 && /Navigating frame was detached|Target closed|Navigation/.test(msg)){
        console.log('Transient browser error detected. Retrying shortly...');
        await sleep(1500 * attempt);
        continue;
      }
      break;
    }
  }
  throw lastError;
}

render();
