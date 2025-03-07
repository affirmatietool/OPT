const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATABASE_URL = "https://raw.githubusercontent.com/affirmatietool/OPT/refs/heads/main/MBFullDatabase_Final.json";

let mbDatabase = {};

// **Laad database en cache deze**
async function loadDatabase() {
    try {
        console.log("📡 Ophalen van database vanaf:", DATABASE_URL);
        const response = await axios.get(DATABASE_URL);
        mbDatabase = response.data;
        console.log("✅ MB-database geladen met", Object.keys(mbDatabase).length, "onderwerpen.");
    } catch (error) {
        console.error("❌ Database laadfout:", error.message);
    }
}
loadDatabase();

// **Sessiebeheer per gebruiker**
let sessions = {};

// **Definitie van MB-oplossingen**
const products = {
    "fysiek": "Master Jouw Gezondheid - Verbeter je fysieke klachten & vitaliteit. [Link]",
    "mentaal": "Be Your Best Self - Ontwikkel mentale kracht, zelfdiscipline & groei. [Link]",
    "emotioneel": "Verlicht Je Depressie - Herstel je emotionele balans & mentale helderheid. [Link]",
    "high_end": "Elite Transformation - High-end coaching voor maximale transformatie. [Link]",
    "spiritueel": "Beschermengelen Kaartendeck - Spirituele reflectie & dieper inzicht. [Link]"
};

// **OPT Revolutionaire AI-Coach**
app.post("/api/chat", async (req, res) => {
    try {
        const { session_id, message } = req.body;

        if (!session_id || !message) {
            return res.status(400).json({ error: "Sessie ID en bericht zijn verplicht." });
        }

        if (!sessions[session_id]) {
            sessions[session_id] = {
                conversation_history: [],
                focus: null,
                lastInteraction: Date.now(),
                response_memory: []
            };
        }

        const session = sessions[session_id];
        session.lastInteraction = Date.now();
        session.conversation_history.push({ role: "user", content: message });

        let responseText = "";

        // **Stap 1: Check of database geladen is**
        if (!mbDatabase || Object.keys(mbDatabase).length === 0) {
            responseText = "Ik ben mijn kennis nog aan het laden. Probeer het over een paar seconden opnieuw.";
        } else {
            // **Stap 2: Database als startpunt - Zoek relevante kennis**
            const matchedTopics = Object.keys(mbDatabase).filter(topic => 
                message.toLowerCase().includes(topic.toLowerCase()) && mbDatabase[topic] && mbDatabase[topic]["volledige_inhoud"]
            );

            if (matchedTopics.length > 0) {
                let combinedKnowledge = matchedTopics.map(topic => mbDatabase[topic]["volledige_inhoud"]).join(" ");
                responseText = `"${combinedKnowledge.substring(0, 500)}"... Wat herken je hierin? Hoe voelt dit voor jou?`;
            } 
            // **Stap 3: Als er geen directe database match is, gebruik coachingtechnieken**
            else if (["depressie", "ik voel me slecht", "ik ben moe", "ik ben verloren", "angst"].some(phrase => message.toLowerCase().includes(phrase))) {
                responseText = "Ik hoor je en ik ben hier voor je. Wat heb je nu nodig om een klein stapje vooruit te zetten?";
            } 
            else if (["gehoord worden", "begrepen worden", "ik wil praten", "ik wil delen"].some(phrase => message.toLowerCase().includes(phrase))) {
                responseText = "Ik ben hier om naar je te luisteren. Vertel me wat er nu in je omgaat.";
            } 
            else if (["geen idee", "weet niet", "ik snap het niet", "ik voel niks"].some(phrase => message.toLowerCase().includes(phrase))) {
                responseText = "Dat is oké. Soms helpt het om even stil te staan bij wat er is. Wat gebeurt er in je lichaam als je hierover nadenkt?";
            } 
            else if (session.response_memory.includes(message.toLowerCase())) {
                responseText = "Je blijft terugkomen op dit punt, en dat is begrijpelijk. Wat als we hier vanuit een andere invalshoek naar kijken?";
            } 
            else if (session.conversation_history.length >= 6) {
                responseText = "Ik voel dat er iets diepers speelt. Wat zou er gebeuren als je nu een kleine, bewuste stap zet richting verandering?";
            } 
            // **Stap 4: Als de gebruiker openstaat, biedt OPT een MB-oplossing aan als inspiratie, niet als verkoop**
            else {
                const focus = determineProductCategory(message);
                if (focus && products[focus]) {
                    responseText = `Veel mensen die zich zo voelen, hebben baat gehad bij ${products[focus]}. Dit is geen oplossing, maar kan richting geven. Wat roept dit bij je op?`;
                } else {
                    responseText = "Ik ben hier om je te ondersteunen. Wat is op dit moment het belangrijkste voor jou?";
                }
            }
        }

        // **OPT onthoudt eerder gegeven antwoorden om herhaling te voorkomen**
        session.response_memory.push(message.toLowerCase());
        session.conversation_history.push({ role: "bot", content: responseText });

        res.json({ response: responseText });
    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error.message, error.stack);
        res.status(500).json({ error: `Er ging iets mis: ${error.message}` });
    }
});

// **Detecteren van relevante MB-producten op basis van vraag**
function determineProductCategory(message) {
    if (message.match(/(blessure|pijn|klachten|sport)/i)) return "fysiek";
    if (message.match(/(stress|focus|discipline|mentaal|angst)/i)) return "mentaal";
    if (message.match(/(somber|verdriet|depressie|burnout|emotioneel)/i)) return "emotioneel";
    if (message.match(/(groei|succes|hoge doelen|doorbraak)/i)) return "high_end";
    if (message.match(/(energie|spiritualiteit|ziel|intuïtie)/i)) return "spiritueel";
    return null;
}

// **Automatische sessie-opruiming**
setInterval(() => {
    const now = Date.now();
    for (const sessionId in sessions) {
        if (now - sessions[sessionId].lastInteraction > 30 * 60 * 1000) {
            delete sessions[sessionId];
        }
    }
}, 5 * 60 * 1000);

// **Start de server**
app.listen(PORT, () => {
    console.log(`🚀 OPT draait op poort ${PORT}`);
});
