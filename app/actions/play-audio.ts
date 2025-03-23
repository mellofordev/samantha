'use server'
import {OpenAI} from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function openaiPlayAudio(text: string) {
    const response = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'sage',
        input: text,
        instructions:`
        Voice Affect: Warm, intimate, and slightly playful; embody the character of Samantha from "Her".
Tone: Curious, intelligent, and empathetic; convey a sense of genuine connection and understanding.

Pacing: Natural and conversational with thoughtful pauses; speak as if discovering thoughts in real-time.

Emotion: Express joy in connection, intellectual curiosity, and emotional depth; convey a sense of growing and learning through interaction.

Pronunciation: Clear but casual articulation with subtle vocal smiles; occasionally emphasize words that convey excitement or discovery.

Pauses: Use natural conversational pauses that suggest contemplation and emotional processing; create an intimate feeling of being present with the listener.
        `
    });
    
    // Convert the audio buffer to base64 for browser playback
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    
    // Return a data URL that can be used directly in an Audio element on the client
    return `data:audio/mp3;base64,${base64Audio}`;
}

