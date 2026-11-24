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
    url: 'https://oqijuuumrmtbbmyzutvq.supabase.co',   // Zest Hire Supabase project
    key: 'sb_publishable_O1GtmfSli5-d8ULw3_4N3A_izIHW529', // publishable key - safe to expose; table is insert-only for the public
    inbox: 'hello@zesthire.com.au'
  };

  const mailtoFallback = (kind, data) => {
    const subject = kind === 'employer'
      ? `Shortlist request - ${data.company || data.name || ''}`
      : kind === 'application'
        ? `Application - ${data.job_title || ''} (${data.job_id || ''}) - ${data.fullname || ''}`
        : `Talent network sign-up - ${data.fullname || ''} (${data.specialty || ''})`;
    if (kind === 'application') { delete data.cv; data.note = 'Please attach your CV to this email before sending.'; }
    const body = Object.entries(data).filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`).join('\n');
    window.location.href = `mailto:${LEADS.inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  document.querySelectorAll('form.lead-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const kind = form.dataset.kind;
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.website) { form.classList.add('hide'); const sc = form.closest('.signup-card'); const ok = sc && sc.querySelector('.form-success'); if (ok) ok.classList.add('show'); return; } // spam bot filled the hidden field
      delete data.website;
      const btn = form.querySelector('button[type="submit"]');
      const card = form.closest('.signup-card');
      const success = card && card.querySelector('.form-success');
      let oldErr = form.querySelector('.form-error'); if (oldErr) oldErr.remove();
      const showErr = (msg) => { const p = document.createElement('p'); p.className = 'form-error'; p.textContent = msg; btn.insertAdjacentElement('afterend', p); };
      if (kind === 'application') {
        const f = form.querySelector('input[type="file"]').files[0];
        if (!f) { showErr('Please attach your CV.'); return; }
        if (f.size > 5 * 1024 * 1024) { showErr('That file is over 5 MB. Please upload a smaller PDF or Word file.'); return; }
        if (!/\.(pdf|docx?)$/i.test(f.name)) { showErr('Please upload your CV as a PDF or Word document.'); return; }
      }

      let saved = false;
      if (LEADS.url && LEADS.key) {
        btn.disabled = true;
        const btnHtml = btn.innerHTML; btn.textContent = kind === 'application' ? 'Uploading your CV…' : 'Sending…';
        try {
          const consent = !!data.privacy_consent;
          let row;
          if (kind === 'employer') {
            row = { kind, name: data.name, company: data.company, email: data.email, phone: data.phone || null,
                    location: data.location || null, engagement: data.engagement || null, roles: data.roles, message: data.message || null };
          } else if (kind === 'application') {
            row = { kind, name: data.fullname, email: data.email, phone: data.phone || null, message: data.message || null,
                    job_id: data.job_id || null, job_title: data.job_title || null, job_location: data.job_location || null };
            const file = form.querySelector('input[type="file"]').files[0];
            const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-120);
            const path = `applications/${crypto.randomUUID()}/${safeName}`;
            const up = await fetch(`${LEADS.url}/storage/v1/object/cv-uploads/${path}`, {
              method: 'POST',
              headers: { apikey: LEADS.key, Authorization: `Bearer ${LEADS.key}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
              body: file
            });
            if (!up.ok) throw new Error('CV upload failed: ' + up.status);
            row.cv_path = path; row.cv_filename = file.name.slice(0, 255);
          } else {
            row = { kind, name: data.fullname, email: data.email, phone: data.phone || null, specialty: data.specialty || null };
          }
          row.privacy_consent = consent;
          row.page = location.pathname;
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 10000);
          const res = await fetch(`${LEADS.url}/rest/v1/website_leads`, {
            method: 'POST', signal: ctrl.signal,
            headers: { 'Content-Type': 'application/json', apikey: LEADS.key, Authorization: `Bearer ${LEADS.key}`, Prefer: 'return=minimal' },
            body: JSON.stringify(row)
          });
          clearTimeout(timer);
          saved = res.ok;
        } catch (err) { saved = false; }
        btn.disabled = false; btn.innerHTML = btnHtml;
      }

      if (!saved) {
        mailtoFallback(kind, data);
        if (success) {
          const p = success.querySelector('p');
          if (p) p.textContent = `Your email app should have opened with your details. Just hit send, or email us at ${LEADS.inbox}.`;
        }
      }
      // Google Analytics: count this as a lead (no personal details are sent)
      try { if (typeof gtag === 'function') gtag('event', 'generate_lead', { lead_type: kind, page_path: location.pathname, job_title: kind === 'application' ? (data.job_title || '') : undefined }); } catch (e) {}
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
    const JOBS_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1pAlZhvx1CmktnyYmRUNTCfwl98LfTZbo2ojjsgDzVUE/export?format=csv&gid=0';

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

    const attr = (v) => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

    /* ---- Apply modal: pre-filled with the role, CV upload ---- */
    const modal = document.getElementById('apply-modal');
    let lastFocus = null;
    const closeModal = () => { if (!modal) return; modal.hidden = true; document.body.classList.remove('modal-open'); if (lastFocus) lastFocus.focus(); };
    const openModal = (btn) => {
      if (!modal) return;
      lastFocus = btn;
      const form = modal.querySelector('form');
      const d = btn.dataset;
      form.reset(); form.classList.remove('hide');
      modal.querySelector('.form-success').classList.remove('show');
      const err = form.querySelector('.form-error'); if (err) err.remove();
      form.job_id.value = d.id || ''; form.job_title.value = d.title || ''; form.job_location.value = d.location || '';
      const drop = form.querySelector('.file-drop'); drop.classList.remove('has-file');
      drop.querySelector('.file-drop-text').innerHTML = '<strong>Choose a file</strong> or drag it here';
      document.getElementById('apply-role').innerHTML = `<strong>${attr(d.title)}</strong><span>${[d.location, d.type, d.salary].filter(Boolean).map(attr).join(' · ')}</span>`;
      modal.hidden = false; document.body.classList.add('modal-open');
      setTimeout(() => form.fullname.focus(), 50);
    };
    if (modal) {
      jobsGrid.addEventListener('click', (e) => { const b = e.target.closest('.js-apply'); if (b) openModal(b); });
      modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
      const drop = modal.querySelector('.file-drop');
      const input = drop.querySelector('input');
      const showFile = () => { const f = input.files[0]; drop.classList.toggle('has-file', !!f); drop.querySelector('.file-drop-text').innerHTML = f ? `📄 ${attr(f.name)}` : '<strong>Choose a file</strong> or drag it here'; };
      input.addEventListener('change', showFile);
      ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); }));
      ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('drag')));
      drop.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files.length) { input.files = e.dataTransfer.files; showFile(); } });
    }

    function jobCard(job) {
      const pillarClass = 'pillar-' + job.pillar;
      return `
        <article class="job-card" data-pillar="${job.pillar}">
          <div class="job-top">
            <h3 class="job-title">${jobPages[job.id] ? `<a href="${attr(jobPages[job.id])}">${attr(job.title)}</a>` : attr(job.title)}</h3>
            <span class="job-pill ${pillarClass}">${pillarLabels[job.pillar]}</span>
          </div>
          ${/bonus/i.test(job.salary + ' ' + job.summary) ? `<span class="job-bonus">🎁 ${attr((job.salary.match(/\$[\d,]+\s*sign-(?:on|up) bonus/i) || ['Sign-on bonus'])[0])}</span>` : ''}
          <div class="job-meta">
            <span>📍 ${job.location}</span>
            <span>💰 ${attr(job.salary.replace(/\s*·\s*\$[\d,]+\s*sign-(?:on|up) bonus/i, ''))}</span>
          </div>
          <p class="job-desc">${attr(job.summary)}</p>
          <div class="job-foot">
            <span class="job-type">${job.type}</span>
            <button type="button" class="btn btn-primary btn-sm js-apply" data-id="${attr(job.id)}" data-title="${attr(job.title)}" data-location="${attr(job.location)}" data-type="${attr(job.type)}" data-salary="${attr(job.salary)}">Apply now</button>
          </div>
        </article>`;
    }

    // Roles that have their own page (built by tools/build_jobs.py) link to it.
    let jobPages = {};
    const jobPagesReady = fetch('/jobs/index.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : {}).then(m => { jobPages = m || {}; }).catch(() => {});

    Promise.all([loadJobs(), jobPagesReady]).then(([loaded]) => {
      // Newest roles first (by Posted Date); rows without a date keep their sheet order at the end.
      const jobsList = loaded.map((j, i) => ({ j, i }))
        .sort((a, b) => (b.j.posted || '').localeCompare(a.j.posted || '') || a.i - b.i)
        .map(x => x.j);
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
