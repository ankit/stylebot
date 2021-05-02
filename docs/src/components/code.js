import React from "react"
import Img from "gatsby-image"
import { useStaticQuery, graphql } from "gatsby"

const Code = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "code.png" }) {
        childImageSharp {
          fixed(height: 420) {
            ...GatsbyImageSharpFixed
          }
        }
      }
    }
  `)

  return (
    <div className="feature">
      <div className="feature-desc" style={{ marginRight: "24px" }}>
        <h3>
          <strong>Code</strong> your own CSS.
        </h3>

        <p>
          Use the Code editor to write your own custom CSS for the page.
        </p>
      </div>

      <div className="feature-img">
        <Img fixed={data.file.childImageSharp.fixed} />
      </div>
    </div>
  )
}

export default Code
