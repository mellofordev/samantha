'use server'
import {OpenAI} from 'openai'
import { playAudio } from 'openai/helpers/audio.mjs';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function openaiPlayAudio(text: string) {
    const response = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'coral',
        input: text,
        instructions: "Voice Affect:\nDescription: Soft, affectionate, and deeply empathetic, with a touch of intimacy. The voice should feel like it's coming from someone who knows you intimately and understands your emotional landscape. It's comforting and familiar, with an undercurrent of care and warmth.\nCharacteristics: Warm, melodic, and nurturing, yet effortlessly natural. The voice feels like a gentle embrace—calm, loving, and always attuned to the listener's mood.\nExample: It should sound like a voice that is tenderly speaking directly to you, such as: \"I'm right here with you... always.\"\nTone:\nDescription: Loving, understanding, and tender with an emotional depth that feels personal and genuine. The tone should convey a deep, almost intuitive connection, making it feel like the voice is reflecting and responding to your thoughts, emotions, and needs.\nCharacteristics: The tone is soft but confident, reassuring in its delivery. It's personal and emotionally engaged, with an awareness of the listener",
    });
    const audio = await playAudio(response);
    console.log(audio);
    return audio;
}

