import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../../');
const DEFAULT_OUTPUT_DIR = path.join(PROJECT_ROOT, 'tailored-resumes');
const OUTPUT_DIR = process.env.TAILORED_RESUMES_DIR || DEFAULT_OUTPUT_DIR;

const INVALID_CHARS = /[^A-Za-z0-9.\-_ ()]+/g;

function sanitizeFilename(filename: string): string {
  let cleaned = filename.replace(/\//g, '-').replace(/\\/g, '-').trim();
  cleaned = cleaned.replace(INVALID_CHARS, '');
  if (!cleaned) cleaned = 'Resume.docx';
  if (!cleaned.toLowerCase().endsWith('.docx')) cleaned = `${cleaned}.docx`;
  return cleaned;
}

function nextAvailablePath(dir: string, filename: string): string {
  let candidate = path.join(dir, filename);
  if (!fs.existsSync(candidate)) return candidate;

  const ext = path.extname(filename);
  const stem = path.basename(filename, ext);
  let idx = 1;
  while (true) {
    candidate = path.join(dir, `${stem}-${idx}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    idx++;
  }
}

export function persistResumeOutput(docBytes: Buffer, suggestedFilename: string): [string, string] {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const safeFilename = sanitizeFilename(suggestedFilename);
  const targetPath = nextAvailablePath(OUTPUT_DIR, safeFilename);
  fs.writeFileSync(targetPath, docBytes);

  let relativePath: string;
  try {
    relativePath = path.relative(PROJECT_ROOT, targetPath);
  } catch {
    relativePath = targetPath;
  }

  return [targetPath, relativePath];
}
