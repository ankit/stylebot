const NotificationManager = {
  init(): void {
    chrome.storage.local.get('version', items => {
      const version = items['version'];

      if (!version || version !== '3') {
        NotificationManager.showNotification();
        chrome.storage.local.set({ version: '3' });
      }
    });
  },

  showNotification(): void {
    const message =
      'Brand new UI, modern CSS support, auto-readability, grayscale mode and lots more.';

    const options = {
      type: 'basic',
      title: 'Stylebot v3',
      message,
      iconUrl: '../../img/icon48.png',
      buttons: [
        {
          title: 'See all the new features',
        },
      ],
    };

    chrome.notifications.onClicked.addListener(() => {
      this.openChangelog();
    });

    chrome.notifications.onButtonClicked.addListener(() => {
      this.openChangelog();
    });

    chrome.notifications.create(options);
  },

  openChangelog(): void {
    chrome.tabs.create({
      active: true,
      url: 'http://ankitahuja.com',
    });
  },
};

export default NotificationManager;
