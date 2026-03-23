// ── Mobile menu toggle ──
const mobileBtn  = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    mobileBtn.classList.toggle('open', open);
    mobileBtn.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', (e) => {
    if (!mobileBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      mobileBtn.classList.remove('open');
    }
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      mobileBtn.classList.remove('open');
    });
  });
}

// ── Navbar scroll shadow ──
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10 ? '0 4px 20px rgba(0,0,0,0.3)' : 'none';
  }, { passive: true });
}

// ── Search input — navigate to /search?q=... on Enter ──
function doSearch(query) {
  const q = query.trim();
  if (!q) return;
  window.location.href = '/search?q=' + encodeURIComponent(q);
}

const navSearch = document.getElementById('navSearch');
if (navSearch) {
  // Pre-fill if we're on the search page
  const urlParams = new URLSearchParams(window.location.search);
  const currentQ  = urlParams.get('q');
  if (currentQ) navSearch.value = currentQ;

  navSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(navSearch.value);
  });
}

// Mobile search input (if present)
const mobileSearch = document.getElementById('mobileSearch');
if (mobileSearch) {
  mobileSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(mobileSearch.value);
  });
}
