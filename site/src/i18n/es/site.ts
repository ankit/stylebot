import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Cambia el estilo de cualquier web',
    titleSuffix: '{title} - Stylebot',
    description:
      'Señala algo en una página y cámbialo, o describe lo que quieres. Stylebot escribe el CSS. Gratis y de código abierto para Chrome, Firefox y Edge.',
  },
  header: {
    home: 'Inicio de Stylebot',
    manual: 'Manual',
    install: 'Instalar',
    language: 'Idioma',
    suggest: 'Ver esta página en español',
    dismiss: 'Descartar',
    theme: 'Tema: {theme}',
  },
  themes: {
    light: 'Claro',
    dark: 'Oscuro',
    stylebot: 'Stylebot',
    newsprint: 'Periódico',
  },
  footer: {
    changelog: 'Novedades',
    donate: 'Invítame a un café',
  },
  store: {
    add: 'Añadir a {store}',
    addFree: 'Añadir a {store}: es gratis',
    reinstall: 'Reinstalar en {store}',
  },
  zoom: {
    label: 'Captura de pantalla ampliada',
    close: 'Cerrar',
  },
  home: {
    title: '{word} cualquier web.',
    titleWord: 'Rediseña',
    titleWordHint: 'Haz clic para cambiar el estilo',
    lede: 'Señala algo en la página y cámbialo, o simplemente describe lo que quieres. Stylebot escribe el CSS y carga tu estilo cada vez que vuelves.',
    also: 'También en {first} y {second}',
    installTitle: 'Instala Stylebot',
    installBody:
      'Gratis y de código abierto desde 2011. Sin cuenta y sin rastreo. Tus estilos se quedan en tu navegador y el código está en GitHub.',
    cli: '¿Usas un agente de programación? Añade la <a href="#cli">CLI</a>:',
  },
  cli: {
    copy: 'Copiar',
    copied: 'Copiado',
    copyCommand: 'Copiar {command}',
    title: 'Funciona con tu agente de programación',
    body: 'Claude Code, Codex, Cursor o cualquier agente que ejecute comandos puede usar Stylebot desde la terminal.',
    guide: 'Configura la CLI →',
    demo: {
      terminal: 'Terminal · agente de programación',
      prompt: 'haz que {site} se lea mejor de noche',
      done: 'Fondo oscuro, texto más cálido, cuerpo con serifa más grande. Anuncio eliminado.',
      before: 'Antes',
      after: 'Después',
      kicker: 'Viajes',
      headline: 'El discreto regreso del ferri nocturno',
      dek: 'Tres navieras apuestan a que los viajeros cambiarán la velocidad por un camarote, vistas al mar y nada de aeropuertos.',
      text: 'El de las 22:40 desde Rostock zarpa sin ceremonias. Cuando las luces del puerto quedan atrás, la mayoría de los pasajeros ya ha encontrado su camarote y en el bar solo queda un murmullo.',
      ad: 'Anuncio',
    },
    page: {
      title: 'Línea de comandos',
      description:
        'Controla Stylebot desde la terminal, o deja que un agente de programación como Claude Code, Codex o Cursor cambie el estilo de los sitios en tu navegador con tu propia suscripción.',
      heading: 'Stylebot desde tu terminal',
      lede: 'Controla Stylebot desde la línea de comandos, o deja que lo haga un agente de programación como Claude Code, Codex o Cursor. El agente cambia el estilo de los sitios directamente en tu navegador, con tu propia suscripción en lugar de una clave de API.',
      setup: 'Configúralo',
      install: 'Instala Stylebot',
      installBody:
        'Para Chrome o Edge. La línea de comandos aún no funciona en Firefox.',
      cli: 'Instala la CLI',
      cliBody: 'Necesita Node 20 o posterior.',
      connect: 'Conéctala a tus navegadores',
      connectBody:
        'Así la CLI queda registrada en Chrome y Edge, para que Stylebot pueda comunicarse con ella.',
      access: 'Activa el acceso por línea de comandos',
      accessBody:
        'En las opciones de Stylebot, en Básico, activa <strong>Permitir que las apps de este ordenador controlen Stylebot</strong> y acepta los permisos que pida el navegador.',
      plugin: 'Añade el plugin de Claude Code',
      optional: 'Opcional',
      pluginBody: 'En Claude Code, ejecuta:',
      tryIt: 'Y luego pruébalo:',
      commands: 'Comandos',
      commandsBody:
        'Un agente los ejecuta por ti, pero también puedes ejecutarlos tú. <code>stylebot --help</code> los muestra todos.',
      examples: {
        open: 'Abre la página en una ventana detrás de la tuya y muestra el id de su pestaña.',
        outline: 'Muestra los elementos visibles de la página como un esquema.',
        css: 'Guarda el CSS como estilo del sitio, lo aplica y comprueba la página.',
        screenshot: 'Guarda una imagen de la pestaña.',
      },
      privacy: 'Privacidad',
      privacyBody: [
        'El acceso por línea de comandos está desactivado hasta que lo activas. Mientras está activado, las apps de este equipo pueden leer tus páginas abiertas, hacer capturas de pantalla y cambiar tus estilos. Puedes desactivarlo en cualquier momento en las opciones de Stylebot.',
        'Stylebot y la CLI solo se comunican entre sí, en este equipo, y no envían nada a ningún sitio. Un agente envía lo que lee a su propio proveedor, como hace Claude Code con Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Estilos para empezar',
    lede: 'Copia uno y ajústalo, o empieza desde cero.',
    hint: 'Abre {site} y pégalo en la pestaña Código.',
    enlarge: 'Ampliar {site}: {name}',
    alt: '{site} con un estilo nuevo de Stylebot: {name}',
    install: 'Instalar',
    installTitle: 'Instalar en Stylebot',
    installed: 'Instalado',
    installedAs: 'Instalado como {name}',
    installFailed: 'No se pudo instalar',
    copy: 'Copiar CSS',
    copied: 'Copiado',
    source: 'Ver en GitHub',
    lightbox: 'Sitio con un estilo nuevo',
    close: 'Cerrar',
  },
  quotes: {
    title: 'A la gente le encanta Stylebot',
  },
  features: {
    title: 'Todo lo demás que incluye.',
    previous: 'Función anterior',
    next: 'Función siguiente',
    sync: {
      title: 'Sincronización',
      body: 'Conecta Google Drive y tus estilos te acompañan a cada equipo en el que inicies sesión. Stylebot sincroniza cada 30 minutos y justo después de que edites.',
      connected: 'Conectado a Google Drive',
      synced: 'Sincronizado hace 2 minutos',
      syncNow: 'Sincronizar ahora',
      savedTo: 'Guardado en',
      disconnect: 'Desconectar',
      schedule: 'Frecuencia',
      scheduleValue: 'Cada 30 minutos y justo después de editar un estilo',
    },
    history: {
      title: 'Historial de versiones',
      body: 'Se guarda cada cambio en tus estilos, del más reciente al más antiguo. Abre una entrada para ver qué cambió y restáurala con un clic.',
      today: 'Hoy, 25 sept.',
      yesterday: 'Ayer, 24 sept.',
      noChanges: 'Sin cambios',
      edited: 'Editado',
      sites: '10 sitios',
      current: 'Actual',
      times: ['1:04', '0:41', '23:41'],
    },
    presets: {
      title: 'Preajustes',
      body: 'Legibilidad y escala de grises funcionan en cualquier sitio y se combinan con tus propios cambios.',
      readability: 'Legibilidad',
      articlesOnly: 'Solo artículos',
      readabilityBody:
        'Una vista de lectura limpia, con el tema, la fuente y el tamaño que elijas.',
      grayscale: 'Escala de grises',
      grayscaleBody: 'Aplica la escala de grises a la página.',
    },
    chat: {
      title: 'Chat',
      body: '¿Sin agente de programación? Describe un cambio en la pestaña Chat y Stylebot escribe el CSS. Usa tu propia clave de Claude, OpenAI o Gemini. Se queda en tu navegador.',
      prompt: 'Haz que el artículo se lea mejor de noche',
      reply:
        'He puesto un fondo oscuro con texto más cálido, y el cuerpo en una serifa más grande con más interlineado.',
      updated: 'Estilos actualizados',
      undo: 'Deshacer',
      placeholder: 'Describe un cambio',
    },
  },
  welcome: {
    title: 'Bienvenida',
    description:
      'Cómo funciona Stylebot, de principio a fin, en más o menos un minuto.',
    heading: 'Stylebot ya está instalado.',
    yourTurn: 'Te toca.',
    yourTurnBody:
      'Abre cualquier sitio y pulsa el atajo. Nada cambia hasta que lo hagas.',
    manual: 'Manual',
    agentTitle: 'Conecta tu agente de programación',
    agentBody:
      'Claude Code, Codex, Cursor o cualquier agente que ejecute comandos puede usar Stylebot desde la terminal.',
    agentPrompt:
      'ponle a este sitio un tema Everforest con fuentes más bonitas',
    agentReply: 'Listo: colores Everforest con Lora y Newsreader.',
  },
  goodbye: {
    title: 'Adiós',
    description: 'Gracias por usar Stylebot.',
    panda: 'Un panda pixelado diciendo adiós con la mano',
    heading: 'Gracias por usar Stylebot.',
    lede: 'Tus estilos se han eliminado de este navegador. Si activaste la sincronización, todavía tienes una copia de seguridad en tu Google Drive.',
    changedMind: '¿Has cambiado de idea?',
    note: 'Trabajo en Stylebot desde 2011. Gracias por probarlo y por cualquier comentario que dejes.',
    signature: '— Ankit',
    feedback: {
      question: '¿Por qué lo desinstalaste?',
      optional: 'Es opcional y solo lleva un segundo.',
      reasons: [
        'Ya no lo necesitaba',
        'Es difícil de usar',
        'Rompió un sitio',
        'Le falta una función',
        'Es demasiado lento',
        'Otro motivo',
      ],
      placeholder: '¿Algo más? (opcional)',
      send: 'Enviar comentarios',
      sendNote: 'Le llega directamente al desarrollador.',
      thanks: 'Gracias. Leo todos los comentarios.',
    },
  },
  manual: {
    title: 'Manual',
    description:
      'Cómo usar Stylebot: dar estilo a un sitio, perfiles, la línea de comandos, Chat, sincronización, reglas de URL y atajos.',
    lede: 'Cómo funciona Stylebot, desde tu primer estilo hasta los perfiles, Chat y la sincronización.',
    sections: 'Secciones del manual',
    toc: {
      start: 'Primeros pasos',
      profiles: 'Perfiles',
      cli: 'Línea de comandos',
      chat: 'Chat',
      presets: 'Legibilidad y escala de grises',
      sync: 'Sincronización, respaldo e historial',
      urls: 'Reglas de URL',
      shortcuts: 'Atajos de teclado',
      help: 'Ayuda y soporte',
    },
    start: {
      open: 'Haz clic en el icono de Stylebot en la barra de herramientas y luego en <strong>Estilizar esta página</strong>. O pulsa [[alt+shift+M]] en cualquier pestaña, o haz clic derecho en un elemento y elige <strong>Stylebot → Dar estilo al elemento</strong>.',
      shot: 'La pestaña Básico, eligiendo un enlace en un artículo de Wikipedia',
      pick: 'Haz clic en el selector de elementos, pasa el cursor por la página y haz clic en un elemento. Pulsa [[↑]] antes de hacer clic para seleccionar su elemento padre. Luego cámbialo en <strong>Básico</strong> o escribe CSS en <strong>Código</strong>. Los cambios se guardan a medida que los haces y se cargan cada vez que visitas el sitio.',
      fonts: 'Fuentes',
      fontsBody:
        'Busca entre 400 <a href="https://fonts.google.com/">Google Fonts</a> y Stylebot carga la que elijas, o escribe cualquier fuente instalada en tu equipo.',
      position: 'Posición del editor',
      positionBody:
        'En Chrome y Edge, el editor se abre en el panel lateral. Usa <strong>Posición</strong> en su menú <strong>⋯</strong> para abrirlo en una ventana aparte o acoplarlo en la página. Firefox no tiene panel lateral.',
      off: 'Desactivar un estilo',
      offBody:
        'Usa el interruptor de la ventana emergente o [[alt+shift+S]]. El estilo se conserva, solo que no se aplica.',
      callout:
        'Algunos sitios usan nombres de clase generados automáticamente que cambian cuando el sitio se actualiza. Si un estilo deja de funcionar, vuelve a elegir el elemento para obtener un selector nuevo.',
    },
    profiles: {
      intro:
        'Un perfil es una hoja de estilo aparte para el mismo sitio, así puedes tener más de un aspecto y cambiar entre ellos. Solo se aplica uno a la vez, y todos los sitios empiezan con Predeterminado.',
      shot: 'La ventana emergente en Hacker News con cuatro perfiles: Violet Hour, Everforest, Hearth y Newspaper',
      manage:
        'Haz clic en el nombre del perfil junto al sitio, en la cabecera del editor, para crear, renombrar, duplicar o eliminar perfiles. Cambia entre ellos ahí o en la ventana emergente, donde <strong>Sin estilo</strong> desactiva el estilo en el sitio. Los perfiles nuevos empiezan vacíos.',
    },
    cli: {
      intro:
        'El comando <code>stylebot</code> permite que un agente de programación como Claude Code, Codex o Cursor cambie el estilo de los sitios directamente en tu navegador, con tu propia suscripción en lugar de una clave de API. Es la mejor forma de que un agente le dé estilo a un sitio, y también puedes ejecutar los comandos tú mismo.',
      setup: 'Configuración',
      setupBody:
        'Instala la CLI, conéctala a tus navegadores y luego activa <strong>Permitir que las apps de este ordenador controlen Stylebot</strong> en Opciones. La <a href="{cli}">página de la línea de comandos</a> explica cada paso. Por ahora, solo en Chrome y Edge.',
      claudeCodeBody:
        'Añade el plugin de Stylebot y pide un cambio con <code>/stylebot</code>, como un tema oscuro para un sitio.',
      privacy: 'Privacidad',
      privacyBody:
        'El acceso por línea de comandos está desactivado hasta que lo activas. Stylebot y la CLI solo se comunican entre sí, en este equipo; un agente envía lo que lee a su propio proveedor.',
    },
    chat: {
      intro:
        'El chat es ideal para ajustes rápidos. Describe el cambio que quieres en la pestaña Chat y Stylebot escribe el CSS. Puedes elegir un elemento para señalar algo concreto, o adjuntar una captura de pantalla para mostrar lo que quieres decir. Para cambios más grandes, como un tema completamente nuevo, usa la <a href="#cli">línea de comandos</a>.',
      shot: 'La pestaña Chat tras pedir un tema de bosque con una fuente serif legible en Hacker News',
      key: 'Usa tu propia clave',
      keyBody:
        'Conecta una clave de API de Claude, OpenAI o Gemini. Las claves solo se guardan en este equipo y nunca se sincronizan. Los mensajes van directamente de tu navegador al proveedor.',
      changes: 'Adónde van los cambios',
      changesBody:
        'Cada cambio se aplica al momento y se añade a la hoja de estilo del perfil actual. Haz clic en <strong>N líneas añadidas</strong> para verlo en Código, o deshazlo desde el chat.',
      cost: 'Coste',
      costBody:
        'El recuento de tokens bajo el cuadro de mensaje muestra lo que ha consumido la conversación, con un coste estimado.',
    },
    presets: {
      intro:
        'Ambos están en la pestaña Preajustes y se combinan con tus propios cambios. <strong>Legibilidad</strong> convierte los artículos de un sitio en una vista de lectura limpia, con tema, fuente, tamaño y ancho a tu elección; las páginas que no son artículos no se tocan. <strong>Escala de grises</strong> quita el color del sitio, con la intensidad que quieras.',
      shot: 'El artículo de Wikipedia sobre Matemáticas en la vista Legibilidad, con los Ajustes de lectura abiertos',
    },
    sync: {
      shot: 'Opciones, conectado a Google Drive y sincronizado',
      drive: 'Sincronización con Google Drive',
      driveBody:
        'Conecta Google Drive en Opciones. Tus estilos, perfiles incluidos, se sincronizan cada 30 minutos y justo después de que edites. Stylebot solo ve los archivos que crea en tu Drive, y no hay ningún servidor de Stylebot.',
      conflicts: 'Conflictos',
      conflictsBody:
        'Si un estilo cambió en dos equipos, se conserva tu edición más reciente y la otra versión se guarda en un comentario, así que no se pierde nada.',
      backup: 'Respaldo',
      backupBody:
        'Exporta e importa todos tus estilos como JSON desde Opciones.',
      history: 'Historial de versiones',
      historyBody:
        'Cada cambio en este equipo se guarda en Opciones, incluidos los que llegan por sincronización. Restaura cualquier versión anterior, para algunos sitios o para todos.',
      historyShot:
        'Historial de versiones en Opciones, con el cambio más reciente primero',
    },
    urls: {
      intro:
        'De forma predeterminada, Stylebot asocia los estilos a los sitios web por nombre de dominio. Edita la URL de un estilo en Opciones y usa estos patrones para algo más específico.',
      wildcards: {
        anything: 'Coincide con cualquier secuencia de caracteres.',
        segment:
          'Coincide con cualquier secuencia de caracteres hasta encontrar una /.',
        list: 'Separa una lista de patrones. Una URL coincide si coincide cualquiera de los patrones.',
        regex:
          'Al principio de una URL, la convierte en una expresión regular.',
      },
      examplesTitle: 'Ejemplos',
      examples: {
        domain: 'El dominio docs.google.com o cualquiera de sus subdominios.',
        prefix: 'Cualquier URL que empiece por docs.',
        numbered: 'docs.google.com, docs1.google.com, docs2.google.com, etc.',
        subdomains: 'news.ycombinator.com y apps.ycombinator.com.',
        either: 'Cualquiera de los dos dominios o sus subdominios.',
        regex: 'Solo la página principal de Reddit.',
        everywhere:
          'Todos los sitios. Útil para estilos que quieres en todas partes.',
      },
    },
    shortcuts: {
      intro:
        'Los atajos globales funcionan en cualquier página a la que Stylebot pueda dar estilo; cámbialos en los ajustes de atajos del navegador, enlazados desde Opciones. Para ver los atajos del propio editor, pulsa [[?]] en el editor.',
      or: 'o',
      unset: 'Sin asignar; asígnalo en tu navegador',
      global: 'Globales',
      picker: 'Al elegir un elemento',
      actions: {
        toggleEditor: 'Alternar editor',
        toggleStyling: 'Alternar estilo',
        toggleReadability: 'Alternar legibilidad',
        toggleGrayscale: 'Alternar escala de grises',
        parent: 'Seleccionar el elemento padre',
        child: 'Volver al elemento hijo',
        select: 'Seleccionar el elemento resaltado',
      },
    },
    help: {
      body: '¿Encontraste un error o tienes una idea? Abre un issue en <a href="{issues}">GitHub</a>. Stylebot es gratis y de código abierto, y se mantiene desde 2011. Si te resulta útil, puedes apoyarlo <a href="{donate}">invitándome a un café</a>.',
    },
  },
  privacy: {
    title: 'Privacidad',
    description:
      'Qué hace Stylebot con tus datos: sin servidor, sin cuenta, sin analíticas.',
    lede: 'Stylebot no tiene servidor, ni cuenta, ni analíticas. Tus estilos se quedan en tu navegador a menos que actives la sincronización, el chat o la línea de comandos, y en ese caso van directamente a un servicio que elegiste o a una app que autorizaste.',
    updated: 'Última actualización: {date}',
    browser: {
      title: 'Lo que se queda en tu navegador',
      body: [
        'Tus estilos, perfiles, ajustes, historial, conversaciones de chat y claves de API se guardan en el almacenamiento de extensiones de tu navegador, y al desinstalar Stylebot se eliminan. Stylebot lee las páginas que visitas para darles estilo, y no envía nada de ellas salvo que uses el chat o la línea de comandos.',
      ],
    },
    sync: {
      title: 'Sincronización con Google Drive',
      body: [
        'Cuando conectas Google Drive en Opciones, tus estilos se guardan en un archivo de tu propio Drive. Stylebot solo puede ver los archivos que crea. Su token de acceso se queda en tu navegador y caduca al cabo de una hora. Desconéctalo en Opciones o en tu <a href="https://myaccount.google.com/connections">cuenta de Google</a>.',
        'El uso que hace Stylebot de la información recibida de las API de Google cumple la <a href="https://developers.google.com/terms/api-services-user-data-policy">Política de datos de usuario de los servicios de API de Google</a>, incluidos los requisitos de uso limitado.',
      ],
    },
    chat: {
      title: 'Chat',
      body: [
        'Cuando añades una clave de API y envías un mensaje, tu navegador lo envía directamente a ese proveedor junto con cualquier captura de pantalla que adjuntes, la dirección y el título de la página, un esquema de lo que se ve en ella, y su CSS y tus estilos. Eso puede incluir información personal que aparezca en la página, así que no uses el chat en páginas que no compartirías con el proveedor. Se aplica su política: <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: 'Línea de comandos',
      body: [
        'Cuando activas <q>Permitir que las apps de este ordenador controlen Stylebot</q> en Opciones, las apps que se ejecutan con tu usuario pueden ver tus pestañas, leer páginas, hacer capturas de pantalla, y leer y cambiar tus estilos, a través de una conexión local que solo tú puedes usar. Lo que lean puede llegar a los servicios que usen, como el modelo detrás de un agente de programación. Desactiva el ajuste para desconectar.',
      ],
    },
    fonts: {
      title: 'Fuentes y CSS importado',
      body: [
        'Las fuentes de Google Fonts de tus estilos se descargan de Google, que ve tu dirección IP. Las hojas de estilo que importas con <code>@import</code> se descargan desde su dirección.',
      ],
    },
    site: {
      title: 'Este sitio web',
      body: [
        'stylebot.dev no tiene anuncios ni cookies, y está alojado en GitHub Pages, que guarda registros de servidor estándar. Plausible cuenta las visitas por página, página de origen, país y tipo de dispositivo, sin cookies ni nada que te identifique.',
      ],
    },
    sharing: {
      title: 'Compartir datos',
      body: [
        'Stylebot no recopila, vende ni comparte tus datos. Solo salen de tu navegador hacia los servicios indicados arriba, cuando los usas.',
      ],
    },
    contact: {
      title: 'Cambios y contacto',
      body: [
        'Los cambios en esta política aparecen en el <a href="{history}">historial del sitio en GitHub</a>. Si tienes preguntas, escribe a <a href="mailto:{email}">{email}</a> o abre un <a href="{issues}">issue en GitHub</a>.',
      ],
    },
    translation:
      'Esta es una traducción. Si difiere de la <a href="{original}">versión en inglés</a>, prevalece la versión en inglés.',
  },
  releases: {
    title: 'Novedades de la versión {version}',
    bugFixes: 'Y muchas <a href="{changelog}">correcciones de errores</a>',
    sections: 'Secciones',
    r31: {
      description:
        'Stylebot 3.1 añade sincronización y respaldo con Google Drive, un editor redimensionable y paletas de colores.',
      syncTitle: 'Sincronización y respaldo con Google Drive',
      syncAlt: 'Sincronizando estilos con Google Drive',
      syncBody: [
        'Activa y autoriza la sincronización con Google Drive desde la <strong>página de Opciones</strong> de Stylebot.',
        'Una vez activada, haz clic en <strong>Sincronizar ahora</strong> en la ventana emergente o en la página de Opciones para sincronizar los estilos de tu navegador con los que tienes respaldados en Google Drive.',
      ],
      resizeTitle: 'Cambia el tamaño del editor de Stylebot',
      resizeAlt: 'Cambiando el tamaño del editor de Stylebot',
      resizeBody:
        'Ahora puedes cambiar el tamaño del editor de Stylebot y, si quieres, hacer que la página se encoja para que su contenido no quede debajo del editor.',
      colorsTitle: 'Paletas de colores',
      colorsAlt: 'Eligiendo un color de una paleta',
      colorsBody:
        'Un selector de color mejorado, con paletas, facilita elegir buenos colores.',
    },
    r32: {
      description:
        'Stylebot 3.2 trae estilos más rápidos y sin parpadeos, un modo Legibilidad rediseñado y una ventana emergente más limpia.',
      lede: 'Stylebot vuelve a estar en desarrollo activo, con más novedades en camino.',
      fasterTitle: 'Estilos más rápidos y sin parpadeos',
      fasterBody:
        'Ahora el CSS se guarda en caché y se aplica al instante, así que las páginas ya no parpadean sin estilo mientras se cargan tus estilos, y todo se siente más ágil.',
      readabilityTitle: 'Un modo Legibilidad rediseñado',
      readabilityAlt:
        'Los nuevos controles de tema y tipografía integrados del modo Legibilidad',
      readabilityItems: [
        'Un algoritmo de extracción de artículos más nuevo, que limpia mejor las páginas',
        'Activación más rápida, que se aplica antes de que cargue el resto de la página',
        'Personalización integrada del tema y la tipografía',
        'Animación de carga más fluida',
        'Atajo de teclado para activarlo y desactivarlo',
      ],
      popupTitle: 'Una ventana emergente más limpia',
      popupAlt: 'La ventana emergente rediseñada de Stylebot',
      popupItems: [
        'Filas de interruptores en las que se puede hacer clic en toda la fila',
        'Botón directo a los ajustes',
        'Compatibilidad con el modo oscuro',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 trae un editor rediseñado, una línea de comandos para agentes de programación, perfiles, un panel lateral, Chat, historial de versiones y sincronización.',
      lede: 'Un editor rediseñado, una línea de comandos para agentes de programación, perfiles y un panel lateral.',
      toc: {
        editor: 'Editor rediseñado',
        cli: 'Línea de comandos',
        profiles: 'Perfiles',
        panel: 'Panel lateral',
        history: 'Historial de versiones',
        sync: 'Sincronización',
        chat: 'Chat',
        more: 'Y más',
      },
      editorTitle: 'Un editor rediseñado',
      editorAlt:
        'La pestaña Básico rediseñada, dando estilo a Hacker News con un perfil Newspaper',
      editorBody: 'Reconstruido desde cero, ahora con modo oscuro.',
      editorItems: [
        'Controles agrupados que muestran los valores propios de la página',
        'Mejor generación de selectores, con selectores que siguen funcionando cuando un sitio se actualiza y otros entre los que elegir',
        'Indica cuándo otra regla anula un valor',
        'Paletas de colores y un cuentagotas',
        'Previsualiza un color o una fuente en la página al pasar el cursor por encima',
        'Edita cualquier otra propiedad CSS en el sitio, en Más propiedades',
        'Deshacer',
      ],
      profilesTitle: 'Perfiles',
      profilesAlt:
        'La ventana emergente en un sitio con dos perfiles, Dracula y Gruvbox',
      profilesBody:
        'Guarda varios aspectos para un sitio y cambia entre ellos desde el editor o la ventana emergente.',
      panelTitle: 'El panel lateral, o su propia ventana',
      panelAlt: 'El menú del editor, con Posición en el panel lateral',
      panelBody:
        'En Chrome y Edge, el editor se abre en el panel lateral. También puedes sacarlo a su propia ventana desde <strong>Posición</strong>, en el menú <strong>⋯</strong> del editor.',
      historyTitle: 'Historial de versiones',
      historyBody:
        'Se guarda cada cambio, y puedes restaurar cualquier versión anterior.',
      syncTitle: 'Sincronización',
      syncBody:
        'La sincronización con Google Drive es más robusta. Los cambios de distintos equipos se combinan, así que no se pierde ninguno. Se ejecuta sola cada 30 minutos y justo después de que edites.',
      chatTitle: 'Chat',
      chatBody:
        '¿Sin agente de programación? Describe lo que quieres, o elige un estilo sugerido, y Stylebot escribe el CSS. Usa tu propia clave de Claude, OpenAI o Gemini.',
      chatAlt:
        'La pestaña Chat sugiriendo estilos para la página: Acogedor, Sereno y Solo los enlaces en color',
      moreTitle: 'Y más',
      moreItems: [
        'Un nuevo stylebot.dev',
        'Un nuevo icono de Stylebot',
        'Los estilos ahora se aplican dentro del shadow DOM, así que funcionan en sitios hechos con web components',
        'Los atajos de Stylebot ahora están en los ajustes de atajos de tu navegador. En Chrome y Edge, los que habías cambiado vuelven a sus valores predeterminados, así que configúralos de nuevo ahí.',
        'Stylebot ya está disponible en vietnamita',
      ],
    },
  },
  notFound: {
    title: 'Página no encontrada',
    description: 'Esta página no existe.',
    heading: 'Esta página no existe, y encima se ve fatal.',
    done: 'Mucho mejor. La página sigue sin existir, pero al menos ahora se ve bien.',
    pageTitle: '404 No encontrado',
    pageBody: 'No se encontró la URL solicitada en este servidor.',
    pageLink: 'Ir a la página principal',
    nice: '✨ Déjala bonita',
  },
};

export default site;
