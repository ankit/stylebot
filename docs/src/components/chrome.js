import React from "react"
import Download from './download'
import chrome from "../images/chrome.svg"

const ChromeDownload = () => (
  <Download
    src={chrome}
    altText="Stylebot for Chrome"
    href="https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha"
  >
    Stylebot for <strong>Chrome</strong>
  </Download>
)


export default ChromeDownload
