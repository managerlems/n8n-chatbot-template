// public/chat-widget.js
(function () {
  if (window.__chat_widget_loaded) return;
  window.__chat_widget_loaded = true;

  const defaultConfig = {
    webhook: {
      url: "",
      route: "general",
    },
    branding: {
      logo: "",
      name: "DT",
      welcomeText: "Hi 👋, how can we help?",
      responseTimeText: "We typically respond right away",
      // poweredBy: { text: "Powered by DT", link: "https://example.com" }
    },
    style: {
      primaryColor: "#854fff",
      secondaryColor: "#6b3fd4",
      position: "right",
      backgroundColor: "#ffffff",
      fontColor: "#000000",
    },
  };

  const userConfig = window.ChatWidgetConfig || {};
  const config = {
    webhook: { ...defaultConfig.webhook, ...(userConfig.webhook || {}) },
    branding: { ...defaultConfig.branding, ...(userConfig.branding || {}) },
    style: { ...defaultConfig.style, ...(userConfig.style || {}) },
  };

  // Helper: safe fallback for CSS variables
  function safeStyleValue(val, fallback) {
    return val && val.trim() !== "" ? val : fallback;
  }

  // Inject default stylesheet
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    #n8n-chat-widget-container {
      position: fixed;
      bottom: 20px;
      ${config.style.position === "left" ? "left: 20px;" : "right: 20px;"}
      z-index: 9999;
      font-family: sans-serif;
    }
    #n8n-chat-widget-container .chat-bubble {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transition: transform 0.2s ease;
    }
    #n8n-chat-widget-container .chat-bubble:hover {
      transform: scale(1.05);
    }
    #n8n-chat-widget-container .chat-widget {
      display: none;
      flex-direction: column;
      width: 320px;
      height: 420px;
      background: var(--n8n-chat-background-color);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      position: absolute;
      bottom: 70px;
      ${config.style.position === "left" ? "left: 0;" : "right: 0;"}
      animation: slideUp 0.3s ease forwards;
    }
    #n8n-chat-widget-container .chat-widget.open {
      display: flex;
    }
    #n8n-chat-widget-container .chat-header {
      padding: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #n8n-chat-widget-container .chat-header .chat-logo {
      height: 24px;
      margin-right: 8px;
    }
    #n8n-chat-widget-container .chat-title {
      flex: 1;
    }
    #n8n-chat-widget-container .chat-close-btn {
      background: transparent;
      border: none;
      font-size: 20px;
      color: inherit;
      cursor: pointer;
    }
    #n8n-chat-widget-container .chat-body {
      flex: 1;
      padding: 10px;
      overflow-y: auto;
      font-size: 14px;
    }
    #n8n-chat-widget-container .chat-welcome {
      margin-bottom: 4px;
      font-weight: 500;
    }
    #n8n-chat-widget-container .chat-response-time {
      margin-bottom: 10px;
      font-size: 12px;
      color: #666;
    }
    #n8n-chat-widget-container .chat-messages {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #n8n-chat-widget-container .chat-message {
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.3;
    }
    #n8n-chat-widget-container .chat-message.user {
      background: var(--n8n-chat-primary-color);
      color: var(--n8n-chat-font-color);
      align-self: flex-end;
    }
    #n8n-chat-widget-container .chat-message.bot {
      background: #f1f1f1;
      color: #000;
      align-self: flex-start;
    }
    #n8n-chat-widget-container .chat-input {
      display: flex;
      border-top: 1px solid #ddd;
    }
    #n8n-chat-widget-container .chat-input input {
      flex: 1;
      border: none;
      padding: 10px;
      font-size: 14px;
      outline: none;
    }
    #n8n-chat-widget-container .chat-input button {
      background: var(--n8n-chat-primary-color);
      color: var(--n8n-chat-font-color);
      border: none;
      padding: 0 16px;
      cursor: pointer;
    }
    #n8n-chat-widget-container .chat-footer {
      font-size: 11px;
      text-align: center;
      padding: 6px;
      color: #aaa;
      border-top: 1px solid #eee;
    }
    #n8n-chat-widget-container .chat-footer a {
      color: inherit;
      text-decoration: none;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(styleTag);

  // Create widget container
  const widgetContainer = document.createElement("div");
  widgetContainer.id = "n8n-chat-widget-container";
  widgetContainer.style.setProperty(
    "--n8n-chat-primary-color",
    safeStyleValue(config.style.primaryColor, defaultConfig.style.primaryColor)
  );
  widgetContainer.style.setProperty(
    "--n8n-chat-secondary-color",
    safeStyleValue(config.style.secondaryColor, defaultConfig.style.secondaryColor)
  );
  widgetContainer.style.setProperty(
    "--n8n-chat-background-color",
    safeStyleValue(config.style.backgroundColor, defaultConfig.style.backgroundColor)
  );
  widgetContainer.style.setProperty(
    "--n8n-chat-font-color",
    safeStyleValue(config.style.fontColor, defaultConfig.style.fontColor)
  );

  // Optional poweredBy footer
  const poweredByHTML = config.branding.poweredBy
    ? `<div class="chat-footer"><a href="${config.branding.poweredBy.link}" target="_blank">${config.branding.poweredBy.text}</a></div>`
    : "";

  // Build widget HTML
  widgetContainer.innerHTML = `
    <div class="chat-widget ${config.style.position}">
      <div class="chat-header" style="background-color: var(--n8n-chat-primary-color); color: var(--n8n-chat-font-color)">
        ${
          config.branding.logo
            ? `<img src="${config.branding.logo}" alt="logo" class="chat-logo" />`
            : ""
        }
        <div class="chat-title">${config.branding.name}</div>
        <button class="chat-close-btn">×</button>
      </div>
      <div class="chat-body">
        <div class="chat-welcome">${config.branding.welcomeText}</div>
        <div class="chat-response-time">${config.branding.responseTimeText}</div>
        <div class="chat-messages"></div>
      </div>
      <div class="chat-input">
        <input type="text" placeholder="Type a message..." />
        <button>Send</button>
      </div>
      ${poweredByHTML}
    </div>
    <div class="chat-bubble" style="background-color: var(--n8n-chat-primary-color); color: var(--n8n-chat-font-color)">💬</div>
  `;

  document.body.appendChild(widgetContainer);

  // Toggle widget open/close
  const chatBubble = widgetContainer.querySelector(".chat-bubble");
  const chatWidget = widgetContainer.querySelector(".chat-widget");
  const chatClose = widgetContainer.querySelector(".chat-close-btn");

  chatBubble.addEventListener("click", () => {
    chatWidget.classList.add("open");
    chatBubble.style.display = "none";
  });

  chatClose.addEventListener("click", () => {
    chatWidget.classList.remove("open");
    chatBubble.style.display = "flex";
  });

  // Handle sending messages
  const inputField = widgetContainer.querySelector(".chat-input input");
  const sendBtn = widgetContainer.querySelector(".chat-input button");
  const messagesContainer = widgetContainer.querySelector(".chat-messages");

  function addMessage(text, sender = "user") {
    const msg = document.createElement("div");
    msg.className = `chat-message ${sender}`;
    msg.innerText = text;
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;
    addMessage(text, "user");
    inputField.value = "";

    try {
      const res = await fetch(config.webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, route: config.webhook.route }),
      });
      const data = await res.json();
      if (data && data.reply) {
        addMessage(data.reply, "bot");
      } else {
        addMessage("Sorry, no response from server.", "bot");
      }
    } catch (err) {
      console.error("Chat widget error:", err);
      addMessage("Error sending message.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
