(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  // ---------------------------------------------------------------------------
  // Dates: keep experience figures current without editing HTML every month
  // ---------------------------------------------------------------------------
  var now = new Date();

  function monthsSince(ym) {
    var parts = ym.split('-');
    var months = (now.getFullYear() - +parts[0]) * 12 + (now.getMonth() + 1 - +parts[1]);
    return Math.max(months + 1, 0); // count the start month, as hh.uz / LinkedIn do
  }

  var isEn = root.lang === 'en';

  function plural(n, forms) {
    if (isEn) return n === 1 ? forms[0] : forms[1];
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
    return forms[2];
  }

  var I18N = isEn ? {
    decimal: '.',
    year: ['year', 'years'],
    month: ['month', 'months'],
    // "for six years" reads better in English than an ordinal
    count: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
  } : {
    decimal: ',',
    year: ['год', 'года', 'лет'],
    month: ['месяц', 'месяца', 'месяцев'],
    // "шестой год": the current, not yet completed year
    count: ['первый', 'второй', 'третий', 'четвёртый', 'пятый', 'шестой', 'седьмой', 'восьмой', 'девятый', 'десятый', 'одиннадцатый', 'двенадцатый']
  };

  document.querySelectorAll('[data-years-since]').forEach(function (el) {
    var m = monthsSince(el.dataset.yearsSince);
    el.textContent = el.hasAttribute('data-precise')
      ? (Math.floor(m / 6) / 2).toString().replace('.', I18N.decimal)
      : Math.floor(m / 12);
  });

  document.querySelectorAll('[data-years-ordinal]').forEach(function (el) {
    var m = monthsSince(el.dataset.yearsOrdinal);
    // RU counts the year in progress ("шестой"), EN rounds to the nearest year ("six")
    var i = isEn ? Math.round(m / 12) : Math.floor(m / 12);
    if (I18N.count[i]) el.textContent = I18N.count[i];
  });

  document.querySelectorAll('[data-duration-since]').forEach(function (el) {
    var m = monthsSince(el.dataset.durationSince);
    var y = Math.floor(m / 12), mo = m % 12, out = [];
    if (y) out.push(y + ' ' + plural(y, I18N.year));
    if (mo) out.push(mo + ' ' + plural(mo, I18N.month));
    el.textContent = out.join(' ');
  });

  var year = document.getElementById('year');
  if (year) year.textContent = now.getFullYear();

  // ---------------------------------------------------------------------------
  // Theme toggle
  // ---------------------------------------------------------------------------
  var themeBtn = document.getElementById('theme-toggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
  }

  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // ---------------------------------------------------------------------------
  // Mobile menu
  // ---------------------------------------------------------------------------
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');

  function setMenu(open) {
    navLinks.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  }

  navToggle.addEventListener('click', function () {
    setMenu(!navLinks.classList.contains('is-open'));
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // ---------------------------------------------------------------------------
  // Nav border on scroll + active section highlight
  // ---------------------------------------------------------------------------
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var linkById = {};
    navLinks.querySelectorAll('a').forEach(function (a) { linkById[a.hash.slice(1)] = a; });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(linkById).forEach(function (id) {
          linkById[id].classList.toggle('is-active', id === entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    // The hero has no nav link: observing it clears the highlight at the top of the page
    ['hero'].concat(Object.keys(linkById)).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });

    // Reveal on scroll
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---------------------------------------------------------------------------
  // "Resume in PDF" uses the print stylesheet, so the CV never goes stale
  // ---------------------------------------------------------------------------
  document.getElementById('print-cv').addEventListener('click', function () {
    window.print();
  });
})();
