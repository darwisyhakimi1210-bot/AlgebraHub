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
// DATA — one entry per topic, organised by Tingkatan below in TINGKATAN_DATA
// ---------------------------------------------------------------------------
const DATA = {
  ungkapan: {
    title: "Ungkapan Algebra",
    tag: "ax + b",
    intro:
      "Ungkapan algebra ialah gabungan pemboleh ubah (huruf), pekali (nombor di hadapan pemboleh ubah) dan pemalar. Operasi seperti tambah, tolak, dan kembangkan kurungan boleh dilakukan ke atas ungkapan algebra.",
    formula: "a(x + y) = ax + ay",
    concepts: [
      {
        n: "1",
        title: "Pemboleh ubah & Pekali",
        body: "Pemboleh ubah ialah huruf seperti x atau y yang mewakili nilai tidak diketahui. Pekali ialah nombor yang didarab dengan pemboleh ubah. Dalam 3x, pekali = 3. Pemalar ialah nombor tetap tanpa pemboleh ubah.",
      },
      {
        n: "2",
        title: "Mengembangkan Kurungan",
        body: "Darab setiap sebutan dalam kurungan dengan faktor di luar. Contoh: 2(3x + 4) = 6x + 8. Kaedah ini juga dipanggil 'taburan'.",
      },
      {
        n: "3",
        title: "Pemfaktoran — kebalikan pengembangan",
        body: "Cari faktor sepunya terbesar (FCS), kemudian keluarkan dari ungkapan. Contoh: 6x + 9 = 3(2x + 3). Semak dengan kembangkan semula.",
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
    tag: "S = ...",
    intro:
      "Rumus algebra ialah persamaan yang menghubungkan beberapa pemboleh ubah. Perkara rumus ialah pemboleh ubah yang bersendirian di satu sisi dengan pekali 1. Menukar perkara rumus bermaksud mengasingkan pemboleh ubah berbeza sebagai subjek baharu.",
    formula: "v = u + at  →  t = (v − u) / a",
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
    tag: "y = mx + c",
    intro:
      "Persamaan garis lurus ialah y = mx + c, di mana m ialah kecerunan dan c ialah pintasan-y. Kecerunan diukur sebagai jarak mencancang dibahagi jarak mengufuk antara dua titik pada garis.",
    formula: "y = mx + c  ,  m = (y₂ − y₁) / (x₂ − x₁)",
    concepts: [
      {
        n: "1",
        title: "Kecerunan (m)",
        body: "m = jarak mencancang ÷ jarak mengufuk = (y₂ − y₁) / (x₂ − x₁). Garis condong ke atas: m > 0. Garis condong ke bawah: m < 0.",
      },
      {
        n: "2",
        title: "Pintasan-y (c) & Pintasan-x",
        body: "Pintasan-y ialah nilai y apabila x = 0 — tempat garis memotong paksi-y. Pintasan-x ialah nilai x apabila y = 0 — tempat garis memotong paksi-x.",
      },
      {
        n: "3",
        title: "Garis Selari",
        body: "Dua garis selari mempunyai kecerunan yang SAMA. Contoh: y = 2x + 1 dan y = 2x − 5 adalah selari kerana m₁ = m₂ = 2.",
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
    tag: "a < x < b",
    intro:
      "Ketaksamaan linear menunjukkan julat nilai yang mungkin bagi pemboleh ubah. Diselesaikan dengan kaedah 'pindah' — sama seperti persamaan linear — tetapi ada 1 peraturan istimewa: tanda TERBALIK apabila darab atau bahagi dengan nombor NEGATIF.",
    formula: "Kaedah Pindah — tukar operasi apabila melintas tanda =",
    concepts: [
      {
        n: "1",
        title: "Tanda Ketaksamaan",
        body: "Cara mudah ingat: > = '>esar' (lebih besar), < = '<urang' (kurang). Simbol ≥ bermaksud lebih besar ATAU sama. Simbol ≤ bermaksud kurang ATAU sama.",
      },
      {
        n: "2",
        title: "Kaedah 'Pindah' + Peraturan Negatif",
        body: "Selesaikan seperti persamaan. PERHATIAN: apabila darab atau bahagi dengan nombor negatif, SONGSANGKAN simbol ketaksamaan. Contoh: −2x > 4 → x < −2.",
      },
      {
        n: "3",
        title: "Garis Nombor & Ketaksamaan Serentak",
        body: "Wakili pada garis nombor: ● (bulatan penuh) untuk ≤ atau ≥, ○ (bulatan kosong) untuk < atau >. Untuk serentak, selesaikan setiap bahagian berasingan, kemudian gabungkan julat.",
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
    tag: "aᵐ × aⁿ",
    intro:
      "Indeks (atau kuasa) menunjukkan bilangan kali sesuatu nombor (asas) didarab dengan dirinya sendiri. Hukum-hukum indeks membolehkan kita memudahkan ungkapan berkuasa dengan cepat dan tepat.",
    formula: "aᵐ × aⁿ = aᵐ⁺ⁿ  |  aᵐ ÷ aⁿ = aᵐ⁻ⁿ  |  (aᵐ)ⁿ = aᵐⁿ",
    concepts: [
      {
        n: "1",
        title: "Hukum Pendaraban & Pembahagian",
        body: "Asas SAMA: aᵐ × aⁿ = aᵐ⁺ⁿ (tambah indeks). aᵐ ÷ aⁿ = aᵐ⁻ⁿ (tolak indeks). Asas berlainan: tidak boleh digabungkan terus.",
      },
      {
        n: "2",
        title: "Indeks Sifar & Negatif",
        body: "a⁰ = 1 untuk semua a ≠ 0. a⁻ⁿ = 1/aⁿ — indeks negatif bermaksud songsang (pecahan). Contoh: 2⁻³ = 1/2³ = 1/8.",
      },
      {
        n: "3",
        title: "Indeks Pecahan",
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
    title: "Fungsi dan Graf",
    tag: "f(x), f⁻¹(x)",
    intro:
      "Fungsi ialah pemetaan khas — setiap objek dalam domain mempunyai TEPAT SATU imej dalam kodomain. Jenis-jenis fungsi termasuk linear, kuadratik, kubik, dan salingan. Fungsi gubahan dan songsang merupakan kemahiran lanjutan.",
    formula: "fg(x) = f(g(x))  ,  ff⁻¹(x) = x",
    concepts: [
      {
        n: "1",
        title: "Tatatanda & Jenis Fungsi",
        body: "f(x) = nilai fungsi f pada x. Jenis: linear f(x) = mx + c, kuadratik f(x) = ax² + bx + c, kubik f(x) = x³, salingan f(x) = k/x. Graf setiap jenis berbeza bentuk.",
      },
      {
        n: "2",
        title: "Fungsi Gubahan fg(x)",
        body: "fg(x) = f(g(x)) — terapkan g DAHULU, kemudian terapkan f pada hasilnya. BACA dari kanan ke kiri. Contoh: fg(3) → kira g(3) dahulu, kemudian masukkan hasilnya ke dalam f.",
      },
      {
        n: "3",
        title: "Fungsi Songsang f⁻¹(x)",
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
    tag: "y ∝ x",
    intro:
      "Ubahan menghuraikan bagaimana satu kuantiti berubah apabila kuantiti lain berubah. k ialah PEMALAR — nilainya tetap dan tidak berubah. Terdapat empat jenis: langsung, songsang, tercantum, dan bergabung.",
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
    tag: "[A][B]",
    intro:
      "Matriks ialah susunan nombor dalam baris dan lajur. Peringkat matriks ditulis sebagai m × n (m = bilangan baris, n = bilangan lajur). Matriks digunakan untuk menyelesaikan persamaan linear serentak dengan lebih cekap.",
    formula: "A⁻¹ = (1 / det A) × [[d, −b], [−c, a]]",
    concepts: [
      {
        n: "1",
        title: "Peringkat & Operasi Matriks",
        body: "Peringkat = m × n. Tambah/tolak: saiz MESTI sama. Darab A × B: bilangan lajur A mesti sama dengan bilangan baris B. Matriks identiti I: AI = IA = A.",
      },
      {
        n: "2",
        title: "Penentu (Determinant)",
        body: "Untuk matriks 2×2 = [[a, b], [c, d]], det = ad − bc. PENTING: Jika det = 0, matriks songsang TIDAK WUJUD. Matriks itu dipanggil matriks singular.",
      },
      {
        n: "3",
        title: "Matriks Songsang & Persamaan Serentak",
        body: "A⁻¹ = (1/det) × [[d, −b], [−c, a]]. Untuk selesaikan AX = B: X = A⁻¹B. Ini kaedah matriks untuk persamaan linear serentak.",
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
};

// ---------------------------------------------------------------------------
// TINGKATAN — maps each school year group to its list of topics
// ---------------------------------------------------------------------------
const TINGKATAN_DATA = [
  {
    id: "12",
    label: "Tingkatan 1 & 2",
    subtitle: "Asas Algebra",
    banner: "ax + b",
    colorClass: "blue",
    topics: ["ungkapan", "rumus"],
  },
  {
    id: "3",
    label: "Tingkatan 3",
    subtitle: "Garis Lurus & Indeks",
    banner: "y = mx + c",
    colorClass: "green",
    topics: ["linear", "ketaksamaan", "indeks"],
  },
  {
    id: "4",
    label: "Tingkatan 4",
    subtitle: "Topik Utama SPM",
    banner: "ax² + bx + c",
    colorClass: "purple",
    topics: ["quadratic", "fungsi", "system"],
  },
  {
    id: "5",
    label: "Tingkatan 5",
    subtitle: "Ubahahan & Matriks",
    banner: "y ∝ x",
    colorClass: "red",
    topics: ["ubahan", "matriks"],
  },
];

// ---------------------------------------------------------------------------
// VIDEO DATA — fill in YouTube embed URLs when ready (null = coming soon)
// ---------------------------------------------------------------------------
const VIDEO_DATA = {
  ungkapan:    null,
  rumus:       null,
  linear:      null,
  ketaksamaan: null,
  indeks:      null,
  quadratic:   null,
  fungsi:      null,
  system:      null,
  ubahan:      null,
  matriks:     null,
};

// ---------------------------------------------------------------------------
// APP STATE
// ---------------------------------------------------------------------------
const state = {
  view: "home",        // home | learning | topics | lesson | practice | quiz | game | dragdrop | wordmatch
  topic: "linear",    // key into DATA
  tingkatan: "3",     // id from TINGKATAN_DATA
};

const App = {
  go(view, param) {
    // stop welcome greeting when leaving home
    if (view !== "home") {
      const audio = document.getElementById("welcome-audio");
      if (audio) { audio.pause(); audio.currentTime = 0; audio.onended = null; }
      const wrap = document.getElementById("owlWrap");
      if (wrap) wrap.classList.remove("speaking");
      const bubble = document.getElementById("owlBubble");
      if (bubble) { bubble.classList.remove("show", "bobbing"); bubble.classList.add("hide"); }
    }

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
    ${navBtn("Permainan", ICONS.game,     "game",     ["game", "dragdrop", "wordmatch"])}
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
    return `
      <button class="topic-card" onclick="App.go('lesson', '${key}')">
        <div class="topic-card-banner ${key}">${d.tag}</div>
        <div class="topic-card-body">
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
        <button class="quiz-topic-card" onclick="App.go('quiz', '${key}')">
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
// QUIZ mockup — answers not scored (preview intent)
// ---------------------------------------------------------------------------
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
        <div class="quiz-header-title">${t.title}</div>
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
    home:      renderHome,
    learning:  renderLearning,
    topics:    renderTopics,
    lesson:    renderLesson,
    practice:  renderPractice,
    quiz:      renderQuiz,
    game:      renderGame,
    dragdrop:  renderDragDrop,
    wordmatch: renderWordMatch,
  };

  document.getElementById("app").innerHTML = (
    renderers[state.view] || renderHome
  )();

  if (state.view === "home")     setTimeout(initOwlGreeting,  200);
  if (state.view === "learning") setTimeout(initLearningOwl,  300);
  if (state.view === "topics")   setTimeout(initLearningOwl,  300);
  if (state.view === "practice") setTimeout(initPracticeOwl,  300);
  if (state.view === "game")     setTimeout(initGameOwl,      300);
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
    msgs.scrollTop = msgs.scrollHeight;
  },
};

render();
