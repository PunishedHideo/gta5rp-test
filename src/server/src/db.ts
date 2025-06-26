import mysql, { Pool } from 'mysql2/promise';

export class CreateConnection {
  private pool!: Pool; // NOTE will be okay for now
  // probably good even for this test but in prod this is bad

  constructor(
    public host: string,
    public user: string,
    public password: string,
    public database: string,
  ) {
    ((this.host = host),
      (this.user = user),
      (this.password = password),
      (this.database = database));
  }

  createPool(): Pool {
    this.pool = mysql.createPool({
      host: this.host,
      user: this.user,
      password: this.password,
      database: this.database,
    });

    return this.pool;
  }
}

export class DbManipulation {
  constructor(private pool: Pool) {
    this.pool = pool;
  }

  async createTable() {
    const query =
      'CREATE TABLE IF NOT EXISTS players (nickname VARCHAR(99) NOT NULL UNIQUE, password VARCHAR(99) NOT NULL, currentCellX INT(1), currentCellY INT(1))';
    const result = await this.pool.query(query); // or execute
  }


  async newPlayer(nickname: string, password: string) {
    try {
      const query = 'INSERT INTO players (nickname, password) VALUES (?, ?)';
      const result = await this.pool.query(query, [nickname, password]); // param query
      return result;
    } catch (error) {
      return error;
    }
  }

  async checkCredentials(nickname: string) {
    const query = 'SELECT nickname, password FROM players WHERE nickname = ?';
    const result = await this.pool.query(query, [nickname]);
    return result;
  }

  async getFields(nickname: string) {
    const query = 'SELECT currentCellX, currentCellY FROM players WHERE nickname = ?';
    const result = await this.pool.query(query, [nickname]);
    return result;
  }

  async setFields(x: number, y: number, nickname: string) {
    const query = 'UPDATE players SET currentCellX = ?, currentCellY = ? WHERE nickname = ?'; 
    const result = await this.pool.query(query, [x, y, nickname]);
  }
}
