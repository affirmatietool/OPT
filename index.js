const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// **GitHub-raw link naar MBFullDatabase_Final.json**
const DATABASE_URL = 'https://raw.githubusercontent.com/affirmatietool/OPT/MBFullDatabase_Final.json';

let mbDatabase = {};

// **Functie om de database op te halen en te cachen**
async function loadDatabase() {
    try {
        const response = await axios.get(DATABASE_URL);
        mbDatabase = response.data;
        console.log("✅ MB-database geladen!");
    } catch (error) {
        console.error("❌ Fout bij ophalen van de database:", error);
    }
}

// **Laad database bij opstarten**
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

// **API-endpoint om kennis op te vragen**
app.get("/api/getMBContent", (req, res) => {
    const { topic } = req.query;
    if (!topic || !mbDatabase[topic]) {
        return res.status(404).json({ error: "Onderwerp niet gevonden in de kennisbank." });
    }
    res.json(mbDatabase[topic]);
});

// **AI-chatfunctie met MB-kennis**
app.post("/api/chat", async (req, res) => {
    try {
        const { session_id, message } = req.body;

        if (!session_id || !message) {
            return res.status(400).json({ error: "Ongeldige aanvraag. Sessie ID en bericht zijn verplicht." });
        }

        if (!sessions[session_id]) {
            sessions[session_id] = {
                conversation_history: [],
                step: 1,
                focus: null,
                lastInteraction: Date.now()
            };
        }

        const session = sessions[session_id];
        session.lastInteraction = Date.now();
        session.conversation_history.push({ role: "user", content: message });

        let responseText = "";

        // **Check of de vraag in de MB-kennisbank zit**
        const matchedTopic = Object.keys(mbDatabase).find(topic => message.toLowerCase().includes(topic.toLowerCase()));
        if (matchedTopic) {
            responseText = `Ik heb iets relevants voor je: ${mbDatabase[matchedTopic]["volledige_inhoud"].substring(0, 500)}... Wil je hier dieper op ingaan?`;
        } else {
            switch (session.step) {
                case 1:
                    responseText = "Waar kan ik je mee helpen?";
                    break;
                case 2:
                    responseText = "Wanneer merk je deze klachten het meest?";
                    break;
                case 3:
                    responseText = "Wat denk je zelf dat de oorzaak is?";
                    break;
                case 4:
                    responseText = "Welke oplossing zoek je van mij?";
                    break;
                case 5:
                    responseText = "Een standaard oplossing werkt vaak niet optimaal. Wat als je een op maat gemaakte aanpak krijgt die écht bij jou past?";
                    break;
                case 6:
                    session.focus = determineProductCategory(message);
                    responseText = `De beste manier om dit goed aan te pakken, is met: ${products[session.focus] || "een gepersonaliseerde aanpak van Mister Bewustzijn."}`;
                    break;
                case 7:
                    responseText = "Wil je het écht goed aanpakken? Dan kun je hier direct een afspraak maken: [Link].";
                    break;
                default:
                    responseText = "Ik hoor je en help je graag verder. Kun je daar iets meer over vertellen?";
            }
        }

        session.step++;
        session.conversation_history.push({ role: "bot", content: responseText });
        res.json({ response: responseText });
    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error);
        res.status(500).json({ error: "Er ging iets mis met de API-aanroep." });
    }
});

// **Bepalen welke MB-oplossing relevant is op basis van de input**
function determineProductCategory(message) {
    if (message.match(/(blessure|pijn|klachten|sport)/i)) return "fysiek";
    if (message.match(/(stress|focus|discipline)/i)) return "mentaal";
    if (message.match(/(somber|verdriet|depressie)/i)) return "emotioneel";
    if (message.match(/(groei|succes|hoge doelen)/i)) return "high_end";
    if (message.match(/(energie|spiritualiteit|ziel)/i)) return "spiritueel";
    return "fysiek";
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
