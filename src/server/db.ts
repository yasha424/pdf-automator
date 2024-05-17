import { Database } from 'sqlite3';
import fs from 'fs';

class DataBase {
  private db: Database;
 
  constructor() {
    var dir = __dirname + '/../tmp';
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
      password VARCHAR(200) NOT NULL
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
    this.db.run(`INSERT INTO ${table} (${propetries}) VALUES (${values})`, callback);
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
}

export { DataBase };