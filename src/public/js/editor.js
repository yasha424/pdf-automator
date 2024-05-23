function Uint8ToBase64(u8Arr) {
  var CHUNK_SIZE = 0x8000;
  var index = 0;
  var length = u8Arr.length;
  var result = '';
  var slice;
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
    deleteButton.onclick = () => {
      element.remove();
    };
    element.appendChild(deleteButton);

    if (type === "table") {
      const table = document.createElement("div");
      table.classList.add("table");
      table.setAttribute("contenteditable", "true");

      let rows = [];
      let columns = [];

      for (let i = 0; i < 2; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < 2; j++) {
          const column = document.createElement("td");
          column.innerText = i + ", " + j;
          columns.push(column);
          row.appendChild(column);
        }
        table.appendChild(row);
        rows.push(row);
      }

      element.appendChild(table);

      const handler = document.createElement("div");
      handler.classList.add("resize-handle");

      let clicked = false;
      let startX, startY, startWidth, startHeight;

      handler.addEventListener("mousedown", function (event) {
        clicked = true;
        startX = event.pageX;
        startWidth = table.offsetWidth;
        startY = event.pageY;
        startHeight = table.offsetHeight;
      });

      document.addEventListener("mousemove", function (event) {
        if (!clicked) return;
        const newWidth = startWidth + (event.pageX - startX);
        const newHeight = startHeight + (event.pageY - startY);
        table.style.width = newWidth + "px";
        table.style.height = newHeight + "px";

        for (let row of rows) {
          row.style.height = (newHeight / rows.length) + "px";
        }

        for (let column of columns) {
          column.style.width = (newWidth / (columns.length / rows.length)) + "px";
        }
      });

      handler.addEventListener("mouseup", function (event) {
        clicked = false;
      });

      element.appendChild(handler);
    } else if (type === "textField") {
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

    return element;
  }
});

canvas.addEventListener("click", function (event) {
  if (selectedTarget && selectedTarget.childNodes[1]) {
    hideElementProperties();
    // selectedTarget.childNodes[1].style.border = "none";
  }

  if (event.target.classList.contains("element")) {
    selectedTarget = event.target;
    showElementProperties(event.target);
  }
});

function showElementProperties(element) {
  const properties = getElementProperties(element);

  propertySidebar.innerHTML = "";
  for (const [key, value] of Object.entries(properties)) {
    const propertyDiv = document.createElement("div");
    propertyDiv.id = "property-div";
    propertyDiv.innerHTML = `<strong>${key}:</strong> ${value}`;
    propertySidebar.appendChild(propertyDiv);
  }

  if (["box", "textField"].includes(properties.Type)) {
    const propertyDiv = document.createElement("div");
    propertyDiv.id = "property-div";
    propertyDiv.innerHTML = '<strong>Border:</strong> ';
    const borderInput = document.createElement("input");
    borderInput.type = "number";
    borderInput.min = 0; borderInput.max = 8; 
    console.log(element.childNodes[1].style.border);
    borderInput.value = parseInt(element.childNodes[1].style.border) || 0;
    borderInput.onchange = () => { 
      element.childNodes[1].style.border = `${borderInput.value}px solid black`;
    };
    propertyDiv.appendChild(borderInput);
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
    const newHeight = startHeight + (event.pageY - startY);
    element.style.width = newWidth + "px";
    element.style.height = newHeight + "px";
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