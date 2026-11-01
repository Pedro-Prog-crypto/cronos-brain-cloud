CREATE TABLE memory_vectors(memory_id TEXT PRIMARY KEY REFERENCES memories(id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,model_key TEXT NOT NULL,dimensions INTEGER NOT NULL,vector TEXT NOT NULL,memory_version INTEGER NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX vectors_owner_model ON memory_vectors(user_id,model_key);
CREATE TRIGGER invalidate_memory_vector AFTER UPDATE ON memories BEGIN DELETE FROM memory_vectors WHERE memory_id=new.id; END;
