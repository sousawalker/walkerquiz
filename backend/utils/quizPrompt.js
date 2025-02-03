require('dotenv').config();

module.exports = `Gere uma questão difícil de múltipla escolha sobre curiosidades, em ${process.env.LANGUAGE}, com uma resposta correta e três incorretas.

Randomize a posição da resposta correta.

Responda SOMENTE com JSON no seguinte formato:
{
  "question": "<question text>",
  "options": [
    { "text": "<option 1>", "correct": true/false },
    { "text": "<option 2>", "correct": true/false },
    { "text": "<option 3>", "correct": true/false },
    { "text": "<option 4>", "correct": true/false }
  ]
}`;
