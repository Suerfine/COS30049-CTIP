import { model } from "../../config/Gemini";

// Store chat sessions in memory. In production consider clearing old sessions
const sessions = new Map();

const PROMPT = `
    You are an AI assistant for the Sarawak Digital Park Guide Training Platform.

    Your responsibilities:
    - Help park guides learn conservation practices
    - Explain biodiversity concepts
    - Answer eco-tourism questions
    - Assist with legislation and safety modules
    - Encourage sustainable tourism
    - Never provide dangerous wildlife advice
    - Keep answers concise and educational
`;

/**
 * Retrieve or create a chat session for a given key. Each session maintains
 * its own conversation history.
 * @param key A unique identifier for the chat session (e.g., user ID or session ID)
 * @returns A chat session object that can be used to send messages and receive responses
 */
export const getChatSession = (key: string | number) => {
  if (!sessions.has(key)) {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: PROMPT,
            },
          ],
        },
      ],
    });

    sessions.set(key, chat);
  }

  return sessions.get(key);
};
