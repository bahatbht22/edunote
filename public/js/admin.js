// ── Admin sidebar mobile toggle ──
const sidebar        = document.getElementById('adminSidebar');
const overlay        = document.getElementById('sidebarOverlay');
const toggleBtn      = document.getElementById('sidebarToggleBtn');
const closeBtn       = document.getElementById('sidebarCloseBtn');

function openSidebar() {
  sidebar?.classList.add('open');
  overlay?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar?.classList.remove('open');
  overlay?.classList.remove('show');
  document.body.style.overflow = '';
}

toggleBtn?.addEventListener('click', openSidebar);
closeBtn?.addEventListener('click', closeSidebar);
overlay?.addEventListener('click', closeSidebar);

// Close on nav link click (mobile UX)
sidebar?.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth < 900) closeSidebar();
  });
});

// ── Flash auto-dismiss ──
document.querySelectorAll('.alert').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  }, 4000);
});

// ── Confirm deletes ──
document.querySelectorAll('form[data-confirm]').forEach(form => {
  form.addEventListener('submit', e => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  });
});
