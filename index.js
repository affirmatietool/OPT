const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATABASE_URL = "https://raw.githubusercontent.com/affirmatietool/OPT/refs/heads/main/MBFullDatabase_Final.json";

let mbDatabase = {};

// **Database laden**
async function loadDatabase() {
    try {
        const response = await axios.get(DATABASE_URL);
        if (response.status !== 200) throw new Error("Fout bij ophalen database.");
        mbDatabase = response.data;
    } catch (error) {
        console.error("❌ Database laadfout:", error.message);
        mbDatabase = {};
    }
}
loadDatabase();

// **API Endpoint**
app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Bericht is verplicht." });

    if (!mbDatabase || Object.keys(mbDatabase).length === 0) {
        await loadDatabase();
        return res.json({ response: "Fout!" });
    }

    let matchedTopic = Object.keys(mbDatabase).find(topic =>
        message.toLowerCase().includes(topic.toLowerCase())
    );

    res.json({ response: matchedTopic ? mbDatabase[matchedTopic]["volledige_inhoud"].substring(0, 500) : "Ik heb daar geen informatie over." });
});

// **Server starten**
app.listen(PORT, () => console.log(`🚀 Server draait op poort ${PORT}`));
