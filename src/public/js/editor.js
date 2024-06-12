function Uint8ToBase64(u8Arr) {
  const CHUNK_SIZE = 0x8000;
  let index = 0;
  const length = u8Arr.length;
  let result = '';
  let slice;
  while (index < length) {
    slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
    result += String.fromCharCode.apply(null, slice);
    index += CHUNK_SIZE;
  }
  return btoa(result);
}

function allowDrop(ev) {
  ev.preventDefault();
}

const toolbox = document.getElementById("toolbox");
const canvas = document.getElementById("canvas");
const propertySidebar = document.getElementById("property-sidebar");
let selectedTarget;
let changed = false;
const elementTypes = {
  "text": "Текст",
  "textField": "Текстове Поле",
  "box": "Прямокутник",
  "image": "Картинка",
  "checkBox": "Прапорець",
  "radioButton": "Радіокнопка",
};

document.addEventListener("DOMContentLoaded", function () {
  let draggedElement = null;
  let offsetX, offsetY;

  toolbox.addEventListener("dragstart", function (event) {
    event.dataTransfer.setData("text/plain", event.target.dataset.element);
  });

  canvas.addEventListener("dragover", function (event) {
    event.preventDefault();
  });

  canvas.addEventListener("drop", function (event) {
    changed = true;
    event.preventDefault();
    const elementType = event.dataTransfer.getData("text/plain");
    const element = createElement(elementType, event);
    canvas.appendChild(element);
  });

  canvas.addEventListener("mousedown", function (event) {
    const target = event.target;
    if (target.classList.contains("element")) {
      draggedElement = target;
      const rect = target.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
    }
  });

  canvas.addEventListener("mousemove", function (event) {
    if (draggedElement) {
      changed = true;
      let rect = canvas.getBoundingClientRect();
      const x = event.clientX - offsetX - rect.x;
      const y = event.clientY - offsetY - rect.y;

      if (x > 0 - 20 && x < rect.width + draggedElement.style.width - 10) {
        draggedElement.style.left = x + "px";
      }
      if (y > 0 - 60 && y < rect.height + draggedElement.style.height - 40) {
        draggedElement.style.top = y + "px";
      }
    }
  });

  canvas.addEventListener("mouseup", function () {
    draggedElement = null;
  });

  function createElement(type, event) {
    if (selectedTarget && selectedTarget.childNodes[1]) {
      hideElementProperties();
    }
  
    const element = document.createElement("div");
    element.style.userSelect = "none";
    element.style.position = "absolute";

    const rect = event.target.getBoundingClientRect();
    element.style.top = `${event.pageY - rect.top - window.scrollY - 28}px`;
    element.style.left = `${event.pageX - rect.left - window.scrollX - 20}px`;

    element.classList.add("element");
    element.classList.add(type);

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");

    deleteButton.onclick = (e) => {
      changed = true;
      hideElementProperties();
      element.remove();
    };
    element.appendChild(deleteButton);

    if (type === "textField") {
      const text = document.createElement("div");
      text.classList.add("text-field");
      text.classList.add("text-editable");
      text.setAttribute("contenteditable", "true");
      text.innerText = type.charAt(0).toUpperCase() + type.slice(1);
      text.style.width = "100px";
      text.style.height = "20px";
      element.appendChild(text);

      const handler = document.createElement("div");
      handler.classList.add("resize-handle");

      let clicked = false;
      let startX, startY, startWidth, startHeight;

      addListener(handler, clicked, startX, startY, startWidth, startHeight, text);

      element.appendChild(handler);
    } else if (type === "box") {
      const box = document.createElement("div");
      box.classList.add("box");
      box.style.width = "60px";
      box.style.height = "40px";
      element.appendChild(box);

      const handler = document.createElement("div");
      handler.classList.add("resize-handle");

      let clicked = false;
      let startX, startY, startWidth, startHeight;

      addListener(handler, clicked, startX, startY, startWidth, startHeight, box);

      element.appendChild(handler);
    } else if (type === "image") {
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("image-element");
      imageContainer.style.width = "100px";
      imageContainer.style.height = "100px";

      const image = document.createElement("img");
      imageContainer.appendChild(image);

      const imagePicker = document.createElement("input");
      imagePicker.classList.add("file-picker");
      imagePicker.type = "file";
      imagePicker.accept = "image/png, image/jpeg";
      imagePicker.addEventListener("change", () => {
        if (imagePicker.files.length !== 0) {
          if (imagePicker.files[0].size < 1024 * 1024 * 5) {
            image.src = URL.createObjectURL(imagePicker.files[0]);
          } else {
            toggleAlert("Maximum image size is 5MB.", "red");
          }
        }
      });

      image.onload = () => {
        imageContainer.aspectRatio = image.naturalWidth / image.naturalHeight;
        if (image.naturalWidth > 790) {
          imageContainer.style.width = 790 + "px";
          imageContainer.style.height = (790 / imageContainer.aspectRatio) + "px";
        } else {
          imageContainer.style.width = image.naturalWidth + "px";
          imageContainer.style.height = image.naturalHeight + "px";
        }
      };

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
      checkBoxContainer.style.width = "50px";
      checkBoxContainer.style.height = "50px";

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
      element.appendChild(checkBoxContainer);

      const handler = document.createElement("div");
      handler.classList.add("resize-handle");

      let clicked = false;
      let startX, startY, startWidth, startHeight;
      addListener(handler, clicked, startX, startY, startWidth, startHeight, checkBoxContainer);
      element.appendChild(handler);
    } else if (type === "radioButton") {
      const radioButtonContainer = document.createElement("div");
      radioButtonContainer.classList.add("radio-button-container");
      radioButtonContainer.style.width = "50px";
      radioButtonContainer.style.height = "50px";

      radioButtonContainer.onclick = () => {
        if (radioButtonContainer.childElementCount === 0) {
          const checkBox = document.createElement("img");
          checkBox.classList.add("check-box");
          checkBox.type = "checkbox";
          checkBox.src = "/images/dot.png";
          radioButtonContainer.appendChild(checkBox);
        } else {
          radioButtonContainer.removeChild(radioButtonContainer.childNodes[0]);
        }
      }
      element.appendChild(radioButtonContainer);

      const handler = document.createElement("div");
      handler.classList.add("resize-handle");

      let clicked = false;
      let startX, startY, startWidth, startHeight;
      addListener(handler, clicked, startX, startY, startWidth, startHeight, radioButtonContainer);
      element.appendChild(handler);
    } else if (type === "text") {
      const text = document.createElement("div");
      text.style.width = '100px';
      text.style.height = '20px';
      text.classList.add("text");
      text.classList.add("text-editable");
      text.setAttribute("contenteditable", "true");
      text.innerText = type.charAt(0).toUpperCase() + type.slice(1);
      element.appendChild(text);

      const handler = document.createElement("div");
      handler.classList.add("resize-handle");

      let clicked = false;
      let startX, startY, startWidth, startHeight;

      addListener(handler, clicked, startX, startY, startWidth, startHeight, text);

      element.appendChild(handler);
    }

    selectedTarget = element;
    showElementProperties(selectedTarget);

    return element;
  }
});

canvas.addEventListener("click", function (event) {
  if (selectedTarget && selectedTarget.childNodes[1]) {
    hideElementProperties();
  }

  if (event.target.classList.contains("element")) {
    selectedTarget = event.target;
    showElementProperties(selectedTarget);
  } else if (event.target.parentNode.classList.contains("element") && !event.target.classList.contains("delete-button")) {
    selectedTarget = event.target.parentNode;
    showElementProperties(selectedTarget);
  }
});

function showElementProperties(element) {
  const properties = getElementProperties(element);

  propertySidebar.innerHTML = "";

  if (["textField", "checkBox", "radioButton"].includes(properties.Type)) {
    const propertyDiv = document.createElement("div");
    propertyDiv.id = "property-div";
    propertyDiv.innerHTML = '<strong>Назва:</strong>';
    propertyDiv.style.display = "flex";
    const nameInput = document.createElement("input");
    nameInput.classList.add("name-input");
    nameInput.placeholder = "Назва поля";
    nameInput.value = element.childNodes[1].name || "";

    nameInput.oninput = () => { 
      changed = true;
      element.childNodes[1].name = nameInput.value;
    };

    propertyDiv.appendChild(nameInput);
    propertySidebar.appendChild(propertyDiv);
  }

  for (const entry of Object.entries(properties)) {
    const propertyDiv = document.createElement("div");
    propertyDiv.id = "property-div";
    propertyDiv.innerHTML = `<strong>Тип:</strong> ${elementTypes[entry[1]]}`;
    propertySidebar.appendChild(propertyDiv);
  }
  
  const propertyDiv = document.createElement("div");
  propertyDiv.id = "position-property-div";
  propertyDiv.classList.add("position-property");
  
  propertyDiv.innerHTML = `<strong>X: </strong>`;
  const xInput = document.createElement("input");
  xInput.type = "number";
  xInput.max = 780;
  xInput.value = parseFloat(element.style.left);
  const yLabel = document.createElement("strong");
  yLabel.innerText = " Y: ";  
  const yInput = document.createElement("input");
  yInput.type = "number";
  yInput.max = 1100;
  yInput.value = parseFloat(element.style.top) + 32;

  xInput.onchange = () => {
    xInput.value = xInput.value > 780 ? 780 : xInput.value;
    element.style.left = xInput.value + "px";
  };
  yInput.onchange = () => {
    yInput.value = yInput.value > 1100 ? 1100 : yInput.value;
    element.style.top = yInput.value - 32 + "px";
  };
  
  propertyDiv.appendChild(xInput);
  propertyDiv.appendChild(yLabel);
  propertyDiv.appendChild(yInput);
  
  propertySidebar.appendChild(propertyDiv);

  if (properties.Type === "image") {
    const propertyDiv = document.createElement("div");
    propertyDiv.id = "property-div";
    propertyDiv.innerHTML = "<strong>Зберігати відношення:</strong>";
    const keepAspectRatioButton = document.createElement("input");
    keepAspectRatioButton.type = "checkbox";
    keepAspectRatioButton.checked = element.childNodes[1].keepAspectRatio || false;
    keepAspectRatioButton.name = "keepAspectRatioButton";
    keepAspectRatioButton.classList.add("aspect-button");
    keepAspectRatioButton.onchange = () => {
      element.childNodes[1].keepAspectRatio = keepAspectRatioButton.checked;
      if (keepAspectRatioButton.checked) {
        element.childNodes[1].oldHeight = element.childNodes[1].style.height;
        element.childNodes[1].style.height = parseFloat(element.childNodes[1].style.width) / element.childNodes[1].aspectRatio + "px";
      } else {
        element.childNodes[1].style.height = element.childNodes[1].oldHeight;
      }
    };
    propertyDiv.appendChild(keepAspectRatioButton);
    propertySidebar.appendChild(propertyDiv);

  }

  if (true) {
    const widthDiv = document.createElement("div");
    widthDiv.id = "size-property-div";
    widthDiv.classList.add("size-property");
    
    widthDiv.innerHTML = `<strong>Ширина: </strong>`;
    const widthInput = document.createElement("input");
    const heightInput = document.createElement("input");
    widthInput.type = "number";
    widthInput.max = 797;
    widthInput.value = parseFloat(element.childNodes[1].style.width);
    widthInput.onchange = () => {
      if (widthInput.value > 797) {
        widthInput.value = 797
      } else {
        widthInput.value = widthInput.value < 20 ? 20 : widthInput.value;
      }
      element.childNodes[1].style.width = widthInput.value + "px";
      if (keepAspectRatioButton.checked) {
        heightInput.value = widthInput.value * element.childNodes[1].aspectRatio;
        element.childNodes[1].style.height = heightInput.value + "px";
      }
    };
    
    widthDiv.appendChild(widthInput);
    propertySidebar.appendChild(widthDiv);

    const heightDiv = document.createElement("div");
    heightDiv.id = "size-property-div";
    heightDiv.classList.add("size-property");
    
    heightDiv.innerHTML = `<strong>Висота: </strong>`;
    heightInput.type = "number";
    heightInput.max = 1126;
    heightInput.value = parseFloat(element.childNodes[1].style.height);
    heightInput.onchange = () => {
      if (heightInput.value > 1126) {
        heightInput.value = 1126;
      } else {
        heightInput.value = heightInput.value < 20 ? 20 : heightInput.value;
      }
      element.childNodes[1].style.height = heightInput.value + "px";
      if (keepAspectRatioButton.checked) {
        widthInput.value = heightInput.value * element.childNodes[1].aspectRatio;
        element.childNodes[1].style.width = widthInput.value + "px";
      }
    };
    
    heightDiv.appendChild(heightInput);
    propertySidebar.appendChild(heightDiv);

  }

  if (["box", "textField"].includes(properties.Type)) {
    const propertyDiv = document.createElement("div");
    propertyDiv.id = "property-div";
    propertyDiv.innerHTML = '<strong>Ширина рамки:</strong> ';
    const borderInput = document.createElement("input");
    borderInput.type = "number";
    borderInput.min = 0; borderInput.max = 8; 
    borderInput.value = parseInt(element.childNodes[1].style.border) || 0;
    borderInput.onchange = () => { 
      changed = true;
      element.childNodes[1].style.border = `${borderInput.value}px solid black`;
    };
    propertyDiv.appendChild(borderInput);
    propertySidebar.appendChild(propertyDiv);
  }

  if (["text", "textField"].includes(properties.Type)) {
    const propertyDiv = document.createElement("div");
    propertyDiv.classList.add('alignment-input');

    for (let alignment of ['left', 'center', 'right']) {
      const label = document.createElement('label');
      
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'textAlignment';
      if (alignment === element.style.textAlign) {
        input.checked = true;
      }

      input.onchange = () => {
        element.style.textAlign = alignment;
      };
      
      const image = document.createElement('img');
      image.src = `/images/text.align${alignment}.png`;

      label.appendChild(input);
      label.appendChild(image);

      propertyDiv.appendChild(label);
    }
    propertySidebar.appendChild(propertyDiv);
  }
}

function hideElementProperties() {
  propertySidebar.innerHTML = "";
}

function getElementProperties(element) {
  const properties = {
    "Type": element.classList[1]
  };

  return properties;
}

function makeid(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function addListener(handler, clicked, startX, startY, startWidth, startHeight, element) {
  handler.addEventListener("mousedown", function (event) {
    clicked = true;
    startX = event.pageX;
    startWidth = element.offsetWidth;
    startY = event.pageY;
    startHeight = element.offsetHeight;
  });

  document.addEventListener("mousemove", function (event) {
    if (clicked !== true) return;
    changed = true;
    const newWidth = startWidth + (event.pageX - startX);
    let newHeight;
    if (element.keepAspectRatio === true) {
      newHeight = newWidth / (element.aspectRatio ? element.aspectRatio : 1);
    } else {
      newHeight = startHeight + (event.pageY - startY);
    }
    element.style.width = (newWidth > 20 ? newWidth : 20) + "px";
    element.style.height = (newHeight > 20 ? newHeight : 20) + "px";
  });

  document.addEventListener("mouseup", function (event) {
    clicked = false;
  });
}

window.onbeforeunload = () => {
  if (changed) {
    return "Leaving yhis page will dismiss all changes made in this file. Make sure you save your file.";
  }
  return null;
};