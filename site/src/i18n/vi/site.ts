import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Thay đổi giao diện mọi trang web',
    titleSuffix: '{title} - Stylebot',
    description:
      'Chỉ vào thứ bạn muốn trên trang rồi chỉnh sửa. Stylebot viết CSS và áp dụng mỗi lần bạn quay lại. Miễn phí và mã nguồn mở cho Chrome, Firefox và Edge.',
  },
  header: {
    home: 'Trang chủ Stylebot',
    manual: 'Hướng dẫn',
    install: 'Cài đặt',
    language: 'Ngôn ngữ',
    theme: 'Giao diện: {theme}',
  },
  themes: {
    light: 'Sáng',
    dark: 'Tối',
    stylebot: 'Stylebot',
    newsprint: 'Giấy báo',
  },
  footer: {
    changelog: 'Nhật ký thay đổi',
    donate: 'Mời tôi ly cà phê',
  },
  store: {
    add: 'Thêm vào {store}',
    reinstall: 'Cài lại cho {store}',
  },
  zoom: {
    label: 'Ảnh chụp màn hình phóng to',
    close: 'Đóng',
  },
  home: {
    title: '{word} giao diện mọi trang web.',
    titleWord: 'Đổi mới',
    titleWordHint: 'Nhấp để đổi mới',
    lede: 'Chỉ vào thứ bạn muốn trên trang rồi chỉnh sửa. Stylebot viết CSS và áp dụng kiểu của bạn mỗi lần bạn quay lại.',
    also: 'Cũng có trên {first} và {second}',
    desktopOnly:
      'Stylebot chạy trên <strong>Chrome, Firefox và Edge</strong> dành cho máy tính.',
    tour: {
      label: 'Giới thiệu tính năng',
      pick: 'Trỏ vào bất cứ thứ gì. Đổi giao diện.',
      code: 'Viết CSS khi bạn muốn.',
      profiles: 'Đổi giao diện chỉ với một cú nhấp.',
    },
    installTitle: 'Cài đặt Stylebot',
    installBody:
      'Miễn phí và mã nguồn mở từ năm 2011. Không cần tài khoản, không theo dõi. Kiểu của bạn nằm trong trình duyệt, còn mã nguồn có trên GitHub.',
    cli: 'Bạn dùng trợ lý lập trình? Thêm <a href="#cli">CLI</a>:',
  },
  cli: {
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    copyCommand: 'Sao chép {command}',
    title: 'Dùng được với trợ lý lập trình của bạn',
    body: 'Stylebot có CLI, nên bất kỳ trợ lý nào chạy được lệnh đều có thể đổi giao diện trang web.',
    guide: 'Thiết lập CLI →',
    demo: {
      terminal: 'Terminal · trợ lý lập trình',
      prompt: 'làm {site} dễ đọc hơn vào ban đêm',
      done: 'Nền tối, chữ ấm hơn, thân bài dùng phông serif lớn hơn. Đã gỡ quảng cáo.',
      before: 'Trước',
      after: 'Sau',
      kicker: 'Du lịch',
      headline: 'Sự trở lại lặng lẽ của chuyến phà đêm',
      dek: 'Ba hãng tàu đang đặt cược rằng du khách sẽ chịu đi chậm để đổi lấy khoang ngủ riêng, cảnh biển và khỏi phải ra sân bay.',
      text: 'Chuyến 22:40 từ Rostock rời bến không chút phô trương. Khi ánh đèn cảng khuất dần phía sau, phần lớn hành khách đã vào khoang của mình và quầy bar chỉ còn tiếng rì rầm khe khẽ.',
      ad: 'Quảng cáo',
    },
    page: {
      title: 'Dòng lệnh',
      description:
        'Điều khiển Stylebot từ terminal, hoặc để trợ lý lập trình như Claude Code, Codex hay Cursor đổi giao diện trang web ngay trong trình duyệt, bằng gói đăng ký của riêng bạn.',
      heading: 'Stylebot từ terminal',
      lede: 'Điều khiển Stylebot từ dòng lệnh, hoặc giao việc đó cho trợ lý lập trình như Claude Code, Codex hay Cursor. Trợ lý đổi giao diện trang web ngay trong trình duyệt của bạn, dùng gói đăng ký của bạn thay vì khóa API.',
      setup: 'Thiết lập',
      install: 'Cài đặt Stylebot',
      installBody:
        'Dành cho Chrome hoặc Edge. Dòng lệnh chưa hoạt động trên Firefox.',
      cli: 'Cài đặt CLI',
      cliBody: 'Cần Node 20 trở lên.',
      connect: 'Kết nối với trình duyệt',
      connectBody:
        'Lệnh này đăng ký CLI với Chrome và Edge để Stylebot kết nối được với CLI.',
      access: 'Bật quyền truy cập dòng lệnh',
      accessBody:
        'Trong tùy chọn của Stylebot, ở mục Cơ bản, bật <strong>Cho phép truy cập từ dòng lệnh</strong> và cấp các quyền mà trình duyệt yêu cầu.',
      plugin: 'Thêm plugin Claude Code',
      optional: 'Không bắt buộc',
      pluginBody: 'Trong Claude Code, chạy:',
      tryIt: 'Rồi thử ngay:',
      commands: 'Lệnh',
      commandsBody:
        'Trợ lý lập trình sẽ chạy các lệnh này cho bạn, nhưng bạn cũng có thể tự chạy. <code>stylebot --help</code> liệt kê tất cả các lệnh.',
      examples: {
        open: 'Mở trang trong cửa sổ nằm sau cửa sổ của bạn và in ra ID của thẻ.',
        outline: 'In các phần tử hiển thị trên trang dưới dạng dàn ý.',
        css: 'Lưu CSS làm kiểu của trang web, áp dụng kiểu đó rồi kiểm tra trang.',
        screenshot: 'Lưu ảnh chụp của thẻ.',
      },
      privacy: 'Quyền riêng tư',
      privacyBody: [
        'Quyền truy cập dòng lệnh ở trạng thái tắt cho đến khi bạn bật. Khi bật, các ứng dụng trên máy tính này có thể đọc các trang bạn đang mở, chụp ảnh màn hình và thay đổi kiểu của bạn. Bạn có thể tắt bất cứ lúc nào trong tùy chọn của Stylebot.',
        'Stylebot và CLI chỉ giao tiếp với nhau, trên máy tính này, và không gửi gì đi đâu cả. Trợ lý lập trình gửi những gì đọc được đến nhà cung cấp của mình, như Claude Code gửi đến Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Kiểu có sẵn để bắt đầu',
    lede: 'Sao chép kiểu bất kỳ rồi chỉnh theo ý thích, hoặc tự tạo từ đầu.',
    hint: 'Dán vào thẻ Mã trên {site}.',
    enlarge: 'Phóng to {site}: {name}',
    alt: '{site} được đổi giao diện bằng Stylebot: {name}',
    install: 'Cài đặt',
    installTitle: 'Cài vào Stylebot',
    installed: 'Đã cài đặt',
    installedAs: 'Đã cài với tên {name}',
    installFailed: 'Không cài được',
    copy: 'Sao chép CSS',
    copied: 'Đã sao chép',
    source: 'Xem trên GitHub',
    lightbox: 'Trang web đã đổi giao diện',
    close: 'Đóng',
  },
  quotes: {
    title: 'Người dùng yêu thích Stylebot',
  },
  features: {
    title: 'Còn nhiều tính năng khác.',
    previous: 'Tính năng trước',
    next: 'Tính năng tiếp theo',
    sync: {
      title: 'Đồng bộ',
      body: 'Kết nối Google Drive để kiểu của bạn theo bạn đến mọi máy tính bạn đăng nhập. Stylebot đồng bộ 30 phút một lần và ngay sau khi bạn chỉnh sửa.',
      connected: 'Đã kết nối với Google Drive',
      synced: 'Đã đồng bộ 2 phút trước',
      syncNow: 'Đồng bộ ngay',
      savedTo: 'Đã lưu vào',
      disconnect: 'Ngắt kết nối',
      schedule: 'Lịch đồng bộ',
      scheduleValue: '30 phút một lần và ngay sau khi bạn sửa kiểu',
    },
    history: {
      title: 'Lịch sử phiên bản',
      body: 'Mọi thay đổi với kiểu của bạn đều được lưu lại, mới nhất ở trên cùng. Mở mục bất kỳ để xem những gì đã thay đổi và khôi phục chỉ bằng một cú nhấp.',
      today: 'Hôm nay, 25 thg 9',
      yesterday: 'Hôm qua, 24 thg 9',
      noChanges: 'Không có thay đổi',
      edited: 'Đã sửa',
      sites: '10 trang web',
      current: 'Hiện tại',
      times: ['1:04', '0:41', '23:41'],
    },
    presets: {
      title: 'Mẫu có sẵn',
      body: 'Chế độ đọc và thang độ xám dùng được trên mọi trang web, và kết hợp được với thay đổi của riêng bạn.',
      readability: 'Chế độ đọc',
      articlesOnly: 'Chỉ bài viết',
      readabilityBody:
        'Chế độ đọc gọn gàng, với giao diện, phông chữ và cỡ chữ tùy chọn.',
      grayscale: 'Thang độ xám',
      grayscaleBody: 'Hiển thị trang ở thang độ xám.',
    },
  },
  welcome: {
    title: 'Chào mừng',
    description:
      'Cách Stylebot hoạt động, từ đầu đến cuối, trong khoảng một phút.',
    heading: 'Đã cài đặt Stylebot.',
    yourTurn: 'Đến lượt bạn.',
    yourTurnBody:
      'Mở trang web bất kỳ và nhấn phím tắt. Trang chỉ thay đổi khi bạn bắt tay vào chỉnh.',
    manual: 'Hướng dẫn',
    agentTitle: 'Bạn dùng trợ lý lập trình?',
    agentBody:
      'Bạn cũng có thể thêm CLI của Stylebot để trợ lý đổi giao diện trang web giúp bạn.',
    agentPrompt:
      'đổi trang này sang giao diện Everforest, phông chữ đẹp hơn nhé',
    agentReply: 'Đã chuyển sang màu Everforest, dùng phông Lora và Newsreader.',
  },
  goodbye: {
    title: 'Tạm biệt',
    description: 'Cảm ơn bạn đã dùng Stylebot.',
    heading: 'Cảm ơn bạn đã dùng Stylebot.',
    lede: 'Các kiểu của bạn đã được xóa khỏi trình duyệt này. Nếu bạn đã bật đồng bộ, bản sao lưu vẫn còn trong Google Drive của bạn.',
    changedMind: 'Bạn đổi ý?',
    feedback: {
      question: 'Vì sao bạn gỡ cài đặt?',
      reasons: [
        'Không cần dùng nữa',
        'Khó sử dụng',
        'Gây lỗi trên trang web',
        'Thiếu tính năng',
        'Quá chậm',
        'Lý do khác',
      ],
      placeholder: 'Bạn muốn nói thêm gì không? (không bắt buộc)',
      send: 'Gửi góp ý',
      thanks: 'Cảm ơn bạn đã gửi góp ý.',
    },
  },
  manual: {
    title: 'Hướng dẫn',
    description:
      'Cách dùng Stylebot: tạo kiểu cho trang web, hồ sơ, dòng lệnh, đồng bộ, quy tắc URL và phím tắt.',
    lede: 'Cách Stylebot hoạt động, từ kiểu đầu tiên đến hồ sơ và đồng bộ.',
    sections: 'Các mục hướng dẫn',
    toc: {
      start: 'Bắt đầu',
      profiles: 'Hồ sơ',
      presets: 'Mẫu có sẵn',
      sync: 'Đồng bộ và lịch sử phiên bản',
      urls: 'Quy tắc URL',
      cli: 'CLI',
      shortcuts: 'Phím tắt',
      help: 'Trợ giúp và hỗ trợ',
    },
    start: {
      open: 'Nhấp vào biểu tượng Stylebot trên thanh công cụ, rồi chọn <strong>Tạo kiểu cho trang này</strong>. Hoặc nhấn [[alt+shift+M]] trên thẻ bất kỳ, hay nhấp chuột phải vào phần tử và chọn <strong>Stylebot → Tạo kiểu phần tử</strong>.',
      shot: 'Thẻ Cơ bản, đang chọn liên kết trong bài viết Wikipedia',
      pick: 'Nhấp vào công cụ chọn, di chuột trên trang rồi nhấp vào phần tử. Nhấn [[↑]] trước khi nhấp để chọn phần tử cha. Sau đó chỉnh sửa trong <strong>Cơ bản</strong>, hoặc viết CSS trong <strong>Mã</strong>. Thay đổi được lưu ngay khi bạn thực hiện và được áp dụng mỗi lần bạn truy cập trang web.',
      fonts: 'Phông chữ',
      fontsBody:
        'Tìm trong 400 phông <a href="https://fonts.google.com/">Google Fonts</a> và Stylebot sẽ tải phông bạn chọn, hoặc nhập tên phông bất kỳ đã cài trên máy tính của bạn.',
      position: 'Vị trí trình chỉnh sửa',
      positionBody:
        'Trong Chrome và Edge, trình chỉnh sửa mở trong bảng bên. Dùng <strong>Vị trí</strong> trong menu <strong>⋯</strong> để mở trình chỉnh sửa trong cửa sổ riêng hoặc gắn vào trang. Firefox không có bảng bên.',
      off: 'Tắt kiểu',
      offBody:
        'Dùng công tắc trong cửa sổ bật lên, hoặc nhấn [[alt+shift+S]]. Kiểu vẫn được giữ, chỉ không được áp dụng.',
      callout:
        'Một số trang web dùng tên class tự động tạo, thay đổi mỗi khi trang cập nhật. Nếu kiểu ngừng hoạt động, hãy chọn lại phần tử để lấy bộ chọn mới.',
    },
    profiles: {
      intro:
        'Hồ sơ là bảng kiểu riêng cho cùng một trang web, để bạn giữ nhiều giao diện và chuyển đổi giữa chúng. Mỗi lúc chỉ áp dụng một hồ sơ, và mọi trang web đều bắt đầu với hồ sơ Mặc định.',
      shot: 'Cửa sổ bật lên trên Hacker News với bốn hồ sơ: Violet Hour, Everforest, Hearth và Newspaper',
      manage:
        'Nhấp vào tên hồ sơ cạnh tên trang web ở đầu trình chỉnh sửa để tạo, đổi tên, nhân bản hoặc xóa hồ sơ. Chuyển đổi giữa các hồ sơ tại đó hoặc trong cửa sổ bật lên, nơi <strong>Không dùng kiểu</strong> tắt kiểu cho trang web. Hồ sơ mới bắt đầu trống.',
    },
    cli: {
      intro:
        'Lệnh <code>stylebot</code> cho phép trợ lý lập trình như Claude Code, Codex hay Cursor đổi giao diện trang web ngay trong trình duyệt của bạn, dùng gói đăng ký của bạn thay vì khóa API. Bạn cũng có thể tự chạy các lệnh.',
      setup: 'Thiết lập',
      setupBody:
        'Cài đặt CLI, kết nối CLI với trình duyệt, rồi bật <strong>Cho phép truy cập từ dòng lệnh</strong> trong Tùy chọn. <a href="{cli}">Trang CLI</a> hướng dẫn từng bước. Hiện chỉ hỗ trợ Chrome và Edge.',
      claudeCodeBody:
        'Thêm plugin Stylebot rồi yêu cầu thay đổi bằng <code>/stylebot</code>, chẳng hạn giao diện tối cho trang web.',
      privacy: 'Quyền riêng tư',
      privacyBody:
        'Quyền truy cập CLI ở trạng thái tắt cho đến khi bạn bật. Stylebot và CLI chỉ giao tiếp với nhau, trên máy tính này; trợ lý lập trình gửi những gì đọc được đến nhà cung cấp của mình.',
    },
    presets: {
      intro:
        'Thẻ Mẫu có sẵn có hai mẫu, và cả hai đều kết hợp được với thay đổi của riêng bạn. <strong>Chế độ đọc</strong> biến bài viết trên trang web thành chế độ đọc gọn gàng, với giao diện, phông chữ, cỡ chữ và chiều rộng tùy chọn; những trang không phải bài viết được giữ nguyên. <strong>Thang độ xám</strong> loại bỏ màu sắc khỏi trang web, ở mức độ tùy chọn.',
      shot: 'Bài viết Wikipedia về Toán học ở chế độ đọc, với Cài đặt đọc đang mở',
    },
    sync: {
      shot: 'Tùy chọn, đã kết nối và đồng bộ với Google Drive',
      drive: 'Đồng bộ Google Drive',
      driveBody:
        'Kết nối Google Drive trong Tùy chọn. Các kiểu của bạn, kể cả hồ sơ, được đồng bộ 30 phút một lần và ngay sau khi bạn chỉnh sửa. Stylebot chỉ thấy các tệp do chính Stylebot tạo trong Drive của bạn, và Stylebot không có máy chủ.',
      conflicts: 'Xung đột',
      conflictsBody:
        'Nếu một kiểu được sửa trên hai máy tính, bản sửa mới hơn của bạn được giữ lại, còn phiên bản kia được lưu trong chú thích, nên không mất gì cả.',
      backup: 'Sao lưu',
      backupBody:
        'Xuất và nhập tất cả kiểu của bạn dưới dạng JSON trong Tùy chọn.',
      history: 'Lịch sử phiên bản',
      historyBody:
        'Mọi thay đổi trên máy tính này được lưu trong Tùy chọn, kể cả những thay đổi đến qua đồng bộ. Khôi phục bất kỳ phiên bản trước nào, cho một vài trang web hoặc tất cả.',
      historyShot:
        'Lịch sử phiên bản trong Tùy chọn, thay đổi mới nhất ở trên cùng',
    },
    urls: {
      intro:
        'Theo mặc định, Stylebot khớp kiểu với trang web theo tên miền. Sửa URL của kiểu trong Tùy chọn và dùng các mẫu sau cho những trường hợp cụ thể hơn.',
      wildcards: {
        anything: 'Khớp với chuỗi ký tự bất kỳ.',
        segment: 'Khớp với chuỗi ký tự bất kỳ cho đến khi gặp dấu /.',
        list: 'Phân tách danh sách mẫu. URL khớp nếu bất kỳ mẫu nào khớp.',
        regex: 'Đặt ở đầu URL để biến URL thành biểu thức chính quy.',
      },
      examplesTitle: 'Ví dụ',
      examples: {
        domain:
          'Tên miền docs.google.com hoặc bất kỳ tên miền con nào của tên miền này.',
        prefix: 'URL bất kỳ bắt đầu bằng docs.',
        numbered: 'docs.google.com, docs1.google.com, docs2.google.com, v.v.',
        subdomains: 'news.ycombinator.com và apps.ycombinator.com.',
        either:
          'Một trong hai tên miền, hoặc bất kỳ tên miền con nào của chúng.',
        regex: 'Chỉ trang chủ Reddit.',
        everywhere:
          'Mọi trang web. Hữu ích cho những kiểu bạn muốn áp dụng ở khắp nơi.',
      },
    },
    shortcuts: {
      intro:
        'Phím tắt toàn cục hoạt động trên mọi trang mà Stylebot có thể tạo kiểu; đổi phím tắt trong cài đặt phím tắt của trình duyệt, có liên kết từ Tùy chọn. Để xem phím tắt riêng của trình chỉnh sửa, nhấn [[?]] trong trình chỉnh sửa.',
      or: 'hoặc',
      unset: 'Chưa đặt; hãy gán trong trình duyệt',
      global: 'Toàn cục',
      picker: 'Khi đang chọn phần tử',
      actions: {
        toggleEditor: 'Bật/tắt trình chỉnh sửa',
        toggleStyling: 'Bật/tắt kiểu',
        toggleReadability: 'Bật/tắt chế độ đọc',
        toggleGrayscale: 'Bật/tắt thang độ xám',
        parent: 'Chọn phần tử cha',
        child: 'Quay lại phần tử con',
        select: 'Chọn phần tử đang được tô sáng',
      },
    },
    help: {
      body: 'Bạn phát hiện lỗi hoặc có ý tưởng? Hãy mở issue trên <a href="{issues}">GitHub</a>. Stylebot miễn phí, mã nguồn mở và được duy trì từ năm 2011. Nếu thấy Stylebot hữu ích, bạn có thể ủng hộ bằng cách <a href="{donate}">mời tôi ly cà phê</a>.',
    },
  },
  privacy: {
    title: 'Quyền riêng tư',
    description:
      'Stylebot làm gì với dữ liệu của bạn: không máy chủ, không tài khoản, không phân tích.',
    lede: 'Stylebot không có máy chủ, không tài khoản, không phân tích, và không thu thập, bán hay chia sẻ dữ liệu của bạn. Dữ liệu chỉ rời khỏi trình duyệt khi bạn dùng một trong các tính năng bên dưới.',
    updated: 'Cập nhật lần cuối {date}',
    browser: {
      title: 'Trong trình duyệt của bạn',
      body: [
        'Kiểu, cài đặt và lịch sử của bạn được lưu trong trình duyệt, và gỡ cài đặt Stylebot sẽ xóa tất cả. Google Fonts và các bảng kiểu bạn <code>@import</code> được tải từ nơi lưu trữ chúng, và nơi đó thấy được địa chỉ IP của bạn.',
      ],
    },
    sync: {
      title: 'Đồng bộ Google Drive',
      body: [
        'Khi bạn kết nối Google Drive trong Tùy chọn, các kiểu của bạn được lưu vào một tệp trong Drive của chính bạn. Stylebot chỉ thấy được các tệp do Stylebot tạo, và mã truy cập được giữ trong trình duyệt của bạn. Hãy ngắt kết nối trong Tùy chọn hoặc trong <a href="https://myaccount.google.com/connections">tài khoản Google</a> của bạn.',
        'Việc Stylebot sử dụng thông tin nhận được từ các API của Google tuân thủ <a href="https://developers.google.com/terms/api-services-user-data-policy">Chính sách về dữ liệu người dùng của Dịch vụ API của Google</a>, bao gồm các yêu cầu về Sử dụng có giới hạn.',
      ],
    },
    cli: {
      title: 'Dòng lệnh',
      body: [
        'Bật <q>Cho phép truy cập từ dòng lệnh</q> trong Tùy chọn sẽ cho phép các ứng dụng chạy dưới tài khoản của bạn đọc các thẻ, trang và kiểu của bạn, chụp ảnh màn hình và thay đổi kiểu của bạn, qua kết nối cục bộ. Những gì ứng dụng đọc được có thể đến các dịch vụ mà ứng dụng sử dụng, chẳng hạn mô hình của trợ lý lập trình.',
      ],
    },
    site: {
      title: 'Trang web này',
      body: [
        'stylebot.dev không dùng quảng cáo hay cookie. Trang được lưu trữ trên GitHub Pages, nơi lưu nhật ký máy chủ, và Plausible đếm lượt truy cập và lượt nhấp mà không nhận diện bạn.',
      ],
    },
    translation:
      'Đây là bản dịch. Nếu có điểm khác với <a href="{original}">bản tiếng Anh</a>, bản tiếng Anh sẽ được áp dụng.',
  },
  releases: {
    title: 'Có gì mới trong {version}',
    bugFixes: 'Cùng rất nhiều <a href="{changelog}">bản sửa lỗi</a>',
    sections: 'Các mục',
    r31: {
      description:
        'Stylebot 3.1 bổ sung đồng bộ và sao lưu với Google Drive, trình chỉnh sửa có thể đổi kích thước và bảng màu.',
      syncTitle: 'Đồng bộ và sao lưu với Google Drive',
      syncAlt: 'Đồng bộ kiểu với Google Drive',
      syncBody: [
        'Bật và cấp quyền đồng bộ với Google Drive từ <strong>trang Tùy chọn</strong> của Stylebot.',
        'Sau khi bật, nhấp <strong>Đồng bộ ngay</strong> trong cửa sổ bật lên hoặc trang Tùy chọn để đồng bộ kiểu trong trình duyệt với các kiểu đã sao lưu trên Google Drive.',
      ],
      resizeTitle: 'Đổi kích thước trình chỉnh sửa Stylebot',
      resizeAlt: 'Đổi kích thước trình chỉnh sửa Stylebot',
      resizeBody:
        'Giờ đây bạn có thể đổi kích thước trình chỉnh sửa Stylebot, và có thể thu hẹp trang để nội dung không bị trình chỉnh sửa che mất.',
      colorsTitle: 'Bảng màu',
      colorsAlt: 'Chọn màu từ bảng màu',
      colorsBody:
        'Công cụ chọn màu cải tiến với các bảng màu giúp bạn chọn màu đẹp dễ dàng hơn.',
    },
    r32: {
      description:
        'Stylebot 3.2 mang đến khả năng tạo kiểu nhanh hơn, không nhấp nháy, chế độ đọc được thiết kế lại và cửa sổ bật lên gọn gàng hơn.',
      lede: 'Stylebot đã quay lại giai đoạn phát triển tích cực, với nhiều bản cập nhật đang được lên kế hoạch.',
      fasterTitle: 'Tạo kiểu nhanh hơn, không nhấp nháy',
      fasterBody:
        'CSS giờ được lưu vào bộ nhớ đệm và áp dụng tức thì, nên trang không còn chớp hiện bản chưa có kiểu trong lúc chờ kiểu của bạn, và mọi thứ cũng nhanh nhạy hơn.',
      readabilityTitle: 'Chế độ đọc được thiết kế lại',
      readabilityAlt:
        'Các điều khiển giao diện và kiểu chữ mới ngay trong chế độ đọc',
      readabilityItems: [
        'Thuật toán trích xuất bài viết mới hơn, làm gọn trang tốt hơn',
        'Kích hoạt nhanh hơn, áp dụng trước khi phần còn lại của trang tải xong',
        'Tùy chỉnh giao diện và kiểu chữ ngay tại chỗ',
        'Hiệu ứng tải mượt mà hơn',
        'Phím tắt để bật/tắt chế độ đọc',
      ],
      popupTitle: 'Cửa sổ bật lên gọn gàng hơn',
      popupAlt: 'Cửa sổ bật lên được thiết kế lại của Stylebot',
      popupItems: [
        'Nhấp được vào toàn bộ hàng bật/tắt',
        'Nút cài đặt trực tiếp',
        'Hỗ trợ chế độ tối',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 mang đến trình chỉnh sửa được thiết kế lại, dòng lệnh cho trợ lý lập trình, hồ sơ, bảng bên, lịch sử phiên bản và đồng bộ.',
      lede: 'Trình chỉnh sửa được thiết kế lại, dòng lệnh cho trợ lý lập trình, hồ sơ và bảng bên.',
      toc: {
        editor: 'Trình chỉnh sửa mới',
        cli: 'Dòng lệnh',
        profiles: 'Hồ sơ',
        panel: 'Bảng bên',
        history: 'Lịch sử phiên bản',
        sync: 'Đồng bộ',
        more: 'Và hơn thế nữa',
      },
      editorTitle: 'Trình chỉnh sửa được thiết kế lại',
      editorAlt:
        'Thẻ Cơ bản được thiết kế lại, đang tạo kiểu cho Hacker News với hồ sơ Newspaper',
      editorBody: 'Được xây dựng lại từ đầu, giờ đã có chế độ tối.',
      editorItems: [
        'Các nhóm điều khiển hiển thị giá trị sẵn có của trang',
        'Tạo bộ chọn tốt hơn, vẫn hoạt động khi trang web cập nhật, kèm các bộ chọn khác để bạn chọn',
        'Cho biết khi giá trị bị quy tắc khác ghi đè',
        'Bảng màu và công cụ hút màu',
        'Di chuột lên màu hoặc phông chữ để xem trước trên trang',
        'Chỉnh sửa trực tiếp mọi thuộc tính CSS khác trong mục Thêm thuộc tính',
        'Hỗ trợ hoàn tác',
      ],
      profilesTitle: 'Hồ sơ',
      profilesAlt:
        'Cửa sổ bật lên trên trang web có hai hồ sơ, Dracula và Gruvbox',
      profilesBody:
        'Lưu nhiều giao diện cho mỗi trang web và chuyển đổi giữa chúng từ trình chỉnh sửa hoặc cửa sổ bật lên.',
      panelTitle: 'Bảng bên, hoặc cửa sổ riêng',
      panelAlt: 'Menu của trình chỉnh sửa, với Vị trí đặt là bảng bên',
      panelBody:
        'Trong Chrome và Edge, trình chỉnh sửa mở trong bảng bên. Bạn cũng có thể tách trình chỉnh sửa ra cửa sổ riêng, từ <strong>Vị trí</strong> trong menu <strong>⋯</strong> của trình chỉnh sửa.',
      historyTitle: 'Lịch sử phiên bản',
      historyBody:
        'Mọi thay đổi đều được lưu lại, và bạn có thể khôi phục bất kỳ phiên bản trước nào.',
      syncTitle: 'Đồng bộ',
      syncBody:
        'Đồng bộ Google Drive ổn định hơn. Thay đổi từ các máy tính khác nhau được gộp lại, nên không mất gì cả. Stylebot tự đồng bộ 30 phút một lần và ngay sau khi bạn chỉnh sửa.',
      moreTitle: 'Và hơn thế nữa',
      moreItems: [
        'stylebot.dev mới',
        'Biểu tượng Stylebot mới',
        'Kiểu giờ được áp dụng cả bên trong shadow DOM, nên hoạt động trên các trang web xây dựng bằng web component',
        'Phím tắt của Stylebot giờ nằm trong cài đặt phím tắt của trình duyệt. Trong Chrome và Edge, những phím tắt bạn từng thay đổi đã trở về mặc định, nên hãy đặt lại tại đó.',
        'Stylebot giờ đã có tiếng Việt',
      ],
    },
  },
  notFound: {
    title: 'Không tìm thấy trang',
    description: 'Trang này không tồn tại.',
    heading: 'Trang này không tồn tại, mà trông còn xấu nữa.',
    done: 'Đẹp hơn nhiều rồi. Trang này vẫn không tồn tại, nhưng ít ra giờ trông cũng ổn.',
    pageTitle: '404 Không tìm thấy',
    pageBody: 'Không tìm thấy URL được yêu cầu trên máy chủ này.',
    pageLink: 'Về trang chủ',
    nice: '✨ Làm đẹp giúp tôi',
  },
};

export default site;
