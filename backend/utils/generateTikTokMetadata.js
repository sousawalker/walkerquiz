require('dotenv').config();
const { ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

async function generateTikTokMetadata(quizQuestion, bedrockClient) {
  const prompt = `
  Por favor, gere uma breve descrição em apenas uma string, em ${process.env.LANGUAGE}, sem emotes, para um vídeo do TikTok promovendo um quiz com a seguinte pergunta:

  "${quizQuestion}"

  Inclua também 10 hashtags relevantes em sequência, em ${process.env.LANGUAGE}, focado em quizzes, curiosidades, engajamento e resposta em formato JSON, por exemplo:
  {
    "description": "Descrição da postagem...",
    "tags": ["#quiz", "#curiosidades", "#engajamento", "#resposta", "#..."]
  }
  `;

  const command = new ConverseCommand({
    modelId: process.env.BEDROCK_MODEL_ID,
    messages: [
      {
        role: 'user',
        content: [
          {
            text: prompt
          }
        ]
      }
    ],
    inferenceConfig: { temperature: 0.7 }
  });

  const response = await bedrockClient.send(command);

  let rawText = response.output.message.content[0].text;

  rawText = rawText.replace(/^[^{]+/, '').replace(/\n/g, '').replace(/\"/g, '"');

  let metadata;

  try {
    metadata = JSON.parse(rawText);
  } catch (err) {
    console.warn('Falha ao parsear JSON de metadados do TikTok:', err);

    metadata = {
      description: 'Vídeo do quiz!',
      tags: ['#quiz', '#curiosidades']
    }
  }

  return {
    description: metadata.description || 'Vídeo do quiz!',
    tags: metadata.tags || ['#quiz', '#curiosidades']
  };
}

module.exports = generateTikTokMetadata;
