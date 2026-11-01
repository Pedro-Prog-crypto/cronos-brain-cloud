ALTER TABLE memory_versions ADD COLUMN snapshot TEXT;
CREATE TRIGGER memory_history BEFORE UPDATE ON memories
BEGIN
  INSERT INTO memory_versions(id,memory_id,version,content,created_at,snapshot)
  VALUES(lower(hex(randomblob(16))),old.id,old.version,old.content,old.updated_at,
    json_object('content',old.content,'source',old.source,'confidence',old.confidence,'metadata',json(old.metadata),'kind',old.kind));
END;
CREATE TABLE preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  proactive INTEGER NOT NULL DEFAULT 0,
  quiet_start INTEGER NOT NULL DEFAULT 22 CHECK(quiet_start BETWEEN 0 AND 23),
  quiet_end INTEGER NOT NULL DEFAULT 8 CHECK(quiet_end BETWEEN 0 AND 23),
  retention_days INTEGER NOT NULL DEFAULT 0 CHECK(retention_days BETWEEN 0 AND 3650),
  backup_enabled INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE events ADD COLUMN recurrence_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE reminders ADD COLUMN seen_at TEXT;
CREATE TABLE tool_executions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,tool TEXT NOT NULL,status TEXT NOT NULL,latency_ms INTEGER NOT NULL,error_code TEXT,created_at TEXT NOT NULL);
CREATE TABLE documents (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,mime TEXT NOT NULL,content TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX documents_owner ON documents(user_id);
CREATE TABLE backups (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,object_key TEXT NOT NULL UNIQUE,checksum TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE response_cache (key TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,value TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX cache_expiry ON response_cache(expires_at);
CREATE TABLE memory_relations (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,from_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,to_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,relation TEXT NOT NULL,UNIQUE(user_id,from_id,to_id,relation));
