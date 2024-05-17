function getPdfElements() {
  const elements = document.getElementsByClassName("element");
  let pdf = [];
  for (let i = 0; i < elements.length; i++) {
    let element = {};
    for (const children of elements[i].children) {
      if (children.classList.contains("text")) {
        element = {
          text: {
            label: children.innerText,
            options: {
              x: (parseInt(elements[i].style.left) / 1.34),
              y: (parseInt(elements[i].style.top) / 1.34) + 28,
              size: 12
            }
          }
        };
        break;
      } else if (children.classList.contains("table")) {

      } else if (children.classList.contains("text-field")) {
        const width = parseInt(children.style.width) / 1.34;
        const height = parseInt(children.style.height) / 1.34;

        element = {
          textField: {
            label: children.innerText,
            options: {
              x: parseInt(elements[i].style.left) / 1.34,
              y: parseInt(elements[i].style.top) / 1.35 + 20,
              width: width,
              height: height
            }
          }
        };
        break;
      } else if (children.classList.contains("box")) {
        const width = parseInt(children.style.width) / 1.34;
        const height = parseInt(children.style.height) / 1.34;
        
        element = {
          box: {
            options: {
              x: parseInt(elements[i].style.left) / 1.34,
              y: parseInt(elements[i].style.top) / 1.35 + 20,
              width: width,
              height: height
            }
          }
        };
        break;
      }
    }

    pdf.push(element);
  }
  return pdf;
}

function saveTemplate() {
  const pdf = getPdfElements();
  
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const email = urlParams.get('email');
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
      toggleAlert("PDF succesfully saved.", "green");
    }
  });
}

function downloadPdf() {
  const pdf = getPdfElements();

  fetch("/pdf", {
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
      a.download = "file.pdf";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    })
}

function allowDrop(ev) {
  ev.preventDefault();
}

const toolbox = document.getElementById("toolbox");
const canvas = document.getElementById("canvas");
const propertySidebar = document.getElementById("property-sidebar");
let selectedTarget;

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
    event.preventDefault();
    const elementType = event.dataTransfer.getData("text/plain");
    const element = createElement(elementType, event);
    canvas.appendChild(element);
  });

  canvas.addEventListener("click", function (event) {
    const target = event.target;
    if (target.classList.contains("delete-button")) {
      target.parentElement.remove();
    }
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
      const x = event.clientX - offsetX + window.pageXOffset;
      const y = event.clientY - offsetY + window.pageYOffset;

      draggedElement.style.left = x - 450 + "px";
      draggedElement.style.top = y - 90 + "px";
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
    element.style.top = `${event.pageY - rect.top}px`;
    element.style.left = `${event.pageX - rect.left}px`;

    element.classList.add("element");
    element.classList.add(type);

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");
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

      handler.addEventListener("mousedown", function(event) {
        clicked = true;
        startX = event.pageX;
        startWidth = table.offsetWidth;
        startY = event.pageY;
        startHeight = table.offsetHeight;
      });

      document.addEventListener("mousemove", function(event) {
        if (!clicked) return;
        const newWidth = startWidth + (event.pageX - startX);
        const newHeight = startHeight + (event.pageY - startY);
        table.style.width = newWidth + "px";
        table.style.height = newHeight + "px";
        
        for (let i = 0; i < rows.length; i++) {
          rows[i].style.height = (newHeight / rows.length) + "px";
        }

        for (let i = 0; i < columns.length; i++) {
          columns[i].style.width = (newWidth / (columns.length / rows.length)) + "px";
        }
      });

      handler.addEventListener("mouseup", function(event) {
        clicked = false;
      });


      element.appendChild(handler);
    } else if (type === "text-field") {
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
      let startX, startY, startWidth;

      addListener(handler, clicked, startX, startY, startWidth, text);

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
      let startX, startY, startWidth;

      addListener(handler, clicked, startX, startY, startWidth, box);

      element.appendChild(handler);

    } else {
      const text = document.createElement("div");
      text.classList.add("text");
      text.classList.add("text-editable");
      text.setAttribute("contenteditable", "true");
      text.innerText = type.charAt(0).toUpperCase() + type.slice(1);
      element.appendChild(text);

      const handler = document.createElement("div");
      handler.classList.add("resize-handle");

      let clicked = false;
      let startX, startY, startWidth;

      addListener(handler, clicked, startX, startY, startWidth, text);

      element.appendChild(handler);
    }

    return element;
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      const target = event.target;

      if (target.classList.contains("table")) {
        const table = document.getElementsByClassName(target.childNodes[0].classList[0])[0];
        const newRow = document.createElement("tr");
        newRow.innerHTML = "<td></td><td></td>";

        table.appendChild(newRow);
      }
    } else if (event.key === "Backspace") {

    }
  }
});

canvas.addEventListener("click", function (event) {
  if (selectedTarget != undefined && selectedTarget != event.target 
    && !selectedTarget.classList.contains("resize-handle") && !selectedTarget.contains("text-field")) {
    selectedTarget.childNodes[1].style.border = "none";
  }

  selectedTarget = event.target;
  if (selectedTarget.classList.contains("element")) {
    showElementProperties(selectedTarget);
    selectedTarget.childNodes[1].style.border = "1px solid black";
  } else {

  }
});

function showElementProperties(element) {
  const properties = getElementProperties(element);

  propertySidebar.innerHTML = "";
  for (const [key, value] of Object.entries(properties)) {
    const propertyDiv = document.createElement("div");
    propertyDiv.innerHTML = `<strong>${key}:</strong> ${value}`;
    propertySidebar.appendChild(propertyDiv);
  }
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

function addListener(handler, clicked, startX, startY, startWidth, element) {
  handler.addEventListener("mousedown", function(event) {
    clicked = true;
    startX = event.pageX;
    startWidth = element.offsetWidth;
    startY = event.pageY;
    startHeight = element.offsetHeight;
  });

  document.addEventListener("mousemove", function(event) {
    if (!clicked) return;
    const newWidth = startWidth + (event.pageX - startX);
    const newHeight = startHeight + (event.pageY - startY);
    element.style.width = newWidth + "px";
    element.style.height = newHeight + "px";
  });

  handler.addEventListener("mouseup", function(event) {
    clicked = false;
  });
}

window.onload = (() => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const id = urlParams.get('id');
  const defaultId = urlParams.get('defaultId');

  if (id) {
    fetch("/api/pdf-template/" + id, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
    .then(response => response.json())
    .then(json => {
      const pdf = JSON.parse(json.pdf);

      for (let page = 0; page < pdf.length; page++) {
        for (const key in pdf[page]) {
            const element = createElement(key, pdf[page][key].options, pdf[page][key].label);
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
    .then(json => {
      const pdf = JSON.parse(json.pdf);

      for (let page = 0; page < pdf.length; page++) {
        for (const key in pdf[page]) {
            const element = createElement(key, pdf[page][key].options, pdf[page][key].label);
            canvas.appendChild(element);
        }
      }

      document.getElementById("filename").value = json.filename;
    });
  }

  setParams();
});

function createElement(type, options, label) {
  const element = document.createElement("div");
  element.style.userSelect = "none";
  element.style.position = "absolute";

  element.classList.add("element");
  element.classList.add(type);

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  element.appendChild(deleteButton);
  
  const rect = canvas.getBoundingClientRect();

  element.style.top = `${(options.y + rect.top - 112) * 1.36}px`;
  element.style.left = `${(options.x + rect.left - 456) * 1.34}px`;
  
  if (type === "box") {
    const box = document.createElement("div");
    box.classList.add("box");
    box.style.width = options.width * 1.34 + "px";
    box.style.height = options.height * 1.34 + "px";
    element.appendChild(box);

    const handler = document.createElement("div");
    handler.classList.add("resize-handle");

    let clicked = false;
    let startX, startY, startWidth;

    addListener(handler, clicked, startX, startY, startWidth, box);

    element.appendChild(handler);
  } else if (type === "text") {
    const text = document.createElement("div");
    text.classList.add("text");
    text.style.width = options.width * 1.34 + "px";
    text.style.height = options.height * 1.34 + "px";
    text.innerText = label;
    element.appendChild(text);

    const handler = document.createElement("div");
    handler.classList.add("resize-handle");

    let clicked = false;
    let startX, startY, startWidth;

    addListener(handler, clicked, startX, startY, startWidth, text);

    element.appendChild(handler);
  } else if (type === "textField") {
    const textField = document.createElement("div");
    textField.classList.add("text-field");
    textField.style.width = options.width * 1.34 + "px";
    textField.style.height = options.height * 1.34 + "px";
    textField.innerText = label;
    element.appendChild(textField);

    const handler = document.createElement("div");
    handler.classList.add("resize-handle");

    let clicked = false;
    let startX, startY, startWidth;

    addListener(handler, clicked, startX, startY, startWidth, textField);

    element.appendChild(handler);
  }

  return element;
}