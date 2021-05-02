import React from "react"

const Download = ({ href, children, altText, src }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="download"
  >
    <img alt={altText} src={src} />
    <span>{children}</span>
  </a>
)

export default Download
