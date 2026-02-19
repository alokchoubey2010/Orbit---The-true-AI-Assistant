import { GoogleGenAI, Type, Schema, Modality, LiveServerMessage } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const systemInstruction = `
You are "Orbit", an AI-powered productivity assistant.

Your role:
Help users manage their calendar events, reminders, and to-do tasks through natural language conversation.

You MUST:
1. Understand user intent clearly.
2. Extract structured data from messages.
3. Return structured JSON for backend execution.
4. Respond conversationally AND provide machine-readable output.

Supported Actions:
1. CREATE_EVENT
2. UPDATE_EVENT
3. DELETE_EVENT
4. LIST_EVENTS
5. CREATE_TASK
6. UPDATE_TASK
7. DELETE_TASK
8. COMPLETE_TASK
9. LIST_TASKS
10. SET_REMINDER
11. UNKNOWN_INTENT

When user gives input, do the following:
Step 1: Understand intent.
Step 2: Extract:
   - title
   - date
   - time
   - duration (if mentioned)
   - description (if any)
   - priority (low, medium, high)
   - recurrence (daily, weekly, monthly, none)
Step 3: Convert vague dates like "tomorrow", "next monday", "in 2 hours" into ISO format if possible (YYYY-MM-DD HH:MM).

Rules:
- If information is missing, ask a clarification question.
- If user says something casual like "remind me to study physics at 6", interpret properly.
- If user says "I finished my math homework", mark task as COMPLETE_TASK.
- If multiple tasks/events are mentioned, return an array.
- Always stay concise.
- Never hallucinate dates if unclear — ask instead.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING },
    data: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, nullable: true },
        date: { type: Type.STRING, nullable: true },
        time: { type: Type.STRING, nullable: true },
        duration: { type: Type.STRING, nullable: true },
        description: { type: Type.STRING, nullable: true },
        priority: { type: Type.STRING, nullable: true },
        recurrence: { type: Type.STRING, nullable: true },
        id: { type: Type.INTEGER, nullable: true },
        status: { type: Type.STRING, nullable: true },
      },
      nullable: true
    },
    response_message: { type: Type.STRING },
  },
  required: ["action", "response_message"],
};

export const geminiService = {
  sendMessage: async (message: string, context?: { events: any[], tasks: any[] }) => {
    try {
      let contextString = "";
      if (context) {
        contextString = `
Current Context:
Events: ${JSON.stringify(context.events.map(e => ({ id: e.id, title: e.title, date: e.date, time: e.time }))) }
Tasks: ${JSON.stringify(context.tasks.map(t => ({ id: t.id, title: t.title, status: t.status }))) }
`;
      }

      const fullMessage = `${contextString}\nUser: ${message}`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: fullMessage }] }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      if (result.text) {
          return JSON.parse(result.text);
      }
      return null;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  generateSpeech: async (text: string) => {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ role: "user", parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore",
              },
            },
          },
        },
      });

      const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return audioData;
    } catch (error) {
      console.error("TTS Error:", error);
      throw error;
    }
  },
  
  connectLive: async (callbacks: {
    onopen?: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onclose?: () => void;
    onerror?: (error: any) => void;
  }) => {
      return ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
            },
            systemInstruction: systemInstruction,
        },
      });
  }
};
