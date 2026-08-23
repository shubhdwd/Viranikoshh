import http from 'http';

const MOCK_PORT = parseInt(process.env.MOCK_AI_PORT || '3099', 10);

function geminiResponse(text: string) {
  return {
    candidates: [
      {
        content: { parts: [{ text }], role: 'model' },
        finishReason: 'STOP',
        index: 0,
      },
    ],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
  };
}

function classifyPrompt(prompt: string): 'translate' | 'tags' | 'detect' | 'unknown' {
  const lower = prompt.toLowerCase();
  if (lower.includes('translate the following text')) return 'translate';
  if (lower.includes('extract structured metadata')) return 'tags';
  if (lower.includes('detect the primary language')) return 'detect';
  return 'unknown';
}

function handleGemini(body: any): object {
  const prompt = body?.contents?.[0]?.parts?.[0]?.text || '';
  switch (classifyPrompt(prompt)) {
    case 'translate':
      return geminiResponse('This is a mock translated text for E2E testing purposes.');
    case 'tags':
      return geminiResponse(
        JSON.stringify({
          summary: 'A cultural record created during E2E automated testing.',
          tags: ['e2e-test', 'cultural-record', 'automation'],
          category: 'Other',
          region: 'Pan-India',
        })
      );
    case 'detect':
      return geminiResponse(JSON.stringify({ code: 'en', name: 'English' }));
    default:
      return geminiResponse('Mock response');
  }
}

function handleGroq(): object {
  return {
    text: 'This is a mock transcription from Groq Whisper for E2E testing.',
    language: 'en',
    language_probability: 0.95,
    duration: 5.0,
    segments: [],
  };
}

export default async function globalSetup() {
  await new Promise<void>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        const url = req.url || '';

        if (url.includes('/v1beta/models/gemini-2.5-flash:generateContent')) {
          try {
            const parsed = JSON.parse(body);
            const result = handleGemini(parsed);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: 'Bad request', code: 400 } }));
          }
          return;
        }

        if (url.includes('/openai/v1/audio/transcriptions')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(handleGroq()));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Not found', code: 404 } }));
      });
    });

    server.listen(MOCK_PORT, '127.0.0.1', () => {
      console.log(`Mock AI server listening on port ${MOCK_PORT}`);
      resolve();
    });
    server.on('error', reject);
  });
}
