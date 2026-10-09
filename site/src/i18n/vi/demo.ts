import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'Ghim vào thanh công cụ',
      body: 'Mở Stylebot chỉ với một cú nhấp.',
      captions: {
        menu: 'Ban đầu, Stylebot nằm trong menu Tiện ích.',
        pinned: 'Đã ghim. Stylebot giờ nằm trên thanh công cụ của bạn.',
      },
    },
    open: {
      title: 'Mở trình chỉnh sửa',
      keysBody: 'Nhấp vào biểu tượng, hoặc nhấn {keys}.',
      captions: {
        iconThenStyle:
          'Nhấp vào biểu tượng Stylebot, rồi chọn Tạo kiểu cho trang này.',
        orKeys: 'Hoặc nhấn {keys} để mở trực tiếp.',
      },
    },
    pick: {
      title: 'Chọn phần tử',
      fieldsBody: 'Nhấp để chọn. Các ô hiển thị kiểu hiện tại.',
      captions: {
        hoverToSee: 'Di chuột để xem những gì có thể tạo kiểu.',
        select: 'Nhấp để chọn. Bộ chọn được điền sẵn cho bạn.',
        computed: 'Mỗi ô hiển thị giá trị tính toán hiện tại của phần tử.',
      },
    },
    style: {
      title: 'Tạo kiểu',
      body: 'Dùng các điều khiển Cơ bản hoặc viết CSS.',
      captions: {
        size: 'Đặt cỡ chữ…',
        color: '…và màu.',
        plainCss: 'Mọi thay đổi đều là CSS thuần, được lưu cho trang này.',
        byHand: 'Hoặc tự viết CSS.',
        live: 'Trang cập nhật ngay khi bạn gõ.',
      },
    },
    profiles: {
      title: 'Hồ sơ',
      looksBody: 'Lưu nhiều giao diện khác nhau cho cùng một trang web.',
      captions: {
        createForLook: 'Tạo hồ sơ cho giao diện mới.',
        created: '{profile} bắt đầu trống. {defaultProfile} vẫn được lưu.',
        newspaperLook: 'Cho hồ sơ này giao diện kiểu báo giấy.',
        darkLook: 'Cho hồ sơ này giao diện tối, tông ấm.',
        switchAnytime: 'Chuyển đổi giữa hai hồ sơ bất cứ lúc nào.',
        backToDefault:
          'Quay lại {defaultProfile}. Một trang web, hai giao diện.',
      },
    },
  },
  browser: {
    extensions: 'Tiện ích',
    fullAccess: 'Toàn quyền truy cập',
    fullAccessNote:
      'Các tiện ích này có thể xem và thay đổi thông tin trên trang web này.',
    otherExtensions: {
      adBlocker: 'Trình chặn quảng cáo',
      passwordManager: 'Trình quản lý mật khẩu',
      translate: 'Dịch',
      webArchive: 'Lưu trữ web',
    },
  },
  popup: {
    readability: 'Chế độ đọc',
    styleThisPage: 'Tạo kiểu cho trang này',
  },
  editor: {
    defaultProfile: 'Mặc định',
    newProfile: 'Báo giấy',
    newProfileDark: 'Cú đêm',
    createProfile: 'Tạo hồ sơ',
    pickAnElement: 'Chọn phần tử',
    tabs: {
      basic: 'Cơ bản',
      code: 'Mã',
      presets: 'Mẫu có sẵn',
      chat: 'Trò chuyện',
    },
    basic: {
      hide: 'Ẩn',
      reset: 'Đặt lại',
      text: 'Văn bản',
      font: 'Phông chữ',
      defaultFont: 'Mặc định',
      size: 'Cỡ chữ',
      lineHeight: 'Chiều cao dòng',
      color: 'Màu',
      decoration: 'Trang trí',
      none: 'Không',
      alignment: 'Căn lề',
      background: 'Nền',
      box: 'Hộp',
      effects: 'Hiệu ứng',
      moreProperties: 'Thêm thuộc tính',
    },
    code: {
      noStyles: 'Chưa có kiểu nào',
    },
    presets: {
      readability: 'Chế độ đọc',
      articlesOnly: 'Chỉ bài viết',
      readabilityDescription:
        'Biến bài viết trên trang này thành chế độ đọc gọn gàng, không gây xao nhãng, với giao diện, phông chữ và cỡ chữ tùy chọn.',
      grayscale: 'Thang độ xám',
      grayscaleDescription: 'Hiển thị trang ở thang độ xám.',
    },
  },
  article: {
    nav: {
      news: 'Tin tức',
      travel: 'Du lịch',
      signIn: 'Đăng nhập',
    },
    kicker: 'Du lịch · Phóng sự',
    headline: 'Sự trở lại lặng lẽ của chuyến phà đêm',
    dek: 'Ba hãng tàu đang đặt cược rằng du khách sẽ chịu đi chậm để đổi lấy khoang ngủ riêng, cảnh biển và khỏi phải ra sân bay.',
    byline: 'Marta Linde · 24 thg 9 · 6 phút đọc',
    paragraphs: [
      'Hai mươi năm sau khi chuyến vượt biển đêm cuối cùng bị cắt, ba hãng tàu đang đưa khoang ngủ trở lại mặt nước. Lời mời gọi rất đơn giản: lên tàu sau bữa tối, ngủ một giấc qua biển và thức dậy ở một đất nước khác.',
      'Vé của tuyến đầu tiên mở lại đã bán hết cho cả mùa hè chỉ trong một tuần. Phần lớn hành khách dưới bốn mươi tuổi, và nhiều người chưa từng đi tàu đêm bao giờ. Các hãng cho biết khoang ngủ kín chỗ trước tiên, rồi đến ghế ngả, sau cùng mới tới boong tàu.',
    ],
    quote:
      '“Chẳng ai đặt chuyến này để tiết kiệm thời gian. Họ đặt để được chậm lại một chút.”',
    quoteBy: '— Ines Varga, chuyên viên hoạch định tuyến',
  },
  steps: {
    heading: 'Cách hoạt động',
    counter: '{current} / {total}',
    jump: 'Chuyển đến đoạn này',
  },
};

export default demo;
