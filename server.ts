import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  // Store the current markdown state
  let currentMarkdown = `# 🚀 Collaborative Markdown Studio Demo

Welcome to the most professional collaborative editor! This demo showcases all the features available.

## 📝 Text Formatting
- **Bold** with \`**\` or __Bold__ with \`__\`
- *Italic* with \`*\` or _Italic_ with \`_\`
- ~~Strikethrough~~ with \`~~\`
- \`Inline Code\` with backticks
- Em-dash replacement: -- becomes —

## 📊 Tables
| Feature | Status | Description |
| :--- | :---: | :--- |
| Real-time | ✅ | Instant sync across clients |
| Offline Mode | 📶 | Edit locally without server |
| History | 🕒 | Undo/Redo support |

## ✅ Task Lists
- [x] Implement WebSockets
- [x] Add Markdown Preview
- [ ] Add AI assistance

## 🔗 Links & Autolinks
- [Google](https://google.com)
- Autolink: <http://www.google.com>

## 💻 Code Highlighting
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet('Collaborator');
\`\`\`

## 🖼️ Images
![Alan Turing](https://upload.wikimedia.org/wikipedia/commons/c/ce/Alan_turing_header.jpg)`;

  // WebSocket connection handling
  wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected");

    // Broadcast client count to all
    const broadcastCount = () => {
      const count = wss.clients.size;
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "presence", count }));
        }
      });
    };

    broadcastCount();

    // Send initial state to the new client
    ws.send(JSON.stringify({ type: "init", content: currentMarkdown }));

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "update") {
          currentMarkdown = data.content;
          // Broadcast the update to all other clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "update", content: currentMarkdown }));
            }
          });
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      broadcastCount();
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
