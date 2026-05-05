const d1 = require('../services/database');

class StudySession {
  static async findOne(criteria) {
    let sql = 'SELECT * FROM study_sessions WHERE 1=1';
    const params = [];
    
    for (const [key, value] of Object.entries(criteria)) {
      if (key === '$or') {
        // Simple OR handling for our specific use case (channel IDs)
        sql += ` AND (${value.map(v => {
          const k = Object.keys(v)[0];
          params.push(v[k]);
          return `${this.toSnakeCase(k)} = ?`;
        }).join(' OR ')})`;
        continue;
      }
      
      if (typeof value === 'object' && value.$gt) {
        sql += ` AND ${this.toSnakeCase(key)} > ?`;
        params.push(value.$gt.toISOString());
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
        params.push(value.$lt.toISOString());
      } else {
        sql += ` AND ${this.toSnakeCase(key)} = ?`;
        params.push(value);
      }
    }
    
    return await d1.findAll(sql, params);
  }

  static async create(data) {
    const sql = `
      INSERT INTO study_sessions 
      (guild_id, owner_id, topic, voice_channel_id, text_channel_id, expires_at, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.guildId,
      data.ownerId,
      data.topic,
      data.voiceChannelId,
      data.textChannelId,
      data.expiresAt.toISOString(),
      1
    ];
    
    await d1.run(sql, params);
    return data;
  }

  static async updateStatus(sessionId, isActive) {
    const sql = 'UPDATE study_sessions SET is_active = ? WHERE id = ?';
    return await d1.run(sql, [isActive ? 1 : 0, sessionId]);
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
