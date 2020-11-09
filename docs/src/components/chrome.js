import React from "react"
import chromeImg from "../images/chrome.svg"

/*
 * This component is built using `gatsby-image` to automatically serve optimized
 * images with lazy loading and reduced file sizes. The image is loaded using a
 * `useStaticQuery`, which allows us to load the image from directly within this
 * component, rather than having to pass the image data down from pages.
 *
 * For more information, see the docs:
 * - `gatsby-image`: https://gatsby.dev/gatsby-image
 * - `useStaticQuery`: https://www.gatsbyjs.org/docs/use-static-query/
 */

const Chrome = () => {
  return (
    <a
      href="https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha"
      target="_blank"
      rel="noreferrer"
      className="chrome-install-link"
    >
      <img
        src={chromeImg}
        alt="Stylebot for Chrome"
        style={{ height: "45px", marginRight: "10px", marginBottom: 0 }}
      />

      <div style={{ height: "45px", lineHeight: "45px" }}>
        Stylebot for Chrome
      </div>
    </a>
  )
}

export default Chrome
