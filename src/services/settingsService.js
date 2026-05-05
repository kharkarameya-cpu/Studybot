const d1 = require('./database');

class SettingsService {
  async setBranchCategories(guildId, categories, lfmChannelId) {
    const sql = `
      INSERT INTO guild_settings (guild_id, cat_ce, cat_cse, cat_mechanical, cat_other, lfm_channel_id) 
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET 
        cat_ce = excluded.cat_ce,
        cat_cse = excluded.cat_cse,
        cat_mechanical = excluded.cat_mechanical,
        cat_other = excluded.cat_other,
        lfm_channel_id = excluded.lfm_channel_id
    `;
    return await d1.run(sql, [
      guildId, 
      categories.CE, 
      categories.CSE, 
      categories.MECHANICAL, 
      categories.OTHER,
      lfmChannelId
    ]);
  }

  async getSettings(guildId) {
    const sql = 'SELECT * FROM guild_settings WHERE guild_id = ?';
    return await d1.findOne(sql, [guildId]);
  }
}

module.exports = new SettingsService();
