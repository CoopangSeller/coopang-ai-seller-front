import { createAiHandler } from '../server/openai.mjs';
export const config = { maxDuration: 210 };
export default createAiHandler(process.env);
