import { model } from "../../config/Gemini";

// Store chat sessions in memory. In production consider clearing old sessions
const sessions = new Map();

export const createChatSession = (
  key: string | number,
  context: string = "",
) => {
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text: `
            You are an AI assistant for the Sarawak Digital Park Guide Training Platform.

            Your responsibilities:
            - Help park guides learn conservation practices
            - Explain biodiversity concepts
            - Answer eco-tourism questions
            - Assist with legislation and safety modules
            - Encourage sustainable tourism
            - Never provide dangerous wildlife advice
            - Keep answers concise and educational

            This is contenxt information. Use it to answer the user's question. If the
            question is not related to the context, answer based on your general 
            knowledge.:
            ${context}
            `,
          },
        ],
      },
    ],
  });
  sessions.set(key, chat);
  return chat;
};

/**
 * Retrieve a chat session for a given key. Each session maintains its own
 * conversation history. Returns null if doesnt exists.
 * @param key A unique identifier for the chat session (e.g., user ID or session ID)7
 * @returns A chat session object that can be used to send messages and receive responses else null if session does not exist
 */
export const getChatSession = (key: string | number) => {
  if (!sessions.has(key)) {
    return null;
  }

  return sessions.get(key);
};
