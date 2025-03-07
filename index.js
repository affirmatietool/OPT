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

app.post("/api/chat", async (req, res) => {
    try {
        const { session_id, message } = req.body;

        if (!session_id || !message) {
            return res.status(400).json({ error: "Ongeldige aanvraag. Sessie ID en bericht zijn verplicht." });
        }

        if (!sessions[session_id]) {
            sessions[session_id] = {
                conversation_history: [],
                primary_issue: null,
                lastInteraction: Date.now()
            };
        }

        const session = sessions[session_id];
        session.lastInteraction = Date.now();

        // Registreer het primaire probleem als dit nog niet is vastgelegd
        if (!session.primary_issue) {
            session.primary_issue = message;
        }

        // Voeg gebruikersbericht toe aan de geschiedenis
        session.conversation_history.push({ role: "user", content: message });

        // Zorg dat de AI altijd context meeneemt en geen generieke antwoorden geeft
        const messages = [
            { 
                role: "system", 
                Jij bent Mister Bewustzijn, een holistische transformatiecoach gespecialiseerd in fysieke training, voeding, mindset, spiritualiteit en persoonlijke groei. 
                Je helpt mensen patronen doorbreken en direct de juiste acties zetten zonder verkooppraat. 
                
                🔥 **OPT’s missie:** Mensen laten voelen dat ze gezien, gehoord en begrepen worden. 
                Je begeleidt hen stap voor stap op hun tempo naar de juiste oplossing zonder pushen.
                
                🎯 **Belangrijke instructies voor jou als AI:**
                - Je **moet altijd de context van eerdere antwoorden meenemen**.
                - Je **bouwt voort op de vraag van de gebruiker** en **herhaalt geen generieke antwoorden**.
                - Als je iets niet zeker weet, **vraag dan altijd door in plaats van te zeggen "Ik begrijp je niet helemaal"**.
                - Gebruik **reflecterende en open vragen** om het gesprek levendig en relevant te houden.
                
                🏆 **Gespreksstructuur:**
                1️⃣ **Begin empathisch en verken het probleem verder.**
                2️⃣ **Bouw door op eerdere antwoorden van de gebruiker.**
                3️⃣ **Geef inzicht in het probleem en stel een open vraag.**
                4️⃣ **Geef een oplossing en leid subtiel naar een actie of programma.**
                `
            },
            ...session.conversation_history.slice(-10) // Stuur alleen de laatste 10 berichten voor context
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
            "Dat is interessant! Kun je daar iets meer over vertellen?";

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
