-- Cloudflare D1 SQL Schema for Study Bot
DROP TABLE IF EXISTS study_sessions;
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    voice_channel_id TEXT NOT NULL,
    text_channel_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active INTEGER DEFAULT 1,
    user_limit INTEGER DEFAULT 0,
    is_locked INTEGER DEFAULT 0
);

-- Guild Settings for branch-specific categories
DROP TABLE IF EXISTS guild_settings;
CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    cat_ce TEXT,
    cat_cse TEXT,
    cat_mechanical TEXT,
    cat_other TEXT,
    lfm_channel_id TEXT
);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_expires_at ON study_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_topic ON study_sessions(guild_id, owner_id, topic, is_active);
