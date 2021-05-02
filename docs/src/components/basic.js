import React from "react"
import Img from "gatsby-image"
import { useStaticQuery, graphql } from "gatsby"

const Basic = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "basic-mode.png" }) {
        childImageSharp {
          fixed(height: 450) {
            ...GatsbyImageSharpFixed
          }
        }
      }
    }
  `)

  return (
    <div className="feature">
      <div className="feature-img" style={{ marginRight: "24px" }}>
        <Img fixed={data.file.childImageSharp.fixed} />
      </div>

      <div className="feature-desc">
        <h3>
          <strong>Pick</strong> and hide ads, change colors, fonts, and lots more.
        </h3>

        <p>
          Launch Stylebot and pick any element to style on a page. Use the Basic editor to quickly apply and save changes to the current website.
        </p>
      </div>
    </div>
  )
}

export default Basic
