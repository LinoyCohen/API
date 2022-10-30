document.addEventListener('submit', async (e) => {
  const pass = document.getElementById('pass').value;
  const confirm = document.getElementById('confirm').value;

  if (pass === confirm) {
    document.getElementById('hid').style.visibility = 'visible';
    document.getElementById('pass').value = '';
    document.getElementById('confirm').value = '';
  } else {
    document.getElementById('hid').style.visibility = 'visible';
    document.getElementById('hid').innerHTML = 'Passwords are not the same!';
  }
});
