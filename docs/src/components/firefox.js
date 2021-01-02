import React from "react"
import firefoxImg from "../images/firefox.svg"

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

const Firefox = () => {
  return (
    <a
      href="https://addons.mozilla.org/en-US/firefox/addon/stylebot-web/"
      target="_blank"
      rel="noreferrer"
      className="download-link"
    >
      <img
        src={firefoxImg}
        alt="Stylebot for Firefox"
        style={{ height: "45px", marginRight: "10px", marginBottom: 0 }}
      />

      <div style={{ height: "45px", lineHeight: "45px" }}>Firefox</div>
    </a>
  )
}

export default Firefox
