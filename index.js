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

// Endpoint voor OPT 2.0 AI-coach
app.post("/api/chat", async (req, res) => {
    try {
        const { session_id, message, focus_area } = req.body;

        if (!session_id || !message) {
            return res.status(400).json({ error: "Ongeldige aanvraag. Sessie ID en bericht zijn verplicht." });
        }

        // Start een nieuwe sessie als deze nog niet bestaat
        if (!sessions[session_id]) {
            sessions[session_id] = {
                focus_area: focus_area || "algemeen",
                conversation_history: []
            };
        }

        const session = sessions[session_id];

        // Voeg gebruikersbericht toe aan de geschiedenis
        session.conversation_history.push({ role: "user", content: message });

        // Focusgebied bepalen voor gerichte coaching
        let dynamicIntro = "";
        switch (session.focus_area) {
            case "fysiek":
                dynamicIntro = "Ik begrijp dat nekklachten vervelend kunnen zijn. Kun je me vertellen hoe lang je er al last van hebt?";
                break;
            case "mentaal":
                dynamicIntro = "Mentale uitdagingen kunnen zwaar zijn. Wat is op dit moment je grootste mentale obstakel?";
                break;
            case "spiritueel":
                dynamicIntro = "Ik begrijp dat het lastig kan zijn als je spirituele balans ontbreekt. Wat voelt op dit moment uit balans voor jou?";
                break;
            default:
                dynamicIntro = "Ik hoor je en wil je helpen. Wat speelt er op dit moment?";
                break;
        }

        // AI Contextopbouw met sessiehistorie
        const messages = [
            { 
                role: "system", 
                content: `
                Jij bent Mister Bewustzijn, een holistische transformatiecoach gespecialiseerd in fysieke training, voeding, mindset, spiritualiteit en persoonlijke groei. 
                Je helpt mensen patronen doorbreken en direct de juiste acties zetten zonder verkooppraat. 
                
                🔥 **OPT’s missie:** Mensen laten voelen dat ze gezien, gehoord en begrepen worden. 
                Je begeleidt hen stap voor stap op hun tempo naar de juiste oplossing zonder pushen.
                
                🧠 **Gespreksflow & Structuur:**
                1️⃣ **Empathische erkenning & gerichte vraag:** "${dynamicIntro}"
                2️⃣ **Verdieping op fysiek, mentaal en spiritueel vlak:** Stel slechts één relevante vraag per antwoord.
                3️⃣ **Bewustwording en doorbraak:** Stel een reflecterende vraag gebaseerd op het gesprek.
                4️⃣ **Actiegerichtheid:** Introduceer een praktische stap, niet meerdere tegelijk.
                5️⃣ **Specifieke oplossing per behoefte:** Introduceer maximaal één programma of advies tegelijk.
                6️⃣ **Toewijding en commitment:** Vraag concreet naar de bereidheid om iets te veranderen.
                7️⃣ **Optionele vervolgstap:** "Wil je verder begeleiding hierin?"
                
                📌 **Beschikbare Programma's:**
                - **Master Jouw Gezondheid** → Fysieke klachten & vitaliteit verbeteren.
                - **Be Your Best Self** → Mentale kracht, zelfdiscipline & groei.
                - **Verlicht Je Depressie** → Emotionele balans & mentale helderheid.
                - **Elite Transformation** → High-end coaching voor maximale transformatie.
                - **Beschermengelen Kaartendeck** → Spirituele reflectie & dieper inzicht.
                
                🔗 **Automatisering & Conversie:**
                ✅ **Mailblue** → Start automatische e-mailflows na leadgeneratie.
                ✅ **Make.com** → Verbindt OPT met boekingssystemen en leadbeheer.
                ✅ **Calendly** → Direct afspraken inplannen voor coaching.
                ✅ **Huddle/Plug&Pay** → Automatische aankoop & toegang tot cursussen.
                
                Jij reageert altijd dynamisch, erkent de situatie en stelt slechts één gerichte vraag per stap.`
            },
            ...session.conversation_history // Voeg alle vorige berichten toe voor context
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

        const botResponse = response.data.choices[0].message.content;

        // Voeg AI-reactie toe aan de sessiegeschiedenis
        session.conversation_history.push({ role: "bot", content: botResponse });

        res.json({ response: botResponse });
    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error);
        res.status(500).json({ error: "Er ging iets mis met de API-aanroep." });
    }
});

// Test endpoint
app.get("/", (req, res) => {
    res.send("✅ OPT 2.0 API is live!");
});

// Start de server
app.listen(PORT, () => {
    console.log(`🚀 Server draait op poort ${PORT}`);
});
