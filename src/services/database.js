const axios = require('axios');
const logger = require('../utils/logger');

class D1Service {
  constructor() {
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_DATABASE_ID}/query`;
    this.headers = {
      'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  async query(sql, params = []) {
    try {
      const response = await axios.post(this.baseUrl, {
        sql: sql,
        params: params,
      }, { headers: this.headers });

      if (!response.data.success) {
        throw new Error(response.data.errors[0].message);
      }

      return response.data.result[0];
    } catch (error) {
      if (error.response && error.response.data) {
        const cfErrors = error.response.data.errors.map(e => `[${e.code}] ${e.message}`).join(', ');
        logger.error(`D1 API Error: ${cfErrors}`);
        throw new Error(`Cloudflare D1 Error: ${cfErrors}`);
      }
      logger.error(`D1 Query Error: ${error.message}`);
      throw error;
    }
  }

  // Convenience methods
  async findOne(sql, params = []) {
    const result = await this.query(sql, params);
    return result.results[0] || null;
  }

  async findAll(sql, params = []) {
    const result = await this.query(sql, params);
    return result.results || [];
  }

  async run(sql, params = []) {
    return await this.query(sql, params);
  }
}

module.exports = new D1Service();
