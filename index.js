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

// **Laad database vanuit GitHub**
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

const products = {
    "fysiek": "Master Jouw Gezondheid - Verbeter je fysieke klachten & vitaliteit. [Link]",
    "mentaal": "Be Your Best Self - Ontwikkel mentale kracht, zelfdiscipline & groei. [Link]",
    "emotioneel": "Verlicht Je Depressie - Herstel je emotionele balans & mentale helderheid. [Link]",
    "high_end": "Elite Transformation - High-end coaching voor maximale transformatie. [Link]",
    "spiritueel": "Beschermengelen Kaartendeck - Spirituele reflectie & dieper inzicht. [Link]"
};

// **API om de MB-kennisbank op te halen**
app.get("/api/getMBContent", (req, res) => {
    const { topic } = req.query;
    if (!topic || !mbDatabase[topic]) {
        return res.status(404).json({ error: "Onderwerp niet gevonden in de kennisbank." });
    }
    res.json(mbDatabase[topic]);
});

// **Slimme AI-coach met transformatieve logica**
app.post("/api/chat", async (req, res) => {
    try {
        const { session_id, message } = req.body;

        if (!session_id || !message) {
            return res.status(400).json({ error: "Ongeldige aanvraag. Sessie ID en bericht zijn verplicht." });
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

        // **1️⃣ Eerst de vraag matchen met de kennisbank**
        const matchedTopic = Object.keys(mbDatabase).find(topic => message.toLowerCase().includes(topic.toLowerCase()));

        if (matchedTopic) {
            responseText = `Ik herken iets dat hiermee te maken heeft: ${mbDatabase[matchedTopic]["volledige_inhoud"].substring(0, 300)}... Wil je hier dieper op ingaan?`;
        } 
        
        // **2️⃣ Onverwachte vragen herinterpreteren binnen MB-principes**
        else if (["weet niet", "geen idee", "werkt niet", "vaag", "wat denk je"].some(phrase => message.toLowerCase().includes(phrase))) {
            responseText = "Wat zou er gebeuren als je nu écht actie onderneemt? Wat weerhoudt je het meest van verandering?";
        } 
        
        // **3️⃣ Doorbraakvragen stellen om de gebruiker naar reflectie te leiden**
        else if (["ik wil afvallen", "ik voel me vast", "ik wil veranderen", "hoe doorbreek ik patronen"].some(phrase => message.toLowerCase().includes(phrase))) {
            responseText = "Als je écht eerlijk bent, wat weet je al lang maar blijf je vermijden?";
        }
        
        // **4️⃣ De gebruiker richting een MB-oplossing sturen zonder pushen**
        else {
            const focus = determineProductCategory(message);
            if (focus && products[focus]) {
                responseText = `Op basis van wat je zegt, denk ik dat ${products[focus]} je het beste kan helpen. Wil je weten waarom?`;
            } else {
                responseText = "Ik hoor je en help je graag verder. Wat speelt er écht op dit moment bij jou?";
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
    console.log(`🚀 Server draait op poort ${PORT}`);
});
