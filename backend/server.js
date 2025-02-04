require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const cron = require('node-cron');

const recordTikTokVideo = require('./utils/recordTikTokVideo');
const generateQuizContent = require('./utils/generateQuizContent');
const generateTikTokMetadata = require('./utils/generateTikTokMetadata');
const quizPrompt = require('./utils/quizPrompt');
const publishVideoToTikTok = require('./utils/publishVideoToTikTok');

const app = express();
const port = process.env.PORT || 3000;
const waitTime = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Configuração do cronjob
const cronSchedules = [
  { time: '0 0 * * *', display: '00:00' },
  { time: '0 4 * * *', display: '04:00' },
  { time: '0 8 * * *', display: '08:00' },
  { time: '0 12 * * *', display: '12:00' },
  { time: '0 16 * * *', display: '16:00' },
  { time: '0 20 * * *', display: '20:00' }
];

// Registra cada horário no cron
cronSchedules.forEach(({ time, display }) => {
  cron.schedule(time, async () => {
    console.log(`\nIniciando execução agendada em ${new Date().toLocaleString()}`);
    try {
      await updateQuizQuestionAndPostTikTok();
      console.log(`✅ Execução agendada concluída com sucesso em ${new Date().toLocaleString()}\n`);
    } catch (error) {
      console.error(`❌ Erro na execução agendada: ${error.message}\n`);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
});

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const getPreviousQuestions = () => {
  if (fs.existsSync('questions_log.txt')) {
    return fs.readFileSync('questions_log.txt', 'utf8').split('\n').filter(Boolean);
  }

  return [];
};

const logQuestion = (question) => {
  if (question) {
    fs.appendFileSync('questions_log.txt', `${question}\n`);
  } else {
    console.warn('Tentou registrar uma pergunta indefinida.');
  }
};

const updateQuizQuestionAndPostTikTok = async () => {
  try {
    const previousQuestions = getPreviousQuestions();

    const generateUniqueQuestion = async () => {
      const promptWithHistory = `${quizPrompt}\n\nEvite essas perguntas:\n${previousQuestions.join('\n')}`;

      const command = new ConverseCommand({
        modelId: process.env.BEDROCK_MODEL_ID,
        messages: [
          {
            role: 'user',
            content: [
              {
                text: promptWithHistory
              }
            ]
          }
        ],
        inferenceConfig: { temperature: 0.7 }
      });

      const response = await bedrockClient.send(command);

      let rawText = response.output.message.content[0].text;

      rawText = rawText.replace(/^[^{]+/, '').replace(/\n/g, '').replace(/\\"/g, '"');

      let generatedQuestion;

      try {
        generatedQuestion = JSON.parse(rawText);
      } catch (parseError) {
        console.warn('A resposta não é uma string JSON válida. Usando texto bruto como objeto.');

        generatedQuestion = rawText;
      }

      return generatedQuestion;
    };

    let isUnique = false;

    let generatedQuestion;

    while (!isUnique) {
      generatedQuestion = await generateUniqueQuestion();

      if (!previousQuestions.includes(generatedQuestion.question)) {
        isUnique = true;
      } else {
        console.warn(`Pergunta repetida: "${generatedQuestion.question}" Tentando novamente...`);

        await waitTime(5000);
      }
    }

    if (generatedQuestion && generatedQuestion.question && Array.isArray(generatedQuestion.options)) {
      logQuestion(generatedQuestion.question);

      const quizContent = generateQuizContent(generatedQuestion);

      fs.writeFileSync('../frontend/src/components/QuizQuestion.tsx', quizContent);

      const { description, tags } = await generateTikTokMetadata(generatedQuestion.question, bedrockClient);

      console.log("Descrição e tags gerados com sucesso!");

      await recordTikTokVideo('http://54.174.171.186:5173/', './videos/quizVideoNoAudio.mp4');

      try {
        const result = await publishVideoToTikTok(path.resolve(__dirname, 'videos', 'quizVideo.mp4'), path.resolve(__dirname, 'videos', 'quizVideo_thumb.jpg'), description, tags, false);

        console.log('Vídeo postado com sucesso:', result);
      } catch (uploadErr) {
        console.error('Erro ao postar no TikTok:', uploadErr);
      }
    } else {
      console.error('A pergunta gerada é inválida ou faltam campos obrigatórios.');
    }
  } catch (error) {
    console.error('Erro ao atualizar a pergunta do teste:', error);
  }
};

app.get('/publish-quiz-tiktok', async (req, res) => {
  await updateQuizQuestionAndPostTikTok();

  res.send('Pergunta do quiz atualizada, criada e vídeo postado no TikTok.');
});

app.get('/publish-video-to-tiktok', async (req, res) => {
  await publishVideoToTikTok(path.resolve(__dirname, 'videos', 'quizVideo.mp4'), path.resolve(__dirname, 'videos', 'quizVideo_thumb.jpg'), 'Descrição do vídeo completo, com todas as respostas. Para teste, use o vídeo sem áudio.', ['#quiz', '#curiosidades', '#engajamento', '#resposta'], true);

  res.send('Vídeo postado no TikTok.');
});

app.listen(port, () => {
  console.log(`Servidor em execução na porta ${port}`);

  console.log('Cronjobs configurados para os horários:');

  console.log('-----------------------------------------');

  cronSchedules.forEach(({ display }) => {
    console.log(`→ ${display}`);
  });
});
