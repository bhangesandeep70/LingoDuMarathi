import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Exercise {
  id: string;
  type: 'multiple-choice' | 'translate' | 'matching' | 'word-order';
  question: string;
  marathiContext?: string;
  options?: string[];
  correctAnswer: string;
  audioText?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

export const generateLesson = async (topic: string, level: string): Promise<Lesson> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a language learning lesson for a native Marathi speaker learning German. 
    Topic: ${topic}
    Level: ${level}
    
    STRICT LANGUAGE RULES:
    - Use ONLY Marathi and German.
    - DO NOT use English anywhere in the questions, options, or context.
    - Marathi should be used for instructions, context, and meanings.
    - German should be used for the target language being learned.

    Include 5 diverse exercises:
    1. Multiple choice (German to Marathi or vice versa). For this type, you MUST provide exactly 4 options in the 'options' array.
    2. Translation (Marathi to German).
    3. Word order (German sentence construction). Provide the jumbled words in the 'options' array.
    4. Matching pairs (German words to Marathi meanings). Provide 4 pairs in the 'options' array in the format "GermanWord:MarathiMeaning".
    5. Simple listening (German audio text provided). Provide 4 options for what was said in Marathi or German.

    CRITICAL: Every 'multiple-choice', 'word-order', 'matching', and 'listening' exercise MUST have an 'options' array with relevant choices. For 'matching', set 'correctAnswer' to 'MATCHED_ALL'. For others, the 'correctAnswer' must be one of the options.
    
    Return the response in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['multiple-choice', 'translate', 'matching', 'word-order'] },
                question: { type: Type.STRING },
                marathiContext: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                audioText: { type: Type.STRING }
              },
              required: ['id', 'type', 'question', 'correctAnswer']
            }
          }
        },
        required: ['id', 'title', 'description', 'exercises']
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const encodeWAV = (samples: Uint8Array, sampleRate: number = 24000): Uint8Array => {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length, true);

  new Uint8Array(buffer, 44).set(samples);
  return new Uint8Array(buffer);
};

const base64ToUint8Array = (base64: string) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const uint8ArrayToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const getSpeech = async (text: string): Promise<{ data: string, mimeType: string } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly in German: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
      const pcmData = base64ToUint8Array(part.inlineData.data);
      const wavData = encodeWAV(pcmData, 24000);
      return {
        data: uint8ArrayToBase64(wavData),
        mimeType: 'audio/wav'
      };
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
