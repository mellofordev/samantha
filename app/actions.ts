'use server'
import {generateText} from 'ai'
import {google} from '@ai-sdk/google'
import { code_gen_prompt } from '@/lib/prompt_helpers/code-gen';
import { writeFileSync } from 'fs';
export async function getVisualResponse(response: string) {
  writeFileSync('components/gen-ui.tsx', 'export default function GenUI() { return <div>Generating...</div> }')
  const result = await generateText({
    model:google('gemini-2.0-flash-exp'),
    prompt: `this is the visual requirements for generating the component : ${response}`,
    system:code_gen_prompt,
    maxSteps:5
  })
  writeFileSync('components/gen-ui.tsx', result.text)
  return {
    success:true
  }
}
