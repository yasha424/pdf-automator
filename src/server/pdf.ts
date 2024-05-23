import { LineCapStyle, PDFImage, PDFDocument as PDFLib, rgb } from 'pdf-lib';
import fs from 'fs';

class PDF {
  async makePdf(pdf: any): Promise<Uint8Array> {
    let pdfDoc = await PDFLib.create()

    const page = pdfDoc.addPage();
    const form = pdfDoc.getForm();

    for (let i = 0; i < pdf.length; i++) {
      const { height } = page.getSize();

      if (pdf[i].text) { // plain text
        const text = pdf[i].text;
        const options = text.options
        options.y = height - options.y
        page.drawText(text.label, options)
      } else if (pdf[i].table) { // table
        console.log(pdf[i].table);
      } else if (pdf[i].textField) { // textField
        const textField = pdf[i].textField;
        textField.options.y = height - textField.options.y - textField.options.height;
        const field = form.createTextField('field' + i);
        field.setText(pdf[i].textField.label);
        field.addToPage(page, pdf[i].textField.options)
      } else if (pdf[i].box) { // rectangle
        const box = pdf[i].box;
        box.options.y = height - box.options.y - box.options.height;
        box.options.borderColor = rgb(0, 0, 0);
        page.drawRectangle(pdf[i].box.options);
      } else if (pdf[i].image) { // image
        let image = pdf[i].image;
        
        if (image.jpgData) {
          const jpgImage = await pdfDoc.embedJpg(image.jpgData);
          const jpgDims = jpgImage.scale(0.5);
          image.options.y = height - image.options.y - image.options.height;
          page.drawImage(jpgImage, image.options);
        } else if (image.pngData) {
          const pngImage = await pdfDoc.embedPng(image.pngData);
          const pngDims = pngImage.scale(0.5);
          image.options.y = height - image.options.y - image.options.height;
          page.drawImage(pngImage, image.options);
        }
      } else if (pdf[i].radioGroup) { // radioGroup
        const radioGroup = form.createRadioGroup(pdf[i].radioGroup.name);
        for (const option of pdf[i].radioGroup.options) {
          option.options.y = height - option.options.y - (option.options.height ?? 50);
          radioGroup.addOptionToPage(option.label, page, option.options);
          if (option.selected === true) {
            radioGroup.select(option.label);
          }
        }
      } else if (pdf[i].checkBox) { // checkBox
        const checkBox = form.createCheckBox(pdf[i].checkBox.name);
        pdf[i].checkBox.options.y = height - pdf[i].checkBox.options.y - (pdf[i].checkBox.options.height ?? 50);;
        checkBox.addToPage(page, pdf[i].checkBox.options);
        if (pdf[i].checkBox.selected === true) {
          checkBox.check();
        }
      }
    }
    const pdfBytes = await pdfDoc.save();
    // LineCapStyle.Butt;
    return pdfBytes;
  }  

  async loadAndEditPdf(url: string, options: any): Promise<Uint8Array> {
    const uint8Array = fs.readFileSync(url);
    const pdfDoc = await PDFLib.load(uint8Array);
    const form = pdfDoc.getForm();

    for (const key in options) {
      try {
        if (key === 'checkBox') {
          for (const box of options[key]) {
            const checkBox = form.getCheckBox(box.name);
            if (box.checked) {
              checkBox.check();
            } else {
              checkBox.uncheck();
            }
          }
        } else if (key === 'textField') {
          const textField = form.getTextField(options[key].name);
          textField.setText(options[key].label);
        } else if (key === 'radioGroup') {
          const radioGroup = form.getRadioGroup(options[key].name);
          radioGroup.select(options[key].selected);
        } else if (key === 'dropdown') {
          const dropdown = form.getDropdown(options[key].name);
          dropdown.select(options[key].selected);
        } else if (key === 'optionList') {
          const optionList = form.getOptionList(options[key].name);
          optionList.select(options[key].selected);
        }
      } catch (error) {
        console.log(error);
      }
    }
    return await pdfDoc.save();
  }
}

export { PDF };