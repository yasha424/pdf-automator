import express, { Express, Request, Response } from "express";
import { degrees, PDFDocument as PDFLib, StandardFonts, rgb } from 'pdf-lib';
const { PDFDocument } = require("pdfkit-table-ts");
import path from 'path';

let dotenv = require('dotenv').config();

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({name: '123'});
});

router.post('/', async (req: Request, res: Response) => {
  const pdfBytes = await makePdf(req.body.pdf);
  res.end(new Buffer(pdfBytes));
});

router.post('/send', async (req: Request, res: Response) => {
  const emails = req.body.emails;
  const pdfBytes = await makePdf(req.body.pdf);
  console.log(emails);
  
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

async function makePdf(pdf: any) {
  let pdfDoc = await PDFLib.create()
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const charSet = helveticaFont.getCharacterSet();
  
  const page = pdfDoc.addPage();
  const form = pdfDoc.getForm();

  for (let i = 0; i < pdf.length; i++) {
    const { width, height } = page.getSize();

    if (pdf[i].text !== undefined) {
      const text = pdf[i].text;
      const options = text.options
      options.y = height - options.y
      page.drawText(text.label, options)
    } else if (pdf[i].table !== undefined) {

    } else if (pdf[i].textField !== undefined) {
      const textField = pdf[i].textField;
      textField.options.y = height - textField.options.y - textField.options.height;
      const field = form.createTextField('field' + i);
      field.setText(pdf[i].textField.label);
      field.addToPage(page, pdf[i].textField.options)
    } else if (pdf[i].box !== undefined) {
      console.log(pdf[i].box);
      
      const box = pdf[i].box;
      box.options.y = height - box.options.y - box.options.height;
      box.options.borderColor = rgb(0, 0, 0);

      page.drawRectangle(pdf[i].box.options);
    }
  }
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

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