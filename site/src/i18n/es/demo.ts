import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'Fíjalo en la barra de herramientas',
      body: 'Ten Stylebot a un clic.',
      captions: {
        menu: 'Stylebot empieza en el menú de extensiones.',
        pinned: 'Fijado. Stylebot ya está en tu barra de herramientas.',
      },
    },
    open: {
      title: 'Abre el editor',
      keysBody: 'Haz clic en el icono o pulsa {keys}.',
      captions: {
        iconThenStyle:
          'Haz clic en el icono de Stylebot y luego en Estilizar esta página.',
        orKeys: 'O pulsa {keys} para abrirlo directamente.',
      },
    },
    pick: {
      title: 'Elige un elemento',
      fieldsBody:
        'Haz clic para seleccionar. Los campos muestran sus estilos actuales.',
      captions: {
        hoverToSee: 'Pasa el cursor para ver a qué puedes dar estilo.',
        select: 'Haz clic para seleccionar. El selector se rellena solo.',
        computed: 'Cada campo muestra el valor calculado actual del elemento.',
      },
    },
    style: {
      title: 'Dale estilo',
      body: 'Usa los controles de Básico o escribe CSS.',
      captions: {
        size: 'Ajusta el tamaño…',
        color: '…y el color.',
        plainCss: 'Cada cambio es CSS normal, guardado para este sitio.',
        byHand: 'O escribe CSS a mano.',
        live: 'La página se actualiza mientras escribes.',
      },
    },
    profiles: {
      title: 'Perfiles',
      looksBody: 'Guarda varios estilos para el mismo sitio.',
      captions: {
        createForLook: 'Crea un perfil para un estilo nuevo.',
        created: '{profile} empieza vacío. {defaultProfile} sigue guardado.',
        newspaperLook: 'Dale un aire de periódico.',
        darkLook: 'Dale un estilo oscuro y cálido.',
        switchAnytime: 'Cambia entre ellos cuando quieras.',
        backToDefault: 'De vuelta a {defaultProfile}. Un sitio, dos estilos.',
      },
    },
  },
  browser: {
    extensions: 'Extensiones',
    fullAccess: 'Acceso total',
    fullAccessNote:
      'Estas extensiones pueden ver y cambiar información en este sitio.',
    otherExtensions: {
      adBlocker: 'Bloqueador de anuncios',
      passwordManager: 'Gestor de contraseñas',
      translate: 'Traductor',
      webArchive: 'Archivo web',
    },
  },
  popup: {
    readability: 'Legibilidad',
    styleThisPage: 'Estilizar esta página',
  },
  editor: {
    defaultProfile: 'Predeterminado',
    newProfile: 'Periódico',
    newProfileDark: 'Ave nocturna',
    createProfile: 'Crear perfil',
    pickAnElement: 'Elegir un elemento',
    tabs: {
      basic: 'Básico',
      code: 'Código',
      presets: 'Preajustes',
      chat: 'Chat',
    },
    basic: {
      hide: 'Ocultar',
      reset: 'Restablecer',
      text: 'Texto',
      font: 'Fuente',
      defaultFont: 'Predeterminado',
      size: 'Tamaño',
      lineHeight: 'Altura de línea',
      color: 'Color',
      decoration: 'Decoración',
      none: 'Ninguno',
      alignment: 'Alineación',
      background: 'Fondo',
      box: 'Caja',
      effects: 'Efectos',
      moreProperties: 'Más propiedades',
    },
    code: {
      noStyles: 'Aún no hay estilos',
    },
    presets: {
      readability: 'Legibilidad',
      articlesOnly: 'Solo artículos',
      readabilityDescription:
        'Convierte los artículos de este sitio en una vista de lectura limpia y sin distracciones, con el tema, la fuente y el tamaño que elijas.',
      grayscale: 'Escala de grises',
      grayscaleDescription: 'Aplica la escala de grises a la página.',
    },
  },
  article: {
    nav: {
      news: 'Noticias',
      travel: 'Viajes',
      signIn: 'Iniciar sesión',
    },
    kicker: 'Viajes · Reportaje',
    headline: 'El discreto regreso del ferri nocturno',
    dek: 'Tres navieras apuestan a que los viajeros cambiarán la velocidad por un camarote, vistas al mar y nada de aeropuertos.',
    byline: 'Marta Linde · 24 sept. · 6 min de lectura',
    paragraphs: [
      'Veinte años después de que se suprimiera la última travesía nocturna, tres navieras vuelven a poner camarotes en el agua. La propuesta es sencilla: embarcar después de cenar, dormir durante la travesía y despertar en otro país.',
      'La primera línea recuperada agotó las plazas de todo el verano en una semana. La mayoría de los pasajeros tiene menos de cuarenta años, y muchos nunca han viajado de noche, ni en tren ni en barco. Según las navieras, primero se llenan los camarotes, luego las butacas reclinables y por último la cubierta.',
    ],
    quote:
      '«Nadie lo reserva para ahorrar tiempo. Lo reservan para perder un poco».',
    quoteBy: '— Ines Varga, planificadora de rutas',
  },
  steps: {
    heading: 'Cómo funciona',
    counter: '{current} / {total}',
    jump: 'Ir a este punto',
  },
};

export default demo;
