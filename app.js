const $ = (selector) => document.querySelector(selector);

const form = $('#search-form');
const input = $('#username');
const button = $('#search-button');
const dashboard = $('#dashboard');
const emptyState = $('#empty-state');
const errorBox = $('#error');
const repoList = $('#repo-list');
const filterInput = $('#filter');
const sortSelect = $('#sort');
const loadMoreButton = $('#load-more');

let repositories = [];
let visibleCount = 8;
let activeUsername = '';

const number = (value) => new Intl.NumberFormat().format(value || 0);
const safeText = (value, fallback = '') => (value && String(value).trim()) || fallback;

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}
function setLoading(loading) {
  button.disabled = loading;
  button.innerHTML = loading ? 'Exploring… <span>↻</span>' : 'Explore profile <span>↗</span>';
}
function dateLabel(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? '' : `Joined ${date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
}

async function githubFetch(url) {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (response.status === 404) throw new Error('We couldn’t find that GitHub username. Double-check the spelling and try again.');
  if (response.status === 403 || response.status === 429) throw new Error('GitHub’s public API rate limit may have been reached. Please wait a little and try again.');
  if (!response.ok) throw new Error(`GitHub returned an error (${response.status}). Please try again in a moment.`);
  return response.json();
}

async function explore(username) {
  clearError();
  setLoading(true);
  dashboard.hidden = true;
  emptyState.hidden = true;
  activeUsername = username;

  try {
    const user = await githubFetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    const repos = await githubFetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`);

    fillProfile(user);
    repositories = repos.filter(repo => !repo.fork || repo.stargazers_count > 0);
    visibleCount = 8;
    $('#repo-count').textContent = number(user.public_repos);
    $('#followers').textContent = number(user.followers);
    $('#following').textContent = number(user.following);
    $('#stars').textContent = number(repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0));
    fillSignals(user, repositories);
    fillLanguages(repositories);
    renderRepositories();
    dashboard.hidden = false;
  } catch (error) {
    emptyState.hidden = false;
    showError(error.message || 'Something went wrong. Check your connection and try again.');
  } finally {
    setLoading(false);
  }
}

function fillProfile(user) {
  $('#avatar').src = user.avatar_url;
  $('#avatar').alt = `${user.login}'s GitHub avatar`;
  $('#name').textContent = safeText(user.name, user.login);
  $('#handle').textContent = `@${user.login} ↗`;
  $('#handle').href = user.html_url;
  $('#profile-link').href = user.html_url;
  $('#bio').textContent = safeText(user.bio, 'No bio provided — let the projects do the talking.');
  $('#location').textContent = user.location ? `⌖ ${user.location}` : '';
  $('#company').textContent = user.company ? `▧ ${user.company}` : '';
  $('#joined').textContent = dateLabel(user.created_at);
}

function fillSignals(user, repos) {
  const accountAge = Math.max(0, new Date().getFullYear() - new Date(user.created_at).getFullYear());
  $('#signal-title').textContent = accountAge === 0 ? 'A fresh GitHub chapter' : `${accountAge}+ year${accountAge === 1 ? '' : 's'} on GitHub`;
  $('#signal-copy').textContent = `${number(user.public_repos)} public repos and ${number(user.followers)} followers are visible on this profile.`;
  const originalCount = repos.filter(repo => !repo.fork).length;
  const starred = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const topRepo = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
  $('#project-title').textContent = topRepo ? `Standout project: ${topRepo.name}` : 'Room for a first project';
  $('#project-copy').textContent = topRepo
    ? `${number(topRepo.stargazers_count)} stars on the most-starred loaded repo. ${originalCount} non-fork projects in this view; ${number(starred)} stars total.`
    : 'No public repositories were returned for this profile.';
}

function fillLanguages(repos) {
  const totals = {};
  repos.forEach(repo => {
    if (repo.language) totals[repo.language] = (totals[repo.language] || 0) + Math.max(repo.size || 1, 1);
  });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const target = $('#languages');
  target.replaceChildren();
  if (!sorted.length) {
    target.innerHTML = '<p class="muted">No language data is available for the loaded repositories.</p>';
    return;
  }
  const total = sorted.reduce((sum, item) => sum + item[1], 0);
  sorted.forEach(([language, size]) => {
    const row = document.createElement('div');
    row.className = 'language-row';
    const name = document.createElement('span');
    name.className = 'language-name';
    name.textContent = language;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('span');
    const percent = Math.round(size / total * 100);
    fill.style.width = `${percent}%`;
    bar.append(fill);
    const pct = document.createElement('span');
    pct.className = 'percent';
    pct.textContent = `${percent}%`;
    row.append(name, bar, pct);
    target.append(row);
  });
}

function renderRepositories() {
  const query = filterInput.value.trim().toLowerCase();
  const sortBy = sortSelect.value;
  let filtered = repositories.filter(repo => `${repo.name} ${repo.description || ''} ${repo.language || ''}`.toLowerCase().includes(query));
  if (sortBy === 'stars') filtered.sort((a, b) => b.stargazers_count - a.stargazers_count);
  if (sortBy === 'updated') filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  $('#repo-total').textContent = `${filtered.length} PROJECT${filtered.length === 1 ? '' : 'S'}`;
  repoList.replaceChildren();
  const shown = filtered.slice(0, visibleCount);
  if (!shown.length) {
    const message = document.createElement('p');
    message.className = 'muted';
    message.textContent = 'No repositories match that filter.';
    repoList.append(message);
  }
  shown.forEach(repo => repoList.append(makeRepoCard(repo)));
  loadMoreButton.hidden = filtered.length <= visibleCount;
  loadMoreButton.textContent = `Load more repositories (${Math.min(filtered.length - visibleCount, filtered.length - visibleCount)} remaining) ↓`;
}

function makeRepoCard(repo) {
  const card = document.createElement('article');
  card.className = 'repo-card';
  const top = document.createElement('div');
  top.className = 'repo-title-row';
  const title = document.createElement('a');
  title.className = 'repo-title';
  title.href = repo.html_url;
  title.target = '_blank';
  title.rel = 'noreferrer';
  title.textContent = repo.name;
  const lock = document.createElement('span');
  lock.className = 'repo-lock';
  lock.textContent = repo.fork ? '⑂ fork' : '↗';
  top.append(title, lock);
  const description = document.createElement('p');
  description.className = 'repo-desc';
  description.textContent = safeText(repo.description, 'No description yet — open the repository to learn more.');
  const meta = document.createElement('div');
  meta.className = 'repo-meta';
  const language = document.createElement('span');
  if (repo.language) {
    const dot = document.createElement('i');
    dot.className = 'language-dot';
    language.append(dot, document.createTextNode(repo.language));
  } else language.textContent = '◌ No language';
  const stars = document.createElement('span');
  stars.textContent = `★ ${number(repo.stargazers_count)}`;
  const forks = document.createElement('span');
  forks.textContent = `⑂ ${number(repo.forks_count)}`;
  meta.append(language, stars, forks);
  card.append(top, description, meta);
  return card;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const username = input.value.trim().replace(/^@/, '');
  if (username) explore(username);
});
filterInput.addEventListener('input', () => { visibleCount = 8; renderRepositories(); });
sortSelect.addEventListener('change', () => { visibleCount = 8; renderRepositories(); });
loadMoreButton.addEventListener('click', () => { visibleCount += 8; renderRepositories(); });
$('#reset').addEventListener('click', () => {
  dashboard.hidden = true;
  emptyState.hidden = false;
  clearError();
  input.value = '';
  input.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
