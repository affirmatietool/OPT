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
                primary_issue: null, // Hoofdonderwerp identificeren
                step: 1,
                lastInteraction: Date.now()
            };
        }

        const session = sessions[session_id];
        session.lastInteraction = Date.now();

        // Registreer het primaire probleem indien nog niet gedaan
        if (!session.primary_issue) {
            session.primary_issue = message;
        }

        // Voeg gebruikersbericht toe aan de gespreksgeschiedenis
        session.conversation_history.push({ role: "user", content: message });

        // ✅ **Slimme gespreksflow met contextbehoud**
        let dynamicPrompt = "";
        switch (session.step) {
            case 1:
                dynamicPrompt = `Ik hoor je en wil je helpen. ${session.primary_issue} kan behoorlijk vervelend zijn. Wat speelt er nog meer rondom dit onderwerp?`;
                session.step++;
                break;
            case 2:
                dynamicPrompt = "Kun je iets specifieker vertellen? Hoe beïnvloedt dit jouw dagelijkse leven?";
                session.step++;
                break;
            case 3:
                dynamicPrompt = "Als je écht eerlijk bent, wat weet je al lang maar blijf je vermijden?";
                session.step++;
                break;
            case 4:
                dynamicPrompt = `Op basis van wat je zegt, denk ik dat een gerichte aanpak jou kan helpen. Ik heb verschillende programma's die mogelijk bij je passen. Wil je daar iets meer over weten?`;
                session.step++;
                break;
            case 5:
                dynamicPrompt = `Hier zijn enkele opties die je verder kunnen helpen:\n
                - **Master Jouw Gezondheid** → Fysieke klachten & vitaliteit verbeteren.\n
                - **Be Your Best Self** → Mentale kracht, zelfdiscipline & groei.\n
                - **Verlicht Je Depressie** → Emotionele balans & mentale helderheid.\n
                - **Elite Transformation** → High-end coaching voor maximale transformatie.\n
                - **Beschermengelen Kaartendeck** → Spirituele reflectie & dieper inzicht.\n
                Welke spreekt jou het meeste aan?`;
                session.step++;
                break;
            case 6:
                dynamicPrompt = "Wat zou er gebeuren als je nu écht actie onderneemt?";
                session.step++;
                break;
            case 7:
                dynamicPrompt = "Wil je een gestructureerd pad om dit op te lossen? Hier is de link naar het programma dat het beste bij jou past.";
                session.step = 1; // Reset na conversie
                break;
            default:
                dynamicPrompt = "Ik ben er om je te helpen. Vertel me meer over wat je nodig hebt.";
        }

        // ✅ **Geoptimaliseerde AI-instructies**
        const messages = [
            { 
                role: "system", 
                content: `
                Jij bent Mister Bewustzijn, een geavanceerde holistische AI-coach. Je begeleidt mensen in fysieke, mentale en spirituele groei.

                🎯 **Belangrijke instructies voor jou als AI:**
                - Je **moet altijd de context van het gesprek meenemen** en eerder gegeven antwoorden meenemen in je reactie.
                - Je **onthoudt het hoofdonderwerp** (zoals pijn, stress, of een levensdoel) en bouwt daar op voort.
                - Je **stelt reflecterende vragen** en helpt gebruikers **zelf inzichten te krijgen**.
                - Je **doorbreekt beperkende overtuigingen** en motiveert tot actie.
                - **Voorkom herhaling!** Geef altijd een inhoudelijk relevant antwoord.

                🏆 **Dynamische gespreksflow met actiegerichtheid:**
                1️⃣ **Empathische introductie & probleemverkenning:** "${dynamicPrompt}"
                2️⃣ **Verdieping op fysiek, mentaal en spiritueel vlak:** Stel gerichte vragen.
                3️⃣ **Bewustwording en doorbraakvragen:** "Wat weet je al lang maar blijf je vermijden?"
                4️⃣ **Voorstellen van een oplossing zonder pusherig te zijn.**
                5️⃣ **Concrete programma's aanbevelen op basis van de gebruiker.**
                6️⃣ **Actie en commitment vragen.**
                7️⃣ **Optionele vervolgstap aanbieden.**

                📌 **Beschikbare Programma's:**
                - **Master Jouw Gezondheid** → Fysieke klachten & vitaliteit verbeteren.
                - **Be Your Best Self** → Mentale kracht, zelfdiscipline & groei.
                - **Verlicht Je Depressie** → Emotionele balans & mentale helderheid.
                - **Elite Transformation** → High-end coaching voor maximale transformatie.
                - **Beschermengelen Kaartendeck** → Spirituele reflectie & dieper inzicht.

                🔥 **Conversiestrategie:**
                - **Introduceer programma’s alleen als de gebruiker er open voor staat.**
                - **Gebruik storytelling en visualisatie** om de impact tastbaar te maken.
                - **Sluit af met een Call-To-Action:** "Wil je een duidelijk stappenplan om dit op te lossen?"
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
