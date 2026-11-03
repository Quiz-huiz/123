const QUIZZES = [
  {
    id: 'fiziologie-semestrul-2',
    title: 'Fiziologie · semestrul II',
    file: 'assets/quiz/fiziologie.json',
    description: 'Un set amplu de întrebări despre sistemul endocrin și fiziologia organismului.',
    subject: 'FIZIOLOGIE',
    accent: 'quiz-art-green',
  },
];

const STORAGE_KEY = 'studiu-progress-v1';
const app = document.querySelector('#app');
const dialog = document.querySelector('#transfer-dialog');
const codeField = document.querySelector('#progress-code');
const importField = document.querySelector('#import-code');
const transferFeedback = document.querySelector('#transfer-feedback');
const copyButton = document.querySelector('#copy-code');
let questionsByQuiz = {};
let toastTimer;

function readStore() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return value && value.version === 1 && value.quizzes ? value : { version: 1, quizzes: {} };
  } catch {
    return { version: 1, quizzes: {} };
  }
}

let store = readStore();

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    showToast('Browserul nu a putut salva progresul.');
  }
}

function getProgress(quiz) {
  if (!store.quizzes[quiz.id]) {
    store.quizzes[quiz.id] = { current: 0, answers: {}, checked: {} };
  }
  const progress = store.quizzes[quiz.id];
  progress.answers ||= {};
  progress.checked ||= {};
  const max = Math.max(0, (questionsByQuiz[quiz.id]?.length || 1) - 1);
  progress.current = Math.min(Math.max(0, Number(progress.current) || 0), max);
  return progress;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function quizStats(quiz) {
  const questions = questionsByQuiz[quiz.id] || [];
  const progress = getProgress(quiz);
  const done = Object.keys(progress.checked).filter((index) => progress.checked[index]).length;
  const correct = Object.entries(progress.checked).filter(([index, checked]) => checked && isCorrect(questions[Number(index)], progress.answers[index] || [])).length;
  return { questions, progress, done, correct, percent: questions.length ? Math.round((done / questions.length) * 100) : 0 };
}

function isCorrect(question, selected) {
  if (!question) return false;
  const expected = question.options.filter((option) => option.correct).map((option) => option.id).sort();
  return expected.length > 0 && expected.length === selected.length && expected.every((id, index) => id === [...selected].sort()[index]);
}

function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="eyebrow">Învață în ritmul tău</div>
        <h1>Înțelegi mai bine<br />cu <em>fiecare întrebare.</em></h1>
        <p class="hero-copy">Un loc liniștit pentru recapitulare. Alege un set, verifică ce știi și continuă oricând ai un moment liber.</p>
      </div>
      <div class="hero-aside"><strong>Fără grabă.</strong><span>Progresul se salvează automat pe dispozitivul tău.</span></div>
    </section>
    <section aria-labelledby="library-heading">
      <div class="section-heading"><h2 id="library-heading">Biblioteca de quizuri</h2><span>${QUIZZES.length} ${QUIZZES.length === 1 ? 'set disponibil' : 'seturi disponibile'}</span></div>
      <div class="quiz-grid">${QUIZZES.map((quiz) => {
        const { questions, done, percent } = quizStats(quiz);
        return `<button class="quiz-card" data-open-quiz="${escapeHtml(quiz.id)}" aria-label="Deschide quizul ${escapeHtml(quiz.title)}">
          <span class="card-top"><span class="card-tag">${escapeHtml(quiz.subject)}</span><span class="card-arrow" aria-hidden="true">↗</span></span>
          <span class="quiz-card-title"><span class="sr-only">${escapeHtml(quiz.title)}</span></span>
          <span class="card-content"><span class="card-title">${escapeHtml(quiz.title)}</span><span class="card-description">${escapeHtml(quiz.description)}</span></span>
          <span class="card-bottom"><span class="progress-meta"><span>${questions.length} întrebări · ${done ? `${done} parcurse` : 'începe când ești gata'}</span><span>${percent}%</span></span><span class="progress-track"><span class="progress-fill" style="width:${percent}%"></span></span>
          <span class="card-cta"><span>${done ? 'Continuă de unde ai rămas' : 'Începe să înveți'}</span><span>→</span></span></span>
        </button>`;
      }).join('')}</div>
      <p class="library-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.2c0 4.7 3.2 8.1 7.5 9.8 4.3-1.7 7.5-5.1 7.5-9.8V6L12 3Z"/><path d="m9 12 2 2 4-4"/></svg> Răspunsurile și poziția se salvează în acest browser. Folosește ↗ pentru a transfera progresul.</p>
    </section>`;
  app.querySelectorAll('[data-open-quiz]').forEach((button) => button.addEventListener('click', () => openQuiz(button.dataset.openQuiz)));
}

function openQuiz(quizId, index) {
  const quiz = QUIZZES.find((item) => item.id === quizId);
  if (!quiz) return;
  const { questions, progress } = quizStats(quiz);
  if (!questions.length) {
    app.innerHTML = '<div class="player-shell"><p>Întrebările nu s-au putut încărca. Reîncarcă pagina pentru a încerca din nou.</p><button class="button button-outline" data-home>Înapoi</button></div>';
    app.querySelector('[data-home]').addEventListener('click', renderHome);
    return;
  }
  if (typeof index === 'number') progress.current = Math.min(Math.max(index, 0), questions.length - 1);
  const currentIndex = progress.current;
  const question = questions[currentIndex];
  const selected = progress.answers[currentIndex] || [];
  const checked = Boolean(progress.checked[currentIndex]);
  const correctIds = question.options.filter((option) => option.correct).map((option) => option.id);
  const multiple = correctIds.length > 1;
  const answered = isCorrect(question, selected);
  const percent = Math.round(((currentIndex + (checked ? 1 : 0)) / questions.length) * 100);

  app.innerHTML = `
    <section class="player-shell">
      <div class="player-top"><button class="back-link" data-home><b>←</b> Biblioteca</button><span class="quiz-name">${escapeHtml(quiz.title)}</span><button class="icon-button player-transfer" aria-label="Transferă progresul" title="Transferă progresul">↗</button></div>
      <div class="player-progress"><span class="progress-track"><span class="progress-fill" style="width:${percent}%"></span></span><span class="progress-count">${currentIndex + 1} / ${questions.length}</span></div>
      <article class="question-card" data-multiple="${multiple}">
        <div class="question-topline"><span class="question-index">Întrebarea ${question.id}</span><span class="answer-type"><span class="type-mark ${multiple ? 'multiple' : ''}"></span>${multiple ? 'Mai multe răspunsuri' : 'Un singur răspuns'}</span></div>
        <h1 class="question-text">${escapeHtml(question.prompt)}</h1>
        ${question.images?.map((image) => `<img class="question-image" src="assets/quiz/${encodeURIComponent(image)}" alt="Imagine asociată întrebării ${question.id}" loading="lazy" />`).join('') || ''}
        <div class="options" role="group" aria-label="Variante de răspuns">${question.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const resultClass = checked ? (option.correct ? 'correct' : (isSelected ? 'incorrect' : '')) : '';
          return `<button class="option ${isSelected ? 'selected' : ''} ${resultClass}" data-option="${escapeHtml(option.id)}" ${checked ? 'disabled' : ''} aria-pressed="${isSelected}">
            <span class="option-letter">${escapeHtml(option.id)}</span><span class="option-text">${escapeHtml(option.text)}</span><span class="option-trailing" aria-hidden="true"></span>
          </button>`;
        }).join('')}</div>
        <p class="option-feedback ${checked ? (answered ? 'good' : 'bad') : ''}" aria-live="polite">${checked ? (answered ? 'Foarte bine. Ai ales toate răspunsurile corecte.' : `Răspuns corect: ${correctIds.join(', ')}.`) : (multiple ? 'Selectează toate variantele pe care le consideri corecte.' : 'Alege varianta pe care o consideri corectă.')}</p>
      </article>
      <div class="player-actions"><button class="button button-quiet" data-prev ${currentIndex === 0 ? 'disabled' : ''}>← Înapoi</button><div class="action-right">
        ${checked ? `<button class="button button-outline" data-next>${currentIndex === questions.length - 1 ? 'Vezi rezultatul' : 'Întrebarea următoare'} →</button>` : `<button class="button button-dark" data-check ${selected.length ? '' : 'disabled'}>Verifică răspunsul</button>`}
      </div></div>
      <p class="key-hint">${checked ? 'Răspunsul a fost verificat. Poți reveni oricând la întrebările anterioare.' : 'Poți reveni la întrebările anterioare fără să-ți pierzi selecțiile.'}</p>
    </section>`;

  app.querySelector('[data-home]').addEventListener('click', renderHome);
  app.querySelector('.player-transfer').addEventListener('click', openTransfer);
  app.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.option;
    let next = [...(progress.answers[currentIndex] || [])];
    if (multiple) next = next.includes(id) ? next.filter((item) => item !== id) : [...next, id];
    else next = [id];
    progress.answers[currentIndex] = next;
    delete progress.checked[currentIndex];
    saveStore();
    openQuiz(quizId);
  }));
  app.querySelector('[data-prev]').addEventListener('click', () => openQuiz(quizId, currentIndex - 1));
  const checkButton = app.querySelector('[data-check]');
  if (checkButton) checkButton.addEventListener('click', () => {
    progress.checked[currentIndex] = true;
    saveStore();
    openQuiz(quizId);
  });
  const nextButton = app.querySelector('[data-next]');
  if (nextButton) nextButton.addEventListener('click', () => currentIndex === questions.length - 1 ? renderResult(quiz) : openQuiz(quizId, currentIndex + 1));
}

function renderResult(quiz) {
  const { questions, progress, done, correct, percent } = quizStats(quiz);
  const incorrect = done - correct;
  app.innerHTML = `
    <section class="result-shell"><div class="result-card">
      <span class="result-kicker">Sesiune încheiată</span>
      <h1 class="result-title">Ai făcut un pas<br />înainte.</h1>
      <p class="result-copy">Ai ajuns la capătul setului de întrebări. Rezultatul tău rămâne salvat; poți relua oricând recapitularea.</p>
      <div class="result-stats"><div class="result-stat"><strong>${correct}</strong><span>răspunsuri corecte</span></div><div class="result-stat"><strong>${incorrect}</strong><span>de revizuit</span></div><div class="result-stat"><strong>${done} / ${questions.length}</strong><span>întrebări verificate</span></div></div>
      <div class="result-actions"><button class="button button-dark" data-review>Revizuiește răspunsurile</button><button class="button button-outline" data-home>Înapoi la bibliotecă</button></div>
      <p class="result-progress">Progresul setului: ${percent}% · Întrebarea următoare va fi ${Math.min(progress.current + 1, questions.length)}.</p>
    </div></section>`;
  app.querySelector('[data-home]').addEventListener('click', renderHome);
  app.querySelector('[data-review]').addEventListener('click', () => {
    const firstWrong = questions.findIndex((question, index) => progress.checked[index] && !isCorrect(question, progress.answers[index] || []));
    openQuiz(quiz.id, firstWrong >= 0 ? firstWrong : 0);
  });
}

function showToast(message) {
  let element = document.querySelector('.toast');
  if (!element) {
    element = document.createElement('div');
    element.className = 'toast';
    element.setAttribute('role', 'status');
    document.body.append(element);
  }
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2400);
}

function openTransfer() {
  transferFeedback.textContent = '';
  transferFeedback.classList.remove('error');
  dialog.showModal();
}

function encodeTransfer() {
  const payload = { format: 'studiu-progress', version: 1, quizzes: store.quizzes };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `STUDIU1-${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

function decodeTransfer(code) {
  const cleaned = code.trim().replace(/\s/g, '');
  if (!cleaned.startsWith('STUDIU1-')) throw new Error('Codul nu are formatul așteptat.');
  const base64 = cleaned.slice(8).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  if (payload.format !== 'studiu-progress' || payload.version !== 1 || !payload.quizzes || typeof payload.quizzes !== 'object') throw new Error('Codul nu conține progres Studiu valid.');
  return payload;
}

document.querySelector('#transfer-open').addEventListener('click', openTransfer);
document.querySelector('#make-code').addEventListener('click', () => {
  codeField.value = encodeTransfer();
  copyButton.disabled = false;
  transferFeedback.textContent = 'Cod creat. Copiază-l și păstrează-l până îl încarci pe celălalt dispozitiv.';
  transferFeedback.classList.remove('error');
});
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeField.value);
    transferFeedback.textContent = 'Cod copiat în clipboard.';
  } catch {
    codeField.focus(); codeField.select();
    transferFeedback.textContent = 'Codul este selectat. Copiază-l folosind meniul dispozitivului.';
  }
});
document.querySelector('#apply-code').addEventListener('click', () => {
  try {
    const payload = decodeTransfer(importField.value);
    for (const [quizId, incoming] of Object.entries(payload.quizzes)) {
      if (!QUIZZES.some((quiz) => quiz.id === quizId)) continue;
      const current = store.quizzes[quizId] || { current: 0, answers: {}, checked: {} };
      store.quizzes[quizId] = {
        current: Math.max(0, Number(incoming.current) || 0),
        answers: { ...current.answers, ...(incoming.answers || {}) },
        checked: { ...current.checked, ...(incoming.checked || {}) },
      };
    }
    saveStore();
    transferFeedback.textContent = 'Progresul a fost încărcat. Poți închide această fereastră.';
    transferFeedback.classList.remove('error');
    renderHome();
  } catch (error) {
    transferFeedback.textContent = error.message || 'Nu am putut citi codul. Verifică să fie copiat complet.';
    transferFeedback.classList.add('error');
  }
});

async function start() {
  try {
    const loaded = await Promise.all(QUIZZES.map(async (quiz) => [quiz.id, await fetch(quiz.file).then((response) => {
      if (!response.ok) throw new Error('Quiz file unavailable');
      return response.json();
    })]));
    questionsByQuiz = Object.fromEntries(loaded);
    renderHome();
  } catch {
    app.innerHTML = '<section class="player-shell"><div class="eyebrow">Nu s-a încărcat</div><h1 class="question-text">Setul de întrebări nu este disponibil.</h1><p class="hero-copy">Verifică conexiunea și reîncarcă pagina.</p></section>';
  }
}

start();
