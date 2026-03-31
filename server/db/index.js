import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/xingyuan.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    school     TEXT NOT NULL DEFAULT '',
    grade      TEXT NOT NULL DEFAULT '',
    avatar     TEXT NOT NULL DEFAULT '🚀',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_school ON users(name, school);

  CREATE TABLE IF NOT EXISTS progress (
    user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    stars            INTEGER NOT NULL DEFAULT 0,
    badges           TEXT NOT NULL DEFAULT '[]',
    scientists       TEXT NOT NULL DEFAULT '[]',
    creative_answers TEXT NOT NULL DEFAULT '{}',
    nova_evaluation  TEXT NOT NULL DEFAULT '',
    updated_at       TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`)

export default db
