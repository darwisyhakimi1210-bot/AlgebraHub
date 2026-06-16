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
    title: "Linear Equations",
    tag: "y = mx + b",
    intro:
      "A linear equation graphs as a straight line. In slope-intercept form, m is the slope (how steep the line is) and b is the y-intercept (where it crosses the y-axis).",
    formula: "y = mx + b",
    concepts: [
      {
        n: "1",
        title: "Slope (m)",
        body: "The rate of change — rise over run between any two points on the line.",
      },
      {
        n: "2",
        title: "Y-intercept (b)",
        body: "The value of y when x = 0; where the line crosses the vertical axis.",
      },
      {
        n: "3",
        title: "Graphing",
        body: "Plot the y-intercept, then use the slope to find a second point and draw the line.",
      },
    ],
    exampleQ: "Find the slope of the line through (1, 2) and (3, 8).",
    exampleSteps: [
      { label: "Step 1", text: "m = (y₂ − y₁) / (x₂ − x₁)" },
      { label: "Step 2", text: "m = (8 − 2) / (3 − 1) = 6 / 2" },
      { label: "Answer", text: "m = 3" },
    ],
    question: "What is the slope of the line y = 4x − 7?",
    opts: ["−7", "4", "7", "−4"],
    icon: "📈",
    iconClass: "purple-bg",
  },
  quadratic: {
    title: "Quadratic Functions",
    tag: "ax² + bx + c",
    intro:
      "A quadratic function graphs as a parabola — a symmetric U-shaped curve. Its solutions (roots) are where the curve crosses the x-axis.",
    formula: "x = (−b ± √(b² − 4ac)) / 2a",
    concepts: [
      {
        n: "1",
        title: "Parabola",
        body: "The U-shaped graph; it opens up when a > 0 and down when a < 0.",
      },
      {
        n: "2",
        title: "Vertex",
        body: "The highest or lowest turning point of the parabola.",
      },
      {
        n: "3",
        title: "Roots",
        body: "The x-values where the function equals zero — found by factoring or the quadratic formula.",
      },
    ],
    exampleQ: "Solve x² − 5x + 6 = 0 by factoring.",
    exampleSteps: [
      { label: "Step 1", text: "Factor: (x − 2)(x − 3) = 0" },
      { label: "Step 2", text: "Set each factor to zero" },
      { label: "Answer", text: "x = 2 or x = 3" },
    ],
    question: "How many real roots does x² − 5x + 6 = 0 have?",
    opts: ["0", "1", "2", "3"],
    icon: "⌣",
    iconClass: "gold-bg",
  },
  system: {
    title: "System of Equations",
    tag: "{ x , y }",
    intro:
      "A system of equations is two or more equations sharing the same variables. The solution is the point where their lines intersect — found by substitution or elimination.",
    formula: "Solve for x and y together",
    concepts: [
      {
        n: "1",
        title: "Substitution",
        body: "Solve one equation for a variable, then substitute it into the other.",
      },
      {
        n: "2",
        title: "Elimination",
        body: "Add or subtract the equations to cancel one variable.",
      },
      {
        n: "3",
        title: "Solution point",
        body: "The (x, y) pair that satisfies both equations at once.",
      },
    ],
    exampleQ: "Solve: x + y = 5 and x − y = 1.",
    exampleSteps: [
      { label: "Step 1", text: "Add equations: 2x = 6" },
      { label: "Step 2", text: "x = 3, then 3 + y = 5" },
      { label: "Answer", text: "x = 3, y = 2" },
    ],
    question: "Solve: x + y = 5, x − y = 1. What is x?",
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
        <div class="nav-brand-tagline">Learn Algebra The Fun Way</div>
      </div>
    </button>
    ${navBtn("Home", ICONS.home, "home", ["home"])}
    ${navBtn("Learning Material", ICONS.learning, "learning", ["learning", "lesson"])}
    ${navBtn("Practice", ICONS.practice, "practice", ["practice", "quiz"])}
    ${navBtn("Game", ICONS.game, "game", ["game", "dragdrop", "wordmatch"])}
  `;
}

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------
function renderHome() {
  return `
    <section class="hero">
      <div>
        <div class="hero-eyebrow">Welcome to</div>
        <div class="hero-title"><span class="p">Algebra</span><span class="g">Hub!</span></div>
        <div class="hero-underline"></div>
        <div class="hero-subtitle">Learn Algebra The Fun Way!</div>
        <p class="hero-desc">Explore interactive lessons, fun activities and exciting quizzes to master Algebra step by step.</p>
        <div class="hero-actions">
          <button class="btn btn-purple" onclick="App.go('learning')">
            Start Learning
            <span class="btn-icon-circle">${ICONS.bigArrowRight}</span>
          </button>
          <button class="btn btn-gold" onclick="App.go('practice')">
            Take Quiz
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
  return `<img src="image/owl.png" alt="Owl mascot" style="width:350px;height:350px;object-fit:contain;">`;
}

// ---------------------------------------------------------------------------
// LEARNING MATERIAL — landing + lesson detail
// ---------------------------------------------------------------------------
function renderLearning() {
  return `
    <div class="section-heading">
      <h1>Learning <span class="p">Materials</span></h1>
      <p>Pick a topic and learn algebra step by step.</p>
    </div>
    <div class="topics-grid">
      <button class="topic-card" onclick="App.go('lesson','linear')">
        <div class="topic-card-banner linear">y = mx + b</div>
        <div class="topic-card-body">
          <div class="topic-card-title">Linear Equations</div>
          <div class="topic-card-desc">Slopes, intercepts and graphing straight lines.</div>
          <div class="topic-card-link">Start lesson ${ICONS.arrowRight}</div>
        </div>
      </button>
      <button class="topic-card" onclick="App.go('lesson','quadratic')">
        <div class="topic-card-banner quadratic">ax² + bx + c</div>
        <div class="topic-card-body">
          <div class="topic-card-title">Quadratic Functions</div>
          <div class="topic-card-desc">Parabolas, factoring and the quadratic formula.</div>
          <div class="topic-card-link">Start lesson ${ICONS.arrowRight}</div>
        </div>
      </button>
      <button class="topic-card" onclick="App.go('lesson','system')">
        <div class="topic-card-banner system">{ x , y }</div>
        <div class="topic-card-body">
          <div class="topic-card-title">System of Equations</div>
          <div class="topic-card-desc">Solve with substitution and elimination.</div>
          <div class="topic-card-link">Start lesson ${ICONS.arrowRight}</div>
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
      <button class="back-btn" onclick="App.go('learning')">${ICONS.arrowLeft} Back to topics</button>
      <div class="lesson-tag">${t.tag}</div>
      <h1 class="lesson-title">${t.title}</h1>
      <p class="lesson-intro">${t.intro}</p>

      <div class="card">
        <div class="card-heading">Key concepts</div>
        ${concepts}
      </div>

      <div class="formula-card">
        <div class="formula-label">Key formula</div>
        <div class="formula-value">${t.formula}</div>
      </div>

      <div class="card">
        <div class="card-heading">Worked example</div>
        <div class="example-q">${t.exampleQ}</div>
        ${steps}
      </div>

      <button class="practice-cta" onclick="App.go('practice')">Practice this topic →</button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// PRACTICE — landing + quiz mockup
// ---------------------------------------------------------------------------
function renderPractice() {
  return `
    <div class="section-heading">
      <h1><span class="p">Practice</span> Quizzes</h1>
      <p>Multiple-choice questions to test your skills.</p>
    </div>
    <div class="topics-grid">
      <button class="quiz-topic-card" onclick="App.go('quiz','linear')">
        <div class="quiz-topic-icon purple-bg">📈</div>
        <div class="quiz-topic-title">Linear Equations</div>
        <div class="quiz-topic-meta">10 questions · Multiple choice</div>
        <div class="pill-badge">Start quiz</div>
      </button>
      <button class="quiz-topic-card" onclick="App.go('quiz','quadratic')">
        <div class="quiz-topic-icon gold-bg">⌣</div>
        <div class="quiz-topic-title">Quadratic Functions</div>
        <div class="quiz-topic-meta">10 questions · Multiple choice</div>
        <div class="pill-badge">Start quiz</div>
      </button>
      <button class="quiz-topic-card" onclick="App.go('quiz','system')">
        <div class="quiz-topic-icon green-bg">{ }</div>
        <div class="quiz-topic-title">System of Equations</div>
        <div class="quiz-topic-meta">10 questions · Multiple choice</div>
        <div class="pill-badge">Start quiz</div>
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
      <button class="back-btn" onclick="App.go('practice')">${ICONS.arrowLeft} Exit quiz</button>
      <div class="quiz-header-row">
        <div class="quiz-header-title">${t.title} Quiz</div>
        <div class="quiz-header-count">Question 3 of 10</div>
      </div>
      <div class="progress-track"><div class="progress-fill"></div></div>

      <div class="quiz-card">
        <div class="quiz-question-label">Question</div>
        <div class="quiz-question">${t.question}</div>
        <div class="quiz-options">${options}</div>
        <div class="quiz-actions">
          <button class="quiz-btn-prev">Previous</button>
          <button class="quiz-btn-next">Next →</button>
        </div>
      </div>
      <div class="mockup-note">Preview mockup · answers are not scored</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// GAME — landing + drag&drop / word match mockups
// ---------------------------------------------------------------------------
function renderGame() {
  return `
    <div class="section-heading">
      <h1>Algebra <span class="g">Games</span></h1>
      <p>Learn while you play — pick a game to start.</p>
    </div>
    <div class="games-grid">
      <button class="game-card" onclick="App.go('dragdrop')">
        <div class="game-card-banner dragdrop">
          <div class="dd-chip">slope</div>
          <div class="dd-chip-drop">drop</div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Drag &amp; Drop</div>
          <div class="game-card-desc">Drag each algebra term onto its matching definition.</div>
        </div>
      </button>
      <button class="game-card" onclick="App.go('wordmatch')">
        <div class="game-card-banner wordmatch">
          <div class="wm-stack">
            <div class="wm-chip">Slope</div>
            <div class="wm-chip">Root</div>
          </div>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.5"><path d="M2 12h36M2 28h36" stroke-dasharray="4 4"/></svg>
          <div class="wm-stack">
            <div class="wm-chip">rise/run</div>
            <div class="wm-chip">x-zero</div>
          </div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Word Match</div>
          <div class="game-card-desc">Connect each term on the left to its meaning on the right.</div>
        </div>
      </button>
    </div>
  `;
}

// Preview mockup: interactions are illustrative, matching the design intent.
function renderDragDrop() {
  return `
    <div class="game-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Back to games</button>
      <div class="game-page-header">
        <div class="game-page-title">Drag &amp; Drop</div>
        <div class="stat-badges">
          <div class="stat-badge gold">⭐ Score 20</div>
          <div class="stat-badge purple">⏱ 01:24</div>
        </div>
      </div>

      <div class="dd-card">
        <div class="dd-instructions">Drag a term into the matching box</div>
        <div class="dd-bank">
          <div class="dd-term">y-intercept</div>
          <div class="dd-term">parabola</div>
          <div class="dd-term">coefficient</div>
        </div>
        <div class="dd-targets">
          <div class="dd-target">
            <div class="dd-target-def">The value of y where the line crosses the y-axis</div>
            <div class="dd-drop-zone">drop here</div>
          </div>
          <div class="dd-target filled">
            <div class="dd-target-def">The U-shaped graph of a quadratic</div>
            <div class="dd-drop-zone filled">parabola ✓</div>
          </div>
          <div class="dd-target">
            <div class="dd-target-def">A number multiplied by a variable</div>
            <div class="dd-drop-zone">drop here</div>
          </div>
          <div class="dd-target">
            <div class="dd-target-def">Where a function equals zero</div>
            <div class="dd-drop-zone">drop here</div>
          </div>
        </div>
      </div>
      <div class="mockup-note">Preview mockup · interactions are illustrative</div>
    </div>
  `;
}

function renderWordMatch() {
  return `
    <div class="lesson-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Back to games</button>
      <div class="game-page-header">
        <div class="game-page-title">Word Match</div>
        <div class="stat-badge gold">Matched 2 / 4</div>
      </div>

      <div class="wm-card">
        <div class="wm-instructions">Tap a term, then tap its matching definition</div>
        <div class="wm-columns">
          <div class="wm-col">
            <div class="wm-item matched-green">Slope</div>
            <div class="wm-item matched-purple">Root</div>
            <div class="wm-item term-default">Vertex</div>
            <div class="wm-item term-default">Constant</div>
          </div>
          <div class="wm-col">
            <div class="wm-item matched-purple def-matched">Where the graph crosses the x-axis</div>
            <div class="wm-item def-default">The turning point of a parabola</div>
            <div class="wm-item matched-green def-matched">Steepness, measured as rise over run</div>
            <div class="wm-item def-default">A term with no variable</div>
          </div>
        </div>
      </div>
      <div class="mockup-note">Preview mockup · interactions are illustrative</div>
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
