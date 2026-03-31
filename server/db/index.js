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
    class_name TEXT NOT NULL DEFAULT '',
    avatar     TEXT NOT NULL DEFAULT '🚀',
    pin_hash   TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    stars            INTEGER NOT NULL DEFAULT 0,
    badges           TEXT NOT NULL DEFAULT '[]',
    scientists       TEXT NOT NULL DEFAULT '[]',
    creative_answers TEXT NOT NULL DEFAULT '{}',
    nova_evaluation  TEXT NOT NULL DEFAULT '',
    updated_at       TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS quiz_cache (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    level_id   TEXT NOT NULL,
    type       TEXT NOT NULL,
    question   TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_quiz_cache_lt ON quiz_cache(level_id, type);

  CREATE TABLE IF NOT EXISTS quiz_results (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    level_id   TEXT NOT NULL,
    type       TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_quiz_results_uid   ON quiz_results(user_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_results_level ON quiz_results(level_id, type);
`)

// 数据迁移：为旧表添加新字段（ALTER TABLE 失败时静默跳过）
;['class_name TEXT NOT NULL DEFAULT \'\'', 'pin_hash TEXT NOT NULL DEFAULT \'\''].forEach(col => {
  try { db.exec(`ALTER TABLE users ADD COLUMN ${col}`) } catch {}
})

// 迁移唯一索引：(name, school) → (name, school, grade, class_name)，仅在旧索引存在时执行一次
const oldIndex = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_name_school'`).get()
if (oldIndex) db.exec(`DROP INDEX idx_users_name_school`)
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_identity ON users(name, school, grade, class_name)`)

export default db
