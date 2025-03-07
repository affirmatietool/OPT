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

// **Laad database en check of deze correct geladen is**
async function loadDatabase() {
    try {
        console.log("📡 Ophalen van database vanaf:", DATABASE_URL);
        const response = await axios.get(DATABASE_URL, { timeout: 10000 });

        if (response.status !== 200) {
            throw new Error(`Fout bij ophalen database: HTTP-status ${response.status}`);
        }

        const data = response.data;
        if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
            throw new Error("De database is leeg of heeft een verkeerd formaat.");
        }

        mbDatabase = data;
        console.log(`✅ MB-database geladen met ${Object.keys(mbDatabase).length} onderwerpen.`);
        console.log("🔍 Database preview:", Object.keys(mbDatabase).slice(0, 5)); // Toon de eerste 5 onderwerpen

    } catch (error) {
        console.error("❌ Database laadfout:", error.message);
        mbDatabase = {}; 
    }
}

// **Laad de database bij het opstarten**
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

        console.log("🔎 Gebruikersvraag:", message);

        // **Stap 2: Zoek of een woord uit de database voorkomt in de vraag**
        let matchedTopic = Object.keys(mbDatabase).find(topic =>
            message.toLowerCase().includes(topic.toLowerCase())
        );

        let responseText = "Ik heb daar geen informatie over.";

        if (matchedTopic) {
            console.log(`✅ Match gevonden: ${matchedTopic}`);
            responseText = mbDatabase[matchedTopic]["volledige_inhoud"].substring(0, 500);
        } else {
            console.log("❌ Geen match gevonden in database.");
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
