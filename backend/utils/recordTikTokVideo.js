const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');

const AUDIO_COUNTER_FILE = path.join(__dirname, '../audioCounter.txt');

async function recordTikTokVideo(url, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 1080, height: 1920 });

  await page.goto(url);

  await page.waitForTimeout(500);

  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: true,
    fps: 60,
    videoFrame: {
      width: 1080,
      height: 1920
    },
    videoCodec: 'libx264'
  });

  await recorder.start(outputPath);

  await page.waitForTimeout(18000);

  await recorder.stop();

  await browser.close();

  const videoSemAudio = path.join(__dirname, '../videos/quizVideoNoAudio.mp4');
  const audioPath = path.join(__dirname, `../audios/${getRandomNumber()}.mp3`);
  const videoFinal = path.join(__dirname, '../videos/quizVideo.mp4');

  await addAudioToVideo(videoSemAudio, audioPath, videoFinal);
}

function getRandomNumber() {
  let currentNumber = 1;

  // Lê o número atual do arquivo
  try {
    if (fs.existsSync(AUDIO_COUNTER_FILE)) {
      currentNumber = parseInt(fs.readFileSync(AUDIO_COUNTER_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn('Erro ao ler contador de áudio:', error);
  }

  // Incrementa o número
  let nextNumber = Number(currentNumber) + 1;

  // Se chegou a 20, volta para 1
  if (nextNumber > 20) {
    nextNumber = 1;
  }

  // Salva o próximo número
  try {
    fs.writeFileSync(AUDIO_COUNTER_FILE, nextNumber.toString());
  } catch (error) {
    console.error('Erro ao salvar contador de áudio:', error);
  }

  // Retorna o número atual formatado com dois dígitos
  return currentNumber.toString().padStart(2, '0');
}

function addAudioToVideo(inputVideo, inputAudio, outputVideo) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(inputVideo)
      .input(inputAudio)
      .outputOptions('-shortest')
      .audioCodec('aac')
      .videoCodec('copy')
      .output(outputVideo)
      .on('end', async () => {
        console.log('Vídeo gerado em:', outputVideo);

        const thumbnailPath = outputVideo.replace(/\.\w+$/, '_thumb.jpg');

        try {
          await generateThumbnail(outputVideo, thumbnailPath, 9);

          console.log('Thumbnail gerado em:', thumbnailPath);
        } catch (err) {
          console.error('Erro ao gerar thumbnail:', err);
        }

        resolve();
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

function generateThumbnail(videoPath, thumbnailPath, second) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(videoPath)
      .seekInput(second)
      .output(thumbnailPath)
      .frames(1)
      .on('end', () => resolve(thumbnailPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

module.exports = recordTikTokVideo;
