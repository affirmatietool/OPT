const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATABASE_URL = "https://raw.githubusercontent.com/affirmatietool/OPT/main/MBFullDatabase_Final.json";

let mbDatabase = {};

// **Database laden met fallback naar fetch als axios faalt**
async function loadDatabase() {
    try {
        console.log("📡 Ophalen van database vanaf:", DATABASE_URL);
        let response;
        
        try {
            response = await axios.get(DATABASE_URL);
        } catch (axiosError) {
            console.warn("⚠️ Axios faalde, proberen met fetch...");
            response = await fetch(DATABASE_URL);
            response = {
                status: response.status,
                data: await response.json()
            };
        }

        if (response.status !== 200) throw new Error(`Fout bij ophalen database: HTTP ${response.status}`);

        mbDatabase = response.data;

        if (!mbDatabase || typeof mbDatabase !== "object" || Object.keys(mbDatabase).length === 0) {
            throw new Error("De database is leeg of heeft een verkeerd formaat.");
        }

        console.log(`✅ Database geladen met ${Object.keys(mbDatabase).length} onderwerpen.`);
        console.log("🔍 Database preview:", Object.keys(mbDatabase).slice(0, 5)); // Toon eerste 5 onderwerpen

    } catch (error) {
        console.error("❌ Database laadfout:", error.message);
        mbDatabase = {};
    }
}

// **Laad database direct bij het starten**
loadDatabase();

// **API Endpoint**
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Bericht is verplicht." });

        if (!mbDatabase || Object.keys(mbDatabase).length === 0) {
            console.log("⚠️ Database is nog leeg, opnieuw laden...");
            await loadDatabase();
            if (!mbDatabase || Object.keys(mbDatabase).length === 0) {
                return res.json({ response: "Mijn kennis is nog niet beschikbaar. Probeer het later opnieuw." });
            }
        }

        console.log("🔎 Gebruikersvraag:", message);

        // **Zoek een match in de database**
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
        console.error("❌ Fout bij API-aanroep:", error.message);
        res.status(500).json({ error: `Er ging iets mis: ${error.message}` });
    }
});

// **Start de server**
app.listen(PORT, () => console.log(`🚀 Server draait op poort ${PORT}`));
