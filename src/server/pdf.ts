import express, { Express, Request, Response } from "express";
import { degrees, PDFDocument as PDFLib, StandardFonts, rgb } from 'pdf-lib';
// import { PDFDocument as PDFDocumentTable } from "pdfkit-table-ts";
// import { PDFDocument  } from "pdfkit-table-ts";
const { PDFDocument } = require("pdfkit-table-ts");
import path from 'path';
// import fs from 'fs';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({name: '123'});
});

router.post('/', async (req: Request, res: Response) => {
  // console.log(req.body.pdf);
  
  let pdfDoc = await PDFLib.create()
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  const page = pdfDoc.addPage();
  const form = pdfDoc.getForm();

  for (let i = 0; i < req.body.pdf.length; i++) {
    const { width, height } = page.getSize();

    if (req.body.pdf[i].text !== undefined) {
      const text = req.body.pdf[i].text;
      const options = text.options
      options.y = height - options.y
      page.drawText(text.label, options)
    } else if (req.body.pdf[i].table !== undefined) {

    } else if (req.body.pdf[i].textField !== undefined) {
      const textField = req.body.pdf[i].textField;
      textField.options.y = height - textField.options.y - textField.options.height;
      const field = form.createTextField('field' + i);
      field.setText(req.body.pdf[i].textField.label);
      field.addToPage(page, req.body.pdf[i].textField.options)
    } else if (req.body.pdf[i].box !== undefined) {
      console.log(req.body.pdf[i].box);
      
      const box = req.body.pdf[i].box;
      box.options.y = height - box.options.y - box.options.height;
      box.options.borderColor = rgb(0, 0, 0);

      page.drawRectangle(req.body.pdf[i].box.options);
    }
  }
  const pdfBytes = await pdfDoc.save()

  res.end(pdfBytes)
});

router.get('/pdf', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, './../../output.pdf'));
})

export { router as pdfRouter };