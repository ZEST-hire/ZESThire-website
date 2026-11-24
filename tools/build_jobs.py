#!/usr/bin/env python3
"""Builds one SEO page per live job from the ZEST jobs Google Sheet.

Each page carries JobPosting structured data so the role can appear in
Google's job search. Runs on a schedule via .github/workflows/build-jobs.yml.

Rules
- A job gets a page only if Status is not Filled / Paused / On hold, it has a
  Title, and it is not past its closing date.
- Closing date = the "Closing Date" column (YYYY-MM-DD or DD/MM/YYYY).
  Blank = 30 days after "Posted Date". No dates at all = no page.
- Pages for jobs that are no longer live are deleted, so they drop off Google.

Usage: python3 tools/build_jobs.py [path-or-url-to-csv]
"""
import csv, datetime as dt, html, io, json, os, re, sys, urllib.request
from zoneinfo import ZoneInfo

SHEET_CSV = ('https://docs.google.com/spreadsheets/d/'
             '1pAlZhvx1CmktnyYmRUNTCfwl98LfTZbo2ojjsgDzVUE/export?format=csv&gid=0')
SITE = 'https://zesthire.com.au'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JOBS_DIR = os.path.join(ROOT, 'jobs')
DEFAULT_DAYS_OPEN = 30
TZ = ZoneInfo('Australia/Sydney')
STATES = {'NSW': 'New South Wales', 'VIC': 'Victoria', 'QLD': 'Queensland', 'WA': 'Western Australia',
          'SA': 'South Australia', 'TAS': 'Tasmania', 'ACT': 'Australian Capital Territory', 'NT': 'Northern Territory'}
ESC = lambda s: html.escape(str(s or ''), quote=True)


def read_csv(src):
    if src.startswith('http'):
        req = urllib.request.Request(src, headers={'User-Agent': 'zest-jobs-builder'})
        with urllib.request.urlopen(req, timeout=30) as r:
            text = r.read().decode('utf-8-sig')
    else:
        text = open(src, encoding='utf-8-sig').read()
    return list(csv.DictReader(io.StringIO(text)))


def parse_date(s):
    s = (s or '').strip()
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d/%m/%y', '%d-%m-%Y', '%Y/%m/%d'):
        try:
            return dt.datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


def slugify(s):
    s = s.lower().replace('&', ' and ')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def salary_ld(salary):
    """'$55 – $62/hr ...' or '$140k – $160k + super' -> MonetaryAmount, else None."""
    s = salary.replace(',', '')
    unit = 'HOUR' if re.search(r'/\s*h(ou)?r', s, re.I) else 'YEAR'
    nums = re.findall(r'\$\s*(\d+(?:\.\d+)?)\s*(k)?', s.split('·')[0], re.I)
    if not nums:
        return None
    vals = [float(n) * (1000 if k else 1) for n, k in nums[:2]]
    value = {'@type': 'QuantitativeValue', 'unitText': unit}
    if len(vals) == 2:
        value.update(minValue=min(vals), maxValue=max(vals))
    else:
        value['value'] = vals[0]
    return {'@type': 'MonetaryAmount', 'currency': 'AUD', 'value': value}


def employment_type(t):
    t = t.lower()
    if 'casual' in t or 'temp' in t:
        return ['TEMPORARY']
    if 'contract' in t:
        return ['CONTRACTOR']
    if 'part' in t:
        return ['PART_TIME']
    return ['FULL_TIME']


def load_jobs(rows, today):
    jobs = []
    for i, r in enumerate(rows):
        g = lambda k: (r.get(k) or '').strip()
        status, title = g('Status'), g('Title')
        if not title or status.lower() in ('filled', 'paused', 'on hold', 'closed', 'draft'):
            continue
        posted = parse_date(g('Posted Date'))
        closing = parse_date(g('Closing Date')) or (posted + dt.timedelta(days=DEFAULT_DAYS_OPEN) if posted else None)
        if not posted or not closing or closing < today:
            continue
        jid = g('Job ID') or f'job-{i}'
        loc = g('Location')
        locality, _, region = loc.rpartition(',')
        locality, region = (locality or loc).strip(), region.strip().upper()
        slug = f"{slugify(title)}-{slugify(locality)}-{slugify(jid)}"
        jobs.append(dict(id=jid, title=title, pillar=g('Pillar'), location=loc, locality=locality,
                         region=region, type=g('Type'), salary=g('Salary'), summary=g('Summary'),
                         posted=posted, closing=closing, slug=slug, url=f'/jobs/{slug}.html'))
    return jobs


def page_html(job, template):
    nav, footer, head_tags = template
    title = f"{job['title']} – {job['location']} | ZEST Hire Jobs"
    desc = (job['summary'][:150].rsplit(' ', 1)[0] + '…') if len(job['summary']) > 155 else job['summary']
    url = SITE + job['url']
    salary_clean = re.sub(r'\s*·\s*\$[\d,]+\s*sign-(?:on|up) bonus', '', job['salary'], flags=re.I)
    bonus = re.search(r'\$[\d,]+\s*sign-(?:on|up) bonus', job['salary'], re.I)
    region_name = STATES.get(job['region'], job['region'])
    description_html = (
        f"<p>{ESC(job['summary'])}</p>"
        f"<p><strong>Location:</strong> {ESC(job['location'])}<br><strong>Job type:</strong> {ESC(job['type'])}"
        f"<br><strong>Pay:</strong> {ESC(job['salary'])}</p>"
        "<p>ZEST Hire is recruiting for this role on behalf of our client. We place electricians, technicians and "
        "project professionals into data centre, energy and critical infrastructure work across NSW, VIC, QLD and WA. "
        "Apply with your CV and a ZEST recruiter will be in touch to talk through the role, the site and next steps.</p>")
    ld = {
        '@context': 'https://schema.org', '@type': 'JobPosting',
        'title': job['title'], 'description': description_html,
        'identifier': {'@type': 'PropertyValue', 'name': 'ZEST Hire', 'value': job['id']},
        'datePosted': job['posted'].isoformat(),
        'validThrough': f"{job['closing'].isoformat()}T23:59:59+11:00",
        'employmentType': employment_type(job['type']),
        'hiringOrganization': {'@type': 'Organization', 'name': 'ZEST Hire', 'sameAs': SITE + '/',
                               'logo': SITE + '/zest-logo-patch.png'},
        'jobLocation': {'@type': 'Place', 'address': {'@type': 'PostalAddress', 'addressLocality': job['locality'],
                                                      'addressRegion': region_name, 'addressCountry': 'AU'}},
        'directApply': True,
        'url': url,
    }
    sal = salary_ld(job['salary'])
    if sal:
        ld['baseSalary'] = sal
    crumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Jobs', 'item': SITE + '/jobs.html'},
        {'@type': 'ListItem', 'position': 3, 'name': job['title'], 'item': url}]}
    closing_txt = job['closing'].strftime('%-d %B %Y')
    return f'''<!DOCTYPE html>
<html lang="en-AU">
<head>
{head_tags}
<title>{ESC(title)}</title>
<meta name="description" content="{ESC(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ZEST Hire">
<meta property="og:title" content="{ESC(title)}">
<meta property="og:description" content="{ESC(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&h=630&q=70">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#14161A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css?v=CSSV">
<script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False, indent=1)}
</script>
<script type="application/ld+json">
{json.dumps(crumbs, ensure_ascii=False)}
</script>
</head>
<body>

{nav}
<section class="page-hero job-hero">
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/jobs.html">Jobs</a> <span aria-hidden="true">/</span> <span>{ESC(job['title'])}</span></nav>
    <span class="eyebrow">{ESC(job['pillar'] or 'Job')}</span>
    <h1>{ESC(job['title'])}</h1>
    <div class="job-facts">
      <span>📍 {ESC(job['location'])}</span>
      <span>💼 {ESC(job['type'])}</span>
      <span>💰 {ESC(salary_clean)}</span>
      {f'<span class="job-bonus">🎁 {ESC(bonus.group(0))}</span>' if bonus else ''}
    </div>
    <div class="hero-actions"><a href="#apply" class="btn btn-primary">Apply now <span class="arrow">→</span></a><a href="/jobs.html" class="btn btn-ghost-light">See all jobs</a></div>
  </div>
</section>

<section class="section-tight">
  <div class="container content-wrap">
    <article class="prose">
      <h2>About the role</h2>
      <p>{ESC(job['summary'])}</p>
      <h2>The details</h2>
      <ul>
        <li><strong>Location:</strong> {ESC(job['location'])}</li>
        <li><strong>Job type:</strong> {ESC(job['type'])}</li>
        <li><strong>Pay:</strong> {ESC(job['salary'])}</li>
        <li><strong>Posted:</strong> {job['posted'].strftime('%-d %B %Y')} · <strong>Applications close:</strong> {closing_txt}</li>
        <li><strong>Reference:</strong> {ESC(job['id'])}</li>
      </ul>
      <h2>About ZEST Hire</h2>
      <p>ZEST Hire is recruiting for this role on behalf of our client. We place electricians, technicians and project professionals into data centre, energy and critical infrastructure work across NSW, VIC, QLD and WA. Apply with your CV and a ZEST recruiter will be in touch to talk through the role, the site and next steps.</p>
      <p>Not quite the right fit? <a href="/jobs.html">Browse all live roles</a> or <a href="/data-centre-electrician-jobs.html">read about data centre electrician jobs</a>.</p>
    </article>
    <aside class="side-cta" aria-label="Apply">
      <div class="side-card dark">
        <h3>Interested?</h3>
        <p>Apply in two minutes with your CV. We'll call you to talk it through.</p>
        <a href="#apply" class="btn btn-lime btn-block">Apply now</a>
      </div>
    </aside>
  </div>
</section>

<section class="section signup-section" id="apply">
  <div class="container">
    <div class="signup-card job-apply-card">
      <div class="signup-card-inner">
        <span class="eyebrow">Apply now</span>
        <h2>Apply for {ESC(job['title'])}</h2>
        <form class="lead-form" data-kind="application">
          <input type="hidden" name="job_id" value="{ESC(job['id'])}"><input type="hidden" name="job_title" value="{ESC(job['title'])}"><input type="hidden" name="job_location" value="{ESC(job['location'])}">
          <div aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden"><label>Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
          <div class="form-row">
            <div class="field"><label for="a-name">Full name</label><input id="a-name" name="fullname" type="text" autocomplete="name" required></div>
            <div class="field"><label for="a-phone">Phone</label><input id="a-phone" name="phone" type="tel" autocomplete="tel" required></div>
          </div>
          <div class="field"><label for="a-email">Email</label><input id="a-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="a-cv">Your CV <span class="muted-label">(PDF or Word, max 5 MB)</span></label><input id="a-cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required></div>
          <div class="field"><label for="a-msg">Anything else? <span class="muted-label">(optional)</span></label><textarea id="a-msg" name="message" rows="3" placeholder="Tickets, availability, notice period…"></textarea></div>
          <label class="consent"><input type="checkbox" name="privacy_consent" required><span>I agree to ZEST collecting and using my details as set out in the <a href="/privacy.html" target="_blank">Privacy Policy</a>.</span></label>
          <button type="submit" class="btn btn-primary btn-block">Submit application <span class="arrow">→</span></button>
        </form>
        <div class="form-success" role="status">
          <div class="big">✅</div>
          <h3>Application sent!</h3>
          <p>Thanks for applying. A ZEST recruiter will review your CV and be in touch about next steps.</p>
        </div>
      </div>
    </div>
  </div>
</section>

{footer}
<script src="/script.js?v=JOBSV"></script>
</body>
</html>
'''


def absolutise(block):
    """Make root-relative links work from /jobs/."""
    block = re.sub(r'(href|src)="(?!https?:|mailto:|tel:|#|/)([^"]*)"', r'\1="/\2"', block)
    return block.replace('href="/index.html', 'href="/')


def load_template():
    s = open(os.path.join(ROOT, 'jobs.html'), encoding='utf-8').read()
    nav = s[s.index('<!-- ========== NAV'):s.index('</header>') + len('</header>')] if '<!-- ========== NAV' in s else ''
    footer = s[s.index('<!-- ========== FOOTER'):s.index('</footer>') + len('</footer>')]
    head = s[s.index('<head>') + 6:s.index('<title>')]
    css_ver = re.search(r'style\.css\?v=([\w]+)', s).group(1)
    js_ver = re.search(r'script\.js\?v=([\w]+)', s).group(1)
    return absolutise(nav), absolutise(footer), absolutise(head.strip()), js_ver, css_ver


def update_sitemap(jobs):
    path = os.path.join(ROOT, 'sitemap.xml')
    s = open(path, encoding='utf-8').read()
    start, end = '<!-- JOBS:START -->', '<!-- JOBS:END -->'
    block = start + '\n' + ''.join(
        f"  <url><loc>{SITE}{j['url']}</loc><lastmod>{j['posted'].isoformat()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n"
        for j in jobs) + '  ' + end
    if start in s:
        s = re.sub(re.escape(start) + r'.*?' + re.escape(end), block, s, flags=re.S)
    else:
        s = s.replace('</urlset>', '  ' + block + '\n</urlset>')
    open(path, 'w', encoding='utf-8').write(s)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else SHEET_CSV
    today = dt.datetime.now(TZ).date()
    jobs = load_jobs(read_csv(src), today)
    nav, footer, head, js_ver, css_ver = load_template()
    os.makedirs(JOBS_DIR, exist_ok=True)
    keep = set()
    for j in jobs:
        out = page_html(j, (nav, footer, head)).replace('JOBSV', js_ver).replace('CSSV', css_ver)
        name = j['slug'] + '.html'
        keep.add(name)
        p = os.path.join(JOBS_DIR, name)
        if not os.path.exists(p) or open(p, encoding='utf-8').read() != out:
            open(p, 'w', encoding='utf-8').write(out)
    for f in os.listdir(JOBS_DIR):
        if f.endswith('.html') and f not in keep:
            os.remove(os.path.join(JOBS_DIR, f))
    index = {j['id']: j['url'] for j in jobs}
    open(os.path.join(JOBS_DIR, 'index.json'), 'w', encoding='utf-8').write(json.dumps(index, indent=1, sort_keys=True) + '\n')
    update_sitemap(jobs)
    print(f'{len(jobs)} job page(s) live on {today}: ' + ', '.join(sorted(index)))


if __name__ == '__main__':
    main()
