import express, { Express, Request, Response } from "express";
import path from 'path';
import { PDF } from './pdf';

const router = express.Router();
let dotenv = require('dotenv').config();

router.post('/', async (req: Request, res: Response) => {
  const pdfBytes = await new PDF().makePdf(req.body.pdf);
  res.end(new Buffer(pdfBytes));
});

router.post('/send', async (req: Request, res: Response) => {
  const emails = req.body.emails;
  
  const pdfBytes = await new PDF().makePdf(req.body.pdf);

  if (emails == null || !Array.isArray(emails) || !emails.length) { return; };

  for (let i = 0; i < emails.length; i++) {
    let result = await sendMail("PDF-Editor", emails[i], "PDF-Editor", "This is a pdf.", pdfBytes);
    
    if (result.status === 404) {
      return res.json({ status: 404 });
    }
  }
  res.json({status: 200});
});

router.get('/pdf', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, './../../output.pdf'));
})

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

export { router as pdfRouter };