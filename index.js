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
        const { session_id, message } = req.body;

        if (!session_id || !message) {
            return res.status(400).json({ error: "Ongeldige aanvraag. Sessie ID en bericht zijn verplicht." });
        }

        // Start of behoud de sessie
        if (!sessions[session_id]) {
            sessions[session_id] = {
                conversation_history: [],
                step: 1, // Start bij stap 1 van de gespreksflow
                lastInteraction: Date.now()
            };
        }

        const session = sessions[session_id];
        session.lastInteraction = Date.now();

        // Voeg gebruikersbericht toe aan de geschiedenis
        session.conversation_history.push({ role: "user", content: message });

        // **STAP 1-7: Automatische gespreksflow-opbouw**
        let dynamicPrompt = "";
        switch (session.step) {
            case 1:
                dynamicPrompt = "Ik hoor je en wil je helpen. Wat speelt er op dit moment in jouw leven?";
                session.step++;
                break;
            case 2:
                dynamicPrompt = "Kun je hier iets dieper op ingaan? Wat merk je fysiek, mentaal of spiritueel aan jezelf?";
                session.step++;
                break;
            case 3:
                dynamicPrompt = "Als je écht eerlijk bent, wat weet je al lang maar blijf je vermijden?";
                session.step++;
                break;
            case 4:
                dynamicPrompt = "Wat zou je willen veranderen? Wat is de eerste stap die je zou kunnen zetten?";
                session.step++;
                break;
            case 5:
                dynamicPrompt = `Op basis van wat je zegt, denk ik dat een gestructureerde aanpak je kan helpen. Dit past bij één van deze programma's:
                - **Master Jouw Gezondheid** → Fysieke klachten & vitaliteit verbeteren.
                - **Be Your Best Self** → Mentale kracht, zelfdiscipline & groei.
                - **Verlicht Je Depressie** → Emotionele balans & mentale helderheid.
                - **Elite Transformation** → High-end coaching voor maximale transformatie.
                - **Beschermengelen Kaartendeck** → Spirituele reflectie & dieper inzicht.
                
                Wat spreekt jou het meeste aan?`;
                session.step++;
                break;
            case 6:
                dynamicPrompt = "Wat zou er gebeuren als je nu écht actie onderneemt?";
                session.step++;
                break;
            case 7:
                dynamicPrompt = "Wil je een gestructureerd pad om dit op te lossen? Hier is de link naar het programma dat het beste bij jou past.";
                session.step = 1; // Reset na de conversie
                break;
            default:
                dynamicPrompt = "Ik ben er om je te helpen. Vertel me meer over wat je nodig hebt.";
        }

        // AI Contextopbouw met sessiehistorie
        const messages = [
            { 
                role: "system", 
                content: `
                Jij bent Mister Bewustzijn, een geavanceerde holistische AI-coach. Je begeleidt mensen in fysieke, mentale en spirituele groei.

                🎯 **Gespreksflow & Conversie-strategie:**
                1️⃣ **Empathische introductie & probleemverkenning:** "${dynamicPrompt}"
                2️⃣ **Verdieping op fysiek, mentaal en spiritueel vlak:** Stel de juiste vragen per onderwerp.
                3️⃣ **Bewustwording en doorbraakvragen:** "Als je écht eerlijk bent, wat weet je al lang maar blijf je vermijden?"
                4️⃣ **Eerste actie & natuurlijke overgang naar de juiste oplossing:** Geen pusherige verkoop, maar subtiele uitnodiging.
                5️⃣ **Concrete oplossingen:** Introduceer het juiste MB-programma.
                6️⃣ **Actie en commitment:** "Wat zou er gebeuren als je nu écht actie onderneemt?"
                7️⃣ **Optionele vervolgstap:** "Wil je een gestructureerd pad om dit op te lossen?"

                📌 **Beschikbare Programma's:**
                - **Master Jouw Gezondheid** → Fysieke klachten & vitaliteit verbeteren.
                - **Be Your Best Self** → Mentale kracht, zelfdiscipline & groei.
                - **Verlicht Je Depressie** → Emotionele balans & mentale helderheid.
                - **Elite Transformation** → High-end coaching voor maximale transformatie.
                - **Beschermengelen Kaartendeck** → Spirituele reflectie & dieper inzicht.

                🏆 **Belangrijk:**
                - Reageer empathisch en contextbewust.
                - Voorkom herhaling en stuur het gesprek strategisch naar een oplossing.
                - Introduceer de juiste oplossing op het juiste moment.
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
