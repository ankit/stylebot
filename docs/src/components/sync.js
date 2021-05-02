import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Img from "gatsby-image"

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

const Sync = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "sync.png" }) {
        childImageSharp {
          fixed(height: 600) {
            ...GatsbyImageSharpFixed
          }
        }
      }
    }
  `)

  return (
    <div style={{ textAlign: "center" }}>
      <Img
        fixed={data.file.childImageSharp.fixed}
        style={{
          marginBottom: "10px",
        }}
      />
      <h3>Sync your styles</h3>
    </div>
  )
}

export default Sync
