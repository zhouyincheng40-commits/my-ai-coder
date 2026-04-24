const providerEl = document.querySelector('#provider');
const modelEl = document.querySelector('#model');
const endpointEl = document.querySelector('#endpoint');
const outputEl = document.querySelector('#output');
const chatInputEl = document.querySelector('#chatInput');
const taskTypeEl = document.querySelector('#taskType');
const taskInputEl = document.querySelector('#taskInput');
const providerStatusEl = document.querySelector('#providerStatus');

const safeJson = (value) => JSON.stringify(value, null, 2);

async function loadProviders() {
  const response = await fetch('/api/providers');
  const data = await response.json();

  providerEl.innerHTML = data.providers
    .map((provider) => `<option value="${provider.key}">${provider.label}</option>`)
    .join('');

  providerStatusEl.textContent = `可用模型网关：${data.providers
    .map((provider) => provider.label)
    .join(' / ')}`;
}

async function sendChat() {
  outputEl.textContent = '正在调用聊天模型...';

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: providerEl.value,
      model: modelEl.value,
      endpoint: endpointEl.value.trim() || undefined,
      messages: [
        { role: 'system', content: 'You are an enterprise AI copilot.' },
        { role: 'user', content: chatInputEl.value.trim() }
      ]
    })
  });

  const data = await response.json();
  outputEl.textContent = safeJson(data);
}

async function runTask() {
  outputEl.textContent = '正在执行任务...';

  const response = await fetch('/api/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: providerEl.value,
      model: modelEl.value,
      endpoint: endpointEl.value.trim() || undefined,
      taskType: taskTypeEl.value,
      input: taskInputEl.value.trim(),
      options: {
        max_new_tokens: 512
      }
    })
  });

  const data = await response.json();
  outputEl.textContent = safeJson(data);
}

document.querySelector('#sendChat').addEventListener('click', sendChat);
document.querySelector('#runTask').addEventListener('click', runTask);

loadProviders().catch((error) => {
  outputEl.textContent = `初始化失败: ${error.message}`;
});
