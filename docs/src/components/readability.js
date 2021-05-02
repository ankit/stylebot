import React from "react"
import Img from "gatsby-image"
import { useStaticQuery, graphql } from "gatsby"

const Readability = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "readability1.png" }) {
        childImageSharp {
          fixed(height: 320) {
            ...GatsbyImageSharpFixed
          }
        }
      }
    }
  `)

  return (
    <div className="feature" style={{ marginRight: "24px" }}>
      <div className="feature-desc">
        <h3>
          Enable <strong>readability</strong> for articles.
        </h3>

        <p>
          If enabled for a site, Stylebot will automatically hide clutter on all articles for readability.
        </p>

        <p>
          Pick between Light, Dark and Sepia themes. Use any custom font available on Google Fonts.
        </p>
      </div>
      <div className="feature-img">
        <Img fixed={data.file.childImageSharp.fixed} />
      </div>
    </div>
  )
}

export default Readability
