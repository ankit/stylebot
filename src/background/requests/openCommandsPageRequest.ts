export default (): void => {
  chrome.tabs.create({
    active: true,
    url: 'chrome://extensions/configureCommands',
  });
};
