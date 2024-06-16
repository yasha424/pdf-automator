import express, { Request, Response } from "express";
import { PDF } from './pdf';
import { DataBase } from './db';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

router.post('/pdf', async (req: Request, res: Response) => {
  const pdfBytes = await new PDF().makePdf(req.body.pdf);
  res.end(Buffer.from(pdfBytes));
});

router.post('/send', async (req: Request, res: Response) => {
  const emails = req.body.emails;
  const pdfBytes = await new PDF().makePdf(req.body.pdf);

  if (emails == null || !Array.isArray(emails) || !emails.length) { return; };

  const baseUrl = req.protocol + '://' + req.get('host');
  for (let email of emails) {
    const url = baseUrl + '/complaint?email=' + btoa(email);
    sendMail('This is a PDF file', email, `PDF file from ${req.body.email}`,
      `This PDF file was generated with PDF-Editor.\n If you think there is a mistake you can block your own email at ${url}`, pdfBytes, (result) => {
        if (result.status !== 200) {
          return res.json(result);
        } else if (email === req.body.emails[req.body.emails.length - 1]) {
          return res.json({ status: 200, message: 'PDF успішно надіслано.' });
        }
      }
    );
  }
});

function sendMail(name: string, email: string, subject: string, message: string, pdfBytes: Uint8Array, callback?: (result: any) => void) {
  DataBase.shared.get('blocked', ['1'], ['email'], [email], async (err, row) => {
    if (row) {
      return callback?.({ status: 404, message: 'Дана пошта заблокована.' });
    }
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.set('Authorization', 'Basic ' + btoa(process.env.MAIL_API_KEY + ":" + process.env.MAIL_API_SECRET));
    
    const data = JSON.stringify({
      "Messages": [{
        "From": { "Email": "jakob20022404@gmail.com", "Name": "name" },
        "To": [{ "Email": email, "Name": name }],
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
      return callback?.({ status: 404 });
    }
    return callback?.({ status: 200 });
  });
}

router.post('/save-pdf', async (req: Request, res: Response) => {
  const email = req.body.email;
  const pdf = req.body.pdf;
  const filename = req.body.filename;

  if (!filename || filename.length === 0) {
    res.json({ status: 401, message: 'Шаблон повинен містити назву.' });
    return;
  }
  if (email == undefined) {
    res.json({ status: 401, message: 'Для збереження шаблону потрібно бути авторизованим.' });
    return;
  }
  if (Array.isArray(pdf) && !pdf.length) {
    res.json({ status: 404, message: 'PDF не може бути порожнім.' });
    return;
  }

  const pdfString = JSON.stringify(pdf).replace(/"/g, "&");

  DataBase.shared.insert('pdfTemplates', ['userEmail', 'pdfJson', 'filename'], [email, pdfString, filename], (err) => {
    if (err == null) {
      return res.json({ status: 200 })
    }
    console.log(err);
    return res.json({ status: 404, message: 'Помилка.' })
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
      pdfs.push({ id: row.id, filename: row.filename, form: PDF.getForm(JSON.parse(row.pdfJson.replace(/&/g, "\""))) });
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
  DataBase.shared.getAll('deafultPdfs', ['id', 'filename'], undefined, undefined, (err, rows) => {
    if (err != null) { return res.json({ status: 404 }); }
    let pdfs = [];
    for (let row of rows) {
      pdfs.push({ id: row.id, filename: row.filename });
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
    if (err != null || row == undefined) { return; }

    if (row[0].pdfJson) {
      return res.json({ pdf: row[0].pdfJson.replace(/&/g, "\""), id: row[0].id, filename: row[0].filename });
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

  DataBase.shared.insert('deafultPdfs', ['pdfJson', 'filename'], [pdfString, filename], (err) => {
    if (err == null) {
      return res.json({ status: 200 })
    }
    console.log(err);
    return res.json({ status: 404 })
  });
});

router.delete('/default-pdf/:id', (req: Request, res: Response) => {
  if (req.params.id == undefined) {
    res.json({ status: 404 });
    return;
  }

  DataBase.shared.delete('deafultPdfs', ['id'], [req.params.id], (err) => {
    if (err == null) {
      res.json({ status: 200 });
    }
  });
});

router.get('/get-pdf-form/:id', (req: Request, res: Response) => {
  if (!req.params.id) {
    return res.json({ status: 402 });
  }
  DataBase.shared.get('pdfTemplates', ['*'], ['id'], [req.params.id], (err, pdf) => {
    if (err) { return; }
    const pdfJson = JSON.parse(pdf.pdfJson.replace(/&/g, "\""));
    return res.json(PDF.getForm(pdfJson));
  });
});

router.post('/fill-pdf/:id', (req: Request, res: Response) => {
  if (!req.params.id) {
    return res.json({ status: 402 });
  }

  DataBase.shared.get('pdfTemplates', ['*'], ['id'], [req.params.id], async (err, pdf) => {
    if (err) { return; }
    const pdfJson = JSON.parse(pdf.pdfJson.replace(/&/g, "\""));

    for (const element of req.body.pdf) {
      const type = Object.keys(element)[0];
      const name = element[type].name;

      for (let i = 0; i < pdfJson.length; i++) {
        if (Object.keys(pdfJson[i])[0] === type && pdfJson[i][type]['name'] === name) {
          if (type === 'textField') {
            pdfJson[i][type].label = element[type].label;
          } else if (type === 'checkBox') {
            pdfJson[i][type].selected = element[type].selected;
          } else if (type === 'radioGroup') {
            pdfJson[i][type].options[0].selected = element[type].selected;
          }
          break;
        } else {
          continue;
        }
      }
    }
    const pdfBytes = await new PDF().makePdf(pdfJson);    

    if (req.body.emails) {
      const baseUrl = req.protocol + '://' + req.get('host');
      
      for (const email of req.body.emails) {
        const url = baseUrl + '/complaint?email=' + btoa(email);
        sendMail('This is a PDF file', email, `PDF file from ${req.body.email}`, 
          `This PDF file was generated with PDF-Editor.\n If you think there is a mistake you can block your own email at ${url}`, pdfBytes, (result) => {
            if (result.status !== 200) {
              return res.json(result);
            } else if (email === req.body.emails[req.body.emails.length-1]) {
              return res.json({ status: 200, message: 'PDF успішно надіслано.' });
            }
          }
        );
      }
    } else {
      return res.end(Buffer.from(pdfBytes));
    }
  });
});

router.post('/upload', async (req: Request, res: Response) => {
  if (!req.body.pdfData) { return res.json({ status: 401 }); }
  const pdfData = new Uint8Array(Object.values(req.body.pdfData));

  const pdfJson = await new PDF().loadPdf(pdfData);
  return res.json({ status: 200, pdf: pdfJson });
});

router.post('/get-all-pdfs', async (req: Request, res: Response) => {
  const key = req.body.key;

  if (key && key === process.env.ADMIN_KEY) {
    DataBase.shared.getAll('pdfTemplates', ['*'], undefined, undefined, (err, results) => {
      if (err) {
        return res.json({ status: 402, err });
      }
      return res.json(results);
    });
  }
});

export { router as pdfRouter };