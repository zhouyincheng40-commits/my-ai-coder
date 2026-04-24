import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

const providerConfigs = {
  huggingface: {
    baseUrl: process.env.HF_BASE_URL || 'https://api-inference.huggingface.co/models',
    token: process.env.HF_API_TOKEN,
    headerName: 'Authorization',
    headerPrefix: 'Bearer '
  },
  openaiCompatible: {
    baseUrl: process.env.OPENAI_COMPAT_BASE_URL || 'https://api.openai.com/v1',
    token: process.env.OPENAI_COMPAT_TOKEN,
    headerName: 'Authorization',
    headerPrefix: 'Bearer '
  },
  custom: {
    baseUrl: process.env.CUSTOM_PROVIDER_BASE_URL || '',
    token: process.env.CUSTOM_PROVIDER_TOKEN,
    headerName: process.env.CUSTOM_PROVIDER_HEADER || 'Authorization',
    headerPrefix: process.env.CUSTOM_PROVIDER_PREFIX || 'Bearer '
  }
};

function resolveProvider(provider) {
  const config = providerConfigs[provider];
  if (!config) {
    return { error: 'Unsupported provider' };
  }

  if (!config.baseUrl) {
    return { error: `Provider ${provider} is missing base URL configuration` };
  }

  return { config };
}

function buildHeaders(config, overrides = {}) {
  const headers = { 'Content-Type': 'application/json', ...overrides };
  if (config.token) {
    headers[config.headerName] = `${config.headerPrefix}${config.token}`;
  }
  return headers;
}

app.get('/api/providers', (req, res) => {
  res.json({
    providers: [
      {
        key: 'huggingface',
        label: 'Hugging Face',
        capabilities: ['chat', 'code', 'writing', 'video', 'face-swap (model dependent)']
      },
      {
        key: 'openaiCompatible',
        label: 'OpenAI Compatible',
        capabilities: ['chat', 'code', 'writing']
      },
      {
        key: 'custom',
        label: 'Custom Endpoint',
        capabilities: ['chat', 'code', 'writing', 'video', 'face-swap']
      }
    ]
  });
});

app.post('/api/chat', async (req, res) => {
  const {
    provider = 'huggingface',
    model,
    messages,
    endpoint,
    extraBody = {}
  } = req.body;

  if (!model || !messages?.length) {
    return res.status(400).json({ error: 'model and messages are required' });
  }

  const providerResult = resolveProvider(provider);
  if (providerResult.error) {
    return res.status(400).json({ error: providerResult.error });
  }

  const { config } = providerResult;

  let url;
  let payload;

  if (provider === 'huggingface') {
    url = `${config.baseUrl}/${model}`;
    payload = {
      inputs: messages.map((m) => `${m.role}: ${m.content}`).join('\n'),
      parameters: extraBody.parameters || {}
    };
  } else {
    url = endpoint || `${config.baseUrl}/chat/completions`;
    payload = {
      model,
      messages,
      ...extraBody
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Upstream provider request failed',
        provider,
        detail: parsed
      });
    }

    return res.json({ provider, model, result: parsed });
  } catch (error) {
    return res.status(500).json({ error: 'Network error', detail: error.message });
  }
});

app.post('/api/task', async (req, res) => {
  const {
    provider = 'huggingface',
    model,
    endpoint,
    taskType,
    input,
    options = {}
  } = req.body;

  if (!taskType || !model || !input) {
    return res.status(400).json({ error: 'taskType, model, input are required' });
  }

  const providerResult = resolveProvider(provider);
  if (providerResult.error) {
    return res.status(400).json({ error: providerResult.error });
  }

  const { config } = providerResult;

  let url;
  let payload;

  if (provider === 'huggingface') {
    url = endpoint || `${config.baseUrl}/${model}`;
    payload = {
      inputs: input,
      parameters: { taskType, ...options }
    };
  } else {
    url = endpoint || `${config.baseUrl}/responses`;
    payload = {
      model,
      input,
      metadata: { taskType },
      ...options
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Task request failed',
        provider,
        detail: parsed
      });
    }

    return res.json({ provider, model, taskType, result: parsed });
  } catch (error) {
    return res.status(500).json({ error: 'Network error', detail: error.message });
  }
});

app.listen(port, () => {
  console.log(`Unified AI workspace is running at http://localhost:${port}`);
});
