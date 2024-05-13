import express, { Express, Request, Response } from "express";
import { degrees, PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import path from 'path';
// import fs from 'fs';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({name: '123'});
});

router.post('/', async (req: Request, res: Response) => {
  // console.log(req.body.pdf);
  
  const pdfDoc = await PDFDocument.create()
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  const page = pdfDoc.addPage();
  const form = pdfDoc.getForm();

  for (let i = 0; i < req.body.pdf.length; i++) {
    const { width, height } = page.getSize();

    const text = req.body.pdf[i].text;
    const options = text.options
    options.y = height - options.y

    // const textField = form.createTextField(`text${i}`);
    // textField.setText(text.label ?? "");
    // textField.addToPage(page, options);

    // const text = req.body.pdf[i].text
    // const options = text.options
    // options.y = height - options.y
    // console.log(text.label, options);
    
    page.drawText(text.label, options)
  }
  const pdfBytes = await pdfDoc.save()

  res.end(pdfBytes)
});

router.get('/pdf', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, './../../output.pdf'));
})

export { router as pdfRouter };