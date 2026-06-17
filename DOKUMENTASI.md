# Dokumentasi AlgebraHub
**Tarikh:** 17 Jun 2026
**Pembangun:** Darwisy Hakimi

---

## 1. Gambaran Keseluruhan Projek

AlgebraHub ialah laman web pembelajaran Algebra SPM yang dibina menggunakan HTML, CSS, dan JavaScript tulen (tanpa framework). Ia berfungsi sebagai Single Page Application (SPA) — bermaksud hanya satu fail HTML, dan kandungan ditukar oleh JavaScript tanpa memuatkan semula halaman.

---

## 2. Struktur Fail

```
AlgebraHub/
├── index.html          → Kerangka HTML utama (nav, audio, widget muzik)
├── app.js              → Logik SPA (render halaman, data, animasi)
├── styles.css          → Semua gaya CSS
├── image/
│   ├── owl.png         → Maskot Algi
│   ├── svg.png         → Logo AlgebraHub
│   ├── favicon.svg     → Ikon tab pelayar (SVG vektor)
│   └── new_bg.jpg      → Imej latar belakang
├── sound/
│   ├── music_bg.mp3    → Muzik latar belakang
│   └── welcome.wav     → Suara ucapan maskot Algi
└── DOKUMENTASI.md      → Fail ini
```

---

## 3. Halaman-Halaman (Views)

| Halaman     | Penerangan                                              |
|-------------|----------------------------------------------------------|
| `home`      | Halaman utama — maskot Algi, butang navigasi            |
| `learning`  | Senarai topik Algebra (Linear, Kuadratik, Sistem)       |
| `lesson`    | Nota pelajaran terperinci untuk topik yang dipilih      |
| `practice`  | Soalan latihan bertulis                                 |
| `quiz`      | Kuiz aneka pilihan dengan skor                          |
| `game`      | Pilihan permainan interaktif                            |
| `dragdrop`  | Permainan susun atur (drag and drop)                    |
| `wordmatch` | Permainan padanan perkataan matematik                   |

---

## 4. Topik Algebra yang Diliputi

Berdasarkan buku nota SPM:

1. **Persamaan Linear** — cerun, titik potong paksi-y, memplot graf (`y = mx + b`)
2. **Fungsi Kuadratik** — parabola, puncak, punca, formula kuadratik (`ax² + bx + c`)
3. **Sistem Persamaan** — kaedah gantian, kaedah penghapusan, titik penyelesaian

---

## 5. Ciri-Ciri yang Dibina

### 5.1 Maskot Algi (Burung Hantu)
- Nama: **Algi** (singkatan Algebra)
- Gambar: `image/owl.png`
- **Animasi pernafasan** — skala naik-turun perlahan (3.8 saat setiap kitar) menggunakan CSS `@keyframes owlBreathe`
- **Gelembung ucapan (speech bubble)** — muncul di sebelah KANAN maskot
- Ekor gelembung menghala ke kiri (arah maskot)

### 5.2 Sistem Ucapan Interaktif
**Aliran kerja:**
1. Pengguna sampai ke halaman utama → gelembung muncul dengan teks **"Sapa saya! 👋 / Klik untuk dengar!"**
2. Gelembung melantun naik-turun (animasi `bubbleBob`) untuk menarik perhatian
3. Pengguna **klik** gelembung → teks taip keluar satu huruf demi satu huruf (typewriter effect)
4. Audio `welcome.wav` dimainkan serentak
5. Cincin ungu berdenyut di sekeliling maskot semasa audio bermain
6. Apabila audio selesai → cincin berhenti, gelembung pudar keluar
7. Jika pengguna pergi ke halaman lain → audio berhenti, gelembung hilang
8. Apabila pengguna kembali ke halaman utama → gelembung muncul semula

**Mengapa klik dan bukan auto-main:**
Pelayar moden (Chrome, Edge, Firefox) menyekat audio yang dimainkan secara automatik tanpa interaksi pengguna. Dengan memerlukan klik, audio dijamin boleh dimainkan.

### 5.3 Muzik Latar Belakang
- Fail: `sound/music_bg.mp3`
- Widget kawalan terapung di sudut bawah kanan (kedudukan tetap)
- Butang main/jeda + gelangsar kelantangan
- Cuba auto-main semasa halaman dimuatkan (jika pelayar benarkan)
- Jika disekat, butang main tersedia untuk diklik

### 5.4 Favicon (Ikon Tab)
- Fail: `image/favicon.svg`
- Format SVG (vektor) — tajam pada mana-mana saiz
- Reka bentuk: Segi empat tepat ungu bulat, huruf **A** emas (Algebra), lencana emas dengan huruf **h** (Hub)
- SVG lebih baik daripada PNG untuk favicon kerana tidak kabur apabila diskalakan

### 5.5 Susun Atur Tanpa Skrol (No-Scroll Layout)
- `html` dan `body` ditetapkan `overflow: hidden` — bar skrol tetingkap tidak muncul sama sekali
- `body` menggunakan `display: flex; flex-direction: column`
- Nav bar kekal di atas (`flex-shrink: 0`)
- Kawasan kandungan `#app` mengisi ruang yang tinggal dan skrol dalaman jika perlu
- Bar skrol dalam `#app` disembunyikan dengan `::-webkit-scrollbar { display: none }` dan `scrollbar-width: none`

---

## 6. Konsep Teknikal Penting (Untuk Pembelajaran)

### Apa itu SPA (Single Page Application)?
SPA bermaksud hanya **satu fail HTML** yang dimuatkan. Apabila pengguna klik butang navigasi, JavaScript menukar kandungan dalam elemen `<main id="app">` tanpa memuatkan semula halaman. Ini menjadikan pengalaman lebih pantas dan lancar.

### Bagaimana `render()` berfungsi?
```
pengguna klik butang → App.go('learning') → state.view = 'learning' → render() → innerHTML dikemaskini
```

### Autoplay Policy Pelayar
Pelayar moden tidak membenarkan audio dimainkan secara automatik tanpa pengguna berinteraksi dahulu. Ini dikenali sebagai **Autoplay Policy**. `audio.play()` mengembalikan Promise — jika disekat, `.catch()` menangkap ralat tersebut.

### CSS Animation vs Transition
- **Transition** — perubahan dari satu nilai ke nilai lain apabila ada pencetus (hover, kelas ditambah)
- **Animation** — berjalan secara bebas menggunakan `@keyframes`, boleh berulang tanpa pencetus

### Transform Origin
`transform-origin: center bottom` pada maskot bermaksud animasi skala bermula dari bawah ke atas — seperti badan mengembang dari tapak kaki, bukan dari tengah.

---

## 7. Cara Menjalankan Projek

1. Buka fail `index.html` dalam pelayar (Chrome/Edge disyorkan)
2. Atau gunakan pelayan tempatan (Live Server dalam VS Code)

**Nota:** Audio tidak akan berfungsi jika dibuka terus dari fail (protokol `file://`) pada sesetengah pelayar. Gunakan Live Server untuk pengalaman terbaik.

---

## 8. Git & Versi Kawalan

Projek ini menggunakan Git untuk jejak perubahan:

```
git status          → lihat fail yang berubah
git add <fail>      → tandakan untuk commit
git commit -m "..."  → simpan perubahan
git push origin main → hantar ke GitHub
```

---

*Dokumentasi ini disediakan bagi tujuan rujukan dan pembelajaran.*
