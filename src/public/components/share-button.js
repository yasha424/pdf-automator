class ShareButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
  <link rel="stylesheet" href="/css/share-button.css">
  <button class="share-button" onclick="toggleShareOptions()">Поділитись</button>
  <div id="share-options">
    <textarea class="email-input" id="emails" rows="3" placeholder="Введіть адреси Email через кому"></textarea>
    <button class="send-button" onclick=sendPdf()>Надіслати</button>
  </div>
    `;
  }
}

async function sendPdf() {
  const emails = document.getElementById('emails').value.split(',');
  const pdf = await getPdfElements();

  if (Array.isArray(pdf) && !pdf.length) {
    toggleAlert("Error sending message. PDF file must contain at least one element.", "red");
    return; 
  }  
  
  fetch('/api/send', {
    method: 'POST',
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify({
      pdf: pdf,
      emails: emails
    })
  })
  .then(response => response.json())
  .then(json => {
    toggleAlert(json.message, json.status === 404 ? 'red' : 'green');
  });
}

function toggleShareOptions() {
  let shareOptions = document.getElementById("share-options");

  if (shareOptions.style.display === "grid") {
    shareOptions.style.display = "none";
  } else {
    shareOptions.style.display = "grid";
  }
}

function toggleAlert(message, color) {
  let alert = document.getElementById("alert");
  alert.classList.add("active");
  setTimeout(() => {
    alert.classList.remove("active");
  }, 4000);
  alert.style.backgroundColor = color;
  alert.innerText = message;
}

customElements.define('share-button', ShareButton);