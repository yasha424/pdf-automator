import { PDFDocument, PDFFont, PDFForm, PDFPage, PDFTextField, TextAlignment, layoutMultilineText, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs';
import { pathToFileURL } from 'url';

class PDF {
  private fontBytes: Buffer;

  constructor() {
    this.fontBytes = fs.readFileSync(pathToFileURL('./src/public/fonts/Roboto-Regular.ttf'));
  }

  async getFont(): Promise<PDFFont> {
    let pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(this.fontBytes);
    return customFont;
  }

  async loadPdf(pdfData: Uint8Array): Promise<any[]> {
    let pdfJson: any[] | PromiseLike<any[]> = [];

    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    const form = pdfDoc.getForm();
    
    form.getFields().forEach(field => {
      if (field instanceof PDFTextField) {
        pdfJson.push(this.getTextField(field, pages[0].getHeight()));
      }
    });

    return pdfJson;
  }

  private getImageObject(image: any) {        
    return {
      image: {
        options: {
          x: 0, y: 0, width: image.width, height: image.height
        },
        pngData: Buffer.from(new Uint8ClampedArray(image.data)).toString('base64')
      }
    }
  }

  private getTextField(field: PDFTextField, height: number): any {
    let options: any = field.acroField.getWidgets()[0].getRectangle();
    options.y = height - options.y;
    options.borderWidth = 1;
    switch (field.getAlignment()) {
      case TextAlignment.Center:
        options.alignment = 'center'
        break;
      case TextAlignment.Right:
        options.alignment = 'right'
        break;          
      default:
        options.alignment = 'left'
        break;
    }

    return { textField: {
      name: field.getName(),
      label: field.getText(),
      options: options
    }};
  }

  async makePdf(pdf: any): Promise<Uint8Array> {
    let pdfDoc = await PDFDocument.create();
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
      try {    
        if (pdf[i].text) { // plain text
          this.drawText(page, pdf, i, height, customFont);
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
      } catch (error) {
        console.log(error);
      }
    }
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }  

  wrapText(text: string, width: number, font: PDFFont, fontSize: number): string {
    const words = text.split(' ');
    let line = '';
    let result = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > width) {
        result += line + '\n';
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    result += line;
    return result;
  }

  drawText(page: PDFPage, pdf: any, i: number, height: number, font: PDFFont) {
    const text = pdf[i].text
    const options = pdf[i].text.options
    let alignment: TextAlignment;
    switch (options.alignment) {
      case 'center':
        alignment = TextAlignment.Center
        break;
      case 'right':
        alignment = TextAlignment.Right
        break;
      default:
        alignment = TextAlignment.Left
        break;
    }
    
    options.y = height - options.y - options.height;
    const multiLineText = layoutMultilineText(text.label, { 
      alignment: alignment,
      bounds: { x: options.x, y: options.y, width: options.width, height: options.height }, 
      font: font, fontSize: 12
    })

    for (const line of multiLineText.lines) {
      page.drawText(line.text, {
        x: line.x, y: line.y, font: font, size: options.size
      });
    }
  }

  createTextField(form: PDFForm, page: PDFPage, pdf: any, i: number, height: number, customFont?: PDFFont) {
    const textField = pdf[i].textField;
    textField.options.y = height - textField.options.y - textField.options.height;
    const field = form.createTextField(textField.name || `field${i}`);    
    field.setText(pdf[i].textField.label);
    pdf[i].textField.options.font = customFont;
    
    let alignment: TextAlignment;
    switch (pdf[i].textField.options.alignment) {
      case 'center':
        alignment = TextAlignment.Center
        break;
      case 'right':
        alignment = TextAlignment.Right
        break;      
      default:
        alignment = TextAlignment.Left
        break;
    }
    field.setAlignment(alignment);

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