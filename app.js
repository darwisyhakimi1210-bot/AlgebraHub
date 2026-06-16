/**
 * AlgebraHub — vanilla JS single-page app.
 *
 * How this works (for learning purposes):
 *  - `state` holds which "page" (view) is currently showing, and which
 *    algebra topic is selected (linear / quadratic / system).
 *  - `go(view, topic)` updates state and calls `render()`.
 *  - `render()` looks at state.view and builds the right chunk of HTML,
 *    then drops it into the #app element. This is the same idea every
 *    JS framework (React, Vue...) is built on, just done by hand.
 *  - Buttons use inline `onclick="App.go('learning')"` so it's easy to
 *    trace exactly what each click does straight from the HTML string.
 */

const DATA = {
  linear: {
    title: "Persamaan Linear",
    tag: "y = mx + b",
    intro:
      "Persamaan linear menghasilkan garis lurus. Dalam bentuk cerun-pintasan, m ialah cerun (kecerunan garis) dan b ialah titik potong paksi-y (tempat garis memotong paksi-y).",
    formula: "y = mx + b",
    concepts: [
      {
        n: "1",
        title: "Cerun (m)",
        body: "Kadar perubahan — kenaikan atas larian antara dua titik pada garis.",
      },
      {
        n: "2",
        title: "Titik Potong Paksi-y (b)",
        body: "Nilai y apabila x = 0; tempat garis memotong paksi menegak.",
      },
      {
        n: "3",
        title: "Memplot Graf",
        body: "Plot titik potong paksi-y, kemudian gunakan cerun untuk mencari titik kedua dan lukis garis.",
      },
    ],
    exampleQ: "Cari cerun garis melalui titik (1, 2) dan (3, 8).",
    exampleSteps: [
      { label: "Langkah 1", text: "m = (y₂ − y₁) / (x₂ − x₁)" },
      { label: "Langkah 2", text: "m = (8 − 2) / (3 − 1) = 6 / 2" },
      { label: "Jawapan", text: "m = 3" },
    ],
    question: "Apakah cerun garis y = 4x − 7?",
    opts: ["−7", "4", "7", "−4"],
    icon: "📈",
    iconClass: "purple-bg",
  },
  quadratic: {
    title: "Fungsi Kuadratik",
    tag: "ax² + bx + c",
    intro:
      "Fungsi kuadratik menghasilkan parabola — lengkung simetri berbentuk U. Penyelesaiannya (punca) adalah tempat lengkung memotong paksi-x.",
    formula: "x = (−b ± √(b² − 4ac)) / 2a",
    concepts: [
      {
        n: "1",
        title: "Parabola",
        body: "Graf berbentuk U; ia打开 apabila a > 0 dan打开 ke bawah apabila a < 0.",
      },
      {
        n: "2",
        title: "Puncak",
        body: "Titik pusingan tertinggi atau terendah pada parabola.",
      },
      {
        n: "3",
        title: "Punca",
        body: "Nilai-x di mana fungsi sama dengan sifar — dicari dengan pemfaktoran atau formula kuadratik.",
      },
    ],
    exampleQ: "Selesaikan x² − 5x + 6 = 0 dengan pemfaktoran.",
    exampleSteps: [
      { label: "Langkah 1", text: "Faktorkan: (x − 2)(x − 3) = 0" },
      { label: "Langkah 2", text: "Set setiap faktor kepada sifar" },
      { label: "Jawapan", text: "x = 2 atau x = 3" },
    ],
    question: "Berapa banyak punca nyata bagi x² − 5x + 6 = 0?",
    opts: ["0", "1", "2", "3"],
    icon: "⌣",
    iconClass: "gold-bg",
  },
  system: {
    title: "Sistem Persamaan",
    tag: "{ x , y }",
    intro:
      "Sistem persamaan ialah dua atau lebih persamaan yang berkongsi pembolehubah yang sama. Penyelesaiannya adalah titik di mana garis mereka bersilang — dicari dengan kaedah gantian atau penghapusan.",
    formula: "Selesaikan x dan y bersama-sama",
    concepts: [
      {
        n: "1",
        title: "Kaedah Gantian",
        body: "Selesaikan satu persamaan untuk satu pembolehubah, kemudian gantikan ke dalam persamaan yang satu lagi.",
      },
      {
        n: "2",
        title: "Kaedah Penghapusan",
        body: "Tambah atau tolak persamaan untuk menghapuskan satu pembolehubah.",
      },
      {
        n: "3",
        title: "Titik Penyelesaian",
        body: "Pasangan (x, y) yang memuaskan kedua-dua persamaan pada masa yang sama.",
      },
    ],
    exampleQ: "Selesaikan: x + y = 5 dan x − y = 1.",
    exampleSteps: [
      { label: "Langkah 1", text: "Tambah persamaan: 2x = 6" },
      { label: "Langkah 2", text: "x = 3, kemudian 3 + y = 5" },
      { label: "Jawapan", text: "x = 3, y = 2" },
    ],
    question: "Selesaikan: x + y = 5, x − y = 1. Apakah nilai x?",
    opts: ["2", "3", "4", "5"],
    icon: "{ }",
    iconClass: "green-bg",
  },
};

const state = {
  view: "home", // home | learning | lesson | practice | quiz | game | dragdrop | wordmatch
  topic: "linear", // linear | quadratic | system
};

const App = {
  go(view, topic) {
    state.view = view;
    if (topic) state.topic = topic;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
};

// Small inline icon set (same strokes as the original design) ---------------
const ICONS = {
  home: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  learning:
    '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H10a2 2 0 0 1 2 2v15a1.5 1.5 0 0 0-1.5-1.5H2z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H14a2 2 0 0 0-2 2v15a1.5 1.5 0 0 1 1.5-1.5H22z"/></svg>',
  practice:
    '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="m8.5 13 2 2 4-4.5"/></svg>',
  game: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9.5h2M8 8.5v2"/><circle cx="15.5" cy="9" r="0.6" fill="currentColor"/><circle cx="17" cy="11" r="0.6" fill="currentColor"/><path d="M5.5 7h11a3.5 3.5 0 0 1 3.4 4.3l-1 4.5A2.6 2.6 0 0 1 14.6 16l-1.4-1.5h-2.4L9.4 16a2.6 2.6 0 0 1-4.3-0.2l-1-4.5A3.5 3.5 0 0 1 5.5 7z"/></svg>',
  arrowRight:
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowLeft:
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  bigArrowRight:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  trophy:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v5a6 6 0 0 1-12 0z"/><path d="M9 16h6M10 20h4M12 16v4"/></svg>',
};

// ---------------------------------------------------------------------------
// NAV BAR
// ---------------------------------------------------------------------------
function renderNav() {
  const v = state.view;
  const isActive = (names) => names.includes(v);

  const navBtn = (label, icon, view, activeWhen) => `
    <button class="nav-btn ${isActive(activeWhen) ? "active" : ""}" onclick="App.go('${view}')">
      ${icon} ${label}
    </button>`;

  document.getElementById("navbar").innerHTML = `
    <button class="nav-brand" onclick="App.go('home')">
      <div class="nav-brand-icon">
        <img src="image/svg.png" width="40" height="40" alt="AlgebraHub">
      </div>
      <div class="nav-brand-text">
        <div class="nav-brand-title"><span class="p">Algebra</span><span class="g">Hub</span></div>
        <div class="nav-brand-tagline">Belajar Algebra dengan Cara Menyenangkan</div>
      </div>
    </button>
    ${navBtn("Utama", ICONS.home, "home", ["home"])}
    ${navBtn("Pelajaran", ICONS.learning, "learning", ["learning", "lesson"])}
    ${navBtn("Latihan", ICONS.practice, "practice", ["practice", "quiz"])}
    ${navBtn("Permainan", ICONS.game, "game", ["game", "dragdrop", "wordmatch"])}
  `;
}

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------
function renderHome() {
  return `
    <section class="hero">
      <div>
        <div class="hero-eyebrow">Selamat Datang ke</div>
        <div class="hero-title"><span class="p">Algebra</span><span class="g">Hub!</span></div>
        <div class="hero-underline"></div>
        <div class="hero-subtitle">Belajar Algebra dengan Cara Menyenangkan!</div>
        <p class="hero-desc">Terokai pelajaran interaktif, aktiviti menarik dan kuiz seru untuk menguasasi Algebra langkah demi langkah.</p>
        <div class="hero-actions">
          <button class="btn btn-purple" onclick="App.go('learning')">
            Mula Belajar
            <span class="btn-icon-circle">${ICONS.bigArrowRight}</span>
          </button>
          <button class="btn btn-gold" onclick="App.go('practice')">
            Ambil Kuiz
            <span class="btn-icon-circle">${ICONS.trophy}</span>
          </button>
        </div>
      </div>
      <div class="hero-art">
        <div class="hero-art-glow"></div>
        <div class="owl-frame">
          ${renderOwlSlot()}
        </div>
      </div>
    </section>


  `;
}

// The owl mascot — always shows the owl image, no upload functionality
function renderOwlSlot() {
  return `<img src="image/owl.png" alt="Owl mascot" style="width:300px;height:300px;object-fit:contain;">`;
}

// ---------------------------------------------------------------------------
// LEARNING MATERIAL — landing + lesson detail
// ---------------------------------------------------------------------------
function renderLearning() {
  return `
    <div class="section-heading">
      <h1>Pelajaran</h1>
      <p>Pilih topik dan belajar algebra langkah demi langkah.</p>
    </div>
    <div class="topics-grid">
      <button class="topic-card" onclick="App.go('lesson','linear')">
        <div class="topic-card-banner linear">y = mx + b</div>
        <div class="topic-card-body">
          <div class="topic-card-title">Persamaan Linear</div>
          <div class="topic-card-desc">Cerun, titik potong dan memplot garis lurus.</div>
          <div class="topic-card-link">Mula pelajaran ${ICONS.arrowRight}</div>
        </div>
      </button>
      <button class="topic-card" onclick="App.go('lesson','quadratic')">
        <div class="topic-card-banner quadratic">ax² + bx + c</div>
        <div class="topic-card-body">
          <div class="topic-card-title">Fungsi Kuadratik</div>
          <div class="topic-card-desc">Parabola, pemfaktoran dan formula kuadratik.</div>
          <div class="topic-card-link">Mula pelajaran ${ICONS.arrowRight}</div>
        </div>
      </button>
      <button class="topic-card" onclick="App.go('lesson','system')">
        <div class="topic-card-banner system">{ x , y }</div>
        <div class="topic-card-body">
          <div class="topic-card-title">Sistem Persamaan</div>
          <div class="topic-card-desc">Selesaikan dengan kaedah gantian dan penghapusan.</div>
          <div class="topic-card-link">Mula pelajaran ${ICONS.arrowRight}</div>
        </div>
      </button>
    </div>
  `;
}

function renderLesson() {
  const t = DATA[state.topic];
  const concepts = t.concepts
    .map(
      (c) => `
    <div class="concept-item">
      <div class="concept-num">${c.n}</div>
      <div>
        <div class="concept-title">${c.title}</div>
        <div class="concept-body">${c.body}</div>
      </div>
    </div>`,
    )
    .join("");

  const steps = t.exampleSteps
    .map(
      (s) => `
    <div class="example-step">
      <span class="example-step-label">${s.label}</span>
      <span>${s.text}</span>
    </div>`,
    )
    .join("");

  return `
    <div class="lesson-page">
      <button class="back-btn" onclick="App.go('learning')">${ICONS.arrowLeft} Kembali ke topik</button>
      <div class="lesson-tag">${t.tag}</div>
      <h1 class="lesson-title">${t.title}</h1>
      <p class="lesson-intro">${t.intro}</p>

      <div class="card">
        <div class="card-heading">Konsep utama</div>
        ${concepts}
      </div>

      <div class="formula-card">
        <div class="formula-label">Formula utama</div>
        <div class="formula-value">${t.formula}</div>
      </div>

      <div class="card">
        <div class="card-heading">Contoh kerja</div>
        <div class="example-q">${t.exampleQ}</div>
        ${steps}
      </div>

      <button class="practice-cta" onclick="App.go('practice')">Berlatih topik ini →</button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// PRACTICE — landing + quiz mockup
// ---------------------------------------------------------------------------
function renderPractice() {
  return `
    <div class="section-heading">
      <h1><span class="p">Kuiz</span> Latihan</h1>
      <p>Soalan pilihan berganda untuk menguji kemahiran anda.</p>
    </div>
    <div class="topics-grid">
      <button class="quiz-topic-card" onclick="App.go('quiz','linear')">
        <div class="quiz-topic-icon purple-bg">📈</div>
        <div class="quiz-topic-title">Persamaan Linear</div>
        <div class="quiz-topic-meta">10 soalan · Pilihan berganda</div>
        <div class="pill-badge">Mula kuiz</div>
      </button>
      <button class="quiz-topic-card" onclick="App.go('quiz','quadratic')">
        <div class="quiz-topic-icon gold-bg">⌣</div>
        <div class="quiz-topic-title">Fungsi Kuadratik</div>
        <div class="quiz-topic-meta">10 soalan · Pilihan berganda</div>
        <div class="pill-badge">Mula kuiz</div>
      </button>
      <button class="quiz-topic-card" onclick="App.go('quiz','system')">
        <div class="quiz-topic-icon green-bg">{ }</div>
        <div class="quiz-topic-title">Sistem Persamaan</div>
        <div class="quiz-topic-meta">10 soalan · Pilihan berganda</div>
        <div class="pill-badge">Mula kuiz</div>
      </button>
    </div>
  `;
}

// Preview mockup: answers are not scored, matching the design's intent
// (quizzes are static mockups; only navigation is fully clickable).
function renderQuiz() {
  const t = DATA[state.topic];
  const letters = ["A", "B", "C", "D"];
  const options = t.opts
    .map(
      (opt, i) => `
    <div class="quiz-option ${i === 1 ? "selected" : ""}">
      <div class="quiz-option-letter">${letters[i]}</div>
      <div class="quiz-option-text">${opt}</div>
    </div>`,
    )
    .join("");

  return `
    <div class="quiz-page">
      <button class="back-btn" onclick="App.go('practice')">${ICONS.arrowLeft} Keluar kuiz</button>
      <div class="quiz-header-row">
        <div class="quiz-header-title">Kuiz ${t.title}</div>
        <div class="quiz-header-count">Soalan 3 daripada 10</div>
      </div>
      <div class="progress-track"><div class="progress-fill"></div></div>

      <div class="quiz-card">
        <div class="quiz-question-label">Soalan</div>
        <div class="quiz-question">${t.question}</div>
        <div class="quiz-options">${options}</div>
        <div class="quiz-actions">
          <button class="quiz-btn-prev">Sebelumnya</button>
          <button class="quiz-btn-next">Seterusnya →</button>
        </div>
      </div>
      <div class="mockup-note">Pratonton mockup · jawapan tidak dinilai</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// GAME — landing + drag&drop / word match mockups
// ---------------------------------------------------------------------------
function renderGame() {
  return `
    <div class="section-heading">
      <h1>Algebra <span class="g">Permainan</span></h1>
      <p>Belajar sambil bermain — pilih permainan untuk dimulakan.</p>
    </div>
    <div class="games-grid">
      <button class="game-card" onclick="App.go('dragdrop')">
        <div class="game-card-banner dragdrop">
          <div class="dd-chip">cerun</div>
          <div class="dd-chip-drop">drop</div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Seret &amp; Lepas</div>
          <div class="game-card-desc">Seret setiap istilah algebra ke definisi yang sepadan.</div>
        </div>
      </button>
      <button class="game-card" onclick="App.go('wordmatch')">
        <div class="game-card-banner wordmatch">
          <div class="wm-stack">
            <div class="wm-chip">Cerun</div>
            <div class="wm-chip">Punca</div>
          </div>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.5"><path d="M2 12h36M2 28h36" stroke-dasharray="4 4"/></svg>
          <div class="wm-stack">
            <div class="wm-chip">naik/turun</div>
            <div class="wm-chip">x-sifar</div>
          </div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Padanan Kata</div>
          <div class="game-card-desc">Hubungkan setiap istilah di kiri dengan maknanya di kanan.</div>
        </div>
      </button>
    </div>
  `;
}

// Preview mockup: interactions are illustrative, matching the design intent.
function renderDragDrop() {
  return `
    <div class="game-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali ke permainan</button>
      <div class="game-page-header">
        <div class="game-page-title">Seret &amp; Lepas</div>
        <div class="stat-badges">
          <div class="stat-badge gold">⭐ Markah 20</div>
          <div class="stat-badge purple">⏱ 01:24</div>
        </div>
      </div>

      <div class="dd-card">
        <div class="dd-instructions">Seret istilah ke kotak yang sepadan</div>
        <div class="dd-bank">
          <div class="dd-term">titik potong-y</div>
          <div class="dd-term">parabola</div>
          <div class="dd-term">pekali</div>
        </div>
        <div class="dd-targets">
          <div class="dd-target">
            <div class="dd-target-def">Nilai y di mana garis memotong paksi-y</div>
            <div class="dd-drop-zone">drop di sini</div>
          </div>
          <div class="dd-target filled">
            <div class="dd-target-def">Graf berbentuk U bagi kuadratik</div>
            <div class="dd-drop-zone filled">parabola ✓</div>
          </div>
          <div class="dd-target">
            <div class="dd-target-def">Nombor yang didarab dengan pembolehubah</div>
            <div class="dd-drop-zone">drop di sini</div>
          </div>
          <div class="dd-target">
            <div class="dd-target-def">Di mana fungsi sama dengan sifar</div>
            <div class="dd-drop-zone">drop di sini</div>
          </div>
        </div>
      </div>
      <div class="mockup-note">Pratonton mockup · interaksi adalah illustratif</div>
    </div>
  `;
}

function renderWordMatch() {
  return `
    <div class="lesson-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali ke permainan</button>
      <div class="game-page-header">
        <div class="game-page-title">Padanan Kata</div>
        <div class="stat-badge gold">Dipadankan 2 / 4</div>
      </div>

      <div class="wm-card">
        <div class="wm-instructions">Tekan istilah, kemudian tekan definisi yang sepadan</div>
        <div class="wm-columns">
          <div class="wm-col">
            <div class="wm-item matched-green">Cerun</div>
            <div class="wm-item matched-purple">Punca</div>
            <div class="wm-item term-default">Puncak</div>
            <div class="wm-item term-default">Pemalar</div>
          </div>
          <div class="wm-col">
            <div class="wm-item matched-purple def-matched">Di mana graf memotong paksi-x</div>
            <div class="wm-item def-default">Titik pusingan parabola</div>
            <div class="wm-item matched-green def-matched">Kecerunan, diukur sebagai naik atas turun</div>
            <div class="wm-item def-default">Istilah tanpa pembolehubah</div>
          </div>
        </div>
      </div>
      <div class="mockup-note">Pratonton mockup · interaksi adalah illustratif</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// MAIN RENDER DISPATCH
// ---------------------------------------------------------------------------
function render() {
  renderNav();

  const renderers = {
    home: renderHome,
    learning: renderLearning,
    lesson: renderLesson,
    practice: renderPractice,
    quiz: renderQuiz,
    game: renderGame,
    dragdrop: renderDragDrop,
    wordmatch: renderWordMatch,
  };

  document.getElementById("app").innerHTML = (
    renderers[state.view] || renderHome
  )();
}

render();
