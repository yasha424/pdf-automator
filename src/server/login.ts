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

function createPdfTemplateTable() {
  db.exec(`CREATE TABLE IF NOT EXISTS pdfTemplates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userEmail VARCHAR(200) NOT NULL,
    pdfJson TEXT NOT NULL
  )`);
}

(() => {
  // db.exec('DELETE FROM pdfTemplates');
  db.all('SELECT * FROM pdfTemplates', (err, rows: any) => {
    for (let i = 0; i < rows.length; i++) {
      // console.log(rows[i]);
    }
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

router.post('/save-pdf', async (req: Request, res: Response) => {
  const email = req.body.email;
  const pdf = req.body.pdf;

  if (email == undefined) {
    res.json({ status: 401 });
    return;
  }
  if (Array.isArray(pdf) && !pdf.length) {
    res.json({ status: 404 });
    return;
  }

  createPdfTemplateTable();
  const pdfString = JSON.stringify(pdf).replace(/\"/g, "&");
  db.run(`INSERT INTO pdfTemplates (userEmail, pdfJson) VALUES (
    "${email}", "${pdfString}"
  )`);

  res.json({status: 200})
});

router.get('/pdf-templates/:email', (req: Request, res: Response) => {
  if (req.params.email == undefined) {
    res.json({ status: 401 });
    return;
  }
  db.all('SELECT * FROM pdfTemplates WHERE userEmail = ?', [req.params.email], (err, rows: any) => {
    let pdfs = [];
    for (let i = 0; i < rows.length; i++) {
      pdfs.push({ pdf: JSON.parse(rows[i].pdfJson.replace(/&/g, "\"")), id: rows[i].id });
    }
    res.json(pdfs);
  })
});

router.delete('/pdf-templates/:email/:id', (req: Request, res: Response) => {
  if (req.params.email == undefined) {
    res.json({ status: 401 });
    return;
  }
  if (req.params.id == undefined) {
    res.json({ status: 404 });
    return;
  }

  db.run('DELETE FROM pdfTemplates WHERE id = ?', req.params.id, (err: any) => {
    console.log(err);
    
    if (err == null) {
      res.json({ status: 200 });
    }
  });
});

export { router as loginRouter };