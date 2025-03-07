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

        // **Stap 1: Database als startpunt - Zoek relevante kennis**
        const matchedTopics = Object.keys(mbDatabase).filter(topic => message.toLowerCase().includes(topic.toLowerCase()));

        if (matchedTopics.length > 0) {
            let combinedKnowledge = matchedTopics.map(topic => mbDatabase[topic]["volledige_inhoud"]).join(" ");
            responseText = `"${combinedKnowledge.substring(0, 500)}"... Hoe voelt dit voor jou? Wat herken je hierin?`;
        } 
        // **Stap 2: Als er geen directe database match is, gebruik coachingtechnieken**
        else if (["depressie", "ik voel me slecht", "ik ben moe", "ik ben verloren", "angst"].some(phrase => message.toLowerCase().includes(phrase))) {
            responseText = "Ik hoor je en ik ben hier voor je. Wat is op dit moment het meest waardevolle inzicht dat je zou kunnen krijgen?";
        } 
        else if (["gehoord worden", "begrepen worden", "ik wil praten", "ik wil delen"].some(phrase => message.toLowerCase().includes(phrase))) {
            responseText = "Ik ben hier om naar je te luisteren. Vertel me wat het meest op je hart ligt.";
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
        else {
            const focus = determineProductCategory(message);
            if (focus && products[focus]) {
                responseText = `Veel mensen die zich zo voelen, hebben baat gehad bij ${products[focus]}. Dit is geen oplossing, maar kan richting geven. Wat roept dit bij je op?`;
            } else {
                responseText = "Ik ben hier om je te ondersteunen. Wat is op dit moment het belangrijkste voor jou?";
            }
        }

        // **OPT onthoudt eerder gegeven antwoorden om herhaling te voorkomen**
        session.response_memory.push(message.toLowerCase());
        session.conversation_history.push({ role: "bot", content: responseText });

        res.json({ response: responseText });
    } catch (error) {
        console.error("❌ Fout bij API-aanroep:", error);
        res.status(500).json({ error: "Er ging iets mis met de API-aanroep." });
    }
});
