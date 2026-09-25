import React from "react";
import Download from "./download";
import firefox from "../images/firefox.svg";

const Firefox = () => (
  <Download
    src={firefox}
    altText="Stylebot for Firefox"
    href="https://addons.mozilla.org/en-US/firefox/addon/stylebot-web/"
  >
    Stylebot for <strong>Firefox</strong>
  </Download>
);

export default Firefox;
