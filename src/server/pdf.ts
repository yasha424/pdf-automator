import { degrees, PDFDocument as PDFLib, StandardFonts, rgb } from 'pdf-lib';
// const { PDFDocument } = require("pdfkit-table-ts");

class PDF {
  async makePdf(pdf: any) {
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
        const box = pdf[i].box;
        box.options.y = height - box.options.y - box.options.height;
        box.options.borderColor = rgb(0, 0, 0);
  
        page.drawRectangle(pdf[i].box.options);
      } else if (pdf[i].image !== undefined) {
        let image = pdf[i].image;
        
        const jpgImage = await pdfDoc.embedJpg(image.jpgData);
  
        const jpgDims = jpgImage.scale(0.5);
        
        image.options.width = jpgDims.width;
        image.options.height = jpgDims.height;
        image.options.y = height - image.options.y - image.options.height;
        
        page.drawImage(jpgImage, image.options);
      }
    }
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }  
}

export { PDF };