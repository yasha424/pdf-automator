class Topnav extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
  <link rel="stylesheet" href="/css/topnav.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <div class="topnav">
    <div class="active" id="home-link"><a id="logo"><img src="/logo.png"></a></div>
    <div id="myLinks">
      <div href="#profile">
        <a href="#profile" id="email"></a>
        <a href="#profile" id="name"></a>
      </div>
      <div><a href="#contact">Contact</a></div>
      <div><a href="#about">About</a></div>
      <div><a href="/login">Logout</a></div>
    </div>
    <a class="icon" onclick="toggleTopnav()">
      <i class="fa fa-bars"></i>
    </a>
  </div>
    `;
  } 
}

function setParams() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  const email = urlParams.get('email');
  const firstName = urlParams.get('firstName');
  const lastName = urlParams.get('lastName');

  document.getElementById('email').innerText = email;
  document.getElementById('name').innerText = firstName + " " + lastName;

  const logo = document.getElementById("logo");
  logo.href = `/main?email=${email}&firstName=${firstName}&lastName=${lastName}`;
}

function toggleTopnav() {
  let menu = document.getElementById("myLinks");
  if (menu.style.display === "block") {
    menu.style.display = "none";
  } else {
    menu.style.display = "block";
  }
}

window.onload = setParams;

customElements.define('topnav-component', Topnav);