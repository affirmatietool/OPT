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
        const response = await axios.get(DATABASE_URL, { timeout: 10000 });

        // Controleer of de respons succesvol is
        if (response.status !== 200) {
            throw new Error(`Fout bij ophalen database: HTTP-status ${response.status}`);
        }

        // Controleer of de data correct is en niet leeg
        const data = response.data;
        if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
            throw new Error("De database is leeg of heeft een verkeerd formaat.");
        }

        mbDatabase = data;
        console.log(`✅ MB-database geladen met ${Object.keys(mbDatabase).length} onderwerpen.`);
    } catch (error) {
        console.error("❌ Database laadfout:", error.message);
        mbDatabase = {}; // Zorg dat mbDatabase nooit undefined is
    }
}

// **Initialiseer de database bij serverstart**
loadDatabase();

// **API-endpoint voor chat**
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Bericht is verplicht." });
        }

        // **Stap 1: Check of database correct geladen is**
        if (!mbDatabase || Object.keys(mbDatabase).length === 0) {
            console.log("⚠️ Database is leeg, opnieuw laden...");
            await loadDatabase();
            if (!mbDatabase || Object.keys(mbDatabase).length === 0) {
                return res.json({ response: "Mijn kennis is nog niet beschikbaar. Probeer het later opnieuw." });
            }
        }

        // **Stap 2: Zoek relevante kennis in de database**
        const matchedTopics = Object.keys(mbDatabase).filter(topic => 
            message.toLowerCase().includes(topic.toLowerCase()) && mbDatabase[topic] && mbDatabase[topic]["volledige_inhoud"]
        );

        let responseText = "Ik heb daar geen informatie over.";

        if (matchedTopics.length > 0) {
            responseText = mbDatabase[matchedTopics[0]]["volledige_inhoud"].substring(0, 500);
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error.message, error.stack);
        res.status(500).json({ error: `Er ging iets mis: ${error.message}` });
    }
});

// **Start de server**
app.listen(PORT, () => {
    console.log(`🚀 OPT draait op poort ${PORT}`);
});
