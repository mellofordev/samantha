export const generateUserPrompt = (prompt: string) => {
  return `
  <query_analysis>
    <user_input>${prompt}</user_input>
    <objective>
      Generate a comprehensive knowledge graph visualization
    </objective>
  </query_analysis>
  `;
};