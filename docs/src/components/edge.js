import React from "react";
import Download from "./download";
import edge from "../images/edge.svg";

const Edge = () => (
  <Download
    src={edge}
    altText="Stylebot for Edge"
    href="https://microsoftedge.microsoft.com/addons/detail/stylebot/mjolbpfednnbebfapicajpifliopnnai"
  >
    Stylebot for <strong>Edge</strong>
  </Download>
);

export default Edge;
