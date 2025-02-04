const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const SESSION_DIR = path.resolve('./puppeteer_session_web');

function findChrome() {
  try {
    if (process.platform === 'win32') {
      const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
      ];

      for (const path of paths) {
        if (fs.existsSync(path)) return path;
      }
    } else if (process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
      const chromePath = execSync('which google-chrome').toString().trim();

      if (chromePath) return chromePath;
    }
  } catch (error) {
    console.error('Erro ao procurar Chrome:', error);
  }

  throw new Error('Google Chrome não encontrado. Por favor, instale o Chrome.');
}

async function publishVideoToTikTok(videoPath, capaPath, description, hashtags, openSmallWindow = false) {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const chromePath = findChrome();

  const browser = await puppeteer.launch({
    headless: !openSmallWindow,
    userDataDir: SESSION_DIR,
    executablePath: chromePath,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-features=NetworkService",
      "--ignore-certificate-errors",
      "--enable-accelerated-2d-canvas",
      "--disable-web-security",
      "--allow-file-access",
      ...(openSmallWindow ? ["--window-size=1920,1080"] : [])
    ]
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // Navega para página de upload
    await page.goto('https://www.tiktok.com/tiktokstudio/upload');

    // Cria uma screenshot da página
    setTimeout(async () => {
      await page.screenshot({ path: path.join(__dirname, '../screenshots/screenshot.png') });
    }, 10000);

    // Aguarda o botão de upload aparecer
    await page.waitForSelector('input[type="file"]');

    await page.waitForTimeout(3000);

    // Upload do vídeo
    const inputFile = await page.$('input[type="file"]');
    await inputFile.uploadFile(videoPath);

    // Aguarda o upload completar e a página carregar os elementos
    await page.waitForTimeout(5000);

    // Escreve a descrição simulando digitação humana
    const descriptionInput = await page.$('.public-DraftEditor-content');
    await descriptionInput.click();

    // Deleta o texto "quizVideo"
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    // Escreve a nova descrição
    for (let char of description) {
      await descriptionInput.type(char, { delay: 50 });
    }

    // Adiciona duas quebras de linha após a descrição
    await descriptionInput.press('Enter');
    await descriptionInput.press('Enter');

    // Adiciona as hashtags
    for (let hashtag of hashtags) {
      await descriptionInput.type(hashtag, { delay: 25 });
      await page.waitForTimeout(3000); // Espera o combo de sugestões aparecer
      await descriptionInput.press('Enter');
      await descriptionInput.type(' '); // Espaço entre hashtags
    }

    // Clica primeiro em "Editar capa"
    await page.click('.edit-container');
    await page.waitForTimeout(3000);

    // Agora clica na aba "Carregar capa"
    await page.click('.cover-edit-tab:nth-child(2)');
    await page.waitForTimeout(3000);

    // Upload da capa
    const coverInput = await page.$('input[type="file"][accept="image/png, image/jpeg, image/jpg"]');
    await coverInput.uploadFile(capaPath);
    await page.waitForTimeout(3000);


    // Confirma a capa
    await page.click('.cover-edit-footer:nth-child(3) > button.TUXButton--primary');
    await page.waitForTimeout(3000);


    // Clica em programação
    await page.click('button[data-e2e="post_video_button"]');

    await page.waitForTimeout(3000);
    await browser.close();

    return {
      status: 'success',
      message: 'Vídeo publicado com sucesso no TikTok',
      description,
      hashtags
    };
  } catch (error) {
    console.error('Erro:', error);

    await browser.close();

    throw error;
  }
}

module.exports = publishVideoToTikTok;
