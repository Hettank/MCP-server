import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NOTES_FILE = join(__dirname, "../notes.json");

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// load notes from file
function loadNotes(): Note[] {
  if (!existsSync(NOTES_FILE)) return [];
  const raw = readFileSync(NOTES_FILE, "utf-8");
  return JSON.parse(raw);
}

// save notes to file
function saveNotes(notes: Note[]): void {
  writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

// generate simple id
function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// CRUD operations

export function createNote(title: string, content: string): Note {
  const notes = loadNotes();
  const note: Note = {
    id: generateId(),
    title,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.push(note);
  saveNotes(notes);
  return note;
}

export function listNotes(): Note[] {
  return loadNotes();
}

export function readNote(id: string): Note | null {
  const notes = loadNotes();
  return notes.find((n) => n.id === id) ?? null;
}

export function editNote(
  id: string,
  title?: string,
  content?: string,
): Note | null {
  const notes = loadNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;

  notes[index] = {
    ...notes[index],
    title: title ?? notes[index].title,
    content: content ?? notes[index].content,
    updatedAt: new Date().toISOString(),
  };
  saveNotes(notes);
  return notes[index];
}

export function deleteNote(id: string): boolean {
  const notes = loadNotes();
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length === notes.length) return false;
  saveNotes(filtered);
  return true;
}
