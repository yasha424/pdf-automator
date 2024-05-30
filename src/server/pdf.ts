import { PDFDocument, PDFFont, PDFForm, PDFDocument as PDFLib, PDFPage, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs';
import path from 'path';

class PDF {
  private fontBytes: Buffer;

  constructor() {
    this.fontBytes = fs.readFileSync(path.join(__dirname, 'fonts/Roboto-Regular.ttf'));
  }

  async makePdf(pdf: any): Promise<Uint8Array> {
    let pdfDoc = await PDFLib.create();
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(this.fontBytes);

    const page = pdfDoc.addPage();
    page.setFont(customFont);
    const form = pdfDoc.getForm();

    const rawUpdateFieldAppearances = form.updateFieldAppearances.bind(form);
    form.updateFieldAppearances = function () {
      return rawUpdateFieldAppearances(customFont);
    };

    for (let i = 0; i < pdf.length; i++) {
      const { height } = page.getSize();

      if (pdf[i].text) { // plain text
        this.drawText(page, pdf, i, height);
      } else if (pdf[i].table) { // table
        console.log(pdf[i].table);
      } else if (pdf[i].textField) { // textField
        this.createTextField(form, page, pdf, i, height, customFont);
      } else if (pdf[i].box) { // rectangle
        this.drawRectangle(page, pdf, i, height);
      } else if (pdf[i].image) { // image
        await this.drawImage(pdf[i].image, pdfDoc, page, height);
      } else if (pdf[i].radioGroup) { // radioGroup
        this.createRadioGroup(form, page, pdf, i, height);
      } else if (pdf[i].checkBox) { // checkBox
        this.createCheckBox(form, page, pdf, i, height);
      }
    }
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }  

  drawText(page: PDFPage, pdf: any, i: number, height: number) {
    const text = pdf[i].text;
    const options = text.options
    options.y = height - options.y
    page.drawText(text.label, options)
  }

  createTextField(form: PDFForm, page: PDFPage, pdf: any, i: number, height: number, customFont?: PDFFont) {
    const textField = pdf[i].textField;
    textField.options.y = height - textField.options.y - textField.options.height;
    const field = form.createTextField(textField.name || `field${i}`);
    field.setText(pdf[i].textField.label);
    field.addToPage(page, pdf[i].textField.options);
    if (customFont) {
      field.updateAppearances(customFont);
    }
  }

  drawRectangle(page: PDFPage, pdf: any, i: number, height: number) {
    const box = pdf[i].box;
    box.options.y = height - box.options.y - box.options.height;
    box.options.borderColor = rgb(0, 0, 0);
    page.drawRectangle(pdf[i].box.options);
  }

  async drawImage(image: any, pdfDoc: PDFDocument, page: PDFPage, height: number) {
    if (image.jpgData) {
      const jpgImage = await pdfDoc.embedJpg(image.jpgData);
      image.options.y = height - image.options.y - image.options.height;
      page.drawImage(jpgImage, image.options);
    } else if (image.pngData) {
      const pngImage = await pdfDoc.embedPng(image.pngData);
      image.options.y = height - image.options.y - image.options.height;
      page.drawImage(pngImage, image.options);
    }
  }

  createRadioGroup(form: PDFForm, page: PDFPage, pdf: any, i: number, height: number) {
    const radioGroup = form.createRadioGroup(pdf[i].radioGroup.name || `radioGroup${i}`);
    for (const option of pdf[i].radioGroup.options) {
      option.options.y = height - option.options.y - (option.options.height ?? 50);
      radioGroup.addOptionToPage(option.label, page, option.options);
      if (option.selected === true) {
        radioGroup.select(option.label);
      }
    }
  }

  createCheckBox(form: PDFForm, page: PDFPage, pdf: any, i: number, height: number) {
    const checkBox = form.createCheckBox(pdf[i].checkBox.name || `checkBox${i}`);
    pdf[i].checkBox.options.y = height - pdf[i].checkBox.options.y - (pdf[i].checkBox.options.height ?? 50);;
    checkBox.addToPage(page, pdf[i].checkBox.options);
    if (pdf[i].checkBox.selected === true) {
      checkBox.check();
    }
  }

}

export { PDF };