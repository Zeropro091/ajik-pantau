import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI categorization route
  app.post("/api/categorize", async (req, res) => {
    try {
      const { description } = req.body;
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      const defaultResponse = {
        categories: ["Lainnya"],
        priority: "Sedang",
        aiCategory: "Lainnya",
        aiSubCategory: "Lainnya",
        aiSentiment: "Pertanyaan",
        tags: ["lainnya"],
        aiSummary: description.substring(0, 50) + "..."
      };

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          ...defaultResponse,
          aiSummary: "Sistem AI belum dikonfigurasi. Silakan tambahkan GEMINI_API_KEY di setelan aplikasi."
        });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analisis laporan warga berikut (bisa dalam Bahasa Indonesia atau Bahasa Bali).
Berikan analisis terstruktur.
Laporan:
"${description}"`;
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                aiCategory: {
                  type: Type.STRING,
                  description: "Kategori utama (contoh: Infrastruktur, Kesehatan, Pendidikan, Sosial, Keamanan, Bencana Alam, Pelayanan Publik, dll)"
                },
                aiSubCategory: {
                  type: Type.STRING,
                  description: "Sub-kategori spesifik (contoh: Jalan & Drainase, Pungli, Bullying, dsb)"
                },
                priority: {
                  type: Type.STRING,
                  description: "Tingkat prioritas. Urgent (Bencana/ancaman jiwa/kerusakan parah), Tinggi (Pungli/Kejahatan/Korupsi/Bullying), Sedang (Keluhan umum), Rendah (Saran/Pertanyaan biasa). Wajib salah satu: 'Urgent', 'Tinggi', 'Sedang', 'Rendah'."
                },
                aiSentiment: {
                  type: Type.STRING,
                  description: "Sentimen laporan. Wajib salah satu: 'Keluhan', 'Saran', 'Apresiasi', atau 'Pertanyaan'."
                },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Daftar tag spesifik, maksimal 3 (contoh: jalan_rusak, pungli, bullying_sekolah)."
                },
                aiSummary: {
                  type: Type.STRING,
                  description: "Ringkasan super singkat 1-2 kalimat untuk admin."
                }
              },
              required: ["aiCategory", "aiSubCategory", "priority", "aiSentiment", "tags", "aiSummary"]
            }
          }
        });

        const text = response.text?.trim() || JSON.stringify(defaultResponse);
        console.log("Gemini raw response:", text);
        let result = { ...defaultResponse };
        try {
          const parsed = JSON.parse(text);
          result.aiCategory = parsed.aiCategory || "Lainnya";
          result.aiSubCategory = parsed.aiSubCategory || "Lainnya";
          result.priority = ["Urgent", "Tinggi", "Sedang", "Rendah"].includes(parsed.priority) ? parsed.priority : "Sedang";
          result.aiSentiment = ["Keluhan", "Saran", "Apresiasi", "Pertanyaan"].includes(parsed.aiSentiment) ? parsed.aiSentiment : "Pertanyaan";
          result.tags = Array.isArray(parsed.tags) ? parsed.tags : ["lainnya"];
          result.aiSummary = parsed.aiSummary || defaultResponse.aiSummary;
          
          // Backward compatibility mappings
          result.categories = [result.aiCategory, ...result.tags].slice(0, 3);
        } catch (e) {
          console.error("JSON parse error:", e);
          result = { ...defaultResponse };
        }

        res.json(result);
      } catch (genError: any) {
        console.warn("Gemini generation warning (e.g. invalid key):", genError.message);
        let errorMsg = genError.message || "Unknown error";
        if (errorMsg.includes("API key not valid")) {
          errorMsg = "API Key Gemini tidak valid. Silakan atur/perbarui API Key di Setelan.";
        } else {
          errorMsg = "Gagal memproses dengan AI: " + errorMsg;
        }
        res.json({
          ...defaultResponse,
          aiSummary: errorMsg
        });
      }
    } catch (error: any) {
      console.error("API route error:", error);
      // Fallback
      res.json({ ...defaultResponse, aiSummary: "Routing error: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
