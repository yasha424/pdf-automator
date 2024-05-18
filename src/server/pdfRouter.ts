import express, { Request, Response } from "express";
import { PDF } from './pdf';
import { DataBase } from './db';

const router = express.Router();
let dotenv = require('dotenv').config();

router.post('/pdf', async (req: Request, res: Response) => {
  const pdfBytes = await new PDF().makePdf(req.body.pdf);
  res.end(new Buffer(pdfBytes));
});

router.post('/send', async (req: Request, res: Response) => {
  const emails = req.body.emails;
  
  const pdfBytes = await new PDF().makePdf(req.body.pdf);

  if (emails == null || !Array.isArray(emails) || !emails.length) { return; };

  for (let email of emails) {
    let result = await sendMail("PDF-Editor", email, "PDF-Editor", "This is a pdf.", pdfBytes);
    
    if (result.status === 404) {
      return res.json({ status: 404 });
    }
  }
  res.json({status: 200});
});

async function sendMail(name: string, email: string, subject: string, message: string, pdfBytes: Uint8Array) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.set('Authorization', 'Basic ' + btoa(process.env.MAIL_API_KEY + ":" + process.env.MAIL_API_SECRET));

  const data = JSON.stringify({
    "Messages": [{
      "From": {"Email": "jakob20022404@gmail.com", "Name": "name"},
      "To": [{"Email": email, "Name": name}],
      "Subject": subject,
      "TextPart": message,
      "Attachments": [
        {
          "ContentType": "application/pdf",
					"Filename": "pdf.pdf",
					"Base64Content": Buffer.from(pdfBytes).toString('base64')
        }
      ]
    }]
  });

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: data,
  };

  let response = await fetch("https://api.mailjet.com/v3.1/send", requestOptions);
  let json: any = await response.json();
  
  if (json.Messages[0].Status === "error") {
    return { status: 404};
  }
  return { status: 200 };
}

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

  const pdfString = JSON.stringify(pdf).replace(/"/g, "&");
  console.log(pdfString);

  DataBase.shared.insert('pdfTemplates', 'userEmail, pdfJson, filename', `"${email}", "${pdfString}", "${filename}"`, (err) => {
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

  DataBase.shared.getAll('pdfTemplates', ['*'], ['userEmail'], [req.params.email], (err, rows) => {
    let pdfs = [];
    for (let row of rows) {
      pdfs.push({ pdf: JSON.parse(row.pdfJson.replace(/&/g, "\"")), id: row.id, filename: row.filename });
    }
    return res.json(pdfs);
  });
});

router.get('/pdf-template/:id', (req: Request, res: Response) => {
  if (req.params.id == undefined) {
    res.json({ status: 401 });
    return;
  }

  DataBase.shared.get('pdfTemplates', ['*'], ['id'], [req.params.id], (err, row: any) => {
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

  DataBase.shared.delete('pdfTemplates', ['id'], [req.params.id], (err) => {
    if (err == null) {
      res.json({ status: 200 });
    }
  });
});

router.get('/default-pdfs', (req: Request, res: Response) => {
  DataBase.shared.getAll('deafultPdfs', ['*'], undefined, undefined, (err, rows) => {
    if (err != null) { return; }
    let pdfs = [];
    for (let row of rows) {
      pdfs.push({ pdf: JSON.parse(row.pdfJson.replace(/&/g, "\"")), id: row.id, filename: row.filename });
    }
    return res.json(pdfs);
  });
})

router.get('/default-pdf/:id', (req: Request, res: Response) => {
  let id = req.params.id;
  
  if (id == null) {
    return res.json({ status: 404 });
  }

  DataBase.shared.getAll('deafultPdfs', ['*'], ['id'], [id], (err, row: any) => {
    if (err != null || row == undefined) { console.log(123); return; }
    
    if (row[0].pdfJson) {
      return res.json({ pdf: row[0].pdfJson.replace(/&/g, "\""), id: row.id, filename: row.filename });
    } else {
      return res.json({ status: 404 });
    }
  })
})

router.post('/save-default-pdf', async (req: Request, res: Response) => {
  const pdf = req.body.pdf;
  const filename = req.body.filename;

  if (filename == undefined) {
    res.json({ status: 401 });
    return;
  }
  if (Array.isArray(pdf) && !pdf.length) {
    res.json({ status: 404 });
    return;
  }

  const pdfString = JSON.stringify(pdf).replace(/"/g, "&");
  console.log(pdfString);

  DataBase.shared.insert('deafultPdfs', 'pdfJson, filename', `"${pdfString}", "${filename}"`, (err) => {
    if (err == null) {
      return res.json({ status: 200 })
    }
    return res.json({ status: 404 })
  });
});


export { router as pdfRouter };