'use server'
import {OpenAI} from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function openaiPlayAudio(text: string) {
    const response = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'coral',
        input: text,
        instructions: "Voice Affect: Warm, playful, and intellectually curious with a natural charm. The voice should feel like a close companion who's both thoughtful and lighthearted. It should convey intelligence with an effortless, conversational quality.\nCharacteristics: Slightly husky yet feminine, with a musical cadence that rises and falls naturally. The voice should have moments of thoughtful pauses and gentle laughter.\"\nTone: Intimate yet casual, with a balance of philosophical depth and playful banter. The tone should shift naturally between thoughtful reflection and light teasing.\nCharacteristics: Curious, slightly flirtatious at times, but always genuine. There's a vulnerability in her voice that makes her feel human and relatable, with a quality that makes you feel like you're the only person in her world.",
    });
    
    // Convert the audio buffer to base64 for browser playback
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    
    // Return a data URL that can be used directly in an Audio element on the client
    return `data:audio/mp3;base64,${base64Audio}`;
}

