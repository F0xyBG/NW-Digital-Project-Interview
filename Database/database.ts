import Database from 'better-sqlite3';

const db = new Database('flow_chats.db');

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
