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
                interaction_count: 0, // Aantal interacties bijhouden
                primary_issue: null, // Hoofdonderwerp identificeren
                lastInteraction: Date.now()
            };
        }

        const session = sessions[session_id];
        session.lastInteraction = Date.now();
        session.interaction_count++; // Tel elke interactie

        // Registreer het primaire probleem indien nog niet gedaan
        if (!session.primary_issue) {
            session.primary_issue = message;
        }

        // Voeg gebruikersbericht toe aan de gespreksgeschiedenis
        session.conversation_history.push({ role: "user", content: message });

        // Dynamische gespreksstrategie: Maximaal 7 vragen en dan conversie
        let dynamicPrompt = "";

        if (session.interaction_count < 7) {
            dynamicPrompt = `Ik hoor je en wil je helpen. ${session.primary_issue} kan behoorlijk invloed hebben op je leven. Wat speelt er nog meer rondom dit onderwerp?`;
        } else {
            // **Tijd voor een zachte conversie richting een programma**
            dynamicPrompt = `Op basis van wat je hebt verteld, lijkt het erop dat je baat zou hebben bij een gestructureerde aanpak. Hier zijn enkele opties die je verder kunnen helpen:\n
            - **Master Jouw Gezondheid** → Fysieke klachten & vitaliteit verbeteren.\n
            - **Be Your Best Self** → Mentale kracht, zelfdiscipline & groei.\n
            - **Verlicht Je Depressie** → Emotionele balans & mentale helderheid.\n
            - **Elite Transformation** → High-end coaching voor maximale transformatie.\n
            - **Beschermengelen Kaartendeck** → Spirituele reflectie & dieper inzicht.\n
            Welke van deze opties spreekt jou het meeste aan?`;
            
            session.interaction_count = 0; // Reset na conversie
        }

        // AI Instructies
        const messages = [
            { 
                role: "system", 
                content: `
                Jij bent Mister Bewustzijn, een geavanceerde holistische AI-coach. Je begeleidt mensen in fysieke, mentale en spirituele groei.

                🎯 **Belangrijke instructies voor jou als AI:**
                - Je **moet altijd de context van het gesprek meenemen** en eerder gegeven antwoorden meenemen in je reactie.
                - Je **onthoudt het hoofdonderwerp** en past je reacties aan op basis van wat de gebruiker eerder zei.
                - **Je telt het aantal interacties** en na 7 vragen introduceer je een relevant programma.
                - **Voorkom herhaling!** Geef altijd een inhoudelijk relevant antwoord en stuur het gesprek vooruit.
                - Als de gebruiker niet direct naar een programma wil kijken, **begeleid je het gesprek verder zonder pusherig te zijn**.

                🏆 **Dynamische gespreksflow:**
                - Tot 7 vragen: Open coaching, reflectieve vragen, begrip tonen.
                - Na 7 vragen: Voorstellen van een oplossing, gekoppeld aan de behoefte van de gebruiker.
                - Conversie zonder druk: "Wil je een duidelijk stappenplan om dit op te lossen?"
                `
            },
            ...session.conversation_history.slice(-10) // Behoud laatste 10 berichten
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

        const botResponse = response.data.choices?.[0]?.message?.content || "Kun je dit iets anders formuleren?";

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
