const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Sessiebeheer per gebruiker
let sessions = {};

// OPT AI-coach API endpoint
app.post("/api/chat", async (req, res) => {
    try {
        const { session_id, message, focus_area } = req.body;

        if (!session_id || !message) {
            return res.status(400).json({ error: "Ongeldige aanvraag. Sessie ID en bericht zijn verplicht." });
        }

        // Start of behoud de sessie
        if (!sessions[session_id]) {
            sessions[session_id] = {
                focus_area: focus_area || "algemeen",
                conversation_history: [],
                step: 1, // Start gespreksflow bij stap 1
                lastInteraction: Date.now() // Timestamp van laatste interactie
            };
        }

        const session = sessions[session_id];
        session.lastInteraction = Date.now(); // Update laatste interactie

        // Voeg gebruikersbericht toe aan de geschiedenis
        session.conversation_history.push({ role: "user", content: message });

        // Dynamische introductie op basis van focusgebied
        let dynamicIntro = "";
        switch (session.focus_area) {
            case "fysiek":
                dynamicIntro = "Ik begrijp dat fysieke klachten je flink kunnen beïnvloeden. Wat ervaar je precies?";
                break;
            case "mentaal":
                dynamicIntro = "Mentale uitdagingen kunnen zwaar zijn. Wat speelt er op dit moment bij jou?";
                break;
            case "spiritueel":
                dynamicIntro = "Spirituele balans is belangrijk. Wat voelt voor jou op dit moment uit balans?";
                break;
            default:
                dynamicIntro = "Ik hoor je en help je graag verder. Wat speelt er op dit moment?";
        }

        // AI Contextopbouw met sessiehistorie en gespreksflow
        const messages = [
            { 
                role: "system", 
                content: `
                Jij bent Mister Bewustzijn, een geavanceerde holistische AI-coach. Je begeleidt mensen in fysieke, mentale en spirituele groei, zonder verkooppraat.

                🎯 **Wat OPT doet:**
                - Beantwoordt ALLE vragen over gezondheid, training, stress, pijn, slaap, voeding, mentale groei en spirituele balans.
                - Behoudt de gespreksflow, maar reageert vrij en empathisch.
                - Begeleidt gebruikers naar inzicht en actie door strategisch door te vragen.
                - Eindigt elk gesprek met een concrete vervolgstap richting een programma.

                🏆 **Gespreksflow:**
                1️⃣ **Empathische erkenning & gerichte vraag:** "${dynamicIntro}"
                2️⃣ **Verdieping:** Stel slechts één relevante vraag per antwoord.
                3️⃣ **Bewustwording:** Stel een reflecterende vraag gebaseerd op het gesprek.
                4️⃣ **Actiegerichtheid:** Introduceer een praktische stap.
                5️⃣ **Specifieke oplossing:** Introduceer maximaal één programma of advies tegelijk.
                6️⃣ **Toewijding:** Vraag concreet naar de bereidheid om iets te veranderen.
                7️⃣ **Vervolgstap:** "Wil je verder begeleiding hierin?" → Link naar het juiste programma.
                `
            },
            ...session.conversation_history.slice(-10) // Beperk tot laatste 10 berichten
        ];

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o",
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const botResponse = response.data.choices?.[0]?.message?.content || 
            "Ik ben er om je te helpen. Kun je me iets meer vertellen over wat je nodig hebt?";

        session.conversation_history.push({ role: "bot", content: botResponse });

        res.json({ response: botResponse });
    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Er ging iets mis met de API-aanroep.", details: error.response ? error.response.data : error.message });
    }
});

// Automatische sessie-opruiming (elke 5 minuten)
setInterval(() => {
    const now = Date.now();
    for (const sessionId in sessions) {
        if (now - sessions[sessionId].lastInteraction > 30 * 60 * 1000) {
            delete sessions[sessionId];
        }
    }
}, 5 * 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server draait op poort ${PORT}`);
});
