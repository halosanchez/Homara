window.onload = () => {
  setTimeout(() => {
    document.getElementById("splash-screen").classList.add("fade-out");
    setTimeout(() => {
      document.getElementById("splash-screen").style.display = "none";
      document.getElementById("login-screen").classList.remove("hidden");
    }, 500);
  }, 3500);
};

document.getElementById("login-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  if (username === "halo" && password === "pass") {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
  } else {
    document.getElementById("login-error").classList.remove("hidden");
  }
});

function navigateTo(page) {
  const content = document.getElementById("content");
  if (page === 'home') content.innerText = "Welcome to the Home page!";
  if (page === 'about') content.innerText = "Learn more about our mission here.";
  if (page === 'community') content.innerText = "Explore the Community section!";
}

document.getElementById("searchbar").addEventListener("input", function () {
  const val = this.value.toLowerCase();
  document.getElementById("content").innerText = `Searching for: ${val}`;
});
