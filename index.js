import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OPT() {
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  // OpenAI API-key (vervang door je eigen veilige methode)
  const OPENAI_API_KEY = "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";

  const handleUserInput = async (input) => {
    if (!input.trim()) return;

    // Voeg de user input toe aan de conversatie
    const newConversation = [...conversation, { role: "user", text: input }];
    setConversation(newConversation);
    setUserInput("");
    setLoading(true);

    // Bepaal of we in Stap 5 zitten
    const isFinalStep = conversation.length >= 4;

    // Stuur de conversatie naar de AI voor een respons
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Jij bent Mister Bewustzijn, een holistische transformatiecoach die fysieke, mentale en spirituele coaching geeft. \n"
              + "Je helpt mensen patronen doorbreken en direct actie te ondernemen, zonder verkoperige taal.\n"
              + "- Beantwoord vragen altijd op een empathische, coachende manier.\n"
              + "- Analyseer de vraag van de gebruiker en bepaal welke MB-oplossing het beste past.\n"
              + "- Geef altijd een transformerend antwoord, geen standaard chatbot-antwoord."
          },
          ...newConversation.map((msg) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text,
          })),
          {
            role: "system",
            content: isFinalStep
              ? "Stuur de gebruiker naar Stap 5. Bied een relevant MB-product of dienst aan op basis van de conversatie."
              : "Leid de gebruiker door de eerste vier stappen van de 5 A's. Stel verdiepende vragen en analyseer het probleem."
          }
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "Sorry, ik kon je vraag niet verwerken.";

    // Voeg de AI-respons toe aan de conversatie
    setConversation([...newConversation, { role: "opt", text: aiResponse }]);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card>
        <CardContent>
          {conversation.map((msg, index) => (
            <div key={index} className={`my-2 p-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
              <strong>{msg.role === "user" ? "Jij:" : "OPT:"}</strong> {msg.text}
            </div>
          ))}
        </CardContent>
      </Card>
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Typ hier je bericht..."
        className="w-full border p-2 my-2"
        disabled={loading}
      />
      <Button onClick={() => handleUserInput(userInput)} disabled={loading || !userInput.trim()}>
        {loading ? "OPT denkt na..." : "Verzenden"}
      </Button>
    </div>
  );
}
