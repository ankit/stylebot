import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Ubah tampilan situs web mana pun',
    titleSuffix: '{title} - Stylebot',
    description:
      'Tunjuk sesuatu di halaman lalu ubah, atau jelaskan apa yang Anda inginkan. Stylebot yang menulis CSS-nya. Gratis dan open source untuk Chrome, Firefox, dan Edge.',
  },
  header: {
    home: 'Beranda Stylebot',
    manual: 'Panduan',
    install: 'Instal',
    language: 'Bahasa',
    suggest: 'Lihat halaman ini dalam bahasa Indonesia',
    dismiss: 'Tutup',
    theme: 'Tema: {theme}',
  },
  themes: {
    light: 'Terang',
    dark: 'Gelap',
    stylebot: 'Stylebot',
    newsprint: 'Kertas koran',
  },
  footer: {
    changelog: 'Log perubahan',
    donate: 'Traktir saya kopi',
  },
  store: {
    add: 'Tambahkan ke {store}',
    addFree: 'Tambahkan ke {store} — gratis',
    reinstall: 'Instal ulang untuk {store}',
  },
  zoom: {
    label: 'Screenshot yang diperbesar',
    close: 'Tutup',
  },
  home: {
    title: '{word} tampilan situs web mana pun.',
    titleWord: 'Ubah',
    titleWordHint: 'Klik untuk mengubah tampilan',
    lede: 'Tunjuk sesuatu di halaman lalu ubah, atau cukup jelaskan apa yang Anda inginkan. Stylebot menulis CSS-nya dan menerapkan gaya Anda setiap kali Anda kembali.',
    also: 'Juga tersedia di {first} dan {second}',
    installTitle: 'Instal Stylebot',
    installBody:
      'Gratis dan open source sejak 2011. Tanpa akun dan tanpa pelacakan. Gaya Anda tersimpan di browser, dan kodenya ada di GitHub.',
    cli: 'Memakai agen coding? Tambahkan <a href="#cli">CLI</a>:',
  },
  cli: {
    copy: 'Salin',
    copied: 'Disalin',
    copyCommand: 'Salin {command}',
    title: 'Bekerja dengan agen coding Anda',
    body: 'Claude Code, Codex, Cursor, atau agen apa pun yang bisa menjalankan perintah dapat memakai Stylebot dari terminal.',
    guide: 'Siapkan CLI →',
    demo: {
      terminal: 'Terminal · agen coding',
      prompt: 'buat {site} lebih nyaman dibaca di malam hari',
      done: 'Latar gelap, teks lebih hangat, isi artikel memakai serif yang lebih besar. Iklan dihapus.',
      before: 'Sebelum',
      after: 'Sesudah',
      kicker: 'Wisata',
      headline: 'Kembalinya feri malam yang senyap',
      dek: 'Tiga operator bertaruh bahwa para pelancong rela menukar kecepatan dengan kabin, pemandangan laut, dan perjalanan tanpa bandara.',
      text: 'Kapal pukul 22.40 dari Rostock berangkat tanpa seremoni. Saat lampu pelabuhan mulai menjauh, sebagian besar penumpang sudah menemukan kabin mereka dan bar pun tinggal diisi gumaman pelan.',
      ad: 'Iklan',
    },
    page: {
      title: 'Baris perintah',
      description:
        'Kendalikan Stylebot dari terminal, atau biarkan agen coding seperti Claude Code, Codex, atau Cursor mengubah tampilan situs di browser Anda dengan langganan Anda sendiri.',
      heading: 'Stylebot dari terminal Anda',
      lede: 'Kendalikan Stylebot dari baris perintah, atau serahkan pada agen coding seperti Claude Code, Codex, atau Cursor. Agen mengubah tampilan situs langsung di browser Anda, memakai langganan Anda sendiri, bukan kunci API.',
      setup: 'Penyiapan',
      install: 'Instal Stylebot',
      installBody:
        'Untuk Chrome atau Edge. Baris perintah belum berfungsi di Firefox.',
      cli: 'Instal CLI',
      cliBody: 'Memerlukan Node 20 atau yang lebih baru.',
      connect: 'Hubungkan ke browser Anda',
      connectBody:
        'Perintah ini mendaftarkan CLI ke Chrome dan Edge agar Stylebot dapat terhubung dengannya.',
      access: 'Aktifkan akses baris perintah',
      accessBody:
        'Di opsi Stylebot, pada bagian Dasar, aktifkan <strong>Izinkan aplikasi di komputer ini mengontrol Stylebot</strong> dan berikan izin yang diminta browser.',
      plugin: 'Tambahkan plugin Claude Code',
      optional: 'Opsional',
      pluginBody: 'Di Claude Code, jalankan:',
      tryIt: 'Lalu coba:',
      commands: 'Perintah',
      commandsBody:
        'Agen akan menjalankan perintah ini untuk Anda, tetapi Anda juga bisa menjalankannya sendiri. <code>stylebot --help</code> menampilkan semuanya.',
      examples: {
        open: 'Membuka halaman di jendela di belakang jendela Anda dan menampilkan ID tabnya.',
        outline:
          'Menampilkan elemen halaman yang terlihat dalam bentuk kerangka.',
        css: 'Menyimpan CSS sebagai gaya situs, menerapkannya, lalu memeriksa halaman.',
        screenshot: 'Menyimpan gambar tab.',
      },
      privacy: 'Privasi',
      privacyBody: [
        'Akses baris perintah nonaktif sampai Anda mengaktifkannya. Selama aktif, aplikasi di komputer ini dapat membaca halaman yang Anda buka, mengambil screenshot, dan mengubah gaya Anda. Nonaktifkan kapan saja di opsi Stylebot.',
        'Stylebot dan CLI hanya berkomunikasi satu sama lain, di komputer ini, dan tidak mengirim apa pun ke mana pun. Agen mengirim apa yang dibacanya ke penyedianya sendiri, seperti Claude Code ke Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Gaya untuk memulai',
    lede: 'Salin salah satunya lalu sesuaikan, atau mulai dari nol.',
    hint: 'Tempel di tab Kode di {site}.',
    enlarge: 'Perbesar {site}: {name}',
    alt: '{site} dengan tampilan baru dari Stylebot: {name}',
    install: 'Instal',
    installTitle: 'Instal di Stylebot',
    installed: 'Terinstal',
    installedAs: 'Diinstal sebagai {name}',
    installFailed: 'Tidak dapat menginstal',
    copy: 'Salin CSS',
    copied: 'Disalin',
    source: 'Lihat di GitHub',
    lightbox: 'Situs dengan tampilan baru',
    close: 'Tutup',
  },
  quotes: {
    title: 'Orang-orang menyukai Stylebot',
  },
  features: {
    title: 'Semua yang juga Anda dapatkan.',
    previous: 'Fitur sebelumnya',
    next: 'Fitur berikutnya',
    sync: {
      title: 'Sinkronisasi',
      body: 'Hubungkan Google Drive, dan gaya Anda ikut ke setiap komputer tempat Anda login. Stylebot menyinkronkan setiap 30 menit dan tepat setelah Anda mengedit.',
      connected: 'Terhubung ke Google Drive',
      synced: 'Disinkronkan 2 menit lalu',
      syncNow: 'Sinkronkan sekarang',
      savedTo: 'Disimpan ke',
      disconnect: 'Putuskan',
      schedule: 'Jadwal',
      scheduleValue: 'Setiap 30 menit, dan tepat setelah Anda mengedit gaya',
    },
    history: {
      title: 'Riwayat versi',
      body: 'Setiap perubahan pada gaya Anda disimpan, dari yang terbaru. Buka entri untuk melihat apa yang berubah dan pulihkan dengan sekali klik.',
      today: 'Hari ini, 25 Sep',
      yesterday: 'Kemarin, 24 Sep',
      noChanges: 'Tidak ada perubahan',
      edited: 'Diedit',
      sites: '10 situs',
      current: 'Saat ini',
      times: ['01.04', '00.41', '23.41'],
    },
    presets: {
      title: 'Preset',
      body: 'Mode baca dan skala abu-abu berfungsi di situs mana pun, dan dapat digabungkan dengan perubahan Anda sendiri.',
      readability: 'Mode baca',
      articlesOnly: 'Hanya artikel',
      readabilityBody:
        'Tampilan baca yang bersih, dengan tema, font, dan ukuran pilihan Anda.',
      grayscale: 'Skala abu-abu',
      grayscaleBody: 'Terapkan skala abu-abu pada halaman.',
    },
    chat: {
      title: 'Chat',
      body: 'Tidak memakai agen coding? Jelaskan perubahan di tab Chat dan Stylebot yang menulis CSS-nya. Gunakan kunci Claude, OpenAI, atau Gemini Anda sendiri. Kunci tetap tersimpan di browser Anda.',
      prompt: 'Buat artikel ini lebih nyaman dibaca di malam hari',
      reply:
        'Latar diganti menjadi gelap dengan teks yang lebih hangat, dan isi artikel memakai serif yang lebih besar dengan jarak baris yang lebih lega.',
      updated: 'Gaya diperbarui',
      undo: 'Urungkan',
      placeholder: 'Jelaskan perubahan',
    },
  },
  welcome: {
    title: 'Selamat datang',
    description:
      'Cara kerja Stylebot dari awal hingga akhir, dalam sekitar satu menit.',
    heading: 'Stylebot sudah terinstal.',
    yourTurn: 'Sekarang giliran Anda.',
    yourTurnBody:
      'Buka situs mana pun dan tekan pintasannya. Tidak ada yang berubah sampai Anda melakukannya.',
    manual: 'Panduan',
    agentTitle: 'Hubungkan agen coding Anda',
    agentBody:
      'Claude Code, Codex, Cursor, atau agen apa pun yang bisa menjalankan perintah dapat memakai Stylebot dari terminal.',
    agentPrompt: 'beri situs ini tema Everforest dengan font yang lebih bagus',
    agentReply: 'Warna diganti ke Everforest dengan Lora dan Newsreader.',
  },
  goodbye: {
    title: 'Sampai jumpa',
    description: 'Terima kasih telah memakai Stylebot.',
    panda: 'Panda piksel melambaikan tangan',
    heading: 'Terima kasih telah memakai Stylebot.',
    lede: 'Gaya Anda telah dihapus dari browser ini. Jika Anda mengaktifkan sinkronisasi, cadangannya masih ada di Google Drive Anda.',
    changedMind: 'Berubah pikiran?',
    note: 'Saya mengembangkan Stylebot sejak 2011. Terima kasih sudah mencobanya, dan atas masukan apa pun yang Anda berikan.',
    signature: '— Ankit',
    feedback: {
      question: 'Mengapa Anda menghapus Stylebot?',
      optional: 'Opsional, hanya sebentar.',
      reasons: [
        'Sudah tidak membutuhkannya',
        'Sulit digunakan',
        'Merusak tampilan situs',
        'Ada fitur yang kurang',
        'Terlalu lambat',
        'Alasan lain',
      ],
      placeholder: 'Ada hal lain? (opsional)',
      send: 'Kirim masukan',
      sendNote: 'Langsung dikirim ke pengelola.',
      thanks: 'Terima kasih. Setiap masukan dibaca.',
    },
  },
  manual: {
    title: 'Panduan',
    description:
      'Cara memakai Stylebot: mengubah gaya situs, profil, baris perintah, Chat, sinkronisasi, aturan URL, dan pintasan.',
    lede: 'Cara kerja Stylebot, dari gaya pertama Anda hingga profil, Chat, dan sinkronisasi.',
    sections: 'Bagian panduan',
    toc: {
      start: 'Memulai',
      profiles: 'Profil',
      cli: 'Baris perintah',
      chat: 'Chat',
      presets: 'Mode baca dan skala abu-abu',
      sync: 'Sinkronisasi, cadangan, dan riwayat',
      urls: 'Aturan URL',
      shortcuts: 'Pintasan keyboard',
      help: 'Bantuan dan dukungan',
    },
    start: {
      open: 'Klik ikon Stylebot di toolbar, lalu <strong>Ubah gaya halaman ini</strong>. Atau tekan [[alt+shift+M]] di tab mana pun, atau klik kanan elemen dan pilih <strong>Stylebot → Ubah gaya elemen</strong>.',
      shot: 'Tab Dasar, saat memilih tautan di artikel Wikipedia',
      pick: 'Klik pemilih, arahkan kursor ke halaman, lalu klik elemen. Tekan [[↑]] sebelum mengklik untuk memilih elemen induknya. Lalu ubah di <strong>Dasar</strong>, atau tulis CSS di <strong>Kode</strong>. Perubahan tersimpan saat Anda membuatnya dan diterapkan setiap kali Anda mengunjungi situs itu.',
      fonts: 'Font',
      fontsBody:
        'Cari di antara 400 <a href="https://fonts.google.com/">Google Fonts</a> dan Stylebot akan memuat font yang Anda pilih, atau ketik nama font apa pun yang terinstal di komputer Anda.',
      position: 'Posisi editor',
      positionBody:
        'Di Chrome dan Edge, editor terbuka di panel samping. Gunakan <strong>Posisi</strong> di menu <strong>⋯</strong> editor untuk membukanya di jendela terpisah atau menempelkannya di halaman. Firefox tidak punya panel samping.',
      off: 'Menonaktifkan gaya',
      offBody:
        'Gunakan tombol di popup, atau [[alt+shift+S]]. Gayanya tetap disimpan, hanya tidak diterapkan.',
      callout:
        'Beberapa situs memakai nama class yang dibuat otomatis dan berubah saat situs diperbarui. Jika gaya berhenti berfungsi, pilih ulang elemennya untuk mendapatkan selektor baru.',
    },
    profiles: {
      intro:
        'Profil adalah stylesheet terpisah untuk situs yang sama, sehingga Anda bisa menyimpan lebih dari satu tampilan dan beralih di antaranya. Hanya satu yang diterapkan dalam satu waktu, dan setiap situs dimulai dengan profil Default.',
      shot: 'Popup di Hacker News dengan empat profil: Violet Hour, Everforest, Hearth, dan Newspaper',
      manage:
        'Klik nama profil di samping nama situs di header editor untuk membuat, mengganti nama, menduplikat, atau menghapus profil. Beralih di antaranya di sana atau di popup, tempat <strong>Tanpa gaya</strong> menonaktifkan gaya untuk situs itu. Profil baru dimulai dalam keadaan kosong.',
    },
    cli: {
      intro:
        'Perintah <code>stylebot</code> memungkinkan agen coding seperti Claude Code, Codex, atau Cursor mengubah tampilan situs langsung di browser Anda, memakai langganan Anda sendiri, bukan kunci API. Inilah cara terbaik meminta agen mengubah gaya situs, dan Anda juga bisa menjalankan perintahnya sendiri.',
      setup: 'Penyiapan',
      setupBody:
        'Instal CLI, hubungkan ke browser Anda, lalu aktifkan <strong>Izinkan aplikasi di komputer ini mengontrol Stylebot</strong> di Opsi. <a href="{cli}">Halaman baris perintah</a> memandu setiap langkahnya. Untuk saat ini hanya Chrome dan Edge.',
      claudeCodeBody:
        'Tambahkan plugin Stylebot dan minta perubahan dengan <code>/stylebot</code>, misalnya tema gelap untuk sebuah situs.',
      privacy: 'Privasi',
      privacyBody:
        'Akses baris perintah nonaktif sampai Anda mengaktifkannya. Stylebot dan CLI hanya berkomunikasi satu sama lain, di komputer ini; agen mengirim apa yang dibacanya ke penyedianya sendiri.',
    },
    chat: {
      intro:
        'Chat cocok untuk perbaikan cepat. Jelaskan perubahan yang Anda inginkan di tab Chat dan Stylebot yang menulis CSS-nya. Anda bisa memilih elemen untuk menunjuk bagian tertentu, atau melampirkan screenshot untuk memperlihatkan maksud Anda. Untuk perubahan yang lebih besar, seperti tema yang benar-benar baru, gunakan <a href="#cli">baris perintah</a>.',
      shot: 'Tab Chat setelah meminta tema hutan dengan font serif yang mudah dibaca di Hacker News',
      key: 'Gunakan kunci Anda sendiri',
      keyBody:
        'Hubungkan kunci API Claude, OpenAI, atau Gemini. Kunci hanya disimpan di komputer ini dan tidak pernah disinkronkan. Pesan dikirim langsung dari browser Anda ke penyedia.',
      changes: 'Ke mana perubahan disimpan',
      changesBody:
        'Setiap perubahan langsung diterapkan dan ditambahkan ke stylesheet profil saat ini. Klik <strong>Ditambahkan N baris</strong> untuk melihatnya di Kode, atau urungkan dari chat.',
      cost: 'Biaya',
      costBody:
        'Jumlah token di bawah kotak pesan menunjukkan pemakaian percakapan sejauh ini, beserta perkiraan biayanya.',
    },
    presets: {
      intro:
        'Keduanya ada di tab Preset dan dapat digabungkan dengan perubahan Anda sendiri. <strong>Mode baca</strong> mengubah artikel di situs menjadi tampilan baca yang bersih, dengan pilihan tema, font, ukuran, dan lebar; halaman yang bukan artikel dibiarkan apa adanya. <strong>Skala abu-abu</strong> menghilangkan warna dari situs, dengan tingkat yang bisa diatur.',
      shot: 'Artikel Wikipedia tentang Matematika dalam Mode baca, dengan Setelan baca terbuka',
    },
    sync: {
      shot: 'Opsi, terhubung ke Google Drive dan sudah disinkronkan',
      drive: 'Sinkronisasi Google Drive',
      driveBody:
        'Hubungkan Google Drive di Opsi. Gaya Anda, termasuk profil, disinkronkan setiap 30 menit dan tepat setelah Anda mengedit. Stylebot hanya melihat file yang dibuatnya di Drive Anda, dan tidak ada server Stylebot.',
      conflicts: 'Konflik',
      conflictsBody:
        'Jika sebuah gaya berubah di dua komputer, editan Anda yang lebih baru dipertahankan dan versi lainnya disimpan dalam komentar, jadi tidak ada yang hilang.',
      backup: 'Cadangan',
      backupBody: 'Ekspor dan impor semua gaya Anda sebagai JSON dari Opsi.',
      history: 'Riwayat versi',
      historyBody:
        'Setiap perubahan di komputer ini disimpan di Opsi, termasuk yang masuk melalui sinkronisasi. Pulihkan versi sebelumnya mana pun, untuk sebagian situs atau semuanya.',
      historyShot: 'Riwayat versi di Opsi, perubahan terbaru di atas',
    },
    urls: {
      intro:
        'Secara default, Stylebot mencocokkan gaya dengan situs berdasarkan nama domain. Edit URL gaya di Opsi dan gunakan pola berikut untuk kebutuhan yang lebih spesifik.',
      wildcards: {
        anything: 'Cocok dengan urutan karakter apa pun.',
        segment: 'Cocok dengan urutan karakter apa pun hingga ditemukan /.',
        list: 'Memisahkan daftar pola. URL cocok jika salah satu pola cocok.',
        regex: 'Di awal URL, mengubahnya menjadi ekspresi reguler.',
      },
      examplesTitle: 'Contoh',
      examples: {
        domain: 'Domain docs.google.com atau subdomainnya.',
        prefix: 'URL apa pun yang diawali docs.',
        numbered:
          'docs.google.com, docs1.google.com, docs2.google.com, dan seterusnya.',
        subdomains: 'news.ycombinator.com dan apps.ycombinator.com.',
        either: 'Salah satu domain, atau subdomainnya.',
        regex: 'Hanya halaman beranda Reddit.',
        everywhere:
          'Semua situs. Berguna untuk gaya yang ingin Anda terapkan di mana saja.',
      },
    },
    shortcuts: {
      intro:
        'Pintasan global berfungsi di halaman mana pun yang bisa diubah gayanya oleh Stylebot; ubah pintasan di setelan pintasan browser, yang ditautkan dari Opsi. Untuk pintasan editor, tekan [[?]] di editor.',
      or: 'atau',
      unset: 'Belum diatur; tetapkan di browser',
      global: 'Global',
      picker: 'Saat memilih elemen',
      actions: {
        toggleEditor: 'Aktifkan/nonaktifkan editor',
        toggleStyling: 'Aktifkan/nonaktifkan gaya',
        toggleReadability: 'Aktifkan/nonaktifkan mode baca',
        toggleGrayscale: 'Aktifkan/nonaktifkan skala abu-abu',
        parent: 'Pilih elemen induk',
        child: 'Kembali ke elemen anak',
        select: 'Pilih elemen yang disorot',
      },
    },
    help: {
      body: 'Menemukan bug atau punya ide? Buka issue di <a href="{issues}">GitHub</a>. Stylebot gratis dan open source, dikelola sejak 2011. Jika Stylebot bermanfaat bagi Anda, dukung dengan <a href="{donate}">mentraktir saya kopi</a>.',
    },
  },
  privacy: {
    title: 'Privasi',
    description:
      'Apa yang dilakukan Stylebot dengan data Anda: tanpa server, tanpa akun, tanpa analitik.',
    lede: 'Stylebot tidak punya server, akun, atau analitik. Gaya Anda tetap di browser kecuali Anda mengaktifkan sinkronisasi, chat, atau baris perintah, dan dalam hal itu gaya dikirim langsung ke layanan yang Anda pilih atau aplikasi yang Anda izinkan.',
    updated: 'Terakhir diperbarui {date}',
    browser: {
      title: 'Apa yang tetap di browser Anda',
      body: [
        'Gaya, profil, setelan, riwayat, percakapan chat, dan kunci API Anda disimpan di penyimpanan ekstensi browser, dan menghapus instalan Stylebot akan menghapusnya. Stylebot membaca halaman yang Anda kunjungi untuk mengubah gayanya, dan tidak mengirim apa pun dari halaman itu kecuali Anda memakai chat atau baris perintah.',
      ],
    },
    sync: {
      title: 'Sinkronisasi Google Drive',
      body: [
        'Saat Anda menghubungkan Google Drive di Opsi, gaya Anda disimpan ke sebuah file di Drive Anda sendiri. Stylebot hanya dapat melihat file yang dibuatnya. Token aksesnya tetap di browser Anda dan kedaluwarsa setelah satu jam. Putuskan sambungan di Opsi atau di <a href="https://myaccount.google.com/connections">Akun Google</a> Anda.',
        'Penggunaan informasi yang diterima Stylebot dari Google API mematuhi <a href="https://developers.google.com/terms/api-services-user-data-policy">Kebijakan Data Pengguna Layanan Google API</a>, termasuk persyaratan Penggunaan Terbatas.',
      ],
    },
    chat: {
      title: 'Chat',
      body: [
        'Saat Anda menambahkan kunci API dan mengirim pesan, browser Anda mengirimkannya langsung ke penyedia itu beserta pesan Anda, screenshot yang Anda lampirkan, alamat dan judul halaman, kerangka dari apa yang terlihat di halaman, serta CSS halaman dan gaya Anda. Ini bisa mencakup informasi pribadi yang tampil di halaman, jadi jangan memakai chat di halaman yang tidak ingin Anda bagikan kepada penyedia. Kebijakan mereka berlaku: <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: 'Baris perintah',
      body: [
        'Saat Anda mengaktifkan <q>Izinkan aplikasi di komputer ini mengontrol Stylebot</q> di Opsi, aplikasi yang berjalan atas nama Anda dapat melihat daftar tab, membaca halaman, mengambil screenshot, serta membaca dan mengubah gaya Anda, melalui koneksi lokal yang hanya bisa Anda gunakan. Apa yang dibaca aplikasi itu dapat sampai ke layanan yang dipakainya, seperti model di balik agen coding. Nonaktifkan setelan ini untuk memutuskan sambungan.',
      ],
    },
    fonts: {
      title: 'Font dan CSS yang diimpor',
      body: [
        'Google Fonts dalam gaya Anda diunduh dari Google, yang dapat melihat alamat IP Anda. Stylesheet yang Anda <code>@import</code> diambil dari alamatnya.',
      ],
    },
    site: {
      title: 'Situs web ini',
      body: [
        'stylebot.dev tidak memiliki iklan atau cookie dan di-hosting di GitHub Pages, yang menyimpan log server standar. Plausible menghitung kunjungan berdasarkan halaman, perujuk, negara, dan jenis perangkat, tanpa cookie atau apa pun yang mengidentifikasi Anda.',
      ],
    },
    sharing: {
      title: 'Berbagi',
      body: [
        'Stylebot tidak mengumpulkan, menjual, atau membagikan data Anda. Data hanya keluar dari browser Anda ke layanan di atas, saat Anda memakainya.',
      ],
    },
    contact: {
      title: 'Perubahan dan kontak',
      body: [
        'Perubahan pada kebijakan ini tercantum dalam <a href="{history}">riwayat situs di GitHub</a>. Kirim pertanyaan ke <a href="mailto:{email}">{email}</a> atau buat <a href="{issues}">issue di GitHub</a>.',
      ],
    },
    translation:
      'Ini adalah terjemahan. Jika ada perbedaan dengan <a href="{original}">versi bahasa Inggris</a>, versi bahasa Inggris yang berlaku.',
  },
  releases: {
    title: 'Yang baru di {version}',
    bugFixes: 'Dan banyak <a href="{changelog}">perbaikan bug</a>',
    sections: 'Bagian',
    r31: {
      description:
        'Stylebot 3.1 menghadirkan sinkronisasi dan cadangan dengan Google Drive, editor yang bisa diubah ukurannya, dan palet warna.',
      syncTitle: 'Sinkronisasi dan cadangan dengan Google Drive',
      syncAlt: 'Menyinkronkan gaya dengan Google Drive',
      syncBody: [
        'Aktifkan dan izinkan sinkronisasi dengan Google Drive dari <strong>halaman Opsi</strong> Stylebot.',
        'Setelah aktif, klik <strong>Sinkronkan sekarang</strong> di popup atau halaman Opsi untuk menyinkronkan gaya di browser Anda dengan yang dicadangkan di Google Drive.',
      ],
      resizeTitle: 'Ubah ukuran editor Stylebot',
      resizeAlt: 'Mengubah ukuran editor Stylebot',
      resizeBody:
        'Kini Anda bisa mengubah ukuran editor Stylebot, dan secara opsional mengecilkan halaman agar kontennya tidak tertutup editor.',
      colorsTitle: 'Palet warna',
      colorsAlt: 'Memilih warna dari palet',
      colorsBody:
        'Pemilih warna yang lebih baik dengan palet memudahkan Anda memilih warna yang bagus.',
    },
    r32: {
      description:
        'Stylebot 3.2 menghadirkan penerapan gaya yang lebih cepat tanpa kedipan, Mode baca yang didesain ulang, dan popup yang lebih rapi.',
      lede: 'Stylebot kembali aktif dikembangkan, dengan lebih banyak pembaruan yang direncanakan.',
      fasterTitle: 'Penerapan gaya lebih cepat, tanpa kedipan',
      fasterBody:
        'CSS kini disimpan di cache dan langsung diterapkan, jadi halaman tidak lagi berkedip tanpa gaya sambil menunggu gaya Anda dimuat, dan semuanya terasa lebih gesit.',
      readabilityTitle: 'Mode baca yang didesain ulang',
      readabilityAlt: 'Kontrol tema dan tipografi baru langsung di Mode baca',
      readabilityItems: [
        'Algoritme ekstraksi artikel yang lebih baru, lebih baik dalam merapikan halaman',
        'Aktif lebih cepat, diterapkan sebelum bagian halaman lainnya selesai dimuat',
        'Penyesuaian tema dan tipografi langsung di tempat',
        'Animasi pemuatan yang lebih halus',
        'Pintasan keyboard untuk mengaktifkan/menonaktifkannya',
      ],
      popupTitle: 'Popup yang lebih rapi',
      popupAlt: 'Popup Stylebot yang didesain ulang',
      popupItems: [
        'Baris tombol yang bisa diklik sepenuhnya',
        'Tombol setelan langsung',
        'Dukungan mode gelap',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 menghadirkan editor yang didesain ulang, baris perintah untuk agen coding, profil, panel samping, Chat, riwayat versi, dan sinkronisasi.',
      lede: 'Editor yang didesain ulang, baris perintah untuk agen coding, profil, dan panel samping.',
      toc: {
        editor: 'Editor baru',
        cli: 'Baris perintah',
        profiles: 'Profil',
        panel: 'Panel samping',
        history: 'Riwayat versi',
        sync: 'Sinkronisasi',
        chat: 'Chat',
        more: 'Dan lainnya',
      },
      editorTitle: 'Editor yang didesain ulang',
      editorAlt:
        'Tab Dasar yang didesain ulang, mengubah gaya Hacker News dengan profil Newspaper',
      editorBody: 'Dibangun ulang dari awal, kini dengan mode gelap.',
      editorItems: [
        'Kontrol yang dikelompokkan dan menampilkan nilai asli halaman',
        'Pembuatan selektor yang lebih baik, dengan selektor yang tetap berfungsi saat situs diperbarui dan pilihan selektor lainnya',
        'Menunjukkan saat nilai ditimpa aturan lain',
        'Palet warna dan pipet',
        'Pratinjau warna atau font di halaman dengan mengarahkan kursor ke sana',
        'Edit properti CSS lainnya langsung di tempat lewat Properti lainnya',
        'Dukungan urungkan',
      ],
      profilesTitle: 'Profil',
      profilesAlt: 'Popup di situs dengan dua profil, Dracula dan Gruvbox',
      profilesBody:
        'Simpan beberapa tampilan untuk sebuah situs dan beralih di antaranya dari editor atau popup.',
      panelTitle: 'Panel samping, atau jendela tersendiri',
      panelAlt: 'Menu editor, dengan Posisi diatur ke panel samping',
      panelBody:
        'Di Chrome dan Edge, editor terbuka di panel samping. Atau pisahkan ke jendelanya sendiri, dari <strong>Posisi</strong> di menu <strong>⋯</strong> editor.',
      historyTitle: 'Riwayat versi',
      historyBody:
        'Setiap perubahan disimpan, dan Anda bisa memulihkan versi sebelumnya mana pun.',
      syncTitle: 'Sinkronisasi',
      syncBody:
        'Sinkronisasi Google Drive kini lebih andal. Editan dari komputer yang berbeda digabungkan, jadi tidak ada yang hilang. Sinkronisasi berjalan otomatis setiap 30 menit dan tepat setelah Anda mengedit.',
      chatTitle: 'Chat',
      chatBody:
        'Tidak memakai agen coding? Jelaskan apa yang Anda inginkan, atau pilih tampilan yang disarankan, dan Stylebot yang menulis CSS-nya. Gunakan kunci Claude, OpenAI, atau Gemini Anda sendiri.',
      chatAlt:
        'Tab Chat menyarankan tampilan untuk halaman: Nyaman, Tenang, dan Hanya tautan berwarna',
      moreTitle: 'Dan lainnya',
      moreItems: [
        'stylebot.dev yang baru',
        'Ikon Stylebot yang baru',
        'Gaya kini diterapkan di dalam shadow DOM, sehingga berfungsi di situs yang dibangun dengan web component',
        'Pintasan Stylebot kini ada di setelan pintasan browser Anda. Di Chrome dan Edge, pintasan yang pernah Anda ubah kembali ke default, jadi atur lagi di sana.',
        'Stylebot kini tersedia dalam bahasa Vietnam',
      ],
    },
  },
  notFound: {
    title: 'Halaman tidak ditemukan',
    description: 'Halaman ini tidak ada.',
    heading: 'Halaman ini tidak ada, dan tampilannya parah.',
    done: 'Jauh lebih baik. Halamannya tetap tidak ada, tapi setidaknya sekarang tampilannya bagus.',
    pageTitle: '404 Tidak Ditemukan',
    pageBody: 'URL yang diminta tidak ditemukan di server ini.',
    pageLink: 'Ke halaman beranda',
    nice: '✨ Buat jadi bagus saja',
  },
};

export default site;
