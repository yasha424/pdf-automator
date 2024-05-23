class Topnav extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
  <link rel="stylesheet" href="/css/topnav.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <div id="loadOverlay" style="background-color: #fff; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 100;"></div>
  <div class="topnav">
    <div class="active" id="home-link"><a id="logo" href="/main"><img src="/images/logo.png"></a><h3 class="logo-text" id="logoText">PDF-Editor</h3></div>
    <div id="myLinks">
      <div href="#profile">
        <a href="#profile" id="email"></a>
        <a href="#profile" id="name"></a>
      </div>
      <div><a href="#contact">Contact</a></div>
      <div><a href="#about">About</a></div>
      <div><a onclick="logout()">Logout</a></div>
    </div>
    <a class="icon" onclick="toggleTopnav()">
      <i class="fa fa-bars"></i>
    </a>
  </div>
    `;
  } 
}

function setParams() {
  const email = localStorage.getItem('email');
  const firstName = localStorage.getItem('firstName');
  const lastName = localStorage.getItem('lastName');

  document.getElementById('email').innerText = email;
  document.getElementById('name').innerText = firstName + " " + lastName;

  const logoText = document.getElementById("logoText");
  logoText.onclick = (() => {
    window.location = '/main';
  });
}

function logout() {
  localStorage.clear();
  window.location = '/login';
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