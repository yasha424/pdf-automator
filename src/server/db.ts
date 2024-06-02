import { Database } from 'sqlite3';
import fs from 'fs';

class DataBase {
  static readonly shared = new DataBase();
  private db: Database;

  private constructor() {
    const dir = __dirname + '/../tmp';

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    this.db = new Database(__dirname + '/../tmp/db.sqlite');
    this.createPdfTemplateTable();
    this.createUserTable();
    this.createDefaultPdfsTable();
  }

  private createUserTable() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName VARCHAR(200) NOT NULL,
      lastName VARCHAR(200) NOT NULL,
      email VARCHAR(200) NOT NULL,
      password VARCHAR(200) NOT NULL,
      admin BOOLEAN NOT NULL DEFAULT FALSE
    )`);
  }

  private createPdfTemplateTable() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS pdfTemplates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename VARCHAR(200) NOT NULL,
      pdfJson TEXT NOT NULL,
      userEmail VARCHAR(200) NOT NULL,
      FOREIGN KEY(userEmail) REFERENCES users(email)
    )`);
  }

  private createDefaultPdfsTable() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS deafultPdfs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename VARCHAR(200) NOT NULL,
      pdfJson TEXT NOT NULL
    )`);
  }

  insert(table: string, propetries: string, values: string, callback?: (err: Error | null) => void) {
    this.db.run(`INSERT INTO ${table} (${propetries}) VALUES(${values.split(', ').map(() => { return '?' })})`, values.split(', '), callback);
  }

  get(table: string, propetries: string[], where?: string[], equals?: any[], callback?: (err: Error | null, result: any) => void) {
    let request = `SELECT ${propetries.toString()} FROM ${table} `;
    if (where && equals && where?.length == equals?.length) {
      request += `WHERE `;
      for (let i = 0; i < where?.length; i++) {
        request += `${where?.[i]} = ?`;
        if (i !== where?.length - 1) {
          request += ' AND ';
        }
      }
    }

    this.db.get(request, equals, (err, result: any) => {
      callback?.(err, result);
    });
  }

  getAll(table: string, propetries: string[], where?: string[], equals?: any[], callback?: (err: Error | null, results: any[]) => void) {
    let request = `SELECT ${propetries.toString()} FROM ${table} `;
    if (where && equals && where?.length == equals?.length) {
      request += `WHERE `;
      for (let i = 0; i < where?.length; i++) {
        request += `${where?.[i]} = ?`;
        if (i !== where?.length - 1) {
          request += ' AND ';
        }
      }
    }
        
    this.db.all(request, equals, (err, results: any[]) => {
      callback?.(err, results);
    });
  }

  delete(table: string, where?: string[], equals?: any[], callback?: (err: Error | null) => void) {
    let request = `DELETE FROM ${table} `;
    if (where && equals && where?.length == equals?.length) {
      request += `WHERE `;
      for (let i = 0; i < where?.length; i++) {
        request += `${where?.[i]} = ?`;
        if (i !== where?.length - 1) {
          request += ' AND ';
        }
      }
    }

    this.db.run(request, equals, (err: any) => {
      callback?.(err);
    });
  }

  update(table: string, set: string[], where?: string[], data?: any[], equals?: any[], callback?: (err: Error | null) => void) {
    let request = `UPDATE ${table} `;
    if (set && data && set.length == data.length) {
      request += `SET `;
      for (let i = 0; i < set.length; i++) {
        request += `${set[i]} = ?`;
        if (i !== set.length - 1) {
          request += ' AND ';
        }
      }
    }

    if (where && equals && where?.length == equals?.length) {
      request += `WHERE `;
      for (let i = 0; i < where?.length; i++) {
        request += `${where?.[i]} = ?`;
        if (i !== where?.length - 1) {
          request += ' AND ';
        }
      }
    }

    this.db.run(request, data, callback);
  }

}

export { DataBase };