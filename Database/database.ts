import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Create data directory if it doesn't exist
const dataDir = './data';
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'flow_chats.db');
const db = new Database(dbPath);

// Enable foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

// Create tables if they do not exist
db.exec(`
    CREATE TABLE IF NOT EXISTS Conversation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        DateTime TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Flow (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Json_flow TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Chat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_prompt TEXT NOT NULL,
        bot_answer TEXT NOT NULL,
        flow_step_taken TEXT,
        DateTime TEXT NOT NULL DEFAULT (datetime('now')),
        conversation_id INTEGER NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES Conversation(id) ON DELETE CASCADE
    );
`);

export default db;
