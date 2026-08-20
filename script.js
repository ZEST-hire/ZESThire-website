/* =========================================================
   ZEST - shared front-end behaviour
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  /* ---- Mailing list signup form (demo submit) ----
     In production, swap this handler for a real POST to your
     ESP / CRM (Mailchimp, Klaviyo, HubSpot, Airtable form, etc).
     See README.md for recommended options. */
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = document.getElementById('signup-success');
      const data = Object.fromEntries(new FormData(signupForm).entries());
      console.log('Mailing list signup (demo - not sent anywhere yet):', data);
      signupForm.classList.add('hide');
      if (success) success.classList.add('show');
    });
  }

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
      facilities: 'Critical Facilities',
      projects: 'Projects & Construction',
      operations: 'Operations & Service Delivery'
    };

    function pillarKeyFromLabel(label) {
      const l = (label || '').toLowerCase();
      if (l.includes('facilit')) return 'facilities';
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
