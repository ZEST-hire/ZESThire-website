/* =========================================================
   ZEST - shared front-end behaviour
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Sticky nav: shadow once scrolled ---- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    const setMenu = (open) => {
      navLinks.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
    };
    navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 960) setMenu(false); });
  }

  /* ---- Accessible tab groups (hero audience, role categories, states) ---- */
  document.querySelectorAll('[role="tablist"]').forEach(list => {
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    const select = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (!panel) return;
        panel.hidden = !on;
        if (on) {
          panel.classList.remove('is-entering');
          void panel.offsetWidth;
          panel.classList.add('is-entering');
          panel.classList.add('in');
        }
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!dir) return;
        e.preventDefault();
        select(tabs[(i + dir + tabs.length) % tabs.length], true);
      });
    });
  });

  /* ---- Reveal on scroll + stat count-up ---- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const fmt = v => el.dataset.format === 'k' ? Math.round(v / 1000) + 'k' : Math.round(v).toString();
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const start = performance.now(), dur = 1400;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---- Lead forms (candidate sign-up + employer enquiry) ----
     Submissions are saved to the Zest Hire Supabase "website_leads" table,
     which the Zest CRM imports from. Until SUPABASE_URL/KEY are filled in,
     (or if saving fails) the form opens a pre-filled email to the ZEST inbox
     instead, so no enquiry is ever lost. */
  const LEADS = {
    url: '',   // e.g. https://xxxx.supabase.co
    key: '',   // Supabase publishable (anon) key - safe to expose; insert-only via RLS
    inbox: 'hello@zesthire.com.au'
  };

  const mailtoFallback = (kind, data) => {
    const subject = kind === 'employer'
      ? `Shortlist request - ${data.company || data.name || ''}`
      : `Talent network sign-up - ${data.fullname || ''} (${data.specialty || ''})`;
    const body = Object.entries(data).filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`).join('\n');
    window.location.href = `mailto:${LEADS.inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  document.querySelectorAll('form.lead-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const kind = form.dataset.kind;
      const data = Object.fromEntries(new FormData(form).entries());
      const btn = form.querySelector('button[type="submit"]');
      const card = form.closest('.signup-card');
      const success = card && card.querySelector('.form-success');
      let oldErr = form.querySelector('.form-error'); if (oldErr) oldErr.remove();

      let saved = false;
      if (LEADS.url && LEADS.key) {
        btn.disabled = true;
        try {
          const row = kind === 'employer'
            ? { kind, name: data.name, company: data.company, email: data.email, phone: data.phone || null,
                location: data.location || null, engagement: data.engagement || null, roles: data.roles, message: data.message || null }
            : { kind, name: data.fullname, email: data.email, phone: data.phone || null, specialty: data.specialty || null };
          row.page = location.pathname;
          const res = await fetch(`${LEADS.url}/rest/v1/website_leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: LEADS.key, Authorization: `Bearer ${LEADS.key}`, Prefer: 'return=minimal' },
            body: JSON.stringify(row)
          });
          saved = res.ok;
        } catch (err) { saved = false; }
        btn.disabled = false;
      }

      if (!saved) {
        mailtoFallback(kind, data);
        if (success) {
          const p = success.querySelector('p');
          if (p) p.textContent = `Your email app should have opened with your details. Just hit send, or email us at ${LEADS.inbox}.`;
        }
      }
      form.classList.add('hide');
      if (success) success.classList.add('show');
    });
  });

  /* ---- Jobs board filtering ----
     Live data comes from a published Google Sheet (see README.md ->
     "Jobs board - Google Sheet backend"). If the sheet can't be reached
     (not yet shared publicly, offline, etc.) this falls back to the
     ZEST_JOBS array in jobs-data.js so the page never shows blank. */
  const jobsGrid = document.getElementById('jobs-grid');
  if (jobsGrid) {
    const searchInput = document.getElementById('job-search');
    const locationSelect = document.getElementById('job-location');
    const pillarSelect = document.getElementById('job-pillar');
    const resultsCount = document.getElementById('results-count');
    const emptyState = document.getElementById('empty-state');

    // Published-to-web CSV export of "ZEST - Jobs Board Data".
    // gid=0 is the first tab - update if you add/reorder sheet tabs.
    const JOBS_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1GQLdamhcCaCbnDc0d2mscbgy2aW3YHa2isepIWAWWls/export?format=csv&gid=0';

    const pillarLabels = {
      facilities: 'Electrical & Facilities',
      projects: 'Projects & Construction',
      operations: 'Operations & Service Delivery'
    };

    function pillarKeyFromLabel(label) {
      const l = (label || '').toLowerCase();
      if (l.includes('facilit') || l.includes('electric')) return 'facilities';
      if (l.includes('project')) return 'projects';
      if (l.includes('operat')) return 'operations';
      return 'facilities';
    }

    // Converts one parsed CSV row (from the sheet's header row) into the
    // job object shape the rest of this file expects.
    function rowToJob(row, index) {
      return {
        id: (row['Job ID'] || `sheet-${index}`).trim(),
        title: (row['Title'] || '').trim(),
        pillar: pillarKeyFromLabel(row['Pillar']),
        location: (row['Location'] || '').trim(),
        type: (row['Type'] || '').trim(),
        salary: (row['Salary'] || '').trim(),
        posted: (row['Posted Date'] || '').trim(),
        summary: (row['Summary'] || '').trim(),
        status: (row['Status'] || 'Live').trim()
      };
    }

    async function loadJobs() {
      try {
        const res = await fetch(JOBS_SHEET_CSV_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
        const csvText = await res.text();
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const jobs = parsed.data
          .map(rowToJob)
          .filter(job => job.title && job.status.toLowerCase() !== 'filled' && job.status.toLowerCase() !== 'paused' && job.status.toLowerCase() !== 'on hold');
        if (!jobs.length) throw new Error('Sheet returned no live rows');
        return jobs;
      } catch (err) {
        console.warn('Falling back to local jobs-data.js (sheet unreachable):', err);
        return typeof ZEST_JOBS !== 'undefined' ? ZEST_JOBS : [];
      }
    }

    function jobCard(job) {
      const pillarClass = 'pillar-' + job.pillar;
      const subject = encodeURIComponent(`Application - ${job.title} (${job.id})`);
      const body = encodeURIComponent(
        `Hi ZEST team,\n\n` +
        `I'm interested in the ${job.title} role and have attached my CV.\n\n` +
        `You can call me on [your phone number] to discuss.\n\n` +
        `Thanks,\n[Your name]`
      );
      return `
        <article class="job-card" data-pillar="${job.pillar}">
          <div class="job-top">
            <h3 class="job-title">${job.title}</h3>
            <span class="job-pill ${pillarClass}">${pillarLabels[job.pillar]}</span>
          </div>
          <div class="job-meta">
            <span>📍 ${job.location}</span>
            <span>💰 ${job.salary}</span>
          </div>
          <p class="job-desc">${job.summary}</p>
          <div class="job-foot">
            <span class="job-type">${job.type}</span>
            <a class="btn btn-primary btn-sm" href="mailto:hello@zesthire.com.au?subject=${subject}&body=${body}">Apply now</a>
          </div>
        </article>`;
    }

    loadJobs().then(jobsList => {
      function render() {
        const q = (searchInput.value || '').toLowerCase().trim();
        const loc = locationSelect.value;
        const pillar = pillarSelect.value;

        const filtered = jobsList.filter(job => {
          const matchesQ = !q || job.title.toLowerCase().includes(q) || job.summary.toLowerCase().includes(q);
          const matchesLoc = loc === 'all' || job.location.includes(loc);
          const matchesPillar = pillar === 'all' || job.pillar === pillar;
          return matchesQ && matchesLoc && matchesPillar;
        });

        jobsGrid.innerHTML = filtered.map(jobCard).join('');
        resultsCount.textContent = `${filtered.length} role${filtered.length === 1 ? '' : 's'} live right now`;
        emptyState.classList.toggle('show', filtered.length === 0);
      }

      [searchInput, locationSelect, pillarSelect].forEach(el =>
        el.addEventListener('input', render)
      );

      render();
    });
  }

  /* ---- Footer year ---- */
  document.querySelectorAll('.js-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
