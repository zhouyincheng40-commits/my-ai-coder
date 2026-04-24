const STORAGE_KEY = "my-omni-ai-config";

const ids = ["hfToken", "chatModel", "codeModel", "writerModel", "videoModel", "faceModel"];

const outputs = {
  chat: document.getElementById("chatOutput"),
  code: document.getElementById("codeOutput"),
  writing: document.getElementById("writingOutput"),
  video: document.getElementById("videoOutput"),
  faceswap: document.getElementById("faceOutput")
};

function loadConfig() {
  const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  ids.forEach((id) => {
    if (cached[id]) document.getElementById(id).value = cached[id];
  });
}

function getConfig() {
  return Object.fromEntries(ids.map((id) => [id, document.getElementById(id).value.trim()]));
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getConfig()));
  alert("配置已保存到浏览器");
}

async function hfTextInference(model, prompt, token) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.7,
        return_full_text: false
      }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`模型调用失败：${res.status} ${text}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
  if (data?.generated_text) return data.generated_text;
  return JSON.stringify(data, null, 2);
}

async function hfGenericTask(model, prompt, token) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: prompt })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`任务失败：${res.status} ${text}`);
  return text;
}

async function runAction(kind) {
  const config = getConfig();
  const token = config.hfToken;

  if (!token) {
    outputs[kind].textContent = "请先填写 Hugging Face Token";
    return;
  }

  const promptByKind = {
    chat: document.getElementById("chatPrompt").value,
    code: document.getElementById("codePrompt").value,
    writing: document.getElementById("writingPrompt").value,
    video: document.getElementById("videoPrompt").value,
    faceswap: document.getElementById("facePrompt").value
  };

  const modelByKind = {
    chat: config.chatModel,
    code: config.codeModel,
    writing: config.writerModel,
    video: config.videoModel,
    faceswap: config.faceModel
  };

  outputs[kind].textContent = "正在调用模型，请稍候...";

  try {
    if (["chat", "code", "writing"].includes(kind)) {
      const answer = await hfTextInference(modelByKind[kind], promptByKind[kind], token);
      outputs[kind].textContent = answer;
    } else {
      const answer = await hfGenericTask(modelByKind[kind], promptByKind[kind], token);
      outputs[kind].textContent = `已提交任务（原始响应）:\n${answer}`;
    }
  } catch (error) {
    outputs[kind].textContent = String(error);
  }
}

function bindTabs() {
  const tabButtons = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((x) => x.classList.remove("active"));
      panels.forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

function bindActions() {
  document.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => runAction(btn.dataset.action));
  });

  document.getElementById("saveConfigBtn").addEventListener("click", saveConfig);
}

loadConfig();
bindTabs();
bindActions();
