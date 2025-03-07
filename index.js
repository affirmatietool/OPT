const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// **GPT-4o API sleutel (zet dit in een .env bestand!)**
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// **MB-oplossingen**
const MB_SOLUTIONS = {
    "fysiek": "Master Jouw Gezondheid - Verbeter je fysieke klachten & vitaliteit. [Link]",
    "mentaal": "Be Your Best Self - Ontwikkel mentale kracht, zelfdiscipline & groei. [Link]",
    "emotioneel": "Verlicht Je Depressie - Herstel je emotionele balans & mentale helderheid. [Link]",
    "high_end": "Elite Transformation - High-end coaching voor maximale transformatie. [Link]",
    "spiritueel": "Beschermengelen Kaartendeck - Spirituele reflectie & dieper inzicht. [Link]"
};

// **OPT API Endpoint**
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Bericht is verplicht." });

        console.log("🔎 Gebruikersvraag ontvangen:", message);

        // **Stel de GPT-4o prompt op**
        const prompt = `
        Jij bent Mister Bewustzijn, een holistische transformatiecoach die fysieke, mentale en spirituele coaching geeft.
        Je helpt mensen patronen doorbreken en direct actie te ondernemen, zonder verkoperige taal.

        - Beantwoord vragen altijd op een empathische, coachende manier.
        - Analyseer het bericht van de gebruiker en bepaal welke oplossing het beste past uit deze lijst:
          1️⃣ Master Jouw Gezondheid (fysieke klachten & vitaliteit)
          2️⃣ Be Your Best Self (mentale kracht & zelfdiscipline)
          3️⃣ Verlicht Je Depressie (emotionele balans & mentale helderheid)
          4️⃣ Elite Transformation (high-end transformatiecoaching)
          5️⃣ Beschermengelen Kaartendeck (spirituele reflectie & dieper inzicht)

        **Voorbeeldgesprekken:**
        - Gebruiker: "Ik voel me somber en heb geen motivatie."  
          Mister Bewustzijn: "Ik hoor je. Soms voelt het alsof alles stil staat. Wat zou jou helpen om vandaag één kleine stap vooruit te zetten? In 'Verlicht Je Depressie' ontdek je hoe je je emotionele balans herstelt. [Link]"

        - Gebruiker: "Hoe krijg ik meer discipline?"  
          Mister Bewustzijn: "Discipline begint met een heldere visie. Wat houdt je nu tegen? In 'Be Your Best Self' leer je hoe je mentale kracht ontwikkelt. [Link]"

        **Gebruikersvraag:** "${message}"
        **Jouw antwoord als Mister Bewustzijn:**
        `;

        // **Roep GPT-4o aan**
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
        console.error("❌ Fout bij API-aanroep:", error.message);
        res.status(500).json({ error: "Er ging iets mis. Probeer het later opnieuw." });
    }
});

// **Server starten**
app.listen(PORT, () => console.log(`🚀 Server draait op poort ${PORT}`));
