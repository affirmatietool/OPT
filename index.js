const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATABASE_URL = 'https://raw.githubusercontent.com/affirmatietool/OPT/main/MBFullDatabase_Final.json';

let mbDatabase = {};

// **Laad database en cache**
async function loadDatabase() {
    try {
        const response = await axios.get(DATABASE_URL);
        mbDatabase = response.data;
        console.log("✅ MB-database geladen!");
    } catch (error) {
        console.error("❌ Fout bij ophalen van de database:", error);
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
                lastInteraction: Date.now()
            };
        }

        const session = sessions[session_id];
        session.lastInteraction = Date.now();
        session.conversation_history.push({ role: "user", content: message });

        let responseText = "";

        // **1️⃣ Eerst kijken of de vraag in de kennisbank staat**
        const matchedTopic = Object.keys(mbDatabase).find(topic => message.toLowerCase().includes(topic.toLowerCase()));

        if (matchedTopic) {
            const content = mbDatabase[matchedTopic]["volledige_inhoud"].substring(0, 400);
            responseText = `Ik hoor je en herken dit als een belangrijk onderwerp. Hier is iets dat mogelijk aansluit: "${content}"... Wat voel je als je dit leest?`;
        } 
        // **2️⃣ Emotionele herkenning en diepe reflectie**
        else if (["depressie", "ik voel me slecht", "ik ben moe", "ik ben verloren", "angst"].some(phrase => message.toLowerCase().includes(phrase))) {
            responseText = "Ik hoor je. Dit is geen gemakkelijke plek om in te zitten. Wat heb je op dit moment nodig?";
        } 
        // **3️⃣ OPT voorkomt vage gesprekken en stuurt altijd door naar reflectie**
        else if (["weet niet", "geen idee", "ik snap het niet", "ik voel niks"].some(phrase => message.toLowerCase().includes(phrase))) {
            responseText = "Soms is het lastig om te voelen wat er speelt. Wat gebeurt er in je lichaam als je dit nu zegt?";
        } 
        // **4️⃣ Diepere coaching op patronen en overtuigingen**
        else if (session.conversation_history.length >= 5) {
            responseText = "Ik merk dat je hier echt mee zit. Wat is de grootste overtuiging die je tegenhoudt om vooruit te komen?";
        } 
        // **5️⃣ Als de gebruiker openstaat, biedt OPT een MB-oplossing aan als reflectie, niet als verkoop**
        else {
            const focus = determineProductCategory(message);
            if (focus && products[focus]) {
                responseText = `Veel mensen die dit ervaren, hebben baat bij ${products[focus]}. Dit is geen oplossing, maar kan een richting zijn. Hoe voelt dit voor jou?`;
            } else {
                responseText = "Ik ben hier om je te ondersteunen. Wat is het meest waardevolle inzicht dat je nu zou kunnen krijgen?";
            }
        }

        session.conversation_history.push({ role: "bot", content: responseText });
        res.json({ response: responseText });
    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error);
        res.status(500).json({ error: "Er ging iets mis met de API-aanroep." });
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
