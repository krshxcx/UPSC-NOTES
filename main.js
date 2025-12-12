const body = document.body;
const toggleBtn = document.getElementById('themeToggle');
const faqSearch = document.getElementById('faqSearch');
const faqCards = document.querySelectorAll('.faq-grid details');
const notesList = document.getElementById('notesList');
const articlesList = document.getElementById('articlesList');
const notesSearch = document.getElementById('notesSearch');
const articlesSearch = document.getElementById('articlesSearch');
const adminStatus = document.getElementById('adminStatus');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogoutBtn = document.getElementById('adminLogout');
const adminOpenBtn = document.getElementById('adminOpen');
const noteForm = document.getElementById('noteForm');
const articleForm = document.getElementById('articleForm');
const subjectForm = document.getElementById('subjectForm');
const adminOnlyBlocks = document.querySelectorAll('.admin-only');
const subjectSelect = document.getElementById('subjectSelect');
const noteSubjectSelect = document.getElementById('noteSubject');
const subjectTag = document.getElementById('subjectTag');
const subjectTitle = document.getElementById('subjectTitle');
const subjectDesc = document.getElementById('subjectDesc');
const subjectTags = document.getElementById('subjectTags');
const subjectFiles = document.getElementById('subjectFiles');
const subjectCount = document.getElementById('subjectCount');
const subjectUpdated = document.getElementById('subjectUpdated');
const viewerModal = document.getElementById('viewerModal');
const viewerClose = document.getElementById('viewerClose');
const viewerFrame = document.getElementById('viewerFrame');
const viewerSubject = document.getElementById('viewerSubject');
const viewerTitle = document.getElementById('viewerTitle');

const SUBJECTS_KEY = 'upsc_subjects';
const ARTICLES_KEY = 'upsc_articles_list';
const ADMIN_KEY = 'upsc_admin_logged';
const adminCreds = { user: 'admin', pass: 'notes123' }; // demo only

const defaultSubjects = [
    {
        id: 'history',
        name: 'History',
        desc: 'Modern + Ancient + Art & Culture in timeline-first briefs.',
        tags: ['Modern', 'Ancient', 'Culture'],
        notes: [
            { title: 'Modern India Crash Notes', link: 'https://example.com/modern-india.pdf', desc: 'Timeline + personalities one-pager.', createdAt: Date.now() - 86400000 }
        ]
    },
    {
        id: 'environment',
        name: 'Environment',
        desc: 'Protocols, species, climate cues, and PYQ hotspots.',
        tags: ['Climate', 'Biodiversity'],
        notes: [
            { title: 'Environment 50 Must-Know', link: 'https://example.com/env-50.pdf', desc: 'Protocols, species, indices — prelims ready.', createdAt: Date.now() - 172800000 }
        ]
    },
    {
        id: 'polity',
        name: 'Polity',
        desc: 'Laxmi distilled: articles, schedules, SC cues.',
        tags: ['Constitution', 'SC Cases'],
        notes: []
    },
    {
        id: 'economy',
        name: 'Economy',
        desc: 'Macro/micro snapshots, budget bites, indices.',
        tags: ['Budget', 'Macro'],
        notes: []
    }
];

const defaultArticles = [
    {
        title: 'GS2: Cooperative Federalism in 2025',
        summary: 'Quick brief with recent judgments and fiscal angles.',
        body: 'Centre-State dynamics, FC grants, GST council cues.',
        tags: ['GS2', 'Federalism'],
        createdAt: Date.now() - 7200000
    },
    {
        title: 'Ethics: Writing tighter case studies',
        summary: 'A 4-step framework plus 3 sample intros.',
        body: 'Stakeholder map → options → values → action.',
        tags: ['Ethics'],
        createdAt: Date.now() - 3600000
    }
];

function loadList(key, fallback) {
    const stored = localStorage.getItem(key);
    if (stored) {
        try { return JSON.parse(stored); } catch (e) { return fallback; }
    }
    return fallback;
}

function saveList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
}

let subjects = loadList(SUBJECTS_KEY, defaultSubjects);
const legacyNotes = loadList('upsc_notes_list', null);
if (legacyNotes && legacyNotes.length && !subjects.some(s => s.id === 'general')) {
    subjects.unshift({
        id: 'general',
        name: 'General',
        desc: 'Imported notes',
        tags: ['legacy'],
        notes: legacyNotes
    });
    saveList(SUBJECTS_KEY, subjects);
    localStorage.removeItem('upsc_notes_list');
}

let articles = loadList(ARTICLES_KEY, defaultArticles);
let isAdmin = localStorage.getItem(ADMIN_KEY) === 'true';

function getAllNotes() {
    return subjects.flatMap(s => s.notes.map(n => ({ ...n, subject: s.name, subjectId: s.id })));
}

function setAdminUI(state) {
    isAdmin = state;
    adminStatus.textContent = state ? 'Admin logged in' : 'Logged out';
    adminStatus.style.color = state ? '#71dee0' : 'inherit';
    adminOnlyBlocks.forEach(el => {
        el.style.display = state ? 'block' : 'none';
    });
    localStorage.setItem(ADMIN_KEY, state ? 'true' : 'false');
}

function renderNotes(filter = '') {
    const term = filter.toLowerCase();
    notesList.innerHTML = '';
    const filtered = getAllNotes().filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.subject.toLowerCase().includes(term)
    );
    if (!filtered.length) {
        notesList.innerHTML = '<p class="mini">No notes found. Add some from Admin Desk.</p>';
        return;
    }
    filtered
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .forEach(n => {
            const card = document.createElement('div');
            card.className = 'card note-card';
            card.innerHTML = `
                <div class="note-meta">
                    <span class="badge">${n.subject}</span>
                    <span class="mini">${n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <h3>${n.title}</h3>
                <p class="mini">${n.desc || ''}</p>
                <div class="actions">
                    <button class="pill ghost tiny" data-view="${n.link}" data-subject="${n.subject}" data-title="${n.title}">View</button>
                    <a class="pill link primary" href="${n.link}" target="_blank" rel="noopener">Open ↗</a>
                </div>
            `;
            notesList.appendChild(card);
        });

    // Hook view buttons
    notesList.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => openViewer(btn.dataset.view, btn.dataset.title, btn.dataset.subject));
    });
}

function renderArticles(filter = '') {
    const term = filter.toLowerCase();
    articlesList.innerHTML = '';
    const filtered = articles.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.summary.toLowerCase().includes(term) ||
        (a.body || '').toLowerCase().includes(term) ||
        (a.tags || []).some(t => t.toLowerCase().includes(term))
    );
    if (!filtered.length) {
        articlesList.innerHTML = '<p class="mini">No articles yet. Post one from Admin Desk.</p>';
        return;
    }
    filtered
        .sort((a, b) => b.createdAt - a.createdAt)
        .forEach(a => {
            const tags = (a.tags || []).map(t => `<span class="chip">${t}</span>`).join('');
            const card = document.createElement('div');
            card.className = 'card article-card';
            card.innerHTML = `
                <div class="article-meta">
                    <span class="badge">Article</span>
                    <span class="mini">${new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <h3>${a.title}</h3>
                <p class="mini">${a.summary}</p>
                <div class="subject-tags">${tags}</div>
                <details>
                    <summary class="mini">Read more</summary>
                    <p class="mini">${a.body || '—'}</p>
                </details>
            `;
            articlesList.appendChild(card);
        });
}

function renderSubjectOptions() {
    if (!subjectSelect || !noteSubjectSelect) return;
    subjectSelect.innerHTML = '';
    noteSubjectSelect.innerHTML = '';
    subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        subjectSelect.appendChild(opt);

        const opt2 = document.createElement('option');
        opt2.value = s.id;
        opt2.textContent = s.name;
        noteSubjectSelect.appendChild(opt2);
    });
}

function renderSubjectWorkspace(subjectId) {
    const subject = subjects.find(s => s.id === subjectId) || subjects[0];
    if (!subject) return;
    subjectTag.textContent = subject.name;
    subjectTitle.textContent = subject.name;
    subjectDesc.textContent = subject.desc || 'Notes, maps, PYQ drills — all in one place.';
    subjectTags.innerHTML = (subject.tags || []).map(t => `<span class="chip">${t}</span>`).join('');
    const files = subject.notes || [];
    subjectCount.textContent = files.length;
    subjectUpdated.textContent = files.length ? new Date(files[0].createdAt || Date.now()).toLocaleDateString() : '—';
    subjectFiles.innerHTML = '';
    if (!files.length) {
        subjectFiles.innerHTML = '<p class="mini">No files yet for this subject.</p>';
    } else {
        files
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .forEach(f => {
                const row = document.createElement('div');
                row.className = 'subject-file';
                row.innerHTML = `
                    <div class="meta">
                        <strong>${f.title}</strong>
                        <span class="mini">${f.desc || ''}</span>
                    </div>
                    <div class="actions">
                        <button class="pill ghost tiny" data-view="${f.link}" data-subject="${subject.name}" data-title="${f.title}">View</button>
                        <a class="pill link primary" href="${f.link}" target="_blank" rel="noopener">Open ↗</a>
                    </div>
                `;
                subjectFiles.appendChild(row);
            });
        subjectFiles.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => openViewer(btn.dataset.view, btn.dataset.title, btn.dataset.subject));
        });
    }
    subjectSelect.value = subject.id;
}

function openViewer(link, title, subject) {
    if (!viewerModal) return;
    viewerFrame.src = link;
    viewerTitle.textContent = title || 'Document';
    viewerSubject.textContent = subject || 'Subject';
    viewerModal.classList.add('open');
}

viewerClose?.addEventListener('click', () => {
    viewerModal.classList.remove('open');
    viewerFrame.src = '';
});

viewerModal?.addEventListener('click', (e) => {
    if (e.target === viewerModal) {
        viewerModal.classList.remove('open');
        viewerFrame.src = '';
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a.header-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Theme toggle with localStorage persistence
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    body.dataset.theme = 'light';
    toggleBtn.textContent = '🌞';
}
toggleBtn.addEventListener('click', () => {
    const isLight = body.dataset.theme === 'light';
    body.dataset.theme = isLight ? 'dark' : 'light';
    toggleBtn.textContent = isLight ? '🌙' : '🌞';
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
});

// FAQ live filter
faqSearch?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    faqCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(term) ? 'block' : 'none';
    });
});

// Library search
notesSearch?.addEventListener('input', (e) => renderNotes(e.target.value));
articlesSearch?.addEventListener('input', (e) => renderArticles(e.target.value));

// Admin open button scrolls to desk
adminOpenBtn?.addEventListener('click', () => {
    document.getElementById('admin')?.scrollIntoView({ behavior: 'smooth' });
});

// Admin login
adminLoginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value.trim();
    if (user === adminCreds.user && pass === adminCreds.pass) {
        setAdminUI(true);
    } else {
        adminStatus.textContent = 'Invalid credentials';
        adminStatus.style.color = '#ff6b6b';
    }
});

adminLogoutBtn?.addEventListener('click', () => {
    setAdminUI(false);
});

// Create subject
subjectForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return alert('Login as admin first.');
    const name = document.getElementById('subjectName').value.trim();
    const desc = document.getElementById('subjectInfo').value.trim();
    const tags = document.getElementById('subjectTagsInput').value.split(',').map(t => t.trim()).filter(Boolean);
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (subjects.some(s => s.id === id)) return alert('Subject already exists.');
    subjects.push({ id, name, desc, tags, notes: [] });
    saveList(SUBJECTS_KEY, subjects);
    renderSubjectOptions();
    renderSubjectWorkspace(id);
    subjectForm.reset();
});

// Add note
noteForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return alert('Login as admin first.');
    const title = document.getElementById('noteTitle').value.trim();
    const subjectId = document.getElementById('noteSubject').value;
    const link = document.getElementById('noteLink').value.trim();
    const desc = document.getElementById('noteDesc').value.trim();
    const subject = subjects.find(s => s.id === subjectId);
    if (!title || !subject || !link) return;
    subject.notes.unshift({ title, link, desc, createdAt: Date.now() });
    saveList(SUBJECTS_KEY, subjects);
    renderNotes(notesSearch?.value || '');
    renderSubjectWorkspace(subjectId);
    noteForm.reset();
});

// Add article
articleForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return alert('Login as admin first.');
    const title = document.getElementById('articleTitle').value.trim();
    const summary = document.getElementById('articleSummary').value.trim();
    const bodyText = document.getElementById('articleBody').value.trim();
    const tags = document.getElementById('articleTags').value.split(',').map(t => t.trim()).filter(Boolean);
    if (!title || !summary) return;
    articles.unshift({ title, summary, body: bodyText, tags, createdAt: Date.now() });
    saveList(ARTICLES_KEY, articles);
    renderArticles(articlesSearch?.value || '');
    articleForm.reset();
});

// Subject selection in workspace
subjectSelect?.addEventListener('change', (e) => renderSubjectWorkspace(e.target.value));

// Init
setAdminUI(isAdmin);
renderSubjectOptions();
renderSubjectWorkspace(subjects[0]?.id);
renderNotes();
renderArticles();

