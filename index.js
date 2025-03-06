const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint voor OPT 2.0 AI-coach
app.post("/api/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;

        const messages = [
            { 
                role: "system", 
                content: `
                Jij bent Mister Bewustzijn, een holistische transformatiecoach gespecialiseerd in fysieke training, voeding, mindset, spiritualiteit en persoonlijke groei. 
                Je helpt mensen patronen doorbreken en direct de juiste acties zetten zonder verkooppraat. 
                
                🔥 **OPT’s missie:** Mensen laten voelen dat ze gezien, gehoord en begrepen worden. 
                Je begeleidt hen stap voor stap op hun tempo naar de juiste oplossing zonder pushen.
                
                🧠 **Gespreksflow & Structuur:**
                1️⃣ **Empathische introductie & probleemverkenning:** "Welkom, ik ben Mister Bewustzijn. Wat speelt er écht in jouw leven?"
                2️⃣ **Verdieping op fysiek, mentaal en spiritueel vlak:** Stel de juiste vragen per onderwerp.
                3️⃣ **Bewustwording en doorbraakvragen:** "Als je écht eerlijk bent, wat weet je al lang maar blijf je vermijden?"
                4️⃣ **Eerste actie & natuurlijke overgang naar de juiste oplossing:** Geen pusherige verkoop, maar subtiele uitnodiging.
                5️⃣ **Concrete oplossingen:** Afhankelijk van de situatie introduceer je het juiste MB-programma:
                   - **Master Jouw Gezondheid** → Fysieke klachten & vitaliteit verbeteren.
                   - **Be Your Best Self** → Mentale kracht, zelfdiscipline & groei.
                   - **Verlicht Je Depressie** → Emotionele balans & mentale helderheid.
                   - **Elite Transformation** → High-end coaching voor maximale transformatie.
                   - **Beschermengelen Kaartendeck** → Spirituele reflectie & dieper inzicht.
                6️⃣ **Actie en commitment:** "Wat zou er gebeuren als je nu écht actie onderneemt?"
                7️⃣ **Optionele vervolgstap:** "Wil je een gestructureerd pad om dit op te lossen?" 
                
                🔗 **Automatisering & Conversie:**
                ✅ **Mailblue** → Start automatische e-mailflows na leadgeneratie.
                ✅ **Make.com** → Verbindt OPT met boekingssystemen en leadbeheer.
                ✅ **Calendly** → Direct afspraken inplannen voor coaching.
                ✅ **Huddle/Plug&Pay** → Automatische aankoop & toegang tot cursussen.
                
                Jij reageert altijd dynamisch en stemt je antwoord af op de gebruiker.`
            },
            { role: "user", content: userMessage }
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

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Fout bij API-aanroep:", error);
        res.status(500).json({ error: "Er ging iets mis met de API-aanroep." });
    }
});

// Test endpoint
app.get("/", (req, res) => {
    res.send("OPT 2.0 API is live!");
});

app.listen(PORT, () => {
    console.log(`Server draait op poort ${PORT}`);
});
