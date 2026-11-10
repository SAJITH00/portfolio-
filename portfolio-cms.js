(() => {
  const scriptApi = document.currentScript && document.currentScript.dataset
    ? document.currentScript.dataset.api
    : '';
  const apiRoot = scriptApi
    ? String(scriptApi).replace(/\/$/, '')
    : (location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.port !== '5000'
      ? 'http://localhost:5000/api'
      : '/api';

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  const backendOrigin = apiRoot.startsWith('http')
    ? new URL(apiRoot).origin
    : location.origin;

  const safeUrl = (value) => {
    if (!value) return '';
    const url = String(value).trim();
    if (!url || url.startsWith('#')) return '';
    try {
      const parsed = new URL(url, backendOrigin);
      if (parsed.pathname.startsWith('/uploads/')) {
        return new URL(`${parsed.pathname}${parsed.search}`, backendOrigin).href;
      }
      if (url.startsWith('/') && !url.startsWith('//')) return url;
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch {
      return '';
    }
  };

  const statusElement = () => {
    let status = document.getElementById('portfolioCmsStatus');
    if (!status) {
      status = document.createElement('p');
      status.id = 'portfolioCmsStatus';
      status.setAttribute('role', 'status');
      status.className = 'cms-status';
      const container = document.querySelector('#projects .wrap');
      if (container) container.prepend(status);
    }
    return status;
  };

  const setStatus = (message) => {
    const status = statusElement();
    if (status) status.textContent = message;
  };

  function renderProfile(profile = {}) {
    const setText = (selector, value) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = value == null ? '' : String(value);
    };
    const hello = document.querySelector('.hello');
    if (hello) {
      const textNode = [...hello.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      if (textNode) textNode.textContent = profile.name ? `HELLO WORLD — I'M ${profile.name}` : '';
    }

    setText('.spec-label + .spec-pill #role-cycler', profile.title);
    setText('.hero .lead', profile.tagline);
    setText('.about-copy h2', profile.aboutHeadline);
    setText('.about-copy > p.body', profile.aboutBio);
    setText('.facts .fact:nth-child(1) b', profile.location);
    setText('.facts .fact:nth-child(2) b', profile.status);
    setText('#contactLocation', profile.location);

    const idName = document.querySelector('.id-card b');
    if (idName && idName.firstChild?.nodeType === Node.TEXT_NODE) {
      idName.firstChild.textContent = profile.name ? `${profile.name} ` : '';
    }
    setText('.id-card small', [profile.location, profile.title].filter(Boolean).join(' // '));

    const avatar = document.querySelector('.portrait img');
    if (avatar) {
      const imageUrl = safeUrl(profile.avatarUrl);
      avatar.style.display = imageUrl ? '' : 'none';
      if (imageUrl) avatar.src = imageUrl;
      else avatar.removeAttribute('src');
    }

    const statValues = document.querySelectorAll('.stats .num span');
    [profile.stats?.projectsCount, profile.stats?.techMastered, profile.stats?.passionRate]
      .forEach((value, index) => {
        if (statValues[index]) statValues[index].textContent = value == null ? '' : String(value);
      });

    const emailLink = document.querySelector('#contact a[href^="mailto:"]');
    if (emailLink) {
      if (profile.email) {
        emailLink.href = `mailto:${encodeURIComponent(profile.email)}`;
        emailLink.textContent = profile.email;
      } else {
        emailLink.removeAttribute('href');
        emailLink.textContent = '';
      }
    }

    [
      ['.social.g', profile.githubUrl],
      ['.social.l', profile.linkedinUrl],
      ['.social.w', profile.whatsappUrl],
      ['#contact .info-row a[href*="wa.me"]', profile.whatsappUrl],
    ].forEach(([selector, value]) => {
      const link = document.querySelector(selector);
      if (!link) return;
      const url = safeUrl(value);
      if (url) link.href = url;
      else link.removeAttribute('href');
    });

    const resumeLink = [...document.querySelectorAll('.hero-ctas a')]
      .find((link) => link.textContent.includes('Download Resume'));
    if (resumeLink) {
      const url = safeUrl(profile.resumeUrl);
      if (url) resumeLink.href = url;
      else resumeLink.removeAttribute('href');
    }

    const phoneLink = document.getElementById('profilePhoneLink');
    const phoneRow = document.getElementById('profilePhoneRow');
    if (phoneLink && phoneRow) {
      const phone = String(profile.phone || '').trim();
      phoneLink.href = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';
      document.getElementById('profilePhone').textContent = phone;
      phoneRow.style.display = phone ? '' : 'none';
    }
  }

  function renderProjects(projects) {
    const grid = document.getElementById('projGrid');
    if (!grid) return;
    if (!projects.length) {
      grid.innerHTML = '<p class="cms-empty">No projects have been published yet.</p>';
    } else {
      grid.innerHTML = projects.map((project, index) => {
        const category = String(project.category || 'frontend').toLowerCase();
        const technologies = (project.technologies || [])
          .map((technology) => `<span>${escapeHtml(technology)}</span>`).join('');
        const imageUrl = safeUrl(project.imageUrl);
        const image = imageUrl
          ? `<div class="shot"><img alt="${escapeHtml(project.title)} preview" src="${escapeHtml(imageUrl)}" loading="lazy" onerror="this.style.display='none'"><div class="shade"></div></div>`
          : '';
        const liveUrl = safeUrl(project.liveUrl);
        const githubUrl = safeUrl(project.githubUrl);
        const links = [
          liveUrl ? `<a class="lk btn-like" href="${escapeHtml(liveUrl)}" target="_blank" rel="noopener noreferrer">Live Demo <span class="ms">open_in_new</span></a>` : '',
          githubUrl ? `<a class="lk" href="${escapeHtml(githubUrl)}" target="_blank" rel="noopener noreferrer"><span class="ms">code</span>GitHub</a>` : '',
        ].filter(Boolean).join('');
        const content = `<div class="meta"><span class="no c-primary">PROJECT // ${String(index + 1).padStart(2, '0')}</span>${project.badge ? `<span class="badge">${escapeHtml(project.badge)}</span>` : ''}</div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p><div class="stack">${technologies}</div>${links ? `<div class="links-row">${links}</div>` : ''}`;
        return project.isFeatured
          ? `<article class="proj featured rv in" data-cat="${escapeHtml(category)}"><div>${content}</div>${image}</article>`
          : `<article class="proj half rv in" data-cat="${escapeHtml(category)}">${image}${content}</article>`;
      }).join('');
    }

    const allFilter = document.querySelector('#filters [data-f="all"]');
    if (allFilter) allFilter.textContent = `All (${projects.length})`;
  }

  function renderSkills(skills) {
    const bento = document.querySelector('#arsenal .bento');
    if (!bento) return;
    if (!skills.length) {
      bento.innerHTML = '<p class="cms-empty">No skills have been added yet.</p>';
      return;
    }

    const groups = new Map();
    skills.forEach((skill) => {
      const category = skill.category || 'Other';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(skill);
    });
    const icons = {
      Frontend: 'desktop_windows',
      Backend: 'dns',
      Tools: 'build',
      'AI & Vibe Tools': 'smart_toy',
      Other: 'deployed_code',
    };
    bento.innerHTML = [...groups].map(([category, items], index) => `
      <div class="bento-card rv in" style="--d:${index * 100}ms">
        <header><div class="ico tint-primary c-primary"><span class="ms">${icons[category] || 'deployed_code'}</span></div><h3>${escapeHtml(category)}</h3></header>
        <div class="chips">${items.map((skill) => `<span class="chip ${escapeHtml(skill.styleClass || (skill.isHighlight ? 'hl' : ''))}">${escapeHtml(skill.name)}</span>`).join('')}</div>
      </div>
    `).join('');
  }

  function renderTimeline(education, experience) {
    const timeline = document.getElementById('timelineBox');
    if (!timeline) return;
    const entries = [
      ...experience.map((item) => ({ title: item.role, organization: item.company, ...item })),
      ...education.map((item) => ({ title: item.degree, organization: item.institution, ...item })),
    ].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!entries.length) {
      timeline.innerHTML = '<p class="cms-empty">No education or experience has been added yet.</p>';
      return;
    }
    timeline.innerHTML = `<div class="beam"></div>${entries.map((item) => `
      <article class="tl-item rv-l in"><div class="tl-dot" style="border-color:var(--secondary-c);color:var(--secondary-c)"></div>
        <div class="tl-card"><div class="tl-top"><h3>${escapeHtml(item.title)}</h3><span class="tag cy">${escapeHtml(item.organization)}</span></div>
          ${item.period ? `<small>${escapeHtml(item.period)}</small>` : ''}<p>${escapeHtml(item.description || '')}</p>
        </div>
      </article>
    `).join('')}`;
  }

  async function loadPortfolioContent() {
    try {
      const response = await fetch(`${apiRoot}/portfolio`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Portfolio API returned HTTP ${response.status}.`);
      const result = await response.json();
      if (!result.success || !result.data) throw new Error('Portfolio API returned an invalid response.');

      const { profile, projects = [], skills = [], education = [], experience = [] } = result.data;
      renderProfile(profile || {});
      renderProjects(projects);
      renderSkills(skills);
      renderTimeline(education, experience);
      setStatus('');
    } catch (error) {
      setStatus('Live portfolio data could not be loaded. Showing the saved page content; check the backend connection and FRONTEND_URL CORS setting.');
      console.error('Portfolio content could not be loaded:', error);
    }
  }

  loadPortfolioContent();
})();
