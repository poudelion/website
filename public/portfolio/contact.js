document.getElementById('anon-form').addEventListener('submit', async function (event) {
  event.preventDefault();
  const status = document.getElementById('anon-status');
  const button = this.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Sending…';
  status.style.display = 'block';
  status.setAttribute('role', 'status');
  status.textContent = '';
  try {
    const response = await fetch(this.action, { method: 'POST', body: new FormData(this) });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Submission failed');
    status.textContent = 'Message sent. Thank you!';
    this.reset();
  } catch (error) {
    status.textContent = 'Your message could not be sent. Please try again, or reach out by email.';
  } finally {
    button.disabled = false;
    button.textContent = 'Send a little mystery ↗';
  }
});
