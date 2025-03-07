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

        // **1️⃣ OPT erkent eerst de emotie van de gebruiker**
        if (["depressie", "ik voel me slecht", "ik ben moe", "ik ben verloren"].some(phrase => message.toLowerCase().includes(phrase))) {
            responseText = "Ik hoor je. Dat klinkt zwaar. Wil je delen hoe lang je je al zo voelt?";
        } 
        // **2️⃣ OPT checkt de kennisbank voor inzichten, zonder direct een oplossing te geven**
        else if (Object.keys(mbDatabase).some(topic => message.toLowerCase().includes(topic.toLowerCase()))) {
            const matchedTopic = Object.keys(mbDatabase).find(topic => message.toLowerCase().includes(topic.toLowerCase()));
            responseText = `Dat is een belangrijk onderwerp. Wat ik vaak zie, is dat mensen hier dieper op in willen gaan. Hier is iets dat wellicht resoneert: ${mbDatabase[matchedTopic]["volledige_inhoud"].substring(0, 300)}... Wat raakt je hierin?`;
        } 
        // **3️⃣ OPT stelt verdiepende vragen, zonder te pushen**
        else if (["weet niet", "geen idee", "ik snap het niet"].some(phrase => message.toLowerCase().includes(phrase))) {
            responseText = "Geen zorgen. Soms weten we niet meteen wat we voelen. Wat zou je helpen om dit beter te begrijpen?";
        } 
        // **4️⃣ OPT voorkomt herhaling en biedt écht een doorbraak**
        else if (session.conversation_history.filter(msg => msg.role === "user").length >= 5) {
            responseText = "Ik merk dat je hier echt mee zit. Wat zou voor jou een eerste stap zijn, hoe klein ook?";
        } 
        // **5️⃣ Als de gebruiker zich gehoord voelt, introduceert OPT een MB-oplossing op een natuurlijke manier**
        else {
            const focus = determineProductCategory(message);
            if (focus && products[focus]) {
                responseText = `Ik wil je niets opdringen, maar in mijn ervaring hebben mensen in jouw situatie veel gehad aan ${products[focus]}. Wat zou voor jou een waardevolle eerste stap zijn?`;
            } else {
                responseText = "Ik ben hier om je te ondersteunen. Wat is op dit moment het belangrijkste voor jou?";
            }
        }

        session.conversation_history.push({ role: "bot", content: responseText });
        res.json({ response: responseText });
    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error);
        res.status(500).json({ error: "Er ging iets mis met de API-aanroep." });
    }
});
