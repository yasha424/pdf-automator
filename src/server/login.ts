import express, { Request, Response } from "express";
import { DataBase } from './db';

const router = express.Router();
const db = new DataBase();

router.get('/register', (req: Request, res: Response) => {
  const query = req.query;
  console.log(query);
  

  if (query.email !== undefined && query.password != undefined && query.password == query.repassword) {
    db.insert('users', 'firstName, lastName, email, password', `"${query.first}", "${query.last}", "${query.email}", "${query.password}"`, (err) => {
      if (err == null) {
        return res.redirect('/main' + `?email=${query.email}&lastName=${query.last}&firstName=${query.first}`);
      }
      return res.json({ status: 401 });
    });
  }
});

router.get('/login', async (req: Request, res: Response) => {
  const query = req.query;

  let user = db.get('users', ['firstName', 'lastName', 'email'], ['email', 'password'], [query.email, query.password], (err, user) => {
    if (user != null) {
      return res.redirect(`/html/main.html?email=${user.email}&firstName=${user.firstName}&lastName=${user.lastName}`);
    } 
    return res.json({ status: 401 });
  });
});

router.post('/save-pdf', async (req: Request, res: Response) => {
  const email = req.body.email;
  const pdf = req.body.pdf;
  const filename = req.body.filename;


  if (filename == undefined) {
    res.json({ status: 401 });
    return;
  }
  if (email == undefined) {
    res.json({ status: 401 });
    return;
  }
  if (Array.isArray(pdf) && !pdf.length) {
    res.json({ status: 404 });
    return;
  }

  const pdfString = JSON.stringify(pdf).replace(/\"/g, "&");
  console.log(pdfString);

  db.insert('pdfTemplates', 'userEmail, pdfJson, filename', `"${email}", "${pdfString}", "${filename}"`, (err) => {
    if (err == null) {
      return res.json({ status: 200 })
    }
    return res.json({ status: 404 })
  });
});

router.get('/pdf-templates/:email', (req: Request, res: Response) => {
  if (req.params.email == undefined) {
    res.json({ status: 401 });
    return;
  }

  db.getAll('pdfTemplates', ['*'], ['userEmail'], [req.params.email], (err, rows) => {
    let pdfs = [];
    for (let i = 0; i < rows.length; i++) {
      pdfs.push({ pdf: JSON.parse(rows[i].pdfJson.replace(/&/g, "\"")), id: rows[i].id, filename: rows[i].filename });
    }
    return res.json(pdfs);
  });
});

router.get('/pdf-template/:id', (req: Request, res: Response) => {
  if (req.params.id == undefined) {
    res.json({ status: 401 });
    return;
  }

  db.get('pdfTemplates', ['*'], ['id'], [req.params.id], (err, row: any) => {
    if (err || row == undefined) { return; };
    if (row.pdfJson) {
      res.json({ pdf: row.pdfJson.replace(/&/g, "\""), id: row.id, filename: row.filename });
    } else {
      return res.json({ status: 404 });
    }
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

  db.delete('pdfTemplates', ['id'], [req.params.id], (err) => {
    if (err == null) {
      res.json({ status: 200 });
    }
  });
});

router.get('/default-pdfs', (req: Request, res: Response) => {
  db.getAll('deafultPdfs', ['*'], undefined, undefined, (err, rows) => {
    if (err != null) { return; }
    let pdfs = [];
    for (let i = 0; i < rows.length; i++) {
      pdfs.push({ pdf: JSON.parse(rows[i].pdfJson.replace(/&/g, "\"")), id: rows[i].id, filename: rows[i].filename });
    }
    return res.json(pdfs);
  });
})

router.get('/default-pdf/:id', (req: Request, res: Response) => {
  let id = req.params.id;
  
  if (id == null) {
    return res.json({ status: 404 });
  }

  db.getAll('deafultPdfs', ['*'], ['id'], [id], (err, row: any) => {
    if (err != null || row == undefined) { console.log(123); return; }
    
    if (row[0].pdfJson) {
      return res.json({ pdf: row[0].pdfJson.replace(/&/g, "\""), id: row.id, filename: row.filename });
    } else {
      return res.json({ status: 404 });
    }
  })
})


export { router as loginRouter };