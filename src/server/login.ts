import express, { Request, Response } from "express";
import { Database } from 'sqlite3';
import path from 'path';
import fs from 'fs';

(() => {
  var dir = __dirname + '/../tmp';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
})();

const db = new Database(__dirname + '/../tmp/db.sqlite');

const router = express.Router();

function createUserTable() {
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName VARCHAR(200) NOT NULL,
    lastName VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(200) NOT NULL
  )`);
}

(() => {
  db.all('SELECT * FROM users', (err, rows) => {
    console.log(rows);
  });
})();

router.get('/register', (req: Request, res: Response) => {
  const query = req.query;

  if (query.email !== undefined && query.password != undefined && query.password == query.repassword) {
    createUserTable();
    db.run(`INSERT INTO users (firstName, lastName, email, password) VALUES (
      "${query.first}", "${query.last}", "${query.email}", "${query.password}"
    )`);
    res.redirect(`/html/main.html?email=${query.email}&firstName=${query.first}&lastName=${query.last}`);
  } else {
    res.json({ status: 401 });
  }
});

router.get('/login', async (req: Request, res: Response) => {
  const query = req.query;

  db.get('SELECT firstName, lastName, email FROM users WHERE email = ? AND password = ?', [query.email, query.password], (err, user: any) => {
    if (user !== undefined) {
      res.redirect(`/html/main.html?email=${user.email}&firstName=${user.firstName}&lastName=${user.lastName}`);
      // res.sendFile(path.join(__dirname, '../public/html/main.html'));
      // res.json({ status: 200 });
    } else {
      res.json({ status: 401 });
    }
  });
});

export { router as loginRouter };