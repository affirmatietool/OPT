const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint voor OPT 2.0 API
app.post("/api/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Jij bent Mister Bewustzijn en volgt de 7-stappen gespreksflow." },
                { role: "user", content: userMessage }
            ],
            max_tokens: 1000,
            temperature: 0.7
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Fout bij API-aanroep:", error);
        res.status(500).json({ error: "Er ging iets mis met de API-aanroep." });
    }
});

// Test endpoint
app.get("/", (req, res) => {
    res.send("OPT 2.0 API is live!");
});

app.listen(PORT, () => {
    console.log(`Server draait op poort ${PORT}`);
});
