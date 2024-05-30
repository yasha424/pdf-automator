function getTextElement(item, children) {
  const width = parseInt(children.style.width) / 1.34;
  const height = parseInt(children.style.height) / 1.34;

  element = {
    text: {
      label: children.innerText,
      options: {
        x: (parseInt(item.style.left) / 1.34),
        y: (parseInt(item.style.top) / 1.34) + 28,
        size: 12, width: width, height: height
      }
    }
  };
  return element;
}

function getTextFieldElement(item, children) {
  const width = parseInt(children.style.width) / 1.34;
  const height = parseInt(children.style.height) / 1.34;
  const border = parseInt(children.style.border) || 1;

  element = {
    textField: {
      name: children.name,
      label: children.innerText,
      options: {
        x: parseInt(item.style.left) / 1.34,
        y: parseInt(item.style.top) / 1.35 + 20,
        width: width, height: height, borderWidth: border
      }
    }
  };
  return element;
}

function getBoxElement(item, children) {
  const width = parseInt(children.style.width) / 1.34;
  const height = parseInt(children.style.height) / 1.34;
  const border = parseInt(children.style.border) || 1;

  element = {
    box: {
      options: {
        x: parseInt(item.style.left) / 1.34,
        y: parseInt(item.style.top) / 1.35 + 20,
        width: width, height: height, borderWidth: border
      }
    }
  };
  return element;
}

function getCheckBoxElement(item, children) {
  const width = parseInt(children.style.width) / 1.34;
  const height = parseInt(children.style.height) / 1.34;

  element = {
    checkBox: {
      name: children.name,
      options: {
        x: parseInt(item.style.left) / 1.34,
        y: parseInt(item.style.top) / 1.35 + 20,
        width: width, height: height
      },
      selected: children.childNodes.length !== 0
    }
  }
  return element;
}

async function getImageElement(item, children) {
  const image = children.childNodes[0];

  if (image.src) {
    const buffer = await fetch(image.src).then(async r => (await r.blob()).arrayBuffer());
    const bytes = new Uint8Array(buffer);
    const b64 = Uint8ToBase64(bytes);

    const width = parseInt(children.style.width) / 1.34;
    const height = parseInt(children.style.height) / 1.34;

    element = {
      image: {
        options: {
          x: parseInt(item.style.left) / 1.34,
          y: parseInt(item.style.top) / 1.35 + 20,
          width: width, height: height
        }
      }
    }
    if (children.childNodes[1].files.length === 0) {
      element.image.jpgData = b64
      return element;
    }
    if (children.childNodes[1].files[0].type === "image/jpeg") {
      element.image.jpgData = b64
    } else if (children.childNodes[1].files[0].type === "image/png") {
      element.image.pngData = b64
    }
    return element;
  }
}

function getRadioButtonElement(item, children) {
  const width = parseInt(children.style.width) / 1.34;
  const height = parseInt(children.style.height) / 1.34;

  element = {
    radioGroup: {
      name: children.name,
      options: [
        {
          label: makeid(16),
          options: {
            x: parseInt(item.style.left) / 1.34,
            y: parseInt(item.style.top) / 1.35 + 20,
            width: width, height: height
          },
          selected: children.childNodes.length !== 0
        }
      ]
    }
  }
  return element;
}

async function getPdfElements() {
  const elements = document.getElementsByClassName("element");
  let pdf = [];
  for (let item of elements) {
    let element = {};
    for (const children of item.children) {
      if (children.classList.contains("text")) {
        element = getTextElement(item, children);
        break;
      } else if (children.classList.contains("table")) {
        console.log(children);
      } else if (children.classList.contains("text-field")) {
        element = getTextFieldElement(item, children);
        break;
      } else if (children.classList.contains("box")) {
        element = getBoxElement(item, children);
        break;
      } else if (children.classList.contains("image-element")) {
        element = await getImageElement(item, children);
        break;
      } else if (children.classList.contains("check-box-container")) {
        element = getCheckBoxElement(item, children);
        break;
      } else if (children.classList.contains("radio-button-container")) {
        element = getRadioButtonElement(item, children);
        break;
      }
    }

    pdf.push(element);
  }
  return pdf;
}

async function saveTemplate() {
  const pdf = await getPdfElements();

  const email = localStorage.getItem('email');
  const filename = document.getElementById("filename").value;

  fetch("/api/save-pdf", {
    method: "POST",
    body: JSON.stringify({ pdf, email: email, filename: filename }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
    .then(response => response.json())
    .then(json => {
      if (json.status === 200) {
        changed = false;
        toggleAlert("PDF succesfully saved.", "green");
      }
    });
}

async function saveDefaultTemplate() {
  const pdf = await getPdfElements();
  const filename = document.getElementById("filename").value;

  fetch("/api/save-default-pdf", {
    method: "POST",
    body: JSON.stringify({ pdf, filename: filename }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
    .then(response => response.json())
    .then(json => {
      if (json.status === 200) {
        changed = false;
        toggleAlert("PDF succesfully saved.", "green");
      }
    });
}

async function downloadPdf() {
  const pdf = await getPdfElements();

  fetch("api/pdf", {
    method: "POST",
    body: JSON.stringify({ pdf }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
    .then(response => response.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = document.getElementById("filename").value;
      if (filename !== "") {
        a.download = document.getElementById("filename").value + (filename.endsWith('.pdf') ? "" : ".pdf");
      } else {
        a.download = "file.pdf";
      }
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    })
}

window.onload = (() => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const id = urlParams.get('id');
  const defaultId = urlParams.get('defaultId');

  if (localStorage.getItem('admin') != 1) {
    document.getElementById('saveDefaultButton').remove();
  }

  if (id) {
    fetch("/api/pdf-template/" + id, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
      .then(response => response.json())
      .then(async json => {
        const pdf = JSON.parse(json.pdf);

        for (let page of pdf) {
          for (const key in page) {
            const element = await createElement(key, page[key].options, page[key].label, page[key].jpgData || page[key].pngData, page[key].selected);
            canvas.appendChild(element);
          }
        }

        document.getElementById("filename").value = json.filename;
      });
  } else if (defaultId) {
    fetch("/api/default-pdf/" + defaultId, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
      .then(response => response.json())
      .then(async json => {
        const pdf = JSON.parse(json.pdf);

        for (let page of pdf) {
          for (const key in page) {
            const element = await createElement(key, page[key].options, page[key].label, page[key].jpgData || page[key].pngData, page[key].selected);
            canvas.appendChild(element);
          }
        }

        document.getElementById("filename").value = json.filename;
      });
  }

  setParams();
});

async function createElement(type, options, label, imageData, selected) {
  const element = document.createElement("div");
  element.style.userSelect = "none";
  element.style.position = "absolute";

  element.classList.add("element");
  element.classList.add(type);

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  deleteButton.onclick = () => {
    changed = true;
    element.remove();
  }

  element.appendChild(deleteButton);

  const rect = canvas.getBoundingClientRect();
  element.style.top = `${(options.y + rect.top + window.scrollY) * 1.35 - 146}px`;
  element.style.left = `${(options.x + rect.left + window.scrollX) * 1.34 - 468}px`;

  if (type === "box") {
    const box = document.createElement("div");
    box.classList.add("box");
    box.style.width = options.width * 1.34 + "px";
    box.style.height = options.height * 1.34 + "px";
    box.style.border = `${options.borderWidth || 1}px solid black`
    element.appendChild(box);

    const handler = document.createElement("div");
    handler.classList.add("resize-handle");

    let clicked = false;
    let startX, startY, startWidth, startHeight;

    addListener(handler, clicked, startX, startY, startWidth, startHeight, box);

    element.appendChild(handler);
  } else if (type === "text") {
    const text = document.createElement("div");
    text.classList.add("text");
    text.style.width = options.width * 1.34 + "px";
    text.style.height = options.height * 1.34 + "px";
    text.contentEditable = true;
    text.innerText = label;
    element.appendChild(text);

    const handler = document.createElement("div");
    handler.classList.add("resize-handle");

    let clicked = false;
    let startX, startY, startWidth, startHeight;

    addListener(handler, clicked, startX, startY, startWidth, startHeight, text);

    element.appendChild(handler);
  } else if (type === "textField") {
    const textField = document.createElement("div");
    textField.classList.add("text-field");
    textField.style.width = options.width * 1.34 + "px";
    textField.style.height = options.height * 1.34 + "px";
    textField.style.border = `${options.borderWidth || 1}px solid black`
    textField.innerText = label;
    textField.contentEditable = true;
    element.appendChild(textField);

    const handler = document.createElement("div");
    handler.classList.add("resize-handle");

    let clicked = false;
    let startX, startY, startWidth, startHeight;

    addListener(handler, clicked, startX, startY, startWidth, startHeight, textField);

    element.appendChild(handler);
  } else if (type === "image") {
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("image-element");
    imageContainer.style.width = `${options.width * 1.34}px`;
    imageContainer.style.height = `${options.height * 1.34}px`;

    const image = document.createElement("img");
    image.src = `data:image/png;base64, ${imageData}`;
    imageContainer.appendChild(image);

    const imagePicker = document.createElement("input");
    imagePicker.classList.add("file-picker");
    imagePicker.type = "file";
    imagePicker.accept = "image/*";
    imagePicker.addEventListener("change", () => {
      if (imagePicker.files.length !== 0) {
        image.src = URL.createObjectURL(imagePicker.files[0]);
      }
    });

    imageContainer.appendChild(imagePicker);
    element.appendChild(imageContainer);

    const handler = document.createElement("div");
    handler.classList.add("resize-handle");

    let clicked = false;
    let startX, startY, startWidth, startHeight;

    addListener(handler, clicked, startX, startY, startWidth, startHeight, imageContainer);
    element.appendChild(handler);
  } else if (type === "checkBox") {
    const checkBoxContainer = document.createElement("div");
    checkBoxContainer.classList.add("check-box-container");
    checkBoxContainer.style.width = `${options.width * 1.34}px`;
    checkBoxContainer.style.height = `${options.height * 1.34}px`;

    checkBoxContainer.onclick = () => {
      if (checkBoxContainer.childElementCount === 0) {
        const checkBox = document.createElement("img");
        checkBox.classList.add("check-box");
        checkBox.type = "checkbox";
        checkBox.src = "/images/checkbox.checked.png";
        checkBoxContainer.appendChild(checkBox);
      } else {
        checkBoxContainer.removeChild(checkBoxContainer.childNodes[0]);
      }
    }

    if (selected === true) {
      checkBoxContainer.click();
    }

    element.appendChild(checkBoxContainer);

    const handler = document.createElement("div");
    handler.classList.add("resize-handle");

    let clicked = false;
    let startX, startY, startWidth, startHeight;

    addListener(handler, clicked, startX, startY, startWidth, startHeight, checkBoxContainer);

    element.appendChild(handler);
  } else if (type === "radioGroup") {
  
    for (const option of options) {
      element.style.top = `${(option.options.y + rect.top + window.scrollY) * 1.35 - 146}px`;
      element.style.left = `${(option.options.x + rect.left + window.scrollX) * 1.34 - 468}px`;

      const radioGroupContainer = document.createElement("div");
      radioGroupContainer.classList.add("radio-button-container");
      radioGroupContainer.style.width = `${option.options.width * 1.34}px`;
      radioGroupContainer.style.height = `${option.options.height * 1.34}px`;
    
      radioGroupContainer.onclick = () => {
        if (radioGroupContainer.childElementCount === 0) {
          const checkBox = document.createElement("img");
          checkBox.classList.add("check-box");
          checkBox.type = "checkbox";
          checkBox.src = "/images/dot.png";
          radioGroupContainer.appendChild(checkBox);
        } else {
          radioGroupContainer.removeChild(radioGroupContainer.childNodes[0]);
        }
      }

      if (option.selected === true) {
        radioGroupContainer.click();
      }
  
      element.appendChild(radioGroupContainer);
      const handler = document.createElement("div");
      handler.classList.add("resize-handle");
      let clicked = false;
      let startX, startY, startWidth, startHeight;
      addListener(handler, clicked, startX, startY, startWidth, startHeight, radioGroupContainer);
      element.appendChild(handler);
    }
  }

  return element;
}