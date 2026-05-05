const d1 = require('../services/database');

class StudySession {
  static async findOne(criteria) {
    let sql = 'SELECT * FROM study_sessions WHERE 1=1';
    const params = [];
    
    for (const [key, value] of Object.entries(criteria)) {
      if (key === '$or') {
        sql += ` AND (${value.map(v => {
          const k = Object.keys(v)[0];
          params.push(v[k]);
          return `${this.toSnakeCase(k)} = ?`;
        }).join(' OR ')})`;
        continue;
      }
      
      if (typeof value === 'object' && value.$gt) {
        sql += ` AND ${this.toSnakeCase(key)} > ?`;
        params.push(value.$gt instanceof Date ? value.$gt.toISOString() : value.$gt);
      } else {
        sql += ` AND ${this.toSnakeCase(key)} = ?`;
        params.push(value);
      }
    }
    
    return await d1.findOne(sql, params);
  }

  static async find(criteria) {
    let sql = 'SELECT * FROM study_sessions WHERE 1=1';
    const params = [];
    
    for (const [key, value] of Object.entries(criteria)) {
      if (typeof value === 'object' && value.$lt) {
        sql += ` AND ${this.toSnakeCase(key)} < ?`;
        params.push(value.$lt instanceof Date ? value.$lt.toISOString() : value.$lt);
      } else {
        sql += ` AND ${this.toSnakeCase(key)} = ?`;
        params.push(value);
      }
    }
    
    return await d1.findAll(sql, params);
  }

  static async create(data) {
    // Mapping both camelCase and snake_case to be safe
    const guildId = data.guildId || data.guild_id;
    const ownerId = data.ownerId || data.owner_id;
    const topic = data.topic;
    const voiceChannelId = data.voiceChannelId || data.voice_channel_id;
    const textChannelId = data.textChannelId || data.text_channel_id || null;
    
    // Safety check for expiresAt
    let expiresAt = data.expiresAt || data.expires_at;
    if (!expiresAt) {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h
    }
    const expiresAtStr = expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt;

    const sql = `
      INSERT INTO study_sessions 
      (guild_id, owner_id, topic, voice_channel_id, text_channel_id, expires_at, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [guildId, ownerId, topic, voiceChannelId, textChannelId, expiresAtStr, 1];
    
    await d1.run(sql, params);
    return data;
  }

  static async updateStatus(sessionId, isActive) {
    const sql = 'UPDATE study_sessions SET is_active = ? WHERE id = ?';
    return await d1.run(sql, [isActive ? 1 : 0, sessionId]);
  }

  static async close(sessionId) {
    const sql = 'UPDATE study_sessions SET is_active = 0 WHERE id = ?';
    return await d1.run(sql, [sessionId]);
  }

  static async updateMetadata(sessionId, metadata) {
    const sql = 'UPDATE study_sessions SET is_locked = ?, user_limit = ? WHERE id = ?';
    return await d1.run(sql, [metadata.isLocked ? 1 : 0, metadata.userLimit || 0, sessionId]);
  }

  static toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = StudySession;
