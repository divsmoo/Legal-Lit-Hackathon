import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 1) Serve your static site (index.html, etc.)
app.use(express.static(__dirname));

// 2) Proxy to DeepSeek
app.post("/api/deepseek", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant for legal education. Do not give legal advice." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 600
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error || data });

    const answer = data?.choices?.[0]?.message?.content ?? "";
    res.json({ answer, raw: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error calling DeepSeek" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
