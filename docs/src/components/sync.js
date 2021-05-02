import React from "react"
import Img from "gatsby-image"
import { useStaticQuery, graphql } from "gatsby"

const Sync = () => {
  const data = useStaticQuery(graphql`
    query {
      sync1: file(relativePath: { eq: "sync1.png" }) {
        childImageSharp {
          fixed(height: 250) {
            ...GatsbyImageSharpFixed
          }
        }
      }

      sync2: file(relativePath: { eq: "sync2.png" }) {
        childImageSharp {
          fixed(height: 200) {
            ...GatsbyImageSharpFixed
          }
        }
      }
    }
  `)

  return (
    <div className="feature">
      <div className="feature-img" style={{ marginRight: '24px' }}>
        <div style={{ display: 'flex' }}>
          <Img fixed={data.sync1.childImageSharp.fixed} />
          <Img fixed={data.sync2.childImageSharp.fixed} />
        </div>
      </div>
      <div className="feature-desc">
        <h3>
          <strong>Sync</strong> your styles across browsers.
        </h3>

        <p>
          Enable sync via Google Drive and keep your styles across profiles
          and browsers in sync and backed up.
        </p>

        <p>
          Or download your styles locally.
        </p>
      </div>
    </div>
  )
}

export default Sync
