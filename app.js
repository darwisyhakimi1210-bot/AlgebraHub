/**
 * AlgebraHub — vanilla JS single-page app.
 *
 * How this works (for learning purposes):
 *  - `state` holds the current "page" (view), the selected topic, and the
 *    selected tingkatan (form/year group).
 *  - `go(view, param)` updates state and calls `render()`.
 *  - `render()` looks at state.view and builds the right HTML, then drops
 *    it into the #app element.
 *  - Buttons use inline `onclick="App.go(...)"` so every click is traceable.
 */

// ---------------------------------------------------------------------------
// FRACTION FORMATTER — converts inline "a/b" text into proper stacked
// fractions. The CSS for `.frac` lives in styles.css.
//   "2A/b"            -> <span class="frac"><span class="num">2A</span><span class="den">b</span></span>
//   "(y − c)/x"       -> a fraction with paren-wrapped num/den
//   "((x+1)(x+2))"    -> grouped paren-wrapped num/den (depth 2)
// Multi-pass regex so nested parentheses match the deepest level first.
// ---------------------------------------------------------------------------
function fracFmt(text) {
  if (text == null) return text;
  let s = String(text);

  // ---- Mask URLs / file paths so we never slice them up ----
  // Replace them with invisible placeholders that contain no slash, run the
  // fraction passes, then restore them at the end.
  const MASK = [];
  const MASK_TOKEN = (i) => `\u0001URL${i}\u0001`;
  s = s.replace(
    /\bhttps?:\/\/[^\s)<>]+/gi,
    (m) => { MASK.push(m); return MASK_TOKEN(MASK.length - 1); }
  );
  s = s.replace(
    /\b[a-z0-9][a-z0-9_\-./]*\.(?:png|jpg|jpeg|svg|mp3|wav|gif|webp|css|js|html|json|ico|woff2?|ttf|otf)(?:\?[^\s)<>]*)?/gi,
    (m) => { MASK.push(m); return MASK_TOKEN(MASK.length - 1); }
  );

  // Pass 1: deeply nested parens on both sides  ((a)(b)) / ((c)(d))
  s = s.replace(
    /\(\(([^()]+)\)\)\s*\/\s*\(\(([^()]+)\)\)/g,
    (_, n, d) => `<span class="frac"><span class="num">(${n})</span><span class="den">(${d})</span></span>`
  );

  // Pass 1b: paren-wrapped fraction with slash INSIDE  (a/b)
  //   Lets us turn "(1/det)" into a stacked fraction instead of leaving it
  //   as the ambiguous "1/det" inside parens.
  s = s.replace(
    /\(([^()]+)\/([^()]+)\)/g,
    (m, n, d) => {
      if (/^(https?|ftp|file|data)$/i.test(n) || /^(https?|ftp|file|data)$/i.test(d)) return m;
      return `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`;
    }
  );

  // Pass 2: single parens on BOTH sides  (a + b) / (c - d)
  s = s.replace(
    /\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g,
    (_, n, d) => `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`
  );

  // Pass 3: paren on one side only  (a + b) / c  or  c / (a + b)
  s = s.replace(
    /\(([^()]+)\)\s*\/\s*([A-Za-z0-9⁻⁰¹²³ⁿᵐⁱπ]+)\??\)?/g,
    (_, n, d) => `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`
  );
  s = s.replace(
    /([A-Za-z0-9⁻⁰¹²³ⁿᵐⁱπ]+)\s*\/\s*\(([^()]+)\)/g,
    (_, n, d) => `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`
  );

  // Pass 4: simple a/b with letters, digits, and Unicode math symbols.
  s = s.replace(
    /([A-Za-z][A-Za-z0-9⁻⁰¹²³ⁿᵐⁱπ₀-₉_\-]*|[0-9]+[A-Za-z0-9⁻⁰¹²³ⁿᵐⁱπ_\-]*)\s*\/\s*([A-Za-z0-9⁻⁰¹²³ⁿᵐⁱπ₀-₉][A-Za-z0-9⁻⁰¹²³ⁿᵐⁱπ₀-₉._\-]*)/g,
    (m, n, d) => {
      // Mask tokens like " URL0 " should never be converted
      if (m.includes('\u0001')) return m;
      return `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`;
    }
  );

  // ---- Restore the masked URLs / paths ----
  s = s.replace(/\u0001URL(\d+)\u0001/g, (_, i) => MASK[parseInt(i, 10)]);

  return s;
}

// ---------------------------------------------------------------------------
// applyFractionFormat — walks every text node inside `root` and runs
// fracFmt() on it. After running, inner text like "2A/b" is replaced by
// <span class="frac"><span class="num">2A</span><span class="den">b</span></span>.
// We collect text nodes first so we can mutate the DOM safely.
// ---------------------------------------------------------------------------
function applyFractionFormat(root) {
  if (!root) return;
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        // Skip text already inside a stacked fraction (defensive — fracFmt's
        // output has no slash, so this is a no-op in practice).
        if (parent.classList && (parent.classList.contains('num') || parent.classList.contains('den'))) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue || !node.nodeValue.includes('/')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  const targets = [];
  let n;
  while ((n = walker.nextNode())) targets.push(n);
  for (const node of targets) {
    const parent = node.parentNode;
    if (!parent) continue;
    const converted = fracFmt(node.nodeValue);
    if (converted === node.nodeValue) continue;
    const tmp = document.createElement('span');
    tmp.innerHTML = converted;
    while (tmp.firstChild) parent.insertBefore(tmp.firstChild, node);
    parent.removeChild(node);
  }
}

// ---------------------------------------------------------------------------
// DATA — one entry per topic, organised by Tingkatan below in TINGKATAN_DATA
// ---------------------------------------------------------------------------
const DATA = {
  ungkapan: {
    title: "Ungkapan Algebra",
    bab: "Bab 5",
    tag: "ax + b",
    intro:
      "Ungkapan algebra ialah gabungan nombor, pemboleh ubah (huruf) dan operasi matematik seperti tambah, tolak, darab dan bahagi. Ungkapan algebra digunakan untuk mewakili nilai yang tidak diketahui.",
    formula: "ax+bx=(a+b)x",
    concepts: [
      {
        n: "1",
        title: "Pemboleh Ubah, Pekali dan Pemalar",
        body: "Pemboleh ubah ialah huruf yang mewakili nilai, seperti \(x\) dan \(y\). Pekali ialah nombor yang mendarab pemboleh ubah. Pemalar ialah nombor tanpa pemboleh ubah. Contoh: Dalam \(3x+5\), pekali ialah 3 dan pemalar ialah 5.",
      },
      {
        n: "2",
        title: "Sebutan Serupa dan Sebutan Tidak Serupa",
        body: "Sebutan serupa mempunyai pemboleh ubah dan kuasa yang sama. Contoh: \(2x+4x=6x\). Sebutan tidak serupa tidak boleh digabungkan, contohnya \(2x+3y\).",
      },
      {
        n: "3",
        title: "Operasi Asas Ungkapan Algebra",
        body: "Ungkapan algebra boleh ditambah, ditolak, didarab dan dibahagi mengikut peraturan matematik. Contoh: \(5x-2x=3x\) dan \(3(x+2)=3x+6\).",
      },
    ],
    exampleQ: "Kembangkan dan permudahkan 3(2x + 4) − 2x.",
    exampleSteps: [
      { label: "Langkah 1", text: "Kembangkan kurungan: 3(2x + 4) = 6x + 12" },
      { label: "Langkah 2", text: "Kumpul sebutan serupa: 6x − 2x = 4x" },
      { label: "Jawapan", text: "4x + 12" },
    ],
    question: "Kembangkan 3(2x − 5).",
    opts: ["6x + 15", "6x − 15", "5x − 15", "6x − 8"],
    icon: "ax",
    iconClass: "blue-bg",
  },
  rumus: {
    title: "Rumus Algebra",
    bab: "Bab 3",
    tag: "S = ...",
    intro:
      "Rumus algebra ialah persamaan yang menghubungkan beberapa pemboleh ubah. Perkara rumus ialah pemboleh ubah yang bersendirian di satu sisi dengan pekali 1. Menukar perkara rumus bermaksud mengasingkan pemboleh ubah berbeza sebagai subjek baharu.",
    formula: "p= mx + c",
    concepts: [
      {
        n: "1",
        title: "Perkara Rumus",
        body: "Perkara rumus: hanya ada 1 pemboleh ubah di hadapan, pekalinya ialah 1. Contoh: dalam y = mx + c, y ialah perkara rumus.",
      },
      {
        n: "2",
        title: "Kaedah 'Pindah'",
        body: "Pindahkan semua sebutan lain menjauhi perkara rumus baharu. Apabila pindah kawasan, mesti tukar operasi: (+↔−) dan (×↔÷).",
      },
      {
        n: "3",
        title: "Menentukan Nilai Pemboleh Ubah",
        body: "Setelah mendapat rumus, gantikan nilai yang diberi untuk mendapat jawapan. Semak dengan gantikan semula ke rumus asal.",
      },
    ],
    exampleQ: "Diberi y = mx + c. Ungkapkan m sebagai perkara rumus.",
    exampleSteps: [
      { label: "Langkah 1", text: "Pindah c: y − c = mx" },
      { label: "Langkah 2", text: "Bahagi dengan x: m = (y − c) / x" },
      { label: "Jawapan", text: "m = (y − c) / x" },
    ],
    question: "Diberi A = ½bh, ungkapkan h sebagai perkara rumus.",
    opts: ["h = A/2b", "h = 2A/b", "h = Ab/2", "h = 2b/A"],
    icon: "S=",
    iconClass: "blue-bg",
  },
  linear: {
    title: "Garis Lurus",
    bab: "Bab 9",
    tag: "y = mx + c",
    intro:
      "Garis lurus boleh diwakilkan pada satah Cartesan menggunakan persamaan yang menghubungkan koordinat \(x\) dan \(y\).",
    formula: "y = mx + c  ,  m = (y₂ − y₁) / (x₂ − x₁)",
    concepts: [
      {
        n: "1",
        title: "Persamaan Garis Lurus",
        body: "Persamaan garis lurus boleh ditulis dalam bentuk \(y=mx+c\), dengan \(m\) ialah kecerunan dan \(c\) ialah pintasan paksi-\(y\)",
      },
      {
        n: "2",
        title: "Kecerunan Garis Lurus",
        body: "Pintasan-y ialah nilai y apabila x = 0 — tempat garis memotong paksi-y. Pintasan-x ialah nilai x apabila y = 0 — tempat garis memotong paksi-x.",
      },
      {
        n: "3",
        title: "Melukis dan Mentafsir Graf Garis Lurus",
        body: "Gunakan beberapa pasangan koordinat yang memenuhi persamaan, plot titik pada satah Cartesan dan sambungkan titik menggunakan garis lurus.",
      },
    ],
    exampleQ: "Cari kecerunan garis melalui titik (1, 2) dan (3, 8).",
    exampleSteps: [
      { label: "Langkah 1", text: "m = (y₂ − y₁) / (x₂ − x₁)" },
      { label: "Langkah 2", text: "m = (8 − 2) / (3 − 1) = 6 / 2" },
      { label: "Jawapan", text: "m = 3" },
    ],
    question: "Apakah kecerunan garis y = 4x − 7?",
    opts: ["−7", "4", "7", "−4"],
    icon: "📈",
    iconClass: "purple-bg",
  },
  ketaksamaan: {
    title: "Ketaksamaan Linear",
    bab: "Bab 6",
    tag: "a < x < b",
    intro:
      "Ketaksamaan linear menunjukkan julat nilai yang mungkin bagi pemboleh ubah. Diselesaikan dengan kaedah 'pindah'  sama seperti persamaan linear  tetapi ada 1 peraturan istimewa: tanda TERBALIK apabila darab atau bahagi dengan nombor NEGATIF.",
    formula: "ax+by\leq c",
    concepts: [
      {
        n: "1",
        title: "Mewakilkan ketaksamaan Linear",
        body: "Ketaksamaan linear menggunakan simbol seperti \(<\), \(>\), \(\leq\) dan \(\geq\). Contoh: \(y\leq2x+3\).",
      },
      {
        n: "2",
        title: "Melukis Garis Sempadan dan Rantau",
        body: "Garis penuh digunakan bagi simbol \(\leq\) atau \(\geq\), manakala garis putus-putus digunakan bagi simbol \(<\) atau \(>\). Lorek rantau yang memenuhi ketaksamaan.",
      },
      {
        n: "3",
        title: "Sistem Ketaksamaan Linear",
        body: "Sistem ketaksamaan linear menggabungkan dua atau lebih ketaksamaan. Rantau penyelesaian ialah kawasan yang memenuhi semua ketaksamaan tersebut.",
      },
    ],
    exampleQ: "Selesaikan 7y − 4 < 15 dan senaraikan nilai y.",
    exampleSteps: [
      { label: "Langkah 1", text: "7y < 15 + 4 = 19  →  y < 19/7" },
      { label: "Langkah 2", text: "Hmm, cuba contoh mudah: 2x + 5 < 11  →  2x < 6" },
      { label: "Jawapan", text: "x < 3  (senaraikan: x = 2, 1, 0, −1, ...)" },
    ],
    question: "Selesaikan 3x − 6 > 9.",
    opts: ["x > 1", "x > 5", "x > 3", "x < 5"],
    icon: "<>",
    iconClass: "green-bg",
  },
  indeks: {
    title: "Indeks",
    bab: "Bab 1",
    tag: "aᵐ × aⁿ",
    intro:
      "Indeks ialah cara ringkas untuk menulis pendaraban berulang bagi nombor yang sama. Indeks terdiri daripada asas dan kuasa.",
    formula: "aᵐ × aⁿ = aᵐ⁺ⁿ  |  aᵐ ÷ aⁿ = aᵐ⁻ⁿ  |  (aᵐ)ⁿ = aᵐⁿ",
    concepts: [
      {
        n: "1",
        title: "Asas dan Indeks",
        body: "Asas ialah nombor yang didarab berulang kali, manakala indeks menunjukkan bilangan pendaraban. Contoh: \(2^3=2\times2\times2=8\).",
      },
      {
        n: "2",
        title: "Hukum Indeks",
        body: "a⁰ = 1 untuk semua a ≠ 0. a⁻ⁿ = 1/aⁿ — indeks negatif bermaksud songsang (pecahan). Contoh: 2⁻³ = 1/2³ = 1/8.",
      },
      {
        n: "3",
        title: "Indeks sifar dan Indeks Negatif",
        body: "a^(1/n) = ⁿ√a (punca ke-n). a^(m/n) = ⁿ√aᵐ. Contoh: 8^(2/3) = ³√8² = ³√64 = 4. Indeks pecahan bermaksud punca dan kuasa.",
      },
    ],
    exampleQ: "Permudahkan 5² ÷ 5⁴.",
    exampleSteps: [
      { label: "Langkah 1", text: "Asas sama (5), tolak indeks: 2 − 4 = −2" },
      { label: "Langkah 2", text: "5⁻² = 1/5² = 1/25" },
      { label: "Jawapan", text: "5⁻² atau 1/25" },
    ],
    question: "Permudahkan 5² ÷ 5⁴.",
    opts: ["5⁶", "5⁻²", "5²", "25"],
    icon: "aⁿ",
    iconClass: "green-bg",
  },
  quadratic: {
    title: "Fungsi Kuadratik",
    bab: "Bab 1",
    tag: "ax² + bx + c",
    intro:
      "Fungsi kuadratik ialah f(x) = ax² + bx + c di mana a ≠ 0. Grafnya berbentuk parabola. Nilai a menentukan bentuk graf, nilai b menentukan kedudukan paksi simetri, dan nilai c menentukan pintasan-y.",
    formula: "f(x) = ax² + bx + c  ,  ax² + bx + c = 0",
    concepts: [
      {
        n: "1",
        title: "Bentuk Graf & Titik Pusingan",
        body: "a > 0: parabola terbuka ke ATAS, ada titik MINIMUM. a < 0: parabola terbuka ke BAWAH, ada titik MAKSIMUM. Nilai c ialah pintasan-y (titik persilangan dengan paksi-y).",
      },
      {
        n: "2",
        title: "Paksi Simetri",
        body: "Paksi simetri membelah parabola menjadi dua bahagian sama. Kedudukan paksi simetri ditentukan oleh nilai b. Titik pusingan (minimum/maksimum) terletak pada paksi simetri.",
      },
      {
        n: "3",
        title: "Mencari Punca (Penyelesaian)",
        body: "Punca ialah nilai x di mana f(x) = 0. Kaedah: (1) Pemfaktoran — cari dua nombor yang darab = c dan tambah = b. (2) Kalkulator: tekan MODE → EQN → DEGREE 2.",
      },
    ],
    exampleQ: "Selesaikan x² − 6x + 8 = 0 dengan pemfaktoran.",
    exampleSteps: [
      { label: "Langkah 1", text: "Cari dua nombor: darab = 8, tambah = −6 → (−4) dan (−2)" },
      { label: "Langkah 2", text: "Faktorkan: (x − 4)(x − 2) = 0" },
      { label: "Jawapan", text: "x = 4  atau  x = 2" },
    ],
    question: "Berapa banyak punca nyata bagi x² − 5x + 6 = 0?",
    opts: ["0", "1", "2", "3"],
    icon: "⌣",
    iconClass: "gold-bg",
  },
  fungsi: {
    title: "Fungsi dan Persamaan Kuadratik dalam Satu Pemboleh Ubah",
    bab: "Bab 1",
    tag: "f(x), f⁻¹(x)",
    intro:
      "Fungsi dan persamaan kuadratik melibatkan ungkapan yang mempunyai kuasa tertinggi dua bagi pemboleh ubah. Graf fungsi kuadratik berbentuk parabola.",
    formula: "ax² + bx + c = 0",
    concepts: [
      {
        n: "1",
        title: "Bentuk Am Fungsi Kuadratik",
        body: "Bentuk am fungsi kuadratik ialah \(f(x)=ax² + bx + c\), dengan \(a\neq0\). Nilai \(a\), \(b\) dan \(c\) ialah pemalar.",
      },
      {
        n: "2",
        title: "Graf Fungsi Kuadratik",
        body: "Graf fungsi kuadratik berbentuk parabola. Jika \(a>0\), graf membuka ke atas. Jika \(a<0\), graf membuka ke bawah.",
      },
      {
        n: "3",
        title: "Menyelesaikan Persamaan Kuadratik",
        body: "f⁻¹(x) membalikkan tindakan f. Cara cari: (1) Tulis y = f(x). (2) Ungkapkan x sebagai perkara rumus. (3) Tukar simbol x dan y. Semak: ff⁻¹(x) = x.",
      },
    ],
    exampleQ: "Diberi f(x) = 2x + 1 dan g(x) = x², cari fg(3).",
    exampleSteps: [
      { label: "Langkah 1", text: "Kira g(3) dahulu: g(3) = 3² = 9" },
      { label: "Langkah 2", text: "Masukkan ke f: f(9) = 2(9) + 1 = 19" },
      { label: "Jawapan", text: "fg(3) = 19" },
    ],
    question: "Diberi f(x) = x + 3, cari f⁻¹(x).",
    opts: ["x + 3", "x − 3", "3 − x", "3x"],
    icon: "f(x)",
    iconClass: "purple-bg",
  },
  system: {
    title: "Persamaan Linear Serentak",
    bab: "—",
    tag: "{ x , y }",
    intro:
      "Persamaan linear serentak ialah dua persamaan yang mempunyai dua pemboleh ubah (x dan y). Terdapat 3 kaedah penyelesaian: kaedah penghapusan, kaedah penggantian, dan kalkulator (EQN, Unknowns 2).",
    formula: "3 Kaedah: Penghapusan | Penggantian | Kalkulator EQN",
    concepts: [
      {
        n: "1",
        title: "Kaedah Penghapusan",
        body: "Darab salah satu persamaan supaya pekali satu pemboleh ubah menjadi sama. Kemudian tambah atau tolak kedua-dua persamaan untuk menghapuskan pemboleh ubah tersebut.",
      },
      {
        n: "2",
        title: "Kaedah Penggantian",
        body: "Pilih salah satu persamaan dan jadikannya perkara rumus untuk satu pemboleh ubah. Kemudian gantikan ke dalam persamaan yang satu lagi.",
      },
      {
        n: "3",
        title: "Kalkulator: EQN, Unknowns 2",
        body: "Tekan MODE → EQN → Unknowns? pilih 2. Masukkan nilai a₁, b₁, c₁ (baris pertama) dan a₂, b₂, c₂ (baris kedua). Kalkulator beri jawapan x dan y terus.",
      },
    ],
    exampleQ: "Selesaikan: x − 3y = 7 dan 5x + 2y = 1.",
    exampleSteps: [
      { label: "Kaedah Penghapusan", text: "Darab persamaan 1 dengan 5: 5x − 15y = 35. Tolak: −17y = 34, maka y = −2." },
      { label: "Cari x", text: "Gantikan y = −2 ke persamaan 1: x − 3(−2) = 7, x = 1." },
      { label: "Jawapan", text: "x = 1, y = −2" },
    ],
    question: "Selesaikan: x + y = 5, x − y = 1. Apakah nilai x?",
    opts: ["2", "3", "4", "5"],
    icon: "{ }",
    iconClass: "green-bg",
  },
  ubahan: {
    title: "Ubahan",
    bab: "Bab 1",
    tag: "y ∝ x",
    intro:
      "Ubahan menerangkan hubungan antara dua atau lebih kuantiti, iaitu bagaimana perubahan satu kuantiti mempengaruhi kuantiti yang lain.",
    formula: "y = kx  (ubahan langsung)  |  y = k/x  (ubahan songsang)",
    concepts: [
      {
        n: "1",
        title: "Ubahan Langsung",
        body: "y ∝ x → y = kx. Graf: garis lurus melalui asalan. Apabila x bertambah, y bertambah pada kadar yang sama. Cari k dengan menggantikan nilai y dan x yang diberi.",
      },
      {
        n: "2",
        title: "Ubahan Songsang",
        body: "y ∝ 1/x → y = k/x → xy = k (sentiasa). Apabila x bertambah, y berkurang. Graf: lengkung hiperbola. Cari k: k = xy.",
      },
      {
        n: "3",
        title: "Ubahan Tercantum & Bergabung",
        body: "Tercantum: y ∝ xⁿ → y = kxⁿ. Bergabung: melibatkan dua pemboleh ubah atau lebih. Contoh: z ∝ xy → z = kxy. Sentiasa cari k dahulu, kemudian selesaikan.",
      },
    ],
    exampleQ: "y berubah langsung dengan x. Jika y = 12 apabila x = 4, cari y apabila x = 7.",
    exampleSteps: [
      { label: "Langkah 1", text: "Cari k: k = y/x = 12/4 = 3" },
      { label: "Langkah 2", text: "Tulis persamaan: y = 3x" },
      { label: "Jawapan", text: "y = 3 × 7 = 21" },
    ],
    question: "y berubah songsang dengan x. Jika y = 8 apabila x = 3, cari y apabila x = 6.",
    opts: ["16", "4", "24", "6"],
    icon: "∝",
    iconClass: "red-bg",
  },
  matriks: {
    title: "Matriks",
    bab: "Bab 2",
    tag: "[A][B]",
    intro:
      "Matriks ialah susunan nombor dalam baris dan lajur. Matriks digunakan untuk menyusun maklumat dan menyelesaikan masalah matematik dengan lebih sistematik.",
    formula: "AI = IA = A",
    concepts: [
      {
        n: "1",
        title: "Pengenalan kepada Matriks",
        body: "Matriks mempunyai baris dan lajur. Peringkat matriks ditulis sebagai bilangan baris × bilangan lajur.",
      },
      {
        n: "2",
        title: "Penambahan dan Penolakan Matriks",
        body: "Matriks boleh ditambah atau ditolak jika mempunyai peringkat yang sama. Operasi dilakukan terhadap unsur yang sepadan.",
      },
      {
        n: "3",
        title: "Pendaraban Matriks",
        body: "Pendaraban matriks dengan nombor melibatkan pendaraban setiap unsur dengan nombor tersebut. Pendaraban dua matriks pula memerlukan bilangan lajur matriks pertama sama dengan bilangan baris matriks kedua.",
      },
    ],
    exampleQ: "Cari penentu matriks [[3, 1], [2, 4]].",
    exampleSteps: [
      { label: "Langkah 1", text: "det = (a × d) − (b × c) = (3 × 4) − (1 × 2)" },
      { label: "Langkah 2", text: "det = 12 − 2" },
      { label: "Jawapan", text: "det = 10  (matriks songsang WUJUD)" },
    ],
    question: "Cari penentu matriks [[3, 1], [2, 4]].",
    opts: ["12", "10", "14", "8"],
    icon: "[]",
    iconClass: "red-bg",
  },
  persamaan_linear: {
    title: "Persamaan Linear",
    bab: "Bab 6",
    tag: "ax = b",
    intro:
      "Persamaan linear ialah persamaan matematik yang mengandungi pemboleh ubah dengan kuasa tertinggi satu. Persamaan ini diselesaikan dengan mencari nilai pemboleh ubah yang menjadikan kedua-dua belah persamaan sama.",
    formula: "ax + b = c  →  x = (c − b) / a",
    concepts: [
      {
        n: "1",
        title: "Memahami Persamaan Linear",
        body: "Persamaan linear mempunyai tanda sama dengan (\(=\)) dan pemboleh ubah. Contoh: \(2x+3=9\). Matlamatnya ialah mencari nilai \(x\) yang memenuhi persamaan tersebut.",
      },
      {
        n: "2",
        title: "Menyelesaikan Persamaan Linear",
        body: "Gunakan operasi songsang untuk mencari nilai pemboleh ubah, contohnya \(x+4=10\), maka \(x=10-4=6\).",
      },
      {
        n: "3",
        title: "Menyelesaikan Persamaan dengan Operasi Darab dan Bahagi",
        body: "Asingkan pemboleh ubah menggunakan operasi songsang, contohnya \(3x=12\), maka \(x=\{12}/{3}=4\).",
      },
    ],
    exampleQ: "Selesaikan 5x − 7 = 23.",
    exampleSteps: [
      { label: "Langkah 1", text: "Tambah 7 pada kedua-dua belah: 5x = 30" },
      { label: "Langkah 2", text: "Bahagikan dengan 5: x = 6" },
      { label: "Jawapan", text: "x = 6" },
    ],
    question: "Selesaikan 4x + 3 = 19.",
    opts: ["x = 3", "x = 4", "x = 5", "x = 6"],
    icon: "ax=c",
    iconClass: "blue-bg",
  },
  pemfaktoran: {
    title: "Pemfaktoran & Pecahan Algebra",
    bab: "Bab 2",
    tag: "FST, 1/x",
    intro:
      "Pemfaktoran ialah proses mencari faktor ungkapan. Pecahan algebra pula menggunakan prinsip yang sama seperti pecahan nombor — keluar masuk faktor sepunya untuk mudahkan.",
    formula: "ab + ac = a(b + c)   |   (a/b) ÷ (c/d) = ad / bc",
    concepts: [
      {
        n: "1",
        title: "Faktor Sepunya Terbesar (FST)",
        body: "Cari nombor atau pemboleh ubah terbesar yang boleh membahagikan semua sebutan. Contoh: 6x² + 9x → FST = 3x. Faktorkan: 3x(2x + 3).",
      },
      {
        n: "2",
        title: "Pemfaktoran Kuadratik",
        body: "Untuk ax² + bx + c, cari dua nombor yang darab = ac dan tambah = b. Tulis semula, kemudian kumpulkan dan faktorkan. Contoh: x² − 7x + 12 = (x − 3)(x − 4).",
      },
      {
        n: "3",
        title: "Pecahan Algebra — Tambah & Tolak",
        body: "Cari LCM penyebut, darab untuk samakan, kemudian gabungkan pengangka. Contoh: 2/(x+1) + 3/(x+2) = [2(x+2) + 3(x+1)] / [(x+1)(x+2)].",
      },
    ],
    exampleQ: "Faktorkan x² − 7x + 12.",
    exampleSteps: [
      { label: "Langkah 1", text: "Cari dua nombor: darab = 12, tambah = −7 → (−3) dan (−4)" },
      { label: "Langkah 2", text: "Tulis: x² − 3x − 4x + 12" },
      { label: "Langkah 3", text: "Kumpulan: x(x − 3) − 4(x − 3) = (x − 3)(x − 4)" },
      { label: "Jawapan", text: "(x − 3)(x − 4) = 0  →  x = 3 atau x = 4" },
    ],
    question: "Faktorkan x² − 5x + 6.",
    opts: ["(x − 1)(x − 6)", "(x − 2)(x − 3)", "(x + 2)(x + 3)", "(x − 3)(x + 2)"],
    icon: "FST",
    iconClass: "blue-bg",
  },
};

// ---------------------------------------------------------------------------
// TINGKATAN — maps each school year group to its list of topics
// ---------------------------------------------------------------------------
const TINGKATAN_DATA = [
  {
    id: "1",
    label: "Ungkapan Algebra & Persamaan Linear",
    subtitle: "Bab 5 & 6",
    banner: "Tingkatan 1",
    colorClass: "blue",
    topics: ["ungkapan", "persamaan_linear"],
  },
  {
    id: "2",
    label: "Pemfaktoran Algebra & Rumus Algebra",
    subtitle: "Bab 2 & 3",
    banner: "Tingkatan 2",
    colorClass: "blue",
    topics: ["pemfaktoran", "rumus"],
  },
  {
    id: "3",
    label: "Indeks & Garis Lurus",
    subtitle: "Bab 1 & 9",
    banner: "Tingkatan 3",
    colorClass: "green",
    topics: ["indeks", "linear"],
  },
  {
    id: "4",
    label: "Fungsi dan Persamaan Kuadratik & Ketaksamaan Linear",
    subtitle: "Bab 1 & 6",
    banner: "Tingkatan 4",
    colorClass: "purple",
    // Bab 1 = Fungsi & Persamaan Kuadratik (both `quadratic` & `fungsi`)
    // Bab 6 = Ketaksamaan Linear
    topics: [ "fungsi", "ketaksamaan"],
  },
  {
    id: "5",
    label: "Ubahahan & Matriks",
    subtitle: "Bab 1 & 2",
    banner: "Tingkatan 5",
    colorClass: "red",
    topics: ["ubahan", "matriks"],
  },
];

// ---------------------------------------------------------------------------
// VIDEO DATA — fill in YouTube embed URLs when ready (null = coming soon)
// ---------------------------------------------------------------------------
const VIDEO_DATA = {
  ungkapan:        null,
  persamaan_linear: null,
  pemfaktoran:     null,
  rumus:           null,
  linear:          null,
  ketaksamaan:     null,
  indeks:          null,
  quadratic:       null,
  fungsi:          null,
  system:          null,
  ubahan:          null,
  matriks:         null,
};

// ---------------------------------------------------------------------------
// SOUND FX — Web Audio API synthesizer (no external files needed)
// ---------------------------------------------------------------------------
const SFX = (() => {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };
  return {
    correct() {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(523, c.currentTime);
      o.frequency.setValueAtTime(659, c.currentTime + 0.1);
      o.frequency.setValueAtTime(784, c.currentTime + 0.2);
      g.gain.setValueAtTime(0.35, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
      o.start(c.currentTime); o.stop(c.currentTime + 0.5);
    },
    wrong() {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200, c.currentTime);
      o.frequency.setValueAtTime(150, c.currentTime + 0.15);
      g.gain.setValueAtTime(0.25, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
      o.start(c.currentTime); o.stop(c.currentTime + 0.4);
    },
    success() {
      const c = getCtx();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        const t = c.currentTime + i * 0.18;
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.start(t); o.stop(t + 0.4);
      });
    }
  };
})();

// ---------------------------------------------------------------------------
// QUIZ DATA — extra questions per topic beyond what's in DATA.opts
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// QUIZ DATA â€” based on user's 10-page notes (2026)
// Page 1: Ungkapan Algebra + Kuasa Dua + Nisbah Kadaran
// Pages 2-10: full topic questions
// ---------------------------------------------------------------------------
const QUIZ_QUESTIONS = {
  // PAGE 1: Ungkapan Algebra (Bab 5)
  ungkapan: [
    { q: "Kembangkan 3(2x âˆ’ 5).", opts: ["6x + 15","6x âˆ’ 15","5x âˆ’ 15","6x âˆ’ 8"], ans: 1 },
    { q: "Kembangkan 4(x + 3).", opts: ["4x + 12","4x + 7","x + 12","4x + 3"], ans: 0 },
    { q: "Faktorkan 6x + 9.", opts: ["3(2x + 3)","2(3x + 4)","6(x + 9)","3(2x âˆ’ 3)"], ans: 0 },
    { q: "Kembangkan 2(5x âˆ’ 1).", opts: ["10x + 2","10x âˆ’ 2","7x âˆ’ 1","10x âˆ’ 1"], ans: 1 },
    { q: "Faktorkan 8x + 12.", opts: ["4(2x + 3)","2(4x + 6)","8(x + 1)","4(2x âˆ’ 3)"], ans: 0 },
    { q: "Kembangkan 5(2x + 3y).", opts: ["10x + 3y","10x + 15y","7x + 3y","10x âˆ’ 15y"], ans: 1 },
    { q: "Faktorkan 12x âˆ’ 18.", opts: ["6(2x âˆ’ 3)","3(4x âˆ’ 6)","4(3x âˆ’ 4)","12(x âˆ’ 2)"], ans: 0 },
    { q: "Kembangkan 3(4x + 2).", opts: ["12x + 6","7x + 2","12x + 2","12x âˆ’ 6"], ans: 0 },
    { q: "Faktorkan 5x + 10.", opts: ["5(x + 2)","5(x + 10)","x(x + 10)","5(x âˆ’ 2)"], ans: 0 },
    { q: "Kembangkan âˆ’2(3x + 4).", opts: ["âˆ’6x + 8","âˆ’6x âˆ’ 8","6x âˆ’ 8","âˆ’6x + 4"], ans: 1 },
    { q: "Faktorkan 6xÂ² + 9x.", opts: ["3x(2x + 3)","3(2xÂ² + 3x)","6x(x + 9)","x(6x + 9)"], ans: 0 },
    { q: "Kembangkan 7(2x âˆ’ 3).", opts: ["14x âˆ’ 21","14x + 21","9x âˆ’ 21","14x âˆ’ 3"], ans: 0 },
    { q: "Faktorkan 14x + 21.", opts: ["7(2x + 3)","7(2x âˆ’ 3)","14(x + 21)","3(4x + 7)"], ans: 0 },
    { q: "Kembangkan x(x + 4).", opts: ["xÂ² + 4x","xÂ² + 4","2x + 4","xÂ² + x + 4"], ans: 0 },
    { q: "Faktorkan xÂ² + 7x + 12.", opts: ["(x+3)(x+4)","(x+2)(x+5)","(x+1)(x+12)","(x+6)(x+2)"], ans: 0 },
    { q: "Kembangkan 2x(x âˆ’ 5).", opts: ["2xÂ² âˆ’ 10x","2xÂ² + 10x","2x âˆ’ 10x","xÂ² âˆ’ 10x"], ans: 0 },
    { q: "Faktorkan 4x + 8.", opts: ["4(x + 2)","2(2x + 4)","4(x + 8)","8(x + 1)"], ans: 0 },
    { q: "Kembangkan 3(2x + 5) âˆ’ x.", opts: ["5x + 15","6x + 15","5x âˆ’ 15","6x âˆ’ 5"], ans: 0 },
    { q: "Punca kuasa dua sempurna seterusnya selepas 36.", opts: ["49","45","48","42"], ans: 0 },
    { q: "3Â² + 4Â² = ?", opts: ["25","7","12","49"], ans: 0 },
    { q: "Kuasa dua sempurna: 1, 4, 9, 16, 25, ?", opts: ["36","35","32","49"], ans: 0 },
    { q: "Kuasa tiga sempurna: 1, 8, 27, 64, ?", opts: ["125","100","121","216"], ans: 0 },
    { q: "1Â² = ?", opts: ["1","2","0","âˆ’1"], ans: 0 },
    { q: "4Â³ = ?", opts: ["64","12","43","48"], ans: 0 },
    { q: "âˆš144 = ?", opts: ["12","11","14","13"], ans: 0 },
    { q: "Â³âˆš27 = ?", opts: ["3","9","6","2"], ans: 0 },
  ],

  // PAGE 2: Persamaan Linear (Bab 6) â€” satu pemboleh ubah
  persamaan_linear: [
    { q: "Selesaikan: x âˆ’ 8 = 2.", opts: ["x = 6","x = 10","x = âˆ’6","x = 16"], ans: 1 },
    { q: "Selesaikan: 5x + 3 = 18.", opts: ["x = 2","x = 3","x = 4","x = 5"], ans: 1 },
    { q: "Selesaikan: 3x âˆ’ 2 = 5x.", opts: ["x = âˆ’1","x = 1","x = 2","x = âˆ’2"], ans: 0 },
    { q: "Selesaikan: 2(x + 3) = 10.", opts: ["x = 2","x = 4","x = 1","x = 5"], ans: 0 },
    { q: "Lily beli 5 pen RM y sebatang dan buku RM3. Jumlah RM7. Bentukkan.", opts: ["5y + 3 = 7","y + 3 = 7","5y = 7","5 + 3y = 7"], ans: 0 },
    { q: "Selesaikan: (5x + 8)/2 = 9.", opts: ["x = 2","x = 10","x = 1","x = 5"], ans: 0 },
    { q: "Selesaikan: 4x âˆ’ 7 = 3x + 5.", opts: ["x = 12","x = âˆ’12","x = 2","x = 1"], ans: 0 },
    { q: "Selesaikan: 7 âˆ’ 2x = 3.", opts: ["x = 2","x = âˆ’2","x = 5","x = âˆ’5"], ans: 0 },
    { q: "Selesaikan: 6x + 1 = 4x + 9.", opts: ["x = 4","x = 3","x = 2","x = 1"], ans: 0 },
    { q: "Selesaikan: x/3 + 2 = 7.", opts: ["x = 12","x = 15","x = 9","x = 6"], ans: 0 },
    { q: "Selesaikan: 5x = 35.", opts: ["x = 7","x = 5","x = 6","x = 8"], ans: 0 },
    { q: "Selesaikan: 8 âˆ’ 3x = 2.", opts: ["x = 2","x = âˆ’2","x = 3","x = 1"], ans: 0 },
    { q: "Selesaikan: 2x + 4 = x âˆ’ 3.", opts: ["x = âˆ’7","x = 7","x = âˆ’3","x = 3"], ans: 0 },
    { q: "Selesaikan: 3(x âˆ’ 2) = 12.", opts: ["x = 6","x = 4","x = 2","x = 8"], ans: 0 },
    { q: "Selesaikan: 4x + 5 = 2x + 11.", opts: ["x = 3","x = 2","x = 4","x = 1"], ans: 0 },
    { q: "Suatu nombor ditolak dengan 8, bakinya 2. Bentukkan.", opts: ["x âˆ’ 8 = 2","8 âˆ’ x = 2","x + 8 = 2","x/8 = 2"], ans: 0 },
    { q: "Selesaikan: 2x âˆ’ 3 = 5.", opts: ["x = 4","x = 3","x = 2","x = 1"], ans: 0 },
    { q: "Selesaikan: 9x âˆ’ 2 = 7x + 4.", opts: ["x = 3","x = 2","x = 1","x = 4"], ans: 0 },
    { q: "Selesaikan: 3(x + 1) = 2(x + 4).", opts: ["x = 5","x = 3","x = 2","x = 1"], ans: 0 },
  ],

  // PAGE 2: Persamaan Linear Serentak
  system: [
    { q: "Selesaikan: x + y = 5, x âˆ’ y = 1. Nilai x?", opts: ["2","3","4","5"], ans: 1 },
    { q: "Selesaikan: x âˆ’ 3y = 7 dan 5x + 2y = 1. Nilai y?", opts: ["âˆ’2","2","âˆ’1","1"], ans: 0 },
    { q: "Selesaikan: 2x + y = 7 dan x âˆ’ y = 2.", opts: ["x=3, y=1","x=2, y=3","x=1, y=5","x=4, y=âˆ’1"], ans: 0 },
    { q: "Kaedah ketiga selesaikan persamaan linear serentak?", opts: ["Kalkulator EQN","Pemfaktoran","Graf","Substitusi"], ans: 0 },
    { q: "Selesaikan: x + 2y = 6 dan 2x âˆ’ y = 3.", opts: ["x=3, y=1.5","x=2, y=2","x=4, y=1","x=1, y=2"], ans: 0 },
    { q: "Sistem x + y = 5 dan 2x + 2y = 10 mempunyai...", opts: ["Infiniti penyelesaian","Satu penyelesaian","Tiada penyelesaian","Dua penyelesaian"], ans: 0 },
    { q: "Selesaikan: 3x + 4y = 16 dan x = 2y.", opts: ["x=4, y=2","x=6, y=3","x=2, y=4","x=8, y=1"], ans: 0 },
    { q: "Darab persamaan pertama dengan 5 untuk selesaikan: 2x âˆ’ 3y = 7 dan 5x + 2y = 1.", opts: ["10x âˆ’ 15y = 35","10x + 15y = 35","10x âˆ’ 15y = âˆ’35","7x âˆ’ 15y = 35"], ans: 0 },
    { q: "Kaedah penghapusan digunakan untuk...", opts: ["Hapuskan satu pemboleh ubah","Darab kedua-dua persamaan","Faktorkan persamaan","Lukis graf"], ans: 0 },
    { q: "Kaedah penggantian â€” langkah pertama...", opts: ["Jadikan satu pemboleh ubah perkara rumus","Darab kedua-dua persamaan","Tolak kedua-dua persamaan","Cari pintasan"], ans: 0 },
    { q: "Selesaikan: 4x + 3y = 17 dan x = 3.", opts: ["x=3, y=1.67","x=3, y=2","x=3, y=5","x=3, y=3"], ans: 0 },
    { q: "Jika x = 7 + 3y, gantikan ke 2x + y = 1. Nilai y?", opts: ["y = âˆ’2","y = 2","y = âˆ’1","y = 1"], ans: 0 },
    { q: "Selesaikan: x + y = 8 dan x âˆ’ y = 4.", opts: ["x=6, y=2","x=5, y=3","x=4, y=4","x=7, y=1"], ans: 0 },
    { q: "Selesaikan: 3x + 2y = 12 dan x = 2.", opts: ["x=2, y=3","x=2, y=2","x=2, y=6","x=2, y=1"], ans: 0 },
    { q: "Kalkulator EQN Unknowns 2 â€” cara masukkan?", opts: ["MODE â†’ EQN â†’ Unknowns 2","MODE â†’ CALC â†’ 2","MODE â†’ GRAPH â†’ 2","SHIFT â†’ SOLVE â†’ 2"], ans: 0 },
  ],

  // PAGE 3: Pemfaktoran & Pecahan Algebra (Bab 2)
  pemfaktoran: [
    { q: "Faktorkan xÂ² âˆ’ 5x + 6.", opts: ["(xâˆ’2)(xâˆ’3)","(xâˆ’1)(xâˆ’6)","(x+2)(x+3)","(xâˆ’3)(x+2)"], ans: 0 },
    { q: "Faktorkan xÂ² âˆ’ 9.", opts: ["(xâˆ’3)(x+3)","(xâˆ’9)(x+1)","(xâˆ’3)Â²","(x+3)Â²"], ans: 0 },
    { q: "Faktorkan 2xÂ² + 6x.", opts: ["2x(x+3)","x(2x+6)","2(xÂ²+3x)","(2x+6)(x)"], ans: 0 },
    { q: "Faktorkan xÂ² + 4x + 4.", opts: ["(x+2)Â²","(x+1)(x+4)","(x+2)(xâˆ’2)","(x+4)(x+1)"], ans: 0 },
    { q: "FST bagi 12x + 18.", opts: ["6","3","2","12"], ans: 0 },
    { q: "Faktorkan xÂ² âˆ’ 4x âˆ’ 12.", opts: ["(xâˆ’6)(x+2)","(xâˆ’3)(x+4)","(x+6)(xâˆ’2)","(xâˆ’2)(x+6)"], ans: 0 },
    { q: "Faktorkan 3xÂ² + 9x.", opts: ["3x(x+3)","3(xÂ²+3x)","x(3x+9)","(3x+3)(x+3)"], ans: 0 },
    { q: "Faktorkan xÂ² + 6x + 8.", opts: ["(x+2)(x+4)","(x+1)(x+8)","(x+3)(x+3)","(x+8)(xâˆ’1)"], ans: 0 },
    { q: "FST bagi 8xÂ² âˆ’ 12x.", opts: ["4x","4","2x","8"], ans: 0 },
    { q: "Faktorkan xÂ² âˆ’ 1.", opts: ["(xâˆ’1)(x+1)","(xâˆ’1)Â²","(x+1)Â²","(xâˆ’1)(xâˆ’1)"], ans: 0 },
    { q: "Faktorkan xÂ² + 7x + 12.", opts: ["(x+3)(x+4)","(x+2)(x+5)","(x+1)(x+12)","(x+6)(x+2)"], ans: 0 },
    { q: "Faktorkan 18 + 24x (FSTB).", opts: ["6(3+4x)","3(6+8x)","12(1.5+2x)","2(9+12x)"], ans: 0 },
    { q: "Faktorkan 5xÂ² âˆ’ 80 (FSTB dulu).", opts: ["5(xÂ²âˆ’16)","5(xâˆ’4)(x+4)","5(xâˆ’4)Â²","5x(xâˆ’16)"], ans: 0 },
    { q: "Faktorkan xÂ² + 2x.", opts: ["x(x+2)","x(xâˆ’2)","(x+1)(x+1)","2(x+xÂ²)"], ans: 0 },
    { q: "Faktorkan 25 âˆ’ xÂ².", opts: ["(5âˆ’x)(5+x)","(xâˆ’5)(x+5)","(5âˆ’x)Â²","(xâˆ’25)(x+1)"], ans: 0 },
    { q: "Kembangkan (3x + 2)Â².", opts: ["9xÂ² + 12x + 4","6xÂ² + 12x + 4","9xÂ² + 4","3xÂ² + 12x + 4"], ans: 0 },
    { q: "Kembangkan (x âˆ’ 4)Â².", opts: ["xÂ² âˆ’ 8x + 16","xÂ² âˆ’ 8x âˆ’ 16","xÂ² âˆ’ 4x + 16","xÂ² âˆ’ 16"], ans: 0 },
    { q: "Faktorkan xÂ² + 8x + 15.", opts: ["(x+3)(x+5)","(x+1)(x+15)","(x+3)(x+3)","(x+8)(x+7)"], ans: 0 },
    { q: "FST bagi 6xÂ² âˆ’ 9x.", opts: ["3x","3","6x","9x"], ans: 0 },
    { q: "Kembangkan 4(3x âˆ’ 5).", opts: ["12x âˆ’ 20","12x + 20","7x âˆ’ 5","12x âˆ’ 5"], ans: 0 },
  ],

  // PAGE 3: Pecahan Algebra
  pecahan: [
    { q: "Permudahkan: 2/(x+1) + 3/(x+2)", opts: ["(5x+7)/((x+1)(x+2))","(5x+5)/((x+1)(x+2))","(2x+3)/((x+1)(x+2))","(5x+7)/(xÂ²+3x+2)"], ans: 0 },
    { q: "Permudahkan: (7x+2)/(2x) âˆ’ (xâˆ’5)/(2x)", opts: ["(6x+7)/(2x)","(6xâˆ’3)/(2x)","(8xâˆ’3)/(2x)","(6x+7)/(4x)"], ans: 0 },
    { q: "Permudahkan: (xÂ²âˆ’9)/(xâˆ’3)", opts: ["x+3","xâˆ’3","xÂ²âˆ’9","x"], ans: 0 },
    { q: "Darab: (x/2) Ã— (4/x)", opts: ["2","x/2","4","2/x"], ans: 0 },
    { q: "Bahagi: (xÂ²âˆ’4) Ã· (xâˆ’2)", opts: ["x+2","xâˆ’2","xÂ²âˆ’4","x"], ans: 0 },
    { q: "Permudahkan: (3x+6)/3", opts: ["x+2","3x+2","x+6","3x+6"], ans: 0 },
    { q: "Faktorkan dan permudahkan: (xÂ²âˆ’4)/(x+2)", opts: ["xâˆ’2","x+2","xÂ²âˆ’4","x"], ans: 0 },
    { q: "Permudahkan: 4/(x+1) + 2/(x+1)", opts: ["6/(x+1)","6x+6","2/(x+1)","6x/(x+1)"], ans: 0 },
  ],

  // PAGE 4: Rumus Algebra (Bab 3)
  rumus: [
    { q: "Diberi A = Â½bh, ungkapkan h sebagai perkara rumus.", opts: ["h = 2A/b","h = A/2b","h = Ab/2","h = 2b/A"], ans: 0 },
    { q: "Diberi y = mx + c, ungkapkan m sebagai perkara rumus.", opts: ["m = (y âˆ’ c)/x","m = y âˆ’ c/x","m = y/x âˆ’ c","m = (y + c)/x"], ans: 0 },
    { q: "Diberi v = u + at, ungkapkan t sebagai perkara rumus.", opts: ["t = (v âˆ’ u)/a","t = v + u âˆ’ a","t = v/a âˆ’ u","t = v âˆ’ u + a"], ans: 0 },
    { q: "Diberi K = 2Ï€r, ungkapkan r sebagai perkara rumus.", opts: ["r = K/2Ï€","r = 2Ï€/K","r = KÏ€/2","r = 2K/Ï€"], ans: 0 },
    { q: "Diberi P = 2(L + W), ungkapkan L sebagai perkara rumus.", opts: ["L = P/2 âˆ’ W","L = P âˆ’ 2W","L = P/(2W)","L = 2P âˆ’ W"], ans: 0 },
    { q: "Diberi V = Ï€rÂ²h, ungkapkan h sebagai perkara rumus.", opts: ["h = V/Ï€rÂ²","h = Ï€rÂ²/V","h = VÏ€rÂ²","h = V âˆ’ Ï€rÂ²"], ans: 0 },
    { q: "Diberi E = mcÂ², ungkapkan m sebagai perkara rumus.", opts: ["m = E/cÂ²","m = cÂ²/E","m = EcÂ²","m = E + cÂ²"], ans: 0 },
    { q: "Diberi s = ut + Â½atÂ², ungkapkan a sebagai perkara rumus.", opts: ["a = 2(s âˆ’ ut)/tÂ²","a = s/t âˆ’ u","a = 2s/tÂ²","a = (s âˆ’ u)/t"], ans: 0 },
    { q: "Diberi d = vt, ungkapkan v sebagai perkara rumus.", opts: ["v = d/t","v = dt","v = t/d","v = d + t"], ans: 0 },
    { q: "Diberi A = Ï€rÂ², ungkapkan r sebagai perkara rumus.", opts: ["r = âˆš(A/Ï€)","r = A/Ï€","r = âˆšAÏ€","r = Ï€/âˆšA"], ans: 0 },
    { q: "Perkara rumus ialah pemboleh ubah yang...", opts: ["Hanya ada 1 di hadapan dengan pekali 1","Mempunyai pekali terbesar","Berada di penyebut","Mempunyai kuasa 2"], ans: 0 },
    { q: "Kaedah pindah: + â†” âˆ’ dan Ã— â†” Ã·. Betul atau salah?", opts: ["Betul","Salah","Bergantung","Hanya Ã— â†” Ã·"], ans: 0 },
    { q: "Rumus algebra menghubungkan...", opts: ["Beberapa pemboleh ubah","Hanya satu pemboleh ubah","Nombor sahaja","Tiada pemboleh ubah"], ans: 0 },
    { q: "Diberi K = 3a + 2b, ungkapkan a sebagai perkara rumus.", opts: ["a = (K âˆ’ 2b)/3","a = K/3 âˆ’ 2b","a = K âˆ’ 2b/3","a = 3K âˆ’ 2b"], ans: 0 },
    { q: "Diberi s = ut + Â½atÂ², cari s apabila u = 5, t = 2, a = 3.", opts: ["s = 16","s = 14","s = 10","s = 12"], ans: 0 },
    { q: "Diberi y = 7t âˆ’ 5, cari y apabila t = 3.", opts: ["y = 16","y = 26","y = 7","y = 11"], ans: 0 },
    { q: "Diberi 3z = 4t + u, cari z apabila t = âˆ’1 dan u = âˆ’11.", opts: ["z = 2","z = âˆ’2","z = 1","z = âˆ’1"], ans: 0 },
    { q: "Kaedah pindah: apabila pindah kawasan, operasi bertukar.", opts: ["+ â†” âˆ’ dan Ã— â†” Ã·","+ â†” Ã— dan âˆ’ â†” Ã·","Semua tetap","Hanya + â†” âˆ’"], ans: 0 },
  ],

  // PAGE 5: Indeks (Bab 1)
  indeks: [
    { q: "Nilai 2â´.", opts: ["8","16","6","4"], ans: 1 },
    { q: "Permudahkan xâ¶ Ã— xÂ².", opts: ["xâ¸","xâ´","xÂ¹Â²","xÂ³"], ans: 0 },
    { q: "Permudahkan (xÂ³)Â².", opts: ["xâµ","xâ¶","xâ¹","xÂ¹"], ans: 1 },
    { q: "Nilai 3â°.", opts: ["0","1","3","9"], ans: 1 },
    { q: "Permudahkan yâ· Ã· yÂ³.", opts: ["yâ´","yÂ¹â°","yÂ²","yâ»â´"], ans: 0 },
    { q: "Nilai 2â»Â³.", opts: ["âˆ’8","1/8","8","âˆ’1/8"], ans: 1 },
    { q: "Permudahkan aÂ² Ã— aâ´ Ã· aÂ³.", opts: ["aÂ³","aâµ","aÂ²","aâ´"], ans: 0 },
    { q: "Nilai 5Â¹.", opts: ["1","5","0","25"], ans: 1 },
    { q: "Permudahkan 10â¶ Ã· 10Â².", opts: ["10â´","10Â³","10â¸","10â»â´"], ans: 0 },
    { q: "Permudahkan mâµ Ã— m.", opts: ["mâ¶","mâµ","2mâµ","mâ´"], ans: 0 },
    { q: "Nilai 4Â².", opts: ["8","16","6","4"], ans: 1 },
    { q: "Permudahkan (pÂ³)â´.", opts: ["pâ·","pÂ¹Â²","pâ¸â´","pÂ³â´"], ans: 1 },
    { q: "Nilai 7â°.", opts: ["0","1","7","14"], ans: 1 },
    { q: "Permudahkan xâ¸ Ã· xÂ³.", opts: ["xâµ","xÂ¹Â¹","xÂ³","xâ»âµ"], ans: 0 },
    { q: "Nilai 3â»Â².", opts: ["âˆ’9","1/9","9","âˆ’1/9"], ans: 1 },
    { q: "Permudahkan 5Â² Ã— 5Â³.", opts: ["5âµ","5â¶","25âµ","5Â²âºÂ³"], ans: 0 },
    { q: "Nilai 10â° + 2Â³.", opts: ["9","11","8","10"], ans: 0 },
    { q: "Permudahkan (2x)Â³.", opts: ["8xÂ³","6xÂ³","2xÂ³","8x"], ans: 0 },
    { q: "Nilai âˆš144.", opts: ["11","12","13","14"], ans: 1 },
    { q: "Nilai 3Â³.", opts: ["9","27","6","12"], ans: 1 },
  ],

  // PAGE 6: Garis Lurus (Bab 9)
  linear: [
    { q: "Apakah kecerunan garis y = 4x âˆ’ 7?", opts: ["âˆ’7","4","7","âˆ’4"], ans: 1 },
    { q: "Apakah pintasan-y bagi garis y = 3x + 5?", opts: ["3","5","âˆ’3","âˆ’5"], ans: 1 },
    { q: "Cari kecerunan garis melalui (1,2) dan (3,8).", opts: ["2","3","1","4"], ans: 1 },
    { q: "Garis y = 2x + c melalui (1,5). Cari c.", opts: ["3","2","5","1"], ans: 0 },
    { q: "Apakah kecerunan garis x = 7?", opts: ["0","1","7","tak terdefinisi"], ans: 3 },
    { q: "Garis selari dengan y = 3x + 1 mestilah mempunyai kecerunan...", opts: ["1","3","âˆ’3","0"], ans: 1 },
    { q: "Cari kecerunan garis melalui (âˆ’2,3) dan (2,11).", opts: ["2","1","4","3"], ans: 0 },
    { q: "Persamaan garis dengan kecerunan 2 dan pintasan-y âˆ’3.", opts: ["y = 2x âˆ’ 3","y = âˆ’2x + 3","y = 3x âˆ’ 2","y = 2x + 3"], ans: 0 },
    { q: "Kecerunan garis 2y = 6x + 4.", opts: ["2","3","6","4"], ans: 1 },
    { q: "Titik persilangan y = x + 1 dan y = 2x âˆ’ 2.", opts: ["(3, 4)","(1, 2)","(2, 3)","(âˆ’3, âˆ’2)"], ans: 0 },
    { q: "Pintasan-y bagi garis 3x + 2y = 12.", opts: ["6","4","3","2"], ans: 0 },
    { q: "Kecerunan garis melalui (0,0) dan (5,15).", opts: ["3","5","1","2"], ans: 0 },
    { q: "Persamaan garis selari dengan y = âˆ’2x + 3 melalui (0,5).", opts: ["y = âˆ’2x + 5","y = âˆ’2x âˆ’ 5","y = 2x + 5","y = âˆ’2x + 3"], ans: 0 },
    { q: "Jika dua garis selari, maka...", opts: ["mâ‚ = mâ‚‚","mâ‚ Ã— mâ‚‚ = âˆ’1","mâ‚ + mâ‚‚ = 0","mâ‚ = âˆ’mâ‚‚"], ans: 0 },
    { q: "Cari pintasan-x bagi garis 2x + y = 8.", opts: ["4","2","8","âˆ’4"], ans: 0 },
    { q: "Graf y = mx + c, c ialah...", opts: ["Pintasan-y","Pintasan-x","Kecerunan","Titik asalan"], ans: 0 },
    { q: "Titik (2,5) pada garis y = 3x âˆ’ 1?", opts: ["Betul","Salah","Bergantung","Tak tentu"], ans: 0 },
    { q: "Kecerunan garis mendatar.", opts: ["0","1","âˆž","âˆ’1"], ans: 0 },
    { q: "Cari m jika garis melalui (2,3) dan (4,7).", opts: ["2","1","4","3"], ans: 0 },
  ],

  // PAGE 7: Fungsi & Persamaan Kuadratik (Bab 1)
  quadratic: [
    { q: "Bentuk am fungsi kuadratik.", opts: ["f(x) = axÂ² + bx + c","f(x) = ax + b","f(x) = axÂ³ + bx","f(x) = a/x"], ans: 0 },
    { q: "Faktorkan xÂ² âˆ’ 5x + 6.", opts: ["(xâˆ’2)(xâˆ’3)","(xâˆ’1)(xâˆ’6)","(x+2)(x+3)","(xâˆ’3)(x+2)"], ans: 0 },
    { q: "Selesaikan xÂ² = 9.", opts: ["x = 3","x = Â±3","x = 9","x = Â±9"], ans: 1 },
    { q: "Punca xÂ² âˆ’ 3x + 2 = 0.", opts: ["1, 2","1, âˆ’2","âˆ’1, 2","0, 2"], ans: 0 },
    { q: "Faktorkan xÂ² + 5x + 6.", opts: ["(x+2)(x+3)","(x+1)(x+5)","(xâˆ’2)(xâˆ’3)","(x+6)(xâˆ’1)"], ans: 0 },
    { q: "Selesaikan xÂ² âˆ’ 4 = 0.", opts: ["x = 2","x = Â±2","x = 4","x = Â±4"], ans: 1 },
    { q: "Faktorkan 2xÂ² + 5x + 3.", opts: ["(2x+3)(x+1)","(2x+1)(x+3)","(x+3)(2x+1)","(2xâˆ’1)(xâˆ’3)"], ans: 0 },
    { q: "Punca xÂ² âˆ’ 9 = 0.", opts: ["3","Â±3","9","Â±9"], ans: 1 },
    { q: "Faktorkan xÂ² âˆ’ 7x + 10.", opts: ["(xâˆ’2)(xâˆ’5)","(xâˆ’1)(xâˆ’10)","(x+2)(x+5)","(xâˆ’2)(x+5)"], ans: 0 },
    { q: "Selesaikan xÂ² âˆ’ x = 6.", opts: ["x = 3 atau x = âˆ’2","x = 2 atau x = âˆ’3","x = 6 atau x = âˆ’1","x = 1 atau x = 6"], ans: 0 },
    { q: "Jika a > 0, parabola terbuka ke...", opts: ["Atas","Bawah","Kiri","Kanan"], ans: 0 },
    { q: "Jika a < 0, parabola mempunyai...", opts: ["Titik maksimum","Titik minimum","Pintasan-x","Pintasan-y"], ans: 0 },
    { q: "Persamaan paksi simetri bagi xÂ² + 4x + 3 = 0.", opts: ["x = âˆ’2","x = 2","x = âˆ’4","x = 4"], ans: 0 },
    { q: "Faktorkan xÂ² + 6x + 8.", opts: ["(x+2)(x+4)","(x+1)(x+8)","(x+3)(x+3)","(xâˆ’2)(xâˆ’4)"], ans: 0 },
    { q: "Selesaikan xÂ² + 4x + 3 = 0.", opts: ["x = âˆ’1 atau x = âˆ’3","x = 1 atau x = 3","x = âˆ’1 atau x = 3","x = 1 atau x = âˆ’3"], ans: 0 },
    { q: "Punca bagi xÂ² âˆ’ 4x + 4 = 0.", opts: ["x = 2 (punca sama)","x = 4","x = âˆ’2","tiada punca"], ans: 0 },
    { q: "Cari punca xÂ² âˆ’ 2x âˆ’ 8 = 0.", opts: ["x = 4 atau x = âˆ’2","x = 2 atau x = âˆ’4","x = 8 atau x = âˆ’1","x = 1 atau x = âˆ’8"], ans: 0 },
    { q: "MODE â†’ EQN â†’ DEGREE 2 untuk...", opts: ["Persamaan kuadratik","Persamaan linear","3 pemboleh ubah","Matriks 2Ã—2"], ans: 0 },
    { q: "Bentuk am persamaan kuadratik.", opts: ["axÂ² + bx + c = 0","ax + b = 0","axÂ³ + bxÂ² + c = 0","axÂ² + bx = 0"], ans: 0 },
  ],

  // PAGE 8: Ketaksamaan Linear (Bab 6) â€” dua pemboleh ubah
  ketaksamaan: [
    { q: "Rantau > (lebih daripada) menggunakan garis...", opts: ["Sempang (putus-putus)","Padu","Lurus","Lengkung"], ans: 0 },
    { q: "Rantau â‰¥ (lebih daripada atau sama dengan) menggunakan garis...", opts: ["Padu (penuh)","Sempang (putus-putus)","Lengkung","Tiada garis"], ans: 0 },
    { q: "Titik (2,5) pada y > 2x + 1?", opts: ["5 > 5 âœ“ (memuaskan)","5 < 5 âœ—","5 = 5","Tak boleh tentukan"], ans: 0 },
    { q: "Titik (0,8) pada y < âˆ’3x + 6?", opts: ["8 < 6 âœ“ (memuaskan)","8 > 6 âœ—","8 = 6","Tak boleh tentukan"], ans: 0 },
    { q: "Ketaksamaan linear dalam 2 pemboleh ubahä¸€å®šæœ‰...", opts: ["2 pemboleh ubah","3 pemboleh ubah","Tiada pemboleh ubah","1 pemboleh ubah"], ans: 0 },
    { q: "Rantau besar > atau kecil <?", opts: ["Besar = > (lebih daripada)","Besar = < (kurang daripada)","Sama saja","Bergantung pada nilai"], ans: 0 },
    { q: "Titik (âˆ’1,9) pada y â‰¥ âˆ’3x + 6?", opts: ["9 â‰¥ 9 âœ“ (memuaskan)","9 < 9 âœ—","9 > 9 âœ—","9 = 9"], ans: 0 },
    { q: "Rantau penyelesaian sistem ketaksamaan ialah...", opts: ["Titik yang memuaskan semua","Mana-mana titik","Hanya titik pada garis","Tiada titik"], ans: 0 },
    { q: "Jika titik pada garis penuh (padu), maka simbol...", opts: ["â‰¥ atau â‰¤","> atau <","â‰ ","Semua"], ans: 0 },
    { q: "Lorek rantau besar >: garis origo atau bukan?", opts: ["Jauh dari asalan","Dekati asalan","Mana-mana","Tiada lorekan"], ans: 0 },
  ],

  // PAGE 9: Ubahan (Bab 1)
  ubahan: [
    { q: "y berubah langsung dengan x (y âˆ x). Jika y = 12 apabila x = 4, cari k.", opts: ["3","48","4","8"], ans: 0 },
    { q: "y âˆ x. Jika y = 15 apabila x = 3, cari y apabila x = 7.", opts: ["35","30","21","25"], ans: 0 },
    { q: "y berubah songsang dengan x. Jika y = 8 apabila x = 3, cari y apabila x = 6.", opts: ["16","4","24","6"], ans: 1 },
    { q: "y âˆ 1/x. Jika y = 5 apabila x = 2, cari k.", opts: ["10","2.5","5","7"], ans: 0 },
    { q: "y berubah langsung dengan xÂ². Jika y = 36 apabila x = 3, cari y apabila x = 2.", opts: ["16","12","24","8"], ans: 0 },
    { q: "z âˆ xy. Jika z = 12, x = 3, y = 4, cari k.", opts: ["1","2","3","4"], ans: 0 },
    { q: "y berubah songsang dengan x. Jika y = 3 apabila x = 4, cari y apabila x = 6.", opts: ["2","4.5","1.5","3"], ans: 0 },
    { q: "y âˆ x. Jika y = 8 apabila x = 2, cari y apabila x = 5.", opts: ["20","16","12","10"], ans: 0 },
    { q: "y berubah langsung dengan âˆšx. Jika y = 6 apabila x = 9, cari y apabila x = 4.", opts: ["4","3","2","8"], ans: 0 },
    { q: "Pemalar ubahan songsang xy = k. Jika x = 2 dan y = 7, nilai k = ?", opts: ["14","3.5","9","5"], ans: 0 },
    { q: "Graf ubahan langsung berbentuk...", opts: ["Garis lurus melalui asalan","Lengkung hiperbola","Parabola","Garis mendatar"], ans: 0 },
    { q: "Graf ubahan songsang berbentuk...", opts: ["Lengkung hiperbola","Garis lurus","Parabola","Garis mendatar"], ans: 0 },
    { q: "Ubahan tercantum: y âˆ xâ¿, rumus ialah...", opts: ["y = kxâ¿","y = k/x","y = kx + c","y = x/k"], ans: 0 },
    { q: "Ubahan bergabung: z âˆ xy, rumus ialah...", opts: ["z = kxy","z = kx/y","z = x + y","z = xy/k"], ans: 0 },
    { q: "Cari k bagi y = kx. Jika y = 20 dan x = 4, k = ?", opts: ["5","4","20","0.2"], ans: 0 },
  ],

  // PAGE 10: Matriks (Bab 2)
  matriks: [
    { q: "Peringkat matriks [[1,2],[3,4],[5,6]].", opts: ["3Ã—2","2Ã—3","2Ã—2","3Ã—3"], ans: 0 },
    { q: "Cari penentu [[3, 1], [2, 4]].", opts: ["12","10","14","8"], ans: 1 },
    { q: "Cari penentu [[5, 2], [1, 4]].", opts: ["22","18","20","16"], ans: 0 },
    { q: "Matriks songsang wujud jika penentu...", opts: ["â‰  0","= 0","< 0","> 0"], ans: 0 },
    { q: "[[2,0],[0,3]] + [[1,0],[0,1]] = ?", opts: ["[[3,0],[0,4]]","[[1,0],[0,2]]","[[2,0],[0,3]]","[[3,0],[0,2]]"], ans: 0 },
    { q: "Cari penentu [[4, 3], [2, 1]].", opts: ["âˆ’2","2","10","âˆ’10"], ans: 0 },
    { q: "3 Ã— [[2, 1], [4, 3]] = ?", opts: ["[[6,3],[12,9]]","[[5,4],[7,6]]","[[2,1],[4,3]]","[[6,1],[4,3]]"], ans: 0 },
    { q: "Penentu matriks 2Ã—2 [[a,b],[c,d]] ialah...", opts: ["ad âˆ’ bc","ad + bc","ab + cd","ac + bd"], ans: 0 },
    { q: "Jika det = 0, matriks songsang...", opts: ["Tidak wujud","Wujud","Sama dengan 0","Merge"], ans: 0 },
    { q: "Matriks identiti I mempunyai...", opts: ["Unsur 1 pada pepenjuru, 0 elsewhere","Semua 1","Semua 0","Simetri"], ans: 0 },
    { q: "Matriks A Ã— songsang Aâ»Â¹ = ?", opts: ["I (matriks identiti)","A","0","AÂ²"], ans: 0 },
    { q: "Unsur aâ‚‚â‚ƒ dalam [[1,5],[8,4],[2,9]].", opts: ["4","9","2","8"], ans: 0 },
    { q: "A = B jika...", opts: ["Sama peringkat dan unsur sepadan sama","Mempunyai penentu sama","Kedua-duanya matriks 2Ã—2","Mempunyai songsang"], ans: 0 },
    { q: "2 matriks boleh ditambah jika...", opts: ["Sama peringkat","Songsang antara satu sama lain","Determinan sama","Kuasa dua"], ans: 0 },
    { q: "Peringkat [[a,b],[c,d]].", opts: ["2Ã—2","2Ã—1","1Ã—2","1Ã—1"], ans: 0 },
    { q: "Cari penentu [[2, 4], [1, 3]].", opts: ["2","6","10","âˆ’2"], ans: 0 },
    { q: "Matriks segi empat sama mempunyai...", opts: ["Bil. baris = bil. lajur","Semua unsur sama","det = 1","Tiada songsang"], ans: 0 },
    { q: "Aâ»Â¹ = (1/det A) Ã— [[d, âˆ’b],[âˆ’c, a]] untuk [[3,1],[2,4]].", opts: ["1/10 Ã— [[4,âˆ’1],[âˆ’2,3]]","1/10 Ã— [[3,âˆ’1],[âˆ’2,4]]","1/10 Ã— [[4,1],[2,3]]","1/12 Ã— [[4,âˆ’1],[âˆ’2,3]]"], ans: 0 },
  ],

  // PAGE 1: Kuasa Dua & Kuasa Tiga Sempurna
  kuasa: [
    { q: "Kuasa dua sempurna: 1, 4, 9, 16, 25, ?", opts: ["36","35","32","49"], ans: 0 },
    { q: "Kuasa tiga sempurna: 1, 8, 27, 64, ?", opts: ["125","100","121","216"], ans: 0 },
    { q: "1Â² = ?", opts: ["1","2","0","âˆ’1"], ans: 0 },
    { q: "3Â² = ?", opts: ["9","6","12","3"], ans: 0 },
    { q: "4Â³ = ?", opts: ["64","12","43","48"], ans: 0 },
    { q: "5Â² = ?", opts: ["25","10","15","20"], ans: 0 },
    { q: "âˆš144 = ?", opts: ["12","11","14","13"], ans: 0 },
    { q: "Â³âˆš27 = ?", opts: ["3","9","6","2"], ans: 0 },
    { q: "2Â³ = ?", opts: ["8","6","12","4"], ans: 0 },
    { q: "6Â² = ?", opts: ["36","12","63","6"], ans: 0 },
    { q: "7Â² = ?", opts: ["49","14","42","7"], ans: 0 },
    { q: "3Â³ = ?", opts: ["27","9","6","12"], ans: 1 },
    { q: "Punca kuasa dua bagi 144.", opts: ["12","14","11","13"], ans: 0 },
    { q: "Punca kuasa tiga bagi 125.", opts: ["5","25","15","3"], ans: 0 },
    { q: "Kuasa dua sempurna yang seterusnya selepas 36.", opts: ["49","45","48","50"], ans: 0 },
  ],

  // PAGE 1: Nisbah, Kadar dan Kadaran
  nisbah: [
    { q: "Nisbah x : y = 3 : 5 dan x = 9, cari y.", opts: ["15","5","10","3"], ans: 0 },
    { q: "Nisbah a : b = 2 : 3 dan jumlah a + b = 25, cari a.", opts: ["10","15","8","12"], ans: 0 },
    { q: "Kadar = nilai perubahan bagi setiap...", opts: ["1 unit","10 unit","100 unit","Perubahan itu sendiri"], ans: 0 },
    { q: "Jika nisbah 4 : 7 dan nilai pertama = 20, nilai kedua = ?", opts: ["35","28","14","7"], ans: 0 },
    { q: "Kadaran: a/b = c/d. Apakah bentuk silang?", opts: ["ad = bc","ac = bd","ab = cd","a + b = c + d"], ans: 0 },
    { q: "Nisbah 1 : 4 sama dengan 25% ?", opts: ["Betul","Salah","Bergantung","50%"], ans: 0 },
    { q: "Jika x : y = 3 : 4 dan x + y = 28, cari y.", opts: ["16","12","20","8"], ans: 0 },
    { q: "Perkadaran: a:b = c:d bermaksud...", opts: ["a/b = c/d","aÃ—b = cÃ—d","a + b = c + d","a âˆ’ b = c âˆ’ d"], ans: 0 },
    { q: "Nisbah perimeter : Jejari = ?, untuk bulatan.", opts: ["2Ï€ : 1","Ï€ : 1","1 : 2Ï€","Ï€ : 2"], ans: 0 },
    { q: "Jika kadar = 60 km/j, maka dalam 2 jam perjalanan = ?", opts: ["120 km","30 km","62 km","58 km"], ans: 0 },
  ],

  // PAGE 4: Fungsi (bab 1 Ting 4)
  fungsi: [
    { q: "Diberi f(x) = x + 3, cari fâ»Â¹(x).", opts: ["x âˆ’ 3","x + 3","3 âˆ’ x","3x"], ans: 0 },
    { q: "Diberi f(x) = 2x âˆ’ 1, cari f(3).", opts: ["5","7","4","6"], ans: 0 },
    { q: "fg(x) bermaksud...", opts: ["f(g(x))","f(x) + g(x)","f(x) Ã— g(x)","f(x) âˆ’ g(x)"], ans: 0 },
    { q: "Diberi f(x) = 3x + 2, cari fâ»Â¹(8).", opts: ["2","3","1","4"], ans: 0 },
    { q: "fâ»Â¹(x) dipanggil...", opts: ["Fungsi songsang","Fungsi darab","Fungsi tambah","Fungsi kuadratik"], ans: 0 },
    { q: "fg(2) jika f(x) = x + 1 dan g(x) = 3x.", opts: ["7","9","6","5"], ans: 0 },
    { q: "Diberi f(x) = 5x, nilai fâ»Â¹(25).", opts: ["5","25","125","1"], ans: 0 },
    { q: "ffâ»Â¹(x) sentiasa sama dengan...", opts: ["x","1","0","f(x)"], ans: 0 },
    { q: "Diberi g(x) = xÂ², cari g(4).", opts: ["16","8","4","2"], ans: 0 },
    { q: "fg(3) jika f(x) = 2x dan g(x) = x + 4.", opts: ["14","10","12","8"], ans: 0 },
    { q: "Cari gubahan fg(x) jika f(x) = x + 2 dan g(x) = 3x.", opts: ["3x + 2","2x + 3","4x","x + 5"], ans: 0 },
    { q: "fg(x) = f(g(x)). Kira dalam urutan...", opts: ["g dulu, kemudian f","f dulu, kemudian g","Serentak","Mana-mana"], ans: 0 },
    { q: "fâ»Â¹(f(x)) = ?", opts: ["x","1","0","f(x)"], ans: 0 },
    { q: "Jika f(x) = 4x + 1, cari f(2).", opts: ["9","8","7","6"], ans: 0 },
    { q: "Diberi f(x) = x âˆ’ 5, maka fâ»Â¹(x) = x + 5. Betul atau salah?", opts: ["Betul","Salah","Bergantung","Tak pasti"], ans: 0 },
  ],
};

// ---------------------------------------------------------------------------
// ROCKET MISSION — algebra question bank by difficulty
// ---------------------------------------------------------------------------
const ROCKET_QUESTIONS = {
  // Level 1 — Beginner Orbit: simplifying, like terms, basic substitution
  1: [
    { q: "3x + 2x = ?", opts: ["5x","6x","5","5x²"], ans: 0, exp: "3x dan 2x ialah sebutan serupa. Tambah pekali: 3+2=5. Jadi 5x." },
    { q: "4y − 2y = ?", opts: ["2y","6y","2","2y²"], ans: 0, exp: "4y tolak 2y = 2y (sebutan serupa)." },
    { q: "5 + 3 = ?", opts: ["8","15","2","53"], ans: 0, exp: "5 + 3 = 8 (nombor biasa)." },
    { q: "7x − 3x = ?", opts: ["4x","10x","4","3x"], ans: 0, exp: "7x − 3x = 4x." },
    { q: "2 × 3x = ?", opts: ["6x","5x","6","3x"], ans: 0, exp: "2 × 3x = 6x." },
    { q: "x + x + x = ?", opts: ["3x","3","x³","1x"], ans: 0, exp: "x + x + x = 3x." },
    { q: "8y ÷ 2 = ?", opts: ["4y","6y","4","10y"], ans: 0, exp: "8y ÷ 2 = 4y." },
    { q: "Jika x = 4, cari 2x.", opts: ["8","6","2","4"], ans: 0, exp: "2x = 2 × 4 = 8." },
    { q: "6 + 4 = ?", opts: ["10","2","24","64"], ans: 0, exp: "6 + 4 = 10." },
    { q: "5x + x = ?", opts: ["6x","5x²","5","4x"], ans: 0, exp: "5x + x = 6x." },
    { q: "9 − 3 = ?", opts: ["6","12","3","27"], ans: 0, exp: "9 − 3 = 6." },
    { q: "4 × 2x = ?", opts: ["8x","6x","8","2x"], ans: 0, exp: "4 × 2x = 8x." },
    { q: "7y − y = ?", opts: ["6y","8y","7","6"], ans: 0, exp: "7y − y = 6y." },
    { q: "Jika a = 3, cari 2a + 1.", opts: ["7","8","6","9"], ans: 0, exp: "2a + 1 = 2(3) + 1 = 6 + 1 = 7." },
    { q: "10x ÷ 5 = ?", opts: ["2x","5x","2","15x"], ans: 0, exp: "10x ÷ 5 = 2x." },
  ],
  // Level 2 — Planet Explorer: linear equations, expanding brackets
  2: [
    { q: "2x + 4 = 10. Cari x.", opts: ["3","2","5","4"], ans: 0, exp: "2x + 4 = 10 → 2x = 6 → x = 3." },
    { q: "Kembangkan 3(x + 2).", opts: ["3x + 6","3x + 2","3x − 6","x + 6"], ans: 0, exp: "3(x + 2) = 3x + 6 (darab setiap sebutan)." },
    { q: "x + 5 = 12. Cari x.", opts: ["7","17","6","5"], ans: 0, exp: "x + 5 = 12 → x = 12 − 5 = 7." },
    { q: "Kembangkan 2(3x − 4).", opts: ["6x − 8","6x + 8","5x − 4","6x − 4"], ans: 0, exp: "2(3x − 4) = 6x − 8." },
    { q: "5x − 3 = 22. Cari x.", opts: ["5","25","4","6"], ans: 0, exp: "5x − 3 = 22 → 5x = 25 → x = 5." },
    { q: "Faktorkan 6x + 9.", opts: ["3(2x+3)","3(2x−3)","6(x+9)","2(3x+4)"], ans: 0, exp: "FST = 3. Jadi 6x + 9 = 3(2x + 3)." },
    { q: "3(x − 1) = 12. Cari x.", opts: ["5","4","3","6"], ans: 0, exp: "3(x − 1) = 12 → x − 1 = 4 → x = 5." },
    { q: "4x + 6 = 30. Cari x.", opts: ["6","7","5","8"], ans: 0, exp: "4x + 6 = 30 → 4x = 24 → x = 6." },
    { q: "Kembangkan −2(x + 3).", opts: ["−2x − 6","−2x + 6","2x − 6","−2x + 3"], ans: 0, exp: "−2(x + 3) = −2x − 6." },
    { q: "x − 7 = 3. Cari x.", opts: ["10","4","−4","7"], ans: 0, exp: "x − 7 = 3 → x = 3 + 7 = 10." },
    { q: "Faktorkan 8x + 12.", opts: ["4(2x+3)","2(4x+6)","8(x+1)","4(2x−3)"], ans: 0, exp: "FST = 4. Jadi 8x + 12 = 4(2x + 3)." },
    { q: "2x + 8 = 20. Cari x.", opts: ["6","10","5","4"], ans: 0, exp: "2x + 8 = 20 → 2x = 12 → x = 6." },
    { q: "Kembangkan 5(2x − 1).", opts: ["10x − 5","10x + 5","7x − 1","10x − 1"], ans: 0, exp: "5(2x − 1) = 10x − 5." },
    { q: "3x = 15. Cari x.", opts: ["5","18","3","12"], ans: 0, exp: "3x = 15 → x = 15 ÷ 3 = 5." },
    { q: "x/3 = 4. Cari x.", opts: ["12","7","3","1/3"], ans: 0, exp: "x/3 = 4 → x = 4 × 3 = 12." },
  ],
  // Level 3 — Galactic Challenge: harder equations, factorisation, fractions
  3: [
    { q: "2(x + 3) = 18. Cari x.", opts: ["6","7","5","9"], ans: 0, exp: "2(x+3)=18 → x+3=9 → x=6." },
    { q: "Faktorkan x² − 9.", opts: ["(x−3)(x+3)","(x−9)(x+1)","(x−3)²","(x+3)²"], ans: 0, exp: "x² − 9 = (x−3)(x+3) — beza kuasa dua." },
    { q: "3x + 7 = 22. Cari x.", opts: ["5","15","6","4"], ans: 0, exp: "3x + 7 = 22 → 3x = 15 → x = 5." },
    { q: "Faktorkan x² + 5x + 6.", opts: ["(x+2)(x+3)","(x+1)(x+5)","(x−2)(x−3)","(x+6)(x−1)"], ans: 0, exp: "x²+5x+6: dua nombor darab=6, tambah=5 → (x+2)(x+3)." },
    { q: "(2x + 4)/2 = 7. Cari x.", opts: ["5","3","7","2"], ans: 0, exp: "(2x+4)/2=7 → 2x+4=14 → 2x=10 → x=5." },
    { q: "Faktorkan x² − 4x − 12.", opts: ["(x−6)(x+2)","(x−3)(x+4)","(x+6)(x−2)","(x−2)(x+6)"], ans: 0, exp: "x²−4x−12: dua nombor darab=−12, tambah=−4 → (x−6)(x+2)." },
    { q: "4x − 3 = 2x + 9. Cari x.", opts: ["6","4","5","3"], ans: 0, exp: "4x−3=2x+9 → 2x=12 → x=6." },
    { q: "Faktorkan 2x² + 6x.", opts: ["2x(x+3)","2(x²+3x)","x(2x+6)","(2x+3)(x+2)"], ans: 0, exp: "FST = 2x. Jadi 2x²+6x = 2x(x+3)." },
    { q: "5(x − 2) = 3x + 10. Cari x.", opts: ["10","5","8","6"], ans: 0, exp: "5x−10=3x+10 → 2x=20 → x=10." },
    { q: "Faktorkan x² + 7x + 12.", opts: ["(x+3)(x+4)","(x+2)(x+5)","(x+1)(x+12)","(x+6)(x+2)"], ans: 0, exp: "x²+7x+12: dua nombor darab=12, tambah=7 → (x+3)(x+4)." },
    { q: "3(x + 4) = 2(x + 8). Cari x.", opts: ["4","8","2","6"], ans: 0, exp: "3x+12=2x+16 → x=4." },
    { q: "Faktorkan 12x² − 8x.", opts: ["4x(3x−2)","4(3x²−2x)","2x(6x−4)","8x(x−1)"], ans: 0, exp: "FST = 4x. Jadi 12x²−8x = 4x(3x−2)." },
    { q: "(x+3)/2 = 5. Cari x.", opts: ["7","10","3","5"], ans: 0, exp: "(x+3)/2=5 → x+3=10 → x=7." },
    { q: "Faktorkan x² − 25.", opts: ["(x−5)(x+5)","(x−25)(x+1)","(x−5)²","(x+5)²"], ans: 0, exp: "x²−25 = (x−5)(x+5) — beza kuasa dua." },
    { q: "4x + 1 = 3x + 8. Cari x.", opts: ["7","3","5","4"], ans: 0, exp: "4x+1=3x+8 → x=7." },
  ],
};

// ---------------------------------------------------------------------------
// SPEED RACE — algebra question bank
// ---------------------------------------------------------------------------
const RACE_QUESTIONS = [
  // Easy
  { q: "3x + 2x = ?", opts: ["5x","6x","5","5x²"], ans: 0, exp: "Tambah pekali: 3+2=5. Jadi 5x." },
  { q: "4y − 2y = ?", opts: ["2y","6y","2","2y²"], ans: 0, exp: "4y − 2y = 2y." },
  { q: "2 × 4x = ?", opts: ["8x","6x","8","2x"], ans: 0, exp: "2 × 4x = 8x." },
  { q: "Jika x = 5, cari 2x.", opts: ["10","7","12","6"], ans: 0, exp: "2x = 2 × 5 = 10." },
  { q: "9 − 4 = ?", opts: ["5","13","36","2"], ans: 0, exp: "9 − 4 = 5." },
  { q: "x + x = ?", opts: ["2x","x²","2","x"], ans: 0, exp: "x + x = 2x." },
  { q: "8 ÷ 2 = ?", opts: ["4","10","16","6"], ans: 0, exp: "8 ÷ 2 = 4." },
  { q: "3 × 3 = ?", opts: ["9","6","27","12"], ans: 0, exp: "3 × 3 = 9." },
  // Medium
  { q: "2x + 4 = 10. x = ?", opts: ["3","5","7","2"], ans: 0, exp: "2x+4=10 → 2x=6 → x=3." },
  { q: "3(x + 2) = ?", opts: ["3x+6","3x+2","x+6","3x−6"], ans: 0, exp: "3(x+2) = 3x+6." },
  { q: "x + 7 = 15. x = ?", opts: ["8","22","6","7"], ans: 0, exp: "x+7=15 → x=8." },
  { q: "5x − 3 = 22. x = ?", opts: ["5","19","4","25"], ans: 0, exp: "5x−3=22 → 5x=25 → x=5." },
  { q: "Faktorkan 6x + 9.", opts: ["3(2x+3)","3(2x−3)","6(x+9)","2(3x+4)"], ans: 0, exp: "FST=3 → 3(2x+3)." },
  { q: "3(x − 1) = 12. x = ?", opts: ["5","4","3","13"], ans: 0, exp: "3(x−1)=12 → x−1=4 → x=5." },
  { q: "4x + 6 = 30. x = ?", opts: ["6","7","5","36"], ans: 0, exp: "4x+6=30 → 4x=24 → x=6." },
  { q: "Faktorkan 8x + 12.", opts: ["4(2x+3)","2(4x+6)","8(x+1)","4(2x−3)"], ans: 0, exp: "FST=4 → 4(2x+3)." },
  // Hard
  { q: "2(x + 3) = 18. x = ?", opts: ["6","5","9","7"], ans: 0, exp: "2(x+3)=18 → x+3=9 → x=6." },
  { q: "Faktorkan x² − 9.", opts: ["(x−3)(x+3)","(x−9)(x+1)","(x−3)²","(x+3)²"], ans: 0, exp: "x²−9 = (x−3)(x+3)." },
  { q: "3x + 7 = 22. x = ?", opts: ["5","29","15","3"], ans: 0, exp: "3x+7=22 → 3x=15 → x=5." },
  { q: "Faktorkan x²+5x+6.", opts: ["(x+2)(x+3)","(x+1)(x+5)","(x−2)(x−3)","(x+6)(x−1)"], ans: 0, exp: "x²+5x+6 = (x+2)(x+3)." },
  { q: "(2x+4)/2 = 7. x = ?", opts: ["5","3","7","10"], ans: 0, exp: "(2x+4)/2=7 → 2x+4=14 → 2x=10 → x=5." },
  { q: "Faktorkan x²−4x−12.", opts: ["(x−6)(x+2)","(x−3)(x+4)","(x+6)(x−2)","(x−2)(x+6)"], ans: 0, exp: "x²−4x−12 = (x−6)(x+2)." },
  { q: "4x − 3 = 2x + 9. x = ?", opts: ["6","4","5","3"], ans: 0, exp: "4x−3=2x+9 → 2x=12 → x=6." },
  { q: "5(x − 2) = 3x + 10. x = ?", opts: ["10","5","8","6"], ans: 0, exp: "5x−10=3x+10 → 2x=20 → x=10." },
];

// ---------------------------------------------------------------------------
// APP STATE
// ---------------------------------------------------------------------------
const state = {
  view: "home",        // home | learning | topics | lesson | practice | quiz | game | dragdrop | wordmatch | scoreboard
  topic: "linear",    // key into DATA
  tingkatan: "3",     // id from TINGKATAN_DATA
};

const App = {
  go(view, param) {
    // Stop ALL owl voice audios on every navigation.
    // Without this, the previous page's voice keeps playing until it finishes
    // (e.g. you click "Latihan" while "Pelajaran" voice is still playing).
    ["welcome-audio", "belajar-audio", "latihan-audio", "main-audio"].forEach((id) => {
      const audio = document.getElementById(id);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.onended = null;
      }
    });

    // Hide the home page's owl speech bubble + speaking animation
    const wrap = document.getElementById("owlWrap");
    if (wrap) wrap.classList.remove("speaking");
    const bubble = document.getElementById("owlBubble");
    if (bubble) { bubble.classList.remove("show", "bobbing"); bubble.classList.add("hide"); }

    // Hide any page-level owl bubbles (learning / topics / practice / game)
    document.querySelectorAll(".learn-owl-bubble").forEach((b) => {
      b.classList.remove("show", "bobbing");
      b.classList.add("hide");
    });

    state.view = view;

    if (view === "topics" && param) {
      // param = tingkatan id
      state.tingkatan = param;
    } else if ((view === "lesson" || view === "quiz") && param) {
      // param = topic key; also remember which tingkatan this topic belongs to
      state.topic = param;
      const t = TINGKATAN_DATA.find(t => t.topics.includes(param));
      if (t) state.tingkatan = t.id;
    }

    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
};

// ---------------------------------------------------------------------------
// ICON SET
// ---------------------------------------------------------------------------
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
        <img src="image/svg.png" width="90" height="70" alt="AlgebraHub">
      </div>
      <div class="nav-brand-text">
        <div class="nav-brand-title"><span class="p">Algebra</span><span class="g">Hub</span></div>
        <div class="nav-brand-tagline">Belajar Algebra dengan Cara Menyenangkan</div>
      </div>
    </button>
    ${navBtn("Utama",     ICONS.home,     "home",     ["home"])}
    ${navBtn("Pelajaran", ICONS.learning, "learning", ["learning", "topics", "lesson"])}
    ${navBtn("Latihan",   ICONS.practice, "practice", ["practice", "quiz"])}
    ${navBtn("Permainan", ICONS.game,     "game",     ["game", "dragdrop", "wordmatch", "bubblepop", "scoreboard"])}
  `;
}

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------
function renderHome() {
  return `
    <section class="hero">
      <div class="hero-art">
        <div class="hero-art-glow"></div>
        <div class="owl-frame">
          ${renderOwlSlot()}
        </div>
      </div>
      <div>
        <div class="hero-eyebrow">Selamat Datang ke</div>
        <div class="hero-title"><span class="p">Algebra</span><span class="g">Hub!</span></div>
        <div class="hero-underline"></div>
        <div class="hero-subtitle">Belajar Algebra dengan Cara Menyenangkan!</div>
        <p class="hero-desc">Terokai pelajaran interaktif, aktiviti dan kuiz menarik untuk menguasai Algebra langkah demi langkah — dari Tingkatan 1 hingga Tingkatan 5.</p>
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
    </section>
  `;
}

function renderOwlSlot() {
  return `
    <div class="owl-speaking-wrap" id="owlWrap">
      <div class="owl-ring"></div>
      <div class="owl-ring"></div>
      <div class="owl-ring"></div>
      <div class="owl-bubble" id="owlBubble">
        <div class="owl-bubble-header">
          <span class="owl-bubble-dot"></span>
          Algi 🦉
        </div>
        <div class="owl-bubble-text" id="owlBubbleText"></div>
      </div>
      <img src="image/owl.png" alt="Maskot Algi" class="owl-img" style="width:400px;height:400px;object-fit:cover;position:relative;z-index:1;">
    </div>
  `;
}

function initOwlGreeting() {
  const bubble = document.getElementById("owlBubble");
  const textEl = document.getElementById("owlBubbleText");
  if (!bubble || !textEl) return;
  textEl.innerHTML = 'Siapakah saya! 👋<span class="owl-tap-hint">Klik untuk dengar!</span>';
  bubble.classList.add("show");
  setTimeout(() => bubble.classList.add("bobbing"), 500);
  bubble.addEventListener("click", playGreeting, { once: true });
}

function playGreeting() {
  const wrap   = document.getElementById("owlWrap");
  const bubble = document.getElementById("owlBubble");
  const textEl = document.getElementById("owlBubbleText");
  const audio  = document.getElementById("welcome-audio");
  if (!wrap || !bubble || !textEl || !audio) return;

  bubble.classList.remove("bobbing");

  const message = "Hi, saya Algi! Selamat datang ke AlgebraHub!";

  const cleanup = () => {
    audio.onended = null;
    const w = document.getElementById("owlWrap");
    const b = document.getElementById("owlBubble");
    if (!w || !b) return;
    w.classList.remove("speaking");
    setTimeout(() => { b.classList.remove("show"); b.classList.add("hide"); }, 1800);
  };

  wrap.classList.add("speaking");

  let i = 0;
  textEl.innerHTML = '<span class="owl-cursor"></span>';
  const type = () => {
    const el = document.getElementById("owlBubbleText");
    if (!el) return;
    if (i < message.length) {
      el.innerHTML = message.slice(0, ++i) + '<span class="owl-cursor"></span>';
      setTimeout(type, 45);
    } else {
      setTimeout(() => {
        const el2 = document.getElementById("owlBubbleText");
        if (el2) el2.innerHTML = message;
      }, 500);
    }
  };
  setTimeout(type, 300);

  audio.currentTime = 0;
  audio.onended = cleanup;
  audio.play().catch(() => {});

  setTimeout(() => {
    if (document.getElementById("owlWrap")?.classList.contains("speaking")) cleanup();
  }, 8000);
}

// ---------------------------------------------------------------------------
// LEARNING — Tingkatan selection landing
// ---------------------------------------------------------------------------
function renderLearning() {
  const cards = TINGKATAN_DATA.map(t => `
    <button class="tingkatan-card" onclick="App.go('topics', '${t.id}')">
      <div class="tingkatan-card-banner ${t.colorClass}">${t.banner}</div>
      <div class="tingkatan-card-body">
        <div class="tingkatan-card-label">${t.label}</div>
        <div class="tingkatan-card-subtitle">${t.subtitle}</div>
        <div class="tingkatan-card-count">${t.topics.length} topik</div>
        <div class="topic-card-link">Pilih Topik ${ICONS.arrowRight}</div>
      </div>
    </button>
  `).join("");

  return `
    <div class="section-heading">
      <h1>Pelajaran</h1>
      <p>Pilih tingkatan anda, kemudian pilih topik untuk belajar.</p>
    </div>
    <div class="tingkatan-grid">${cards}</div>

    <div class="learn-owl-wrap" id="learnOwlWrap">
      <div class="learn-owl-base">
        <img src="image/owl.png" class="learn-owl-img owl-img" alt="Algi">
      </div>
      <div class="learn-owl-bubble" id="learnOwlBubble">
        <div class="learn-owl-bubble-header">
          <span class="owl-bubble-dot"></span>
          Algi 🦉
        </div>
        <div class="learn-owl-bubble-text" id="learnOwlText"></div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// TOPICS — topic cards within a chosen Tingkatan
// ---------------------------------------------------------------------------
function renderTopics() {
  const tData = TINGKATAN_DATA.find(t => t.id === state.tingkatan);
  if (!tData) return renderLearning();

  const colsClass = tData.topics.length === 2 ? "cols-2" : "";

  const cards = tData.topics.map(key => {
    const d = DATA[key];
    const shortDesc = d.intro.length > 90 ? d.intro.slice(0, 90) + "…" : d.intro;
    // Bab badge — only show if the topic has a real "Bab X" (skip "—" placeholders)
    const babBadge = d.bab && d.bab !== "—"
      ? `<div class="topic-card-bab">${d.bab}</div>`
      : "";
    return `
      <button class="topic-card" onclick="App.go('lesson', '${key}')">
        <div class="topic-card-banner ${key}">${d.tag}</div>
        <div class="topic-card-body">
          ${babBadge}
          <div class="topic-card-title">${d.title}</div>
          <div class="topic-card-desc">${shortDesc}</div>
          <div class="topic-card-link">Mula pelajaran ${ICONS.arrowRight}</div>
        </div>
      </button>
    `;
  }).join("");

  return `
    <button class="back-btn" onclick="App.go('learning')">${ICONS.arrowLeft} Semua tingkatan</button>
    <div class="section-heading">
      <div class="tingkatan-page-badge ${tData.colorClass}">${tData.label}</div>
      <h1>${tData.subtitle}</h1>
      <p>Pilih topik di bawah untuk memulakan pelajaran.</p>
    </div>
    <div class="topics-grid ${colsClass}">${cards}</div>

    <div class="learn-owl-wrap" id="learnOwlWrap">
      <div class="learn-owl-base">
        <img src="image/owl.png" class="learn-owl-img owl-img" alt="Algi">
      </div>
      <div class="learn-owl-bubble" id="learnOwlBubble">
        <div class="learn-owl-bubble-header">
          <span class="owl-bubble-dot"></span>
          Algi 🦉
        </div>
        <div class="learn-owl-bubble-text" id="learnOwlText"></div>
      </div>
    </div>
  `;
}

function initPageOwl(message, audioId) {
  const bubble = document.getElementById("learnOwlBubble");
  const textEl = document.getElementById("learnOwlText");
  const audio  = document.getElementById(audioId);
  if (!bubble || !textEl || !audio) return;

  bubble.classList.remove("hide");
  bubble.classList.add("show");

  let i = 0;
  textEl.innerHTML = '<span class="owl-cursor"></span>';
  const type = () => {
    const el = document.getElementById("learnOwlText");
    if (!el) return;
    if (i < message.length) {
      el.innerHTML = message.slice(0, ++i) + '<span class="owl-cursor"></span>';
      setTimeout(type, 45);
    } else {
      setTimeout(() => {
        const el2 = document.getElementById("learnOwlText");
        if (el2) el2.innerHTML = message;
      }, 500);
    }
  };
  setTimeout(type, 300);

  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function initLearningOwl() {
  initPageOwl("Jom Belajar! Pilih Tingkatan anda!", "belajar-audio");
}

function initPracticeOwl() {
  initPageOwl("Sukakan Cabaran? Jom buat latihan!", "latihan-audio");
}

// ---------------------------------------------------------------------------
// LESSON — individual lesson detail page
// ---------------------------------------------------------------------------
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
      <button class="back-btn" onclick="App.go('topics', '${state.tingkatan}')">${ICONS.arrowLeft} Kembali ke topik</button>
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

      ${renderVideoSection(state.topic)}

      <div class="card">
        <div class="card-heading">Contoh kerja</div>
        <div class="example-q">${t.exampleQ}</div>
        ${steps}
      </div>

      <button class="practice-cta" onclick="App.go('practice')">Berlatih topik ini →</button>
    </div>
  `;
}

function renderVideoSection(topicKey) {
  const url = VIDEO_DATA[topicKey];
  return `
    <div class="card video-card">
      <div class="card-heading video-card-heading">
        <span class="video-card-icon">▶</span>
        Tonton Video
      </div>
      ${url
        ? `<div class="video-wrapper">
             <iframe src="${url}" frameborder="0" allowfullscreen
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
             </iframe>
           </div>`
        : `<div class="video-placeholder">
             <div class="video-play-ring">
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5,3 19,12 5,21"/></svg>
             </div>
             <p class="video-placeholder-title">Video akan ditambah tidak lama lagi</p>
             <p class="video-placeholder-sub">Semak semula kemudian! 🦉</p>
           </div>`
      }
    </div>
  `;
}

// ---------------------------------------------------------------------------
// PRACTICE — landing with all topics grouped by Tingkatan
// ---------------------------------------------------------------------------
function renderPractice() {
  const sections = TINGKATAN_DATA.map(tData => {
    const colsClass = tData.topics.length === 2 ? "cols-2" : "";

    const cards = tData.topics.map(key => {
      const d = DATA[key];
      return `
        <button class="quiz-topic-card" onclick="startQuiz('${key}')">
          <div class="quiz-topic-icon ${d.iconClass}">${d.icon}</div>
          <div class="quiz-topic-title">${d.title}</div>
          <div class="quiz-topic-meta">10 soalan · Pilihan berganda</div>
          <div class="pill-badge">Mula kuiz</div>
        </button>
      `;
    }).join("");

    return `
      <div class="practice-section">
        <div class="practice-section-header">
          <span class="tingkatan-page-badge ${tData.colorClass}">${tData.label}</span>
          <span class="practice-section-subtitle">${tData.subtitle}</span>
        </div>
        <div class="topics-grid ${colsClass}">${cards}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="section-heading">
      <h1><span class="p"></span> Latihan</h1>
      <p>Soalan pilihan berganda mengikut tingkatan — pilih topik untuk memulakan kuiz.</p>
    </div>
    ${sections}

    <div class="learn-owl-wrap" id="learnOwlWrap">
      <div class="learn-owl-base">
        <img src="image/owl.png" class="learn-owl-img owl-img" alt="Algi">
      </div>
      <div class="learn-owl-bubble" id="learnOwlBubble">
        <div class="learn-owl-bubble-header">
          <span class="owl-bubble-dot"></span>
          Algi 🦉
        </div>
        <div class="learn-owl-bubble-text" id="learnOwlText"></div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// QUIZ STATE
// ---------------------------------------------------------------------------
const QuizState = {
  questions: [],
  current: 0,
  score: 0,
  answers: [],   // -1 = unanswered, 0..3 = selected index
  answered: false,
  topic: '',
  started: false,
};

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz(topic) {
  const pool = QUIZ_QUESTIONS[topic] || [];
  // Pick 5 random questions
  const picked = shuffle(pool).slice(0, 5);
  QuizState.questions = picked;
  QuizState.current = 0;
  QuizState.score = 0;
  QuizState.answers = new Array(picked.length).fill(-1);
  QuizState.answered = false;
  QuizState.topic = topic;
  QuizState.started = true;
  App.go('quiz', topic);
}

function renderQuizPage() {
  const { questions, current, answers, answered } = QuizState;
  if (current >= questions.length) {
    // Show results screen
    const score = QuizState.score;
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const topic = DATA[QuizState.topic];
    let emoji = '😢';
    let msg = 'Cuba lagi!';
    if (pct >= 80) { emoji = '🎉'; msg = 'Hebat!'; }
    else if (pct >= 60) { emoji = '😊'; msg = 'Bagus!'; }
    else if (pct >= 40) { emoji = '🙂'; msg = 'Tidak bahaya!'; }
    return `
    <div class="quiz-page">
      <div class="results-card">
        <div class="results-emoji">${emoji}</div>
        <div class="results-title">${msg}</div>
        <div class="results-score">
          <span class="results-correct">${score}</span>
          <span class="results-div">/</span>
          <span class="results-total">${total}</span>
        </div>
        <div class="results-pct">${pct}%</div>
        <div class="results-topic">${topic?.title || 'Kuiz'}</div>
        <div class="results-actions">
          <button class="quiz-btn-retry" onclick="startQuiz('${QuizState.topic}')">🔄 Cuba Lagi</button>
          <button class="quiz-btn-home" onclick="App.go('practice')">← Menu Latihan</button>
        </div>
        ${pct >= 60 ? `<button class="btn-trophy" onclick="App.go('scoreboard')">🏆 Carta Markah</button>` : ''}
      </div>
    </div>`;
  }

  const q = questions[current];
  const letters = ['A', 'B', 'C', 'D'];
  const pct = Math.round(((current) / questions.length) * 100);
  const selectedIdx = answers[current];
  const isAnswered = answered && selectedIdx !== -1;
  const isCorrect = isAnswered && selectedIdx === q.ans;

  // Build options HTML based on answer state
  let options;
  if (!isAnswered) {
    // Not answered yet — options are clickable
    options = q.opts.map((opt, i) => `
    <div class="quiz-option" onclick="selectOption(${i})">
      <div class="quiz-option-letter">${letters[i]}</div>
      <div class="quiz-option-text">${opt}</div>
    </div>`).join('');
  } else {
    // Answered — show locked options with correct/wrong highlight
    options = q.opts.map((opt, i) => {
      let cls = 'quiz-option';
      if (i === selectedIdx) {
        cls += isCorrect ? ' selected-correct' : ' selected-wrong';
      } else if (!isCorrect && i === q.ans) {
        cls += ' selected-correct'; // show correct answer when wrong
      } else if (i !== selectedIdx && i !== q.ans) {
        cls += ' dimmed';
      }
      return `<div class="${cls}">
        <div class="quiz-option-letter">${letters[i]}</div>
        <div class="quiz-option-text">${opt}</div>
      </div>`;
    }).join('');
  }

  // Bottom action button
  let actionBtn;
  if (!isAnswered) {
    // No answer yet — show "Seterusnya" (skip) button
    actionBtn = `<button class="quiz-btn-next" onclick="advanceQuestion()">Seterusnya →</button>`;
  } else if (isCorrect) {
    // Correct — show "Seterusnya" to go to next question
    actionBtn = current < questions.length - 1
      ? `<button class="quiz-btn-next" onclick="advanceQuestion()">Seterusnya →</button>`
      : `<button class="quiz-btn-next" onclick="advanceQuestion()">Lihat Keputusan →</button>`;
  } else {
    // Wrong — show "Cuba Lagi!" button
    actionBtn = `<button class="quiz-btn-retry" onclick="retryQuestion()">🔄 Cuba Lagi!</button>`;
  }

  // Show correct answer hint when wrong
  let correctHint = '';
  if (isAnswered && !isCorrect) {
    correctHint = `<div class="quiz-correct-hint">✅ Jawapan betulkan: <strong>${letters[q.ans]}. ${q.opts[q.ans]}</strong></div>`;
  }

  return `
    <div class="quiz-page">
      <button class="back-btn" onclick="App.go('practice')">${ICONS.arrowLeft} Keluar kuiz</button>
      <div class="quiz-header-row">
        <div class="quiz-header-title">${DATA[QuizState.topic]?.title || 'Kuiz'}</div>
        <div class="quiz-header-count">Soalan ${current + 1} daripada ${questions.length}</div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="quiz-score-display">⭐ Markah: ${QuizState.score}</div>

      <div class="quiz-card">
        <div class="quiz-question-label">Soalan</div>
        <div class="quiz-question">${q.q}</div>
        ${correctHint}
        <div class="quiz-options">${options}</div>
        <div class="quiz-actions">
          <button class="quiz-btn-prev" ${current === 0 ? 'disabled' : ''} onclick="prevQuestion()">← Sebelumnya</button>
          ${actionBtn}
        </div>
      </div>
    </div>`;
}

// Retry current question (called when student clicks "Cuba Lagi")
function retryQuestion() {
  QuizState.answered = false;
  // Reset the answer for current question so they can try again
  QuizState.answers[QuizState.current] = -1;
  // Re-render the whole quiz page
  document.getElementById("app").innerHTML = renderQuizPage();
}

function selectOption(idx) {
  if (QuizState.answered) return; // prevent double-click
  QuizState.answers[QuizState.current] = idx;
  const q = QuizState.questions[QuizState.current];
  const isCorrect = idx === q.ans;

  if (isCorrect) {
    QuizState.answered = true;
    QuizState.score++;
    SFX.correct();
    showPopup('✅ Betul!', 'tahniah');
    setTimeout(() => {
      const card = document.querySelector('.quiz-card');
      if (card) card.classList.add('card-wiggle');
    }, 50);
  } else {
    SFX.wrong();
    showPopup(`❌ Salah! Cuba lagi!`, 'salah');
    setTimeout(() => {
      const card = document.querySelector('.quiz-card');
      if (card) card.classList.add('card-shake');
    }, 50);
  }

  // Re-render the whole quiz page to show correct/wrong state + appropriate button
  document.getElementById("app").innerHTML = renderQuizPage();
}

function advanceQuestion() {
  QuizState.answered = false;
  if (QuizState.current < QuizState.questions.length - 1) {
    QuizState.current++;
  } else {
    // Last question — show results
    QuizState.current = QuizState.questions.length;
  }
  // Re-render the whole quiz page
  document.getElementById("app").innerHTML = renderQuizPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextQuestion() {
  advanceQuestion();
}

function prevQuestion() {
  if (QuizState.current > 0) {
    QuizState.current--;
    // Restore answered state based on whether this question was already answered
    QuizState.answered = QuizState.answers[QuizState.current] !== -1;
    renderQuizPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showPopup(text, type) {
  const existing = document.getElementById('quiz-popup');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'quiz-popup';
  div.className = `quiz-popup ${type}`;
  div.innerHTML = `<div class="popup-text">${text}</div>`;
  document.body.appendChild(div);
  setTimeout(() => div.classList.add('popup-show'), 10);
  setTimeout(() => { div.classList.remove('popup-show'); setTimeout(() => div.remove(), 400); }, 1200);
}

// Replace renderQuiz with working version
function renderQuiz() {
  // If no quiz active, start one for current topic
  if (!QuizState.started) {
    startQuiz(state.topic);
    return '';
  }
  return renderQuizPage();
}

// ---------------------------------------------------------------------------
// SCOREBOARD
// ---------------------------------------------------------------------------
const ScoreBoard = {
  data: JSON.parse(localStorage.getItem('algebrahub_scores') || '[]'),
  save() {
    localStorage.setItem('algebrahub_scores', JSON.stringify(this.data));
  },
  add(topic, score, total) {
    this.data.unshift({ topic, score, total, date: new Date().toLocaleDateString('ms-MY'), pct: Math.round((score/total)*100) });
    if (this.data.length > 50) this.data = this.data.slice(0, 50);
    this.save();
  },
  clear() {
    this.data = [];
    this.save();
  }
};

function renderScoreBoard() {
  const entries = ScoreBoard.data;
  if (entries.length === 0) {
    return `
    <div class="scoreboard-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali</button>
      <div class="section-heading">
        <h1>🏆 Carta <span class="g">Markah</span></h1>
        <p>Semua keputusan latihan anda disimpan di sini.</p>
      </div>
      <div class="scoreboard-empty">
        <div class="scoreboard-empty-icon">📋</div>
        <div>Belum ada keputusan lagi.</div>
        <div class="scoreboard-empty-sub">Cuba buat latihan dulu!</div>
        <button class="quiz-btn-next" onclick="App.go('practice')" style="margin-top:18px">Mula Latihan →</button>
      </div>
    </div>`;
  }

  const rows = entries.map((e, i) => {
    const pct = e.pct;
    let color = '#EF4444';
    if (pct >= 80) color = '#10B981';
    else if (pct >= 60) color = '#F59E0B';
    else if (pct >= 40) color = '#3B82F6';
    return `
    <div class="sb-row">
      <div class="sb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</div>
      <div class="sb-topic">${DATA[e.topic]?.title || e.topic}</div>
      <div class="sb-score">${e.score}/${e.total}</div>
      <div class="sb-pct" style="color:${color}">${pct}%</div>
      <div class="sb-date">${e.date}</div>
    </div>`;
  }).join('');

  return `
    <div class="scoreboard-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali</button>
      <div class="section-heading">
        <h1>🏆 Carta <span class="g">Markah</span></h1>
        <p>Semua keputusan latihan anda disimpan di sini.</p>
      </div>
      <div class="scoreboard-header-row">
        <div class="sb-col-title">Topik</div>
        <div class="sb-col-title">Skor</div>
        <div class="sb-col-title">Peratus</div>
        <div class="sb-col-title">Tarikh</div>
      </div>
      <div class="sb-list">${rows}</div>
      <div class="sb-clear-wrap">
        <button class="sb-clear-btn" onclick="if(confirm('Padam semua rekod?')){ScoreBoard.clear();render();}">🗑 Padam Rekod</button>
      </div>
    </div>`;
}

// When quiz finishes, save score
const _origGo = App.go.bind(App);
App.go = function(view, param) {
  if (QuizState.started && view !== 'quiz' && view !== 'scoreboard') {
    // Navigating away — save score if quiz was in progress
    if (QuizState.questions.length > 0) {
      ScoreBoard.add(QuizState.topic, QuizState.score, QuizState.questions.length);
    }
    QuizState.started = false;
  }
  _origGo(view, param);
};

// ---------------------------------------------------------------------------
// GAME DATA — drag & drop terms + definitions (from notes pages)
// ---------------------------------------------------------------------------
const GAME_DATA = {
  dragdrop: [
    { term: "Kecerunan", def: "Nisbah jarak mencancang dengan jarak mengufuk garis", icon: "📈" },
    { term: "Punca", def: "Nilai x di mana graf memotong paksi-x", icon: "✖" },
    { term: "Pintasan-y", def: "Nilai y di mana garis memotong paksi-y", icon: "📍" },
    { term: "Pekali", def: "Nombor yang mendarab pemboleh ubah", icon: "🔢" },
    { term: "Pemalar", def: "Nilai tetap tanpa pemboleh ubah", icon: "🔒" },
    { term: "Parabola", def: "Graf berbentuk U bagi fungsi kuadratik", icon: "⌣" },
    { term: "Indeks", def: "Kuasa atau eksponen suatu nombor", icon: "ⁿ" },
    { term: "Matriks", def: "Susunan nombor dalam baris dan lajur", icon: "▦" },
    { term: "Punca Kuasa Dua", def: "Nombor yang didarab dengan dirinya sendiri", icon: "√" },
    { term: "Kuasa Dua Sempurna", def: "Hasil darab nombor dengan dirinya sendiri: 1, 4, 9, 16, 25...", icon: "²" },
    { term: "Nisbah", def: "Perbandingan dua kuantiti, contoh a : b", icon: "⚖" },
  ],
  wordmatch: [
    { term: "Cerun", def: "Kecerunan garis, naik atas turun", icon: "📐" },
    { term: "Punca", def: "Di mana graf memotong paksi-x", icon: "✖" },
    { term: "Puncak", def: "Titik pusingan maksimum atau minimum parabola", icon: "⬆" },
    { term: "Pemalar", def: "Istilah tanpa pemboleh ubah", icon: "🔒" },
    { term: "Pintasan-y", def: "Titik garis memotong paksi-y", icon: "📍" },
    { term: "Indeks", def: "Kuasa dalam pendaraban berulang (aⁿ)", icon: "ⁿ" },
    { term: "Faktor", def: "Pembahagi yang tepat bagi suatu ungkapan", icon: "÷" },
    { term: "Ubahan", def: "Hubungan antara dua kuantiti yang berubah", icon: "↗" },
    { term: "Kadar", def: "Nilai perubahan bagi setiap 1 unit", icon: "⚡" },
    { term: "Kadaran", def: "a/b = c/d → ad = bc", icon: "📐" },
    { term: "FSTB", def: "Faktor Sepunya Terbesar", icon: "🔢" },
    { term: "Perkara Rumus", def: "Pemboleh ubah yang berdiri sendiri di hadapan persamaan", icon: "S=" },
  ],
  // 3rd game: algebra bubble pop
  bubblepop: [
    // Ungkapan Algebra
    { q: "Kembangkan 3(2x + 4) = ?", ans: "6x + 12", alt: ["3x + 12","6x + 4","6x + 7"] },
    { q: "Faktorkan 6x + 9 = ?", ans: "3(2x + 3)", alt: ["6(x + 9)","2(3x + 4)","3(2x − 3)"] },
    { q: "Kembangkan −2(3x + 4) = ?", ans: "−6x − 8", alt: ["−6x + 8","6x − 8","−6x + 4"] },
    { q: "Faktorkan x² − 9 = ?", ans: "(x−3)(x+3)", alt: ["(x−9)(x+1)","(x−3)²","(x+3)²"] },
    // Kuasa Dua & Tiga
    { q: "Nilai 2³ = ?", ans: "8", alt: ["6","9","5"] },
    { q: "³√27 = ?", ans: "3", alt: ["9","6","2"] },
    { q: "√144 = ?", ans: "12", alt: ["11","14","13"] },
    { q: "4² = ?", ans: "16", alt: ["8","6","12"] },
    // Indeks
    { q: "Nilai 5⁰ = ?", ans: "1", alt: ["0","5","10"] },
    { q: "Permudahkan x⁶ ÷ x² = ?", ans: "x⁴", alt: ["x⁸","x³","x⁻⁴"] },
    { q: "Nilai 2⁻³ = ?", ans: "1/8", alt: ["−8","8","−1/8"] },
    { q: "Permudahkan (x³)² = ?", ans: "x⁶", alt: ["x⁵","x⁹","x¹"] },
    // Garis Lurus
    { q: "Kecerunan y = 3x − 5 = ?", ans: "3", alt: ["−5","5","−3"] },
    { q: "Pintasan-y bagi y = 2x + 7 = ?", ans: "7", alt: ["2","−7","14"] },
    // Rumus
    { q: "A = ½bh → h = ?", ans: "2A/b", alt: ["A/2b","Ab/2","2b/A"] },
    { q: "v = u + at → a = ?", ans: "(v−u)/t", alt: ["v−u+t","v/u−t","v+t/u"] },
    // Kuadratik
    { q: "Faktorkan x² − 5x + 6 = ?", ans: "(x−2)(x−3)", alt: ["(x−1)(x−6)","(x+2)(x+3)","(x−3)²"] },
    { q: "Selesaikan x² = 25.", ans: "x = ±5", alt: ["x = 5","x = 25","x = ±25"] },
    { q: "Punca x² − 4 = 0.", ans: "x = ±2", alt: ["x = 2","x = 4","x = ±4"] },
    // Matriks
    { q: "det [[3,1],[2,4]] = ?", ans: "10", alt: ["12","14","8"] },
    { q: "det [[4,3],[2,1]] = ?", ans: "−2", alt: ["2","10","−10"] },
    // Sistem Persamaan
    { q: "Selesaikan: x + y = 6, x − y = 2. x = ?", ans: "4", alt: ["2","3","6"] },
    // Ubahan
    { q: "y ∝ x. Jika y = 12, x = 4, k = ?", ans: "3", alt: ["48","4","8"] },
    // Ketaksamaan
    { q: "Selesaikan 3x − 6 > 9.", ans: "x > 5", alt: ["x > 1","x > 3","x < 5"] },
    // Fungsi
    { q: "fg(2) jika f(x) = x+1, g(x) = 3x.", ans: "7", alt: ["9","6","5"] },
  ],
};

// ---------------------------------------------------------------------------
// GAME STATE
// ---------------------------------------------------------------------------
const GameState = {
  dragdrop: { score: 0, matched: 0, total: 0, items: [], selected: null },
  wordmatch: { score: 0, matched: 0, total: 0, items: [], selTerm: null, selDef: null },
  bubblepop: { score: 0, qIndex: 0, questions: [], selected: null, answered: false },
  rocket: { phase: 'menu', mission: 1, questions: [], current: 0, score: 0, lives: 3, streak: 0, maxStreak: 0, fuel: 0, answers: [], startTime: null, questionsDone: 0, correctCount: 0, wrongCount: 0 },
  speedrace: { phase: 'menu', mode: 'time', questions: [], current: 0, score: 0, combo: 0, maxCombo: 0, mistakes: 3, answers: [], timeLeft: 60, startTime: null, qDone: 0, correctCount: 0, speed: 0 },
};

// ---------------------------------------------------------------------------
// GAME — landing
// ---------------------------------------------------------------------------
function renderGame() {
  return `
    <div class="section-heading">
      <h1>Algebra <span class="g">Permainan</span></h1>
      <p>Belajar sambil bermain — pilih permainan untuk dimulakan.</p>
    </div>
    <div class="scoreboard-link-wrap">
      <button class="scoreboard-link-btn" onclick="App.go('scoreboard')">
        🏆 Carta Markah
      </button>
    </div>
    <div class="games-grid">
      <button class="game-card" onclick="initDragDrop();App.go('dragdrop')">
        <div class="game-card-banner dragdrop">
          <div class="game-banner-icon">🖱️</div>
          <div class="game-banner-label">SERET & LEPAS</div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Seret &amp; Lepas</div>
          <div class="game-card-desc">Seret setiap istilah algebra ke definisi yang sepadan.</div>
        </div>
      </button>
      <button class="game-card" onclick="initWordMatch();App.go('wordmatch')">
        <div class="game-card-banner wordmatch">
          <div class="game-banner-icon">🎯</div>
          <div class="game-banner-label">PADANAN</div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Padanan Kata</div>
          <div class="game-card-desc">Hubungkan setiap istilah di kiri dengan maknanya di kanan.</div>
        </div>
      </button>
      <button class="game-card" onclick="initBubblePop();App.go('bubblepop')">
        <div class="game-card-banner bubblepop">
          <div class="game-banner-icon">🎈</div>
          <div class="game-banner-label">BUBBLE POP</div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Bubble Pop</div>
          <div class="game-card-desc">Pasang jawapan yang betul untuk memecahkan gelembung!</div>
        </div>
      </button>
      <button class="game-card" onclick="initRocketMenu();App.go('rocket')">
        <div class="game-card-banner rocket-banner">
          <div class="game-banner-icon">🚀</div>
          <div class="game-banner-label">ROCKET</div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Rocket Algebra Mission</div>
          <div class="game-card-desc">Jawab soalan algebra untuk melancarkan roket dan jelajahi planet!</div>
        </div>
      </button>
      <button class="game-card" onclick="initSpeedRaceMenu();App.go('speedrace')">
        <div class="game-card-banner speedrace-banner">
          <div class="game-banner-icon">🏎️</div>
          <div class="game-banner-label">RACE</div>
        </div>
        <div class="game-card-body">
          <div class="game-card-title">Algebra Speed Race</div>
          <div class="game-card-desc">Selesaikan soalan algebra untuk memecut kereta lumba!</div>
        </div>
      </button>
    </div>

    <div class="learn-owl-wrap" id="learnOwlWrap">
      <div class="learn-owl-base">
        <img src="image/owl.png" class="learn-owl-img owl-img" alt="Algi">
      </div>
      <div class="learn-owl-bubble" id="learnOwlBubble">
        <div class="learn-owl-bubble-header">
          <span class="owl-bubble-dot"></span>
          Algi 🦉
        </div>
        <div class="learn-owl-bubble-text" id="learnOwlText"></div>
      </div>
    </div>
  `;
}

function initGameOwl() {
  initPageOwl("Sudahkah anda bersedia? Jom kita bermain.", "main-audio");
}

// Fisher-Yates shuffle
function gShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// DRAG & DROP — fully working
// ---------------------------------------------------------------------------
function initDragDrop() {
  const pool = gShuffle(GAME_DATA.dragdrop).slice(0, 6);
  const defs = gShuffle(pool.map(i => ({ ...i })));
  GameState.dragdrop = {
    items: pool,
    defs,
    matched: 0,
    total: pool.length,
    score: 0,
    dragged: null,
  };
}

function renderDragDrop() {
  const gs = GameState.dragdrop;
  if (!gs.items.length) { initDragDrop(); return renderDragDrop(); }

  const termsHTML = gs.items.map((item, i) => {
    const matched = gs.defs.find(d => d.term === item.term && d.matched);
    return matched
      ? `<div class="dd-term dd-term-used" title="${item.def}">${item.icon} ${item.term} ✓</div>`
      : `<div class="dd-term dd-term-active" draggable="true" data-term="${item.term}"
          ondragstart="ddDragStart(event)" ondragend="ddDragEnd(event)">${item.icon} ${item.term}</div>`;
  }).join('');

  const defsHTML = gs.defs.map((item, i) => {
    if (item.matched) {
      return `<div class="dd-target dd-target-done">
        <div class="dd-target-icon">${item.icon}</div>
        <div class="dd-target-def">${item.def}</div>
        <div class="dd-target-matched">${item.term} ✓</div>
      </div>`;
    }
    return `<div class="dd-target ${gs.dragover === i ? 'dd-target-over' : ''}"
      ondragover="ddDragOver(event,${i})" ondrop="ddDrop(event,${i})"
      ondragleave="ddDragLeave(event)">
      <div class="dd-target-icon">${item.icon}</div>
      <div class="dd-target-def">${item.def}</div>
      <div class="dd-drop-zone">⬇ Seret ke sini</div>
    </div>`;
  }).join('');

  const done = gs.matched === gs.total;
  return `
    <div class="game-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali</button>
      <div class="game-page-header">
        <div class="game-page-title">🖱️ Seret &amp; Lepas</div>
        <div class="stat-badges">
          <div class="stat-badge gold">⭐ ${gs.score} markah</div>
          <div class="stat-badge purple">✅ ${gs.matched}/${gs.total}</div>
        </div>
      </div>

      ${done ? `
        <div class="game-complete-card">
          <div class="game-complete-emoji">🎉</div>
          <div class="game-complete-title">Tahniah!</div>
          <div class="game-complete-score">Markah: ${gs.score} / ${gs.total * 10}</div>
          <div class="game-complete-sub">Semua istilah telah dipadankan!</div>
          <div class="game-complete-actions">
            <button class="game-btn-play" onclick="initDragDrop();render();">🔄 Main Lagi</button>
            <button class="game-btn-back" onclick="App.go('game')">← Menu</button>
          </div>
        </div>` : `
        <div class="dd-card">
          <div class="dd-instructions">Seret istilah di bawah ke kotak definisi yang sepadan</div>
          <div class="dd-bank">${termsHTML}</div>
          <div class="dd-targets">${defsHTML}</div>
        </div>`}
    </div>`;
}

function ddDragStart(e) {
  GameState.dragdrop.dragged = e.target.dataset.term;
  e.target.classList.add('dd-term-dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function ddDragEnd(e) {
  e.target.classList.remove('dd-term-dragging');
  GameState.dragdrop.dragover = null;
}
function ddDragOver(e, i) {
  e.preventDefault();
  GameState.dragdrop.dragover = i;
  e.dataTransfer.dropEffect = 'move';
}
function ddDragLeave(e) {}
function ddDrop(e, defIndex) {
  e.preventDefault();
  const gs = GameState.dragdrop;
  const term = gs.dragged;
  if (!term) return;
  const def = gs.defs[defIndex];
  if (def.matched) return;

  if (def.term === term) {
    def.matched = true;
    gs.matched++;
    gs.score += 10;
    SFX.correct();
    showPopup('✅ Betul!', 'tahniah');
  } else {
    gs.score = Math.max(0, gs.score - 2);
    SFX.wrong();
    showPopup('❌ Cuba lagi!', 'salah');
  }
  gs.dragged = null;
  gs.dragover = null;
  render();
}

// ---------------------------------------------------------------------------
// WORD MATCH — fully working
// ---------------------------------------------------------------------------
function initWordMatch() {
  const pool = gShuffle(GAME_DATA.wordmatch).slice(0, 6);
  GameState.wordmatch = {
    items: pool,
    matched: 0,
    total: pool.length,
    score: 0,
    selTerm: null,
    selDef: null,
    termPairs: pool.map(i => i.term),
    defPairs: gShuffle(pool.map(i => i.def)),
  };
}

function renderWordMatch() {
  const gs = GameState.wordmatch;
  if (!gs.items.length) { initWordMatch(); return renderWordMatch(); }

  const termsHTML = gs.termPairs.map((term, i) => {
    const item = gs.items.find(x => x.term === term);
    const isMatched = gs.items.some(x => x.term === term && x.matched);
    const isSelected = gs.selTerm === term;
    if (isMatched) return `<div class="wm-item wm-item-matched">${item.icon} ${term} ✓</div>`;
    return `<div class="wm-item wm-item-term ${isSelected ? 'wm-item-sel' : ''}" onclick="wmSelectTerm('${term}')">${item.icon} ${term}</div>`;
  }).join('');

  const defsHTML = gs.defPairs.map((def, i) => {
    const isMatched = gs.items.some(x => x.def === def && x.matched);
    const isSelected = gs.selDef === def;
    const item = gs.items.find(x => x.def === def);
    if (isMatched) return `<div class="wm-item wm-item-matched wm-item-def">${item.icon} ${def} ✓</div>`;
    return `<div class="wm-item wm-item-def ${isSelected ? 'wm-item-sel' : ''}" onclick="wmSelectDef('${def}')">${item.icon} ${def}</div>`;
  }).join('');

  const done = gs.matched === gs.total;
  return `
    <div class="game-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali</button>
      <div class="game-page-header">
        <div class="game-page-title">🎯 Padanan Kata</div>
        <div class="stat-badges">
          <div class="stat-badge gold">⭐ ${gs.score} markah</div>
          <div class="stat-badge purple">✅ ${gs.matched}/${gs.total}</div>
        </div>
      </div>

      ${done ? `
        <div class="game-complete-card">
          <div class="game-complete-emoji">🎉</div>
          <div class="game-complete-title">Tahniah!</div>
          <div class="game-complete-score">Markah: ${gs.score} / ${gs.total * 10}</div>
          <div class="game-complete-sub">Semua padanan selesai!</div>
          <div class="game-complete-actions">
            <button class="game-btn-play" onclick="initWordMatch();render();">🔄 Main Lagi</button>
            <button class="game-btn-back" onclick="App.go('game')">← Menu</button>
          </div>
        </div>` : `
        <div class="wm-card">
          <div class="wm-instructions">${gs.selTerm && gs.selDef ? '✔ Padankan sekarang!' : gs.selTerm ? '▶ Pilih definisi di kanan' : gs.selDef ? '▶ Pilih istilah di kiri' : 'Pilih istilah di kiri, kemudian definisi di kanan'}</div>
          <div class="wm-columns-wm">
            <div class="wm-col-wm">
              <div class="wm-col-label">📝 Istilah</div>
              ${termsHTML}
            </div>
            <div class="wm-divider">
              <svg width="24" height="120" viewBox="0 0 24 120" fill="none" stroke="#C9B6F6" stroke-width="2" stroke-dasharray="4 4"><path d="M4 10h16M4 60h16M4 110h16"/></svg>
            </div>
            <div class="wm-col-wm">
              <div class="wm-col-label">📖 Definisi</div>
              ${defsHTML}
            </div>
          </div>
        </div>`}
    </div>`;
}

function wmSelectTerm(term) {
  const gs = GameState.wordmatch;
  if (gs.items.some(x => x.term === term && x.matched)) return;
  gs.selTerm = gs.selTerm === term ? null : term;
  if (gs.selTerm && gs.selDef) tryMatchWM();
  render();
}

function wmSelectDef(def) {
  const gs = GameState.wordmatch;
  if (gs.items.some(x => x.def === def && x.matched)) return;
  gs.selDef = gs.selDef === def ? null : def;
  if (gs.selTerm && gs.selDef) tryMatchWM();
  render();
}

function tryMatchWM() {
  const gs = GameState.wordmatch;
  const term = gs.selTerm;
  const def = gs.selDef;
  const item = gs.items.find(x => x.term === term);

  if (item && item.def === def) {
    item.matched = true;
    gs.matched++;
    gs.score += 10;
    SFX.correct();
    showPopup('✅ Betul!', 'tahniah');
  } else {
    gs.score = Math.max(0, gs.score - 2);
    SFX.wrong();
    showPopup('❌ Cuba lagi!', 'salah');
  }
  gs.selTerm = null;
  gs.selDef = null;
}

// ---------------------------------------------------------------------------
// BUBBLE POP — fully working
// ---------------------------------------------------------------------------
function initBubblePop() {
  const pool = gShuffle(GAME_DATA.bubblepop);
  GameState.bubblepop = {
    questions: pool,
    qIndex: 0,
    score: 0,
    selected: null,
    answered: false,
  };
}

function renderBubblePop() {
  const gs = GameState.bubblepop;
  if (gs.qIndex >= gs.questions.length) {
    const pct = Math.round((gs.score / gs.questions.length) * 10);
    let emoji = '😢', msg = 'Cuba Lagi!';
    if (pct >= 8) { emoji = '🎉'; msg = 'Hebat!'; }
    else if (pct >= 6) { emoji = '😊'; msg = 'Bagus!'; }
    else if (pct >= 4) { emoji = '🙂'; msg = 'Tidak Bad!'; }
    return `
    <div class="game-page">
      <div class="game-complete-card">
        <div class="game-complete-emoji">${emoji}</div>
        <div class="game-complete-title">${msg}</div>
        <div class="game-complete-score">Skor: ${gs.score} / ${gs.questions.length}</div>
        <div class="game-complete-sub">${gs.questions.length} soalan dijawab!</div>
        <div class="game-complete-actions">
          <button class="game-btn-play" onclick="initBubblePop();render();">🔄 Main Lagi</button>
          <button class="game-btn-back" onclick="App.go('game')">← Menu</button>
        </div>
      </div>
    </div>`;
  }

  const q = gs.questions[gs.qIndex];
  const opts = gShuffle([q.ans, ...q.alt]);

  const bubblesHTML = opts.map((opt, i) => {
    let cls = 'bubble-btn';
    if (gs.selected === opt) {
      if (gs.answered) {
        cls = opt === q.ans ? 'bubble-btn bubble-correct' : (gs.selected === opt ? 'bubble-btn bubble-wrong' : 'bubble-btn');
      } else {
        cls = 'bubble-btn bubble-selected';
      }
    }
    return `<button class="${cls}" onclick='bubbleSelect("${opt.replace(/"/g, '&quot;')}")' ${gs.answered ? 'disabled' : ''}>${opt}</button>`;
  }).join('');

  const feedbackHTML = gs.answered ? (gs.selected === q.ans
    ? `<div class="bubble-feedback bubble-feedback-correct">✅ Betul! +1</div>`
    : `<div class="bubble-feedback bubble-feedback-wrong">❌ Jawapan: ${q.ans}</div>`
  ) : '';

  const progress = Math.round((gs.qIndex / gs.questions.length) * 100);

  return `
    <div class="game-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali</button>
      <div class="game-page-header">
        <div class="game-page-title">🎈 Bubble Pop</div>
        <div class="stat-badges">
          <div class="stat-badge gold">⭐ ${gs.score} markah</div>
          <div class="stat-badge purple">🔢 ${gs.qIndex + 1}/${gs.questions.length}</div>
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>

      <div class="bubble-card">
        <div class="bubble-question">${q.q}</div>
        <div class="bubble-options">${bubblesHTML}</div>
        ${feedbackHTML}
        ${gs.answered ? `<button class="bubble-next-btn" onclick="bubbleNext()">Soalan Seterusnya →</button>` : ''}
      </div>
    </div>`;
}

function bubbleSelect(opt) {
  const gs = GameState.bubblepop;
  if (gs.answered) return;
  gs.selected = opt;
  gs.answered = true;
  render();
  const q = gs.questions[gs.qIndex];
  if (opt === q.ans) {
    gs.score++;
    SFX.correct();
    showPopup('✅ Betul!', 'tahniah');
  } else {
    SFX.wrong();
    showPopup(`❌ ${q.ans}`, 'salah');
  }
}

function bubbleNext() {
  const gs = GameState.bubblepop;
  gs.qIndex++;
  gs.selected = null;
  gs.answered = false;
  render();
}

// ---------------------------------------------------------------------------
// MAIN RENDER DISPATCH
// ---------------------------------------------------------------------------
function render() {
  renderNav();

  const renderers = {
    home:      renderHome,
    learning:  renderLearning,
    topics:    renderTopics,
    lesson:    renderLesson,
    practice:  renderPractice,
    quiz:      renderQuiz,
    game:      renderGame,
    dragdrop:  renderDragDrop,
    wordmatch: renderWordMatch,
    bubblepop: renderBubblePop,
    scoreboard: renderScoreBoard,
    rocket:    renderRocket,
    speedrace: renderSpeedRace,
  };

  document.getElementById("app").innerHTML = (
    renderers[state.view] || renderHome
  )();

  // Convert every "a/b" on the freshly rendered page into a stacked fraction.
  applyFractionFormat(document.getElementById("app"));

  if (state.view === "home")     setTimeout(initOwlGreeting,  200);
  if (state.view === "learning") setTimeout(initLearningOwl,  300);
  if (state.view === "topics")   setTimeout(initLearningOwl,  300);
  if (state.view === "practice") setTimeout(initPracticeOwl,  300);
  if (state.view === "game")     setTimeout(initGameOwl,      300);
}

// ===========================================================================
// ROCKET ALGEBRA MISSION
// ===========================================================================

// Load saved progress
function rocketLoadProgress() {
  try {
    return JSON.parse(localStorage.getItem('algebraHub.rocket')) || { unlocked: [1], bestScores: {} };
  } catch { return { unlocked: [1], bestScores: {} }; }
}
function rocketSaveProgress(data) {
  try { localStorage.setItem('algebraHub.rocket', JSON.stringify(data)); } catch {}
}

function initRocketMenu() {
  GameState.rocket = { phase: 'menu', mission: 1, questions: [], current: 0, score: 0, lives: 3, streak: 0, maxStreak: 0, fuel: 0, answers: [], startTime: null, questionsDone: 0, correctCount: 0, wrongCount: 0 };
}

function initRocketMission(level) {
  const pool = ROCKET_QUESTIONS[level] || [];
  const picked = gShuffle(pool).slice(0, 7);
  GameState.rocket = {
    phase: 'playing', mission: level, questions: picked,
    current: 0, score: 0, lives: 3, streak: 0, maxStreak: 0,
    fuel: 0, answers: new Array(picked.length).fill(null),
    startTime: Date.now(), questionsDone: 0, correctCount: 0, wrongCount: 0
  };
  document.getElementById("app").innerHTML = renderRocket();
}

function renderRocket() {
  const gs = GameState.rocket;
  const prog = rocketLoadProgress();

  // MENU
  if (gs.phase === 'menu') {
    return `
    <div class="rocket-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali</button>
      <div class="rocket-menu">
        <div class="rocket-stars-bg" aria-hidden="true"></div>
        <div class="rocket-title-wrap">
          <div class="rocket-rocket-anim" aria-hidden="true">
            <svg class="rocket-svg" viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
              <path class="rocket-body" d="M30 5 L45 40 L45 70 L30 80 L15 70 L15 40 Z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
              <path d="M15 40 L5 60 L15 55 Z" fill="#CBD5E1"/>
              <path d="M45 40 L55 60 L45 55 Z" fill="#CBD5E1"/>
              <rect x="22" y="35" width="16" height="12" rx="3" fill="#7C3AED" opacity="0.8"/>
              <rect x="25" y="38" width="10" height="6" rx="2" fill="#C4B5FD"/>
              <path class="rocket-fin" d="M20 70 L10 90 L20 80 Z" fill="#EF4444"/>
              <path class="rocket-fin" d="M40 70 L50 90 L40 80 Z" fill="#EF4444"/>
              <ellipse class="rocket-flame" cx="30" cy="82" rx="8" ry="14" fill="#F97316" opacity="0.9">
                <animate attributeName="ry" values="14;10;14" dur="0.15s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0.6;0.9" dur="0.15s" repeatCount="indefinite"/>
              </ellipse>
              <ellipse cx="30" cy="82" rx="4" ry="8" fill="#FCD34D">
                <animate attributeName="ry" values="8;5;8" dur="0.15s" repeatCount="indefinite"/>
              </ellipse>
            </svg>
          </div>
          <h1 class="rocket-game-title">Rocket Algebra Mission</h1>
          <p class="rocket-game-subtitle">Jawab soalan algebra untuk melancarkan roket dan jelajahi planet!</p>
        </div>
        <div class="rocket-missions">
          ${[1,2,3].map(lvl => {
            const unlocked = prog.unlocked.includes(lvl);
            const best = prog.bestScores[lvl] || 0;
            const names = ['Beginner Orbit', 'Planet Explorer', 'Galactic Challenge'];
            const colors = ['#10B981','#3B82F6','#8B5CF6'];
            const icons = ['🪐','🌍','🚀'];
            return `
            <button class="rocket-mission-btn ${!unlocked ? 'locked' : ''}"
              ${!unlocked ? 'disabled' : `onclick="initRocketMission(${lvl})"`}
              style="--mc:${colors[lvl-1]}">
              <div class="rocket-mission-icon">${icons[lvl-1]}</div>
              <div class="rocket-mission-info">
                <div class="rocket-mission-name">Mission ${lvl}</div>
                <div class="rocket-mission-title">${names[lvl-1]}</div>
                ${unlocked ? `<div class="rocket-mission-best">🏆 Tertinggi: ${best}</div>` : '<div class="rocket-mission-locked">🔒 Kunci</div>'}
              </div>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  // PLAYING
  if (gs.phase === 'playing') {
    const q = gs.questions[gs.current];
    const pct = Math.round((gs.current / gs.questions.length) * 100);
    const letters = ['A', 'B', 'C', 'D'];
    const selected = gs.answers[gs.current];
    const answered = selected !== null;

    const optionsHTML = q.opts.map((opt, i) => {
      let cls = 'rocket-opt';
      if (answered) {
        if (i === q.ans) cls += ' rocket-opt-correct';
        else if (i === selected) cls += ' rocket-opt-wrong';
        else cls += ' rocket-opt-dim';
      }
      return `<button class="${cls}" ${answered ? 'disabled' : `onclick="rocketSelect(${i})"`}>
        <span class="rocket-opt-letter">${letters[i]}</span>
        <span class="rocket-opt-text">${opt}</span>
      </button>`;
    }).join('');

    const missionNames = ['Beginner Orbit', 'Planet Explorer', 'Galactic Challenge'];
    const hearts = Array(3).fill(0).map((_, i) => i < gs.lives ? '❤️' : '🖤').join('');
    const streakStars = '⭐'.repeat(Math.min(gs.streak, 5));

    return `
    <div class="rocket-game-page">
      <div class="rocket-hud">
        <button class="rocket-hud-back" onclick="rocketExit()">${ICONS.arrowLeft}</button>
        <div class="rocket-hud-info">
          <div class="rocket-hud-mission">Mission ${gs.mission}: ${missionNames[gs.mission-1]}</div>
          <div class="rocket-hud-progress">Soalan ${gs.current + 1} / ${gs.questions.length}</div>
        </div>
        <div class="rocket-hud-stats">
          <span class="rocket-hud-hearts">${hearts}</span>
          <span class="rocket-hud-score">⭐ ${gs.score}</span>
          ${gs.streak > 0 ? `<span class="rocket-hud-streak">${streakStars} x${gs.streak}</span>` : ''}
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%; background: var(--purple)"></div></div>

      <div class="rocket-game-area">
        <div class="rocket-scene">
          <div class="rocket-fuel-bar">
            <div class="rocket-fuel-label">⛽ Roket Bahan Api</div>
            <div class="rocket-fuel-track">
              <div class="rocket-fuel-fill" style="width:${gs.fuel}%"></div>
            </div>
          </div>
          <div class="rocket-rocket-scene" style="bottom:${10 + gs.fuel * 0.4}%">
            <svg class="rocket-svg-small" viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 5 L45 40 L45 70 L30 80 L15 70 L15 40 Z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
              <rect x="22" y="35" width="16" height="12" rx="3" fill="#7C3AED" opacity="0.8"/>
              <rect x="25" y="38" width="10" height="6" rx="2" fill="#C4B5FD"/>
              <path d="M20 70 L10 90 L20 80 Z" fill="#EF4444"/>
              <path d="M40 70 L50 90 L40 80 Z" fill="#EF4444"/>
              <ellipse class="rocket-flame-scene" cx="30" cy="82" rx="8" ry="${10 + gs.streak * 2}" fill="#F97316" opacity="0.9">
                <animate attributeName="ry" values="${10 + gs.streak*2};${7 + gs.streak};${10 + gs.streak*2}" dur="0.2s" repeatCount="indefinite"/>
              </ellipse>
              <ellipse cx="30" cy="82" rx="4" ry="${5 + gs.streak}" fill="#FCD34D">
                <animate attributeName="ry" values="${5 + gs.streak};${3 + gs.streak};${5 + gs.streak}" dur="0.2s" repeatCount="indefinite"/>
              </ellipse>
            </svg>
          </div>
          <div class="rocket-stars-field" aria-hidden="true">
            ${Array(12).fill(0).map((_,i) => `<div class="star" style="--sx:${5+i*8}%;--sy:${10+i*7}%;--sd:${0.3+i*0.05}s"></div>`).join('')}
          </div>
        </div>

        <div class="rocket-question-area">
          <div class="rocket-q-card">
            <div class="rocket-q-text">${q.q}</div>
            <div class="rocket-options">${optionsHTML}</div>
            ${answered ? `<div class="rocket-feedback-wrap">
              ${selected === q.ans
                ? `<div class="rocket-feedback rocket-fb-correct">✅ Betul! +${100 + gs.streak * 25}</div>`
                : `<div class="rocket-feedback rocket-fb-wrong">❌ ${q.exp}</div>`}
              <button class="rocket-next-btn" onclick="rocketNext()">
                ${gs.current < gs.questions.length - 1 ? 'Soalan Seterusnya →' : 'Lihat Keputusan 🎉'}
              </button>
            </div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }

  // LOST
  if (gs.phase === 'lost') {
    return `
    <div class="rocket-game-page">
      <div class="rocket-end-screen rocket-lost">
        <div class="rocket-end-emoji">💥</div>
        <h2>Mission Gagal!</h2>
        <p>Roket kehabisan bahan api...</p>
        <div class="rocket-end-stats">
          <div class="rocket-stat"><span>🏆 Markah:</span> <strong>${gs.score}</strong></div>
          <div class="rocket-stat"><span>✅ Betul:</span> <strong>${gs.correctCount}</strong></div>
          <div class="rocket-stat"><span>❌ Salah:</span> <strong>${gs.wrongCount}</strong></div>
          <div class="rocket-stat"><span>⭐ Streak Terbaik:</span> <strong>${gs.maxStreak}</strong></div>
        </div>
        <div class="rocket-end-actions">
          <button class="rocket-btn-retry" onclick="initRocketMission(${gs.mission})">🔄 Cuba Lagi</button>
          <button class="rocket-btn-back" onclick="initRocketMenu(); document.getElementById('app').innerHTML=renderRocket()">🗺️ Peta Mission</button>
        </div>
      </div>
    </div>`;
  }

  // WON
  if (gs.phase === 'won') {
    const elapsed = Math.round((Date.now() - gs.startTime) / 1000);
    const acc = gs.questions.length > 0 ? Math.round((gs.correctCount / gs.questions.length) * 100) : 0;
    const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : 1;

    // Save progress
    const prog = rocketLoadProgress();
    if (!prog.unlocked.includes(gs.mission + 1) && gs.mission < 3) prog.unlocked.push(gs.mission + 1);
    prog.bestScores[gs.mission] = Math.max(prog.bestScores[gs.mission] || 0, gs.score);
    rocketSaveProgress(prog);

    return `
    <div class="rocket-game-page">
      <div class="rocket-end-screen rocket-won">
        <div class="rocket-end-emoji">🎉🚀</div>
        <h2>Mission Berjaya!</h2>
        <p>Roket berjaya dilancarkan!</p>
        <div class="rocket-stars-earned">${'⭐'.repeat(stars)}</div>
        <div class="rocket-end-stats">
          <div class="rocket-stat"><span>🏆 Markah:</span> <strong>${gs.score}</strong></div>
          <div class="rocket-stat"><span>✅ Betul:</span> <strong>${gs.correctCount}</strong></div>
          <div class="rocket-stat"><span>❌ Salah:</span> <strong>${gs.wrongCount}</strong></div>
          <div class="rocket-stat"><span>⭐ Streak:</span> <strong>${gs.maxStreak}</strong></div>
          <div class="rocket-stat"><span>⏱️ Masa:</span> <strong>${elapsed}s</strong></div>
        </div>
        <div class="rocket-end-actions">
          ${gs.mission < 3 ? `<button class="rocket-btn-next" onclick="initRocketMission(${gs.mission + 1})">Mission Seterusnya 🚀</button>` : ''}
          <button class="rocket-btn-retry" onclick="initRocketMission(${gs.mission})">🔄 Main Lagi</button>
          <button class="rocket-btn-back" onclick="initRocketMenu(); document.getElementById('app').innerHTML=renderRocket()">🗺️ Peta Mission</button>
        </div>
      </div>
    </div>`;
  }

  return '';
}

function rocketSelect(idx) {
  const gs = GameState.rocket;
  if (gs.answers[gs.current] !== null) return;
  gs.answers[gs.current] = idx;
  const q = gs.questions[gs.current];
  const correct = idx === q.ans;
  gs.questionsDone++;
  if (correct) {
    gs.correctCount++;
    gs.streak++;
    gs.maxStreak = Math.max(gs.maxStreak, gs.streak);
    gs.score += 100 + gs.streak * 25;
    gs.fuel = Math.min(100, gs.fuel + 15);
    SFX.correct();
  } else {
    gs.wrongCount++;
    gs.streak = 0;
    gs.lives--;
    SFX.wrong();
  }
  document.getElementById("app").innerHTML = renderRocket();
}

function rocketNext() {
  const gs = GameState.rocket;
  if (gs.current < gs.questions.length - 1) {
    gs.current++;
    document.getElementById("app").innerHTML = renderRocket();
  } else {
    // All questions answered
    if (gs.lives <= 0) {
      gs.phase = 'lost';
    } else {
      gs.phase = 'won';
    }
    document.getElementById("app").innerHTML = renderRocket();
  }
}

function rocketExit() {
  if (confirm('Keluar mission? Progess tidak akan disimpan.')) {
    initRocketMenu();
    document.getElementById("app").innerHTML = renderRocket();
  }
}

// ===========================================================================
// ALGEBRA SPEED RACE
// ===========================================================================

function speedRaceLoadProgress() {
  try {
    return JSON.parse(localStorage.getItem('algebraHub.speedrace')) || { bestTime: {}, bestEndurance: {} };
  } catch { return { bestTime: {}, bestEndurance: {} }; }
}
function speedRaceSaveProgress(data) {
  try { localStorage.setItem('algebraHub.speedrace', JSON.stringify(data)); } catch {}
}

let _speedRaceTimer = null;
let _speedRaceAnimation = null;

function clearSpeedRaceTimers() {
  if (_speedRaceTimer) { clearInterval(_speedRaceTimer); _speedRaceTimer = null; }
  if (_speedRaceAnimation) { cancelAnimationFrame(_speedRaceAnimation); _speedRaceAnimation = null; }
}

function initSpeedRaceMenu() {
  clearSpeedRaceTimers();
  GameState.speedrace = { phase: 'menu', mode: 'time', questions: [], current: 0, score: 0, combo: 0, maxCombo: 0, mistakes: 3, answers: [], timeLeft: 60, startTime: null, qDone: 0, correctCount: 0, speed: 0 };
}

function initSpeedRace(mode) {
  clearSpeedRaceTimers();
  const pool = RACE_QUESTIONS;
  const picked = gShuffle(pool).slice(0, 20);
  GameState.speedrace = {
    phase: 'playing', mode,
    questions: picked, current: 0, score: 0, combo: 0, maxCombo: 0,
    mistakes: mode === 'endurance' ? 3 : 0,
    answers: new Array(picked.length).fill(null),
    timeLeft: mode === 'time' ? 60 : 0,
    startTime: Date.now(), qDone: 0, correctCount: 0, speed: 60
  };
  document.getElementById("app").innerHTML = renderSpeedRace();
  startSpeedRaceLoop();
}

function startSpeedRaceLoop() {
  const gs = GameState.speedrace;
  clearSpeedRaceTimers();

  if (gs.mode === 'time') {
    _speedRaceTimer = setInterval(() => {
      if (GameState.speedrace.phase !== 'playing') { clearSpeedRaceTimers(); return; }
      GameState.speedrace.timeLeft--;
      updateSpeedRaceHUD();
      if (GameState.speedrace.timeLeft <= 0) {
        GameState.speedrace.timeLeft = 0;
        clearSpeedRaceTimers();
        finishSpeedRace();
      }
    }, 1000);
  }
}

function updateSpeedRaceHUD() {
  const gs = GameState.speedrace;
  const hud = document.getElementById('sr-hud');
  if (!hud) return;
  hud.innerHTML = `
    <button class="rocket-hud-back" onclick="speedRaceExit()">${ICONS.arrowLeft}</button>
    <div class="sr-hud-info">
      <div class="sr-hud-mode">${gs.mode === 'time' ? '⏱️ Time Trial' : '💓 Endurance'}</div>
      <div class="sr-hud-q">Soalan ${gs.qDone + 1} / ${gs.questions.length}</div>
    </div>
    <div class="sr-hud-right">
      ${gs.mode === 'time' ? `<div class="sr-timer">⏱️ ${gs.timeLeft}s</div>` : `<div class="sr-lives">${'❤️'.repeat(gs.mistakes)}${'🖤'.repeat(3-gs.mistakes)}</div>`}
      <div class="sr-score">⭐ ${gs.score}</div>
      ${gs.combo > 1 ? `<div class="sr-combo">🔥 x${gs.combo}</div>` : ''}
    </div>`;
}

function renderSpeedRace() {
  const gs = GameState.speedrace;
  const prog = speedRaceLoadProgress();

  // MENU
  if (gs.phase === 'menu') {
    return `
    <div class="speedrace-page">
      <button class="back-btn" onclick="App.go('game')">${ICONS.arrowLeft} Kembali</button>
      <div class="sr-menu">
        <div class="sr-road-anim" aria-hidden="true">
          <div class="sr-road"></div>
          <div class="sr-car-wrap">
            <svg class="sr-car-svg" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="20" width="80" height="20" rx="8" fill="#3B82F6"/>
              <rect x="20" y="10" width="50" height="18" rx="6" fill="#60A5FA"/>
              <rect x="25" y="13" width="18" height="10" rx="3" fill="#BFDBFE"/>
              <rect x="48" y="13" width="18" height="10" rx="3" fill="#BFDBFE"/>
              <circle cx="25" cy="40" r="8" fill="#1E293B"/>
              <circle cx="25" cy="40" r="4" fill="#94A3B8"/>
              <circle cx="75" cy="40" r="8" fill="#1E293B"/>
              <circle cx="75" cy="40" r="4" fill="#94A3B8"/>
              <rect x="78" y="24" width="8" height="5" rx="2" fill="#EF4444"/>
              <rect x="12" y="24" width="8" height="5" rx="2" fill="#FCD34D"/>
            </svg>
          </div>
        </div>
        <h1 class="sr-game-title">Algebra Speed Race</h1>
        <p class="sr-game-subtitle">Selesaikan soalan algebra untuk memecut kereta lumba!</p>
        <div class="sr-modes">
          <button class="sr-mode-btn" onclick="initSpeedRace('time')" style="--mc:#10B981">
            <div class="sr-mode-icon">⏱️</div>
            <div class="sr-mode-name">Time Trial</div>
            <div class="sr-mode-desc">60 saat — jawab sebanyak mungkin!</div>
            <div class="sr-mode-best">🏆 Terbaik: ${prog.bestTime.score || '-'}</div>
          </button>
          <button class="sr-mode-btn" onclick="initSpeedRace('endurance')" style="--mc:#EF4444">
            <div class="sr-mode-icon">💓</div>
            <div class="sr-mode-name">Endurance</div>
            <div class="sr-mode-desc">3 nyawa — tahan selama mungkin!</div>
            <div class="sr-mode-best">🏆 Terbaik: ${prog.bestEndurance.score || '-'}</div>
          </button>
        </div>
      </div>
    </div>`;
  }

  // PLAYING
  if (gs.phase === 'playing') {
    const q = gs.questions[gs.current];
    const letters = ['A', 'B', 'C', 'D'];
    const selected = gs.answers[gs.current];
    const answered = selected !== null;

    // Speed visual: 0-200 km/h mapped to animation speed
    const roadOffset = (gs.speed * 0.5) % 100;

    const optionsHTML = q.opts.map((opt, i) => {
      let cls = 'rocket-opt';
      if (answered) {
        if (i === q.ans) cls += ' rocket-opt-correct';
        else if (i === selected) cls += ' rocket-opt-wrong';
        else cls += ' rocket-opt-dim';
      }
      return `<button class="${cls}" ${answered ? 'disabled' : `onclick="speedRaceSelect(${i})"`}>
        <span class="rocket-opt-letter">${letters[i]}</span>
        <span class="rocket-opt-text">${opt}</span>
      </button>`;
    }).join('');

    return `
    <div class="speedrace-game-page">
      <div class="sr-hud" id="sr-hud">
        <button class="rocket-hud-back" onclick="speedRaceExit()">${ICONS.arrowLeft}</button>
        <div class="sr-hud-info">
          <div class="sr-hud-mode">${gs.mode === 'time' ? '⏱️ Time Trial' : '💓 Endurance'}</div>
          <div class="sr-hud-q">Soalan ${gs.qDone + 1} / ${gs.questions.length}</div>
        </div>
        <div class="sr-hud-right">
          ${gs.mode === 'time' ? `<div class="sr-timer">⏱️ ${gs.timeLeft}s</div>` : `<div class="sr-lives">${'❤️'.repeat(gs.mistakes)}${'🖤'.repeat(3-gs.mistakes)}</div>`}
          <div class="sr-score">⭐ ${gs.score}</div>
          ${gs.combo > 1 ? `<div class="sr-combo">🔥 x${gs.combo}</div>` : ''}
        </div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${(gs.qDone / gs.questions.length) * 100}%; background: var(--purple)"></div></div>

      <div class="sr-race-scene">
        <div class="sr-speed-display">🏎️ ${Math.round(gs.speed)} km/h</div>
        <div class="sr-track-wrap">
          <div class="sr-track">
            <div class="sr-lane-markings" style="transform: translateY(${roadOffset}px)">
              ${Array(8).fill(0).map(() => '<div class="sr-dash"></div>').join('')}
            </div>
            <div class="sr-scenery">
              ${Array(6).fill(0).map((_,i) => `<div class="sr-tree" style="left:${10+i*18}%"></div>`).join('')}
            </div>
            <div class="sr-car-scene" style="left: 20%; bottom: 20px">
              <svg class="sr-car-svg-scene" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="20" width="80" height="20" rx="8" fill="#3B82F6"/>
                <rect x="20" y="10" width="50" height="18" rx="6" fill="#60A5FA"/>
                <rect x="25" y="13" width="18" height="10" rx="3" fill="#BFDBFE"/>
                <rect x="48" y="13" width="18" height="10" rx="3" fill="#BFDBFE"/>
                <circle cx="25" cy="40" r="8" fill="#1E293B"/>
                <circle cx="25" cy="40" r="4" fill="#94A3B8"/>
                <circle cx="75" cy="40" r="8" fill="#1E293B"/>
                <circle cx="75" cy="40" r="4" fill="#94A3B8"/>
                <rect x="78" y="24" width="8" height="5" rx="2" fill="#EF4444"/>
                <rect x="12" y="24" width="8" height="5" rx="2" fill="#FCD34D"/>
              </svg>
              ${gs.speed > 100 ? '<div class="sr-boost-effect"></div>' : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="sr-question-area">
        <div class="rocket-q-card">
          <div class="rocket-q-text">${q.q}</div>
          <div class="rocket-options">${optionsHTML}</div>
          ${answered ? `<div class="rocket-feedback-wrap">
            ${selected === q.ans
              ? `<div class="rocket-feedback rocket-fb-correct">✅ Betul! +${100 + gs.combo * 25}</div>`
              : `<div class="rocket-feedback rocket-fb-wrong">❌ ${q.exp}</div>`}
            <button class="rocket-next-btn" onclick="speedRaceNext()">
              ${gs.qDone < gs.questions.length - 1 ? 'Soalan Seterusnya →' : 'Lihat Keputusan 🎉'}
            </button>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }

  // FINISHED
  if (gs.phase === 'finished') {
    const elapsed = Math.round((Date.now() - gs.startTime) / 1000);
    const acc = gs.qDone > 0 ? Math.round((gs.correctCount / gs.qDone) * 100) : 0;
    const rating = acc >= 90 ? '🏆 Platinum' : acc >= 70 ? '🥈 Silver' : acc >= 50 ? '🥉 Bronze' : '😢 Keep Trying!';

    // Save best
    const prog = speedRaceLoadProgress();
    const key = gs.mode === 'time' ? 'bestTime' : 'bestEndurance';
    if (!prog[key].score || gs.score > prog[key].score) {
      prog[key] = { score: gs.score, qDone: gs.qDone, acc, time: elapsed };
      speedRaceSaveProgress(prog);
    }

    return `
    <div class="speedrace-game-page">
      <div class="rocket-end-screen rocket-won">
        <div class="rocket-end-emoji">🏁</div>
        <h2>Lumba Selesai!</h2>
        <div class="rocket-stars-earned">${rating}</div>
        <div class="rocket-end-stats">
          <div class="rocket-stat"><span>🏆 Markah:</span> <strong>${gs.score}</strong></div>
          <div class="rocket-stat"><span>✅ Betul:</span> <strong>${gs.correctCount}</strong></div>
          <div class="rocket-stat"><span>❌ Salah:</span> <strong>${gs.qDone - gs.correctCount}</strong></div>
          <div class="rocket-stat"><span>🔥 Combo Terbaik:</span> <strong>x${gs.maxCombo}</strong></div>
          ${gs.mode === 'time' ? `<div class="rocket-stat"><span>⏱️ Masa:</span> <strong>${elapsed}s</strong></div>` : ''}
          <div class="rocket-stat"><span>📊 Ketepatan:</span> <strong>${acc}%</strong></div>
        </div>
        <div class="rocket-end-actions">
          <button class="rocket-btn-retry" onclick="initSpeedRace('${gs.mode}')">🔄 Lumba Lagi</button>
          <button class="rocket-btn-back" onclick="initSpeedRaceMenu(); document.getElementById('app').innerHTML=renderSpeedRace()">← Menu</button>
        </div>
      </div>
    </div>`;
  }

  return '';
}

function speedRaceSelect(idx) {
  const gs = GameState.speedrace;
  if (gs.answers[gs.current] !== null) return;
  gs.answers[gs.current] = idx;
  const q = gs.questions[gs.current];
  const correct = idx === q.ans;
  if (correct) {
    gs.correctCount++;
    gs.combo++;
    gs.maxCombo = Math.max(gs.maxCombo, gs.combo);
    gs.score += 100 + gs.combo * 25;
    gs.speed = Math.min(200, gs.speed + 15);
    SFX.correct();
  } else {
    gs.combo = 0;
    gs.speed = Math.max(40, gs.speed - 20);
    if (gs.mode === 'endurance') gs.mistakes--;
    SFX.wrong();
  }
  updateSpeedRaceHUD();
  document.getElementById('app').innerHTML = renderSpeedRace();
}

function speedRaceNext() {
  const gs = GameState.speedrace;
  if (gs.qDone < gs.questions.length - 1) {
    gs.qDone++;
    gs.current++;
    gs.speed = Math.max(60, gs.speed - 5);
    document.getElementById('app').innerHTML = renderSpeedRace();
  } else {
    finishSpeedRace();
  }
}

function finishSpeedRace() {
  clearSpeedRaceTimers();
  GameState.speedrace.phase = 'finished';
  document.getElementById('app').innerHTML = renderSpeedRace();
}

function speedRaceExit() {
  if (confirm('Keluar lumba? Progress tidak akan disimpan.')) {
    clearSpeedRaceTimers();
    initSpeedRaceMenu();
    document.getElementById('app').innerHTML = renderSpeedRace();
  }
}

// ---------------------------------------------------------------------------
// CHATBOT — Algi the algebra assistant
// ---------------------------------------------------------------------------
const CHAT_KB = [
  {
    keys: ["garis lurus", "kecerunan", "pintasan", "y=mx", "y = mx"],
    reply: "Garis lurus: y = mx + c. m = kecerunan (jarak mencancang ÷ jarak mengufuk), c = pintasan-y. Garis selari mempunyai kecerunan SAMA (m₁ = m₂)! 📈",
  },
  {
    keys: ["indeks", "kuasa", "hukum indeks", "pecahan indeks"],
    reply: "Hukum Indeks: aᵐ×aⁿ = aᵐ⁺ⁿ, aᵐ÷aⁿ = aᵐ⁻ⁿ, a⁰ = 1, a⁻ⁿ = 1/aⁿ. Indeks pecahan: a^(m/n) = ⁿ√aᵐ. Asas mesti SAMA untuk darab/bahagi! 💡",
  },
  {
    keys: ["kuadratik", "parabola", "punca", "ax2", "ax²", "fungsi kuadratik"],
    reply: "Fungsi kuadratik: f(x) = ax²+bx+c. a>0 → minimum ↑, a<0 → maksimum ↓. Cari punca dengan pemfaktoran atau kalkulator MODE → EQN → DEGREE 2. ⌣",
  },
  {
    keys: ["ubahan", "langsung", "songsang", "ubahan bergabung", "pemalar k"],
    reply: "Ubahan: k = pemalar (nilai tetap). Langsung: y = kx. Songsang: y = k/x (xy = k selalu). Bergabung: z = kxy. Cari k dahulu guna nilai yang diberi! ∝",
  },
  {
    keys: ["matriks", "determinan", "penentu", "matriks songsang", "peringkat"],
    reply: "Matriks 2×2: det = ad−bc. Jika det = 0, matriks songsang TIDAK WUJUD. A⁻¹ = (1/det)×[[d,−b],[−c,a]]. Guna untuk selesaikan persamaan serentak! [ ]",
  },
  {
    keys: ["ketaksamaan", "tanda terbalik", "ketaksamaan linear"],
    reply: "Ketaksamaan: selesaikan macam persamaan biasa. TAPI tanda TERBALIK apabila darab/bahagi nombor NEGATIF! Ingat: '>esar' dan '<urang'. 📐",
  },
  {
    keys: ["rumus", "perkara rumus", "ungkapkan", "menukar perkara"],
    reply: "Kaedah pindah: pindahkan sebutan lain menjauhi perkara rumus baharu. Tukar operasi: +↔− dan ×↔÷. Semak dengan gantikan nilai semula! S=",
  },
  {
    keys: ["sistem", "serentak", "penghapusan", "penggantian", "eqn unknowns"],
    reply: "3 kaedah: (1) Penghapusan — samakan pekali lalu tambah/tolak. (2) Penggantian — jadikan perkara rumus. (3) Kalkulator MODE → EQN → Unknowns 2. { }",
  },
  {
    keys: ["fungsi gubahan", "fungsi songsang", "fg(x)", "f⁻¹"],
    reply: "Fungsi gubahan: fg(x) = f(g(x)) — kira g DAHULU, kemudian f. Fungsi songsang f⁻¹: tukar y = f(x) jadi x perkara rumus, kemudian tukar simbol x dan y. f(x)",
  },
  {
    keys: ["ungkapan", "pemfaktoran", "kembangkan", "sebutan serupa"],
    reply: "Ungkapan algebra: pekali × pemboleh ubah + pemalar. Kembangkan: a(x+y) = ax+ay. Pemfaktoran: keluarkan FCS. Contoh: 6x+9 = 3(2x+3). ax",
  },
];

const ChatBot = {
  _ready: false,

  toggle() {
    const win   = document.getElementById("chatWindow");
    const icon  = document.getElementById("chatLauncherIcon");
    const label = document.getElementById("chatLauncherLabel");
    if (!win) return;
    const isHidden = win.classList.toggle("hidden");
    if (isHidden) {
      icon.textContent  = "🦉";
      if (label) { label.textContent = "Tanya Algi"; label.style.display = ""; }
    } else {
      icon.textContent  = "✕";
      if (label) label.style.display = "none";   // hide label when chat is open
    }
    if (!isHidden) {
      if (!this._ready) {
        this._addMsg("bot", "Hi! Saya Algi 🦉 — pembantu algebra AlgebraHub. Tanya saya apa-apa, contoh: \"indeks\", \"garis lurus\", \"kuadratik\", atau \"matriks\"!");
        this._ready = true;
      }
      setTimeout(() => document.getElementById("chatInput")?.focus(), 50);
    }
  },

  send() {
    const input = document.getElementById("chatInput");
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = "";
    this._addMsg("user", text);
    setTimeout(() => this._addMsg("bot", this._reply(text)), 450);
  },

  _reply(text) {
    const t = text.toLowerCase();
    for (const entry of CHAT_KB) {
      if (entry.keys.some(k => t.includes(k))) return entry.reply;
    }
    return "Maaf, Algi belum tahu jawapan tu. 😅 Cuba tanya dengan kata kunci seperti \"indeks\", \"garis lurus\", \"kuadratik\", atau \"matriks\"!";
  },

  _addMsg(who, text) {
    const msgs = document.getElementById("chatMessages");
    if (!msgs) return;
    const div = document.createElement("div");
    div.className = `chat-msg chat-msg--${who}`;
    div.innerHTML = `<div class="chat-bubble">${text}</div>`;
    msgs.appendChild(div);
    // Format any fractions inside this new chat bubble too
    applyFractionFormat(div);
    msgs.scrollTop = msgs.scrollHeight;
  },
};

render();
