class Topnav extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
  <link rel="stylesheet" href="/css/topnav.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <div id="loadOverlay" style="background-color: #fff; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 100;"></div>
  <div class="topnav">
    <div class="active" id="home-link"><a id="logo" href="/main"><img src="/images/logo.png"></a><h3 class="logo-text" id="logoText">PDF-Editor</h3></div>
    <div id="myLinks">
      <div href="#profile" id="user">
        <a href="#profile" id="email"></a>
        <a href="#profile" id="name"></a>
      </div>
      <div><a href="#contact">Контакти</a></div>
      <div><a onclick="logout()" id="logout">Вийти з акаунту</a></div>
    </div>
    <a class="icon" id="icon">
      <i class="fa fa-bars"></i>
    </a>
  </div>
    `;
  } 
}

function getCookie(name) {
  return decodeURIComponent(document.cookie)
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

function setParams() {
  let icon = document.getElementById("icon");
  icon.onclick = (e) => {
    let menu = document.getElementById("myLinks");
    if (menu.style.display === "block") {
      menu.style.display = "none";
    } else {
      menu.style.display = "block";
    }
    e.stopPropagation();
  
  };

  const email = getCookie('email');
  const firstName = getCookie('firstName');
  const lastName = getCookie('lastName');

  if (email && firstName && lastName) {
    document.getElementById('email').innerText = email;
    document.getElementById('name').innerText = firstName + " " + lastName;
  } else {
    document.getElementById('user').remove();
    const logoutLink = document.getElementById('logout');
    logoutLink.innerText = "Увійти";
  }

  const logoText = document.getElementById("logoText");
  logoText.onclick = (() => {
    window.location = '/main';
  });
}

function logout() {
  deleteAllCookies();
  window.location = '/login';
}

function deleteAllCookies() {
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });
}

customElements.define('topnav-component', Topnav);