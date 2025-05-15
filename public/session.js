async function checkSession() {
  const res = await fetch('http://localhost:5000/me', {
    credentials: 'include'
  });
  if (res.ok) {
    document.body.innerHTML = '<h1>Welcome</h1><button onclick="logout()">Logout</button>';
  } else {
    window.location.href = 'login.html';
  }
}

async function logout() {
  await fetch('http://localhost:5000/logout', {
    method: 'POST',
    credentials: 'include'
  });
  alert('Ви вийшли з акаунта');
  window.location.href = 'login.html';
}

checkSession();