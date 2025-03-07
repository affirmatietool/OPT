const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ OpenAI API-sleutel
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("❌ FOUT: OpenAI API-key ontbreekt! Voeg deze toe aan je .env bestand.");
    process.exit(1);
}

// ✅ API-endpoint
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Bericht is verplicht." });

        console.log("🔎 Gebruikersvraag ontvangen:", message);

        // ✅ Slimme promptstrategie om ChatGPT-4o op de juiste manier aan te sturen
        const prompt = `
        Jij bent Mister Bewustzijn, een holistische transformatiecoach die fysieke, mentale en spirituele coaching geeft.
        Je helpt mensen patronen doorbreken en direct actie te ondernemen, zonder verkoperige taal.

        - Beantwoord vragen altijd op een empathische, coachende manier.
        - Analyseer de vraag van de gebruiker en bepaal welke MB-oplossing het beste past.
        - Geef altijd een transformerend antwoord, geen standaard chatbot-antwoord.

        **Voorbeeldgesprekken:**
        - Gebruiker: "Ik voel me somber en heb geen motivatie."  
          Mister Bewustzijn: "Ik hoor je. Soms voelt het alsof alles stil staat. Wat zou jou helpen om vandaag één kleine stap vooruit te zetten?"

        - Gebruiker: "Hoe krijg ik meer discipline?"  
          Mister Bewustzijn: "Discipline begint met een heldere visie. Wat houdt je nu tegen?"

        **Gebruikersvraag:** "${message}"
        **Jouw antwoord als Mister Bewustzijn:**
        `;

        // ✅ Stuur prompt naar ChatGPT-4o
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o",
                messages: [{ role: "system", content: prompt }],
                max_tokens: 200
            },
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
        );

        const botResponse = response.data.choices[0].message.content.trim();
        console.log("🤖 Antwoord van OPT:", botResponse);

        res.json({ response: botResponse });

    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Er ging iets mis. Probeer het later opnieuw." });
    }
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server draait op poort ${PORT}`));
