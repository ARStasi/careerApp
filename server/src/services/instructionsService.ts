import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSTRUCTIONS_PATH = process.env.INSTRUCTIONS_PATH ||
  path.join(__dirname, '../../../backend/app/assets/instructions.md');

export function getInstructions(): string {
  let content = fs.readFileSync(INSTRUCTIONS_PATH, 'utf-8');
  if (content.startsWith('markdown\n')) {
    content = content.slice('markdown\n'.length);
  }
  return content;
}

export function saveInstructions(content: string): void {
  fs.writeFileSync(INSTRUCTIONS_PATH, content, 'utf-8');
}
