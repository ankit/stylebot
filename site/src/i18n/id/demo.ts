import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'Sematkan ke toolbar',
      body: 'Buka Stylebot dengan sekali klik.',
      captions: {
        menu: 'Awalnya, Stylebot ada di menu Ekstensi.',
        pinned: 'Tersemat. Stylebot kini ada di toolbar Anda.',
      },
    },
    open: {
      title: 'Buka editor',
      keysBody: 'Klik ikonnya, atau tekan {keys}.',
      captions: {
        iconThenStyle: 'Klik ikon Stylebot, lalu Ubah gaya halaman ini.',
        orKeys: 'Atau tekan {keys} untuk langsung membukanya.',
      },
    },
    pick: {
      title: 'Pilih elemen',
      fieldsBody: 'Klik untuk memilih. Kolom menampilkan gayanya saat ini.',
      captions: {
        hoverToSee:
          'Arahkan kursor untuk melihat apa yang bisa diubah gayanya.',
        select: 'Klik untuk memilih. Selektor terisi otomatis.',
        computed:
          'Setiap kolom menampilkan nilai elemen yang berlaku saat ini.',
      },
    },
    style: {
      title: 'Ubah gayanya',
      body: 'Gunakan kontrol Dasar atau tulis CSS.',
      captions: {
        size: 'Atur ukurannya…',
        color: '…dan warnanya.',
        plainCss:
          'Setiap perubahan adalah CSS biasa, disimpan untuk situs ini.',
        byHand: 'Atau tulis CSS sendiri.',
        live: 'Halaman langsung diperbarui saat Anda mengetik.',
      },
    },
    profiles: {
      title: 'Profil',
      looksBody: 'Simpan beberapa tampilan berbeda untuk situs yang sama.',
      captions: {
        createForLook: 'Buat profil untuk tampilan baru.',
        created:
          '{profile} dimulai dari kosong. {defaultProfile} tetap tersimpan.',
        newspaperLook: 'Beri profil ini tampilan ala koran.',
        darkLook: 'Beri profil ini tampilan gelap yang hangat.',
        switchAnytime: 'Beralih di antara keduanya kapan saja.',
        backToDefault: 'Kembali ke {defaultProfile}. Satu situs, dua tampilan.',
      },
    },
  },
  browser: {
    extensions: 'Ekstensi',
    fullAccess: 'Akses penuh',
    fullAccessNote:
      'Ekstensi ini dapat melihat dan mengubah informasi di situs ini.',
    otherExtensions: {
      adBlocker: 'Pemblokir iklan',
      passwordManager: 'Pengelola sandi',
      translate: 'Terjemahkan',
      webArchive: 'Arsip web',
    },
  },
  popup: {
    readability: 'Mode baca',
    styleThisPage: 'Ubah gaya halaman ini',
  },
  editor: {
    defaultProfile: 'Default',
    newProfile: 'Koran',
    newProfileDark: 'Burung hantu',
    createProfile: 'Buat profil',
    pickAnElement: 'Pilih elemen',
    tabs: {
      basic: 'Dasar',
      code: 'Kode',
      presets: 'Preset',
      chat: 'Chat',
    },
    basic: {
      hide: 'Sembunyikan',
      reset: 'Setel ulang',
      text: 'Teks',
      font: 'Font',
      defaultFont: 'Default',
      size: 'Ukuran',
      lineHeight: 'Tinggi baris',
      color: 'Warna',
      decoration: 'Dekorasi',
      none: 'Tidak ada',
      alignment: 'Perataan',
      background: 'Latar belakang',
      box: 'Kotak',
      effects: 'Efek',
      moreProperties: 'Properti lainnya',
    },
    code: {
      noStyles: 'Belum ada gaya',
    },
    presets: {
      readability: 'Mode baca',
      articlesOnly: 'Hanya artikel',
      readabilityDescription:
        'Ubah artikel di situs ini menjadi tampilan baca yang bersih dan bebas gangguan, dengan tema, font, dan ukuran pilihan Anda.',
      grayscale: 'Skala abu-abu',
      grayscaleDescription: 'Terapkan skala abu-abu pada halaman.',
    },
  },
  article: {
    nav: {
      news: 'Berita',
      travel: 'Wisata',
      signIn: 'Login',
    },
    kicker: 'Wisata · Laporan panjang',
    headline: 'Kembalinya feri malam yang senyap',
    dek: 'Tiga operator bertaruh bahwa para pelancong rela menukar kecepatan dengan kabin, pemandangan laut, dan perjalanan tanpa bandara.',
    byline: 'Marta Linde · 24 Sep · 6 menit baca',
    paragraphs: [
      'Dua puluh tahun setelah penyeberangan malam terakhir dihentikan, tiga operator kembali menghadirkan kabin di atas laut. Tawarannya sederhana: naik kapal setelah makan malam, tidur selama penyeberangan, dan bangun di negara lain.',
      'Tiket jalur pertama yang dibuka kembali terjual habis untuk musim panas dalam seminggu. Sebagian besar penumpang berusia di bawah empat puluh tahun, dan banyak yang belum pernah naik kereta atau kapal tidur sama sekali. Menurut para operator, kabin selalu penuh lebih dulu, lalu kursi rebah, baru kemudian dek.',
    ],
    quote:
      '“Tidak ada yang memesan ini untuk menghemat waktu. Mereka memesannya untuk sedikit melupakan waktu.”',
    quoteBy: '— Ines Varga, perencana rute',
  },
  steps: {
    heading: 'Cara kerjanya',
    counter: '{current} / {total}',
    jump: 'Lompat ke bagian ini',
  },
};

export default demo;
