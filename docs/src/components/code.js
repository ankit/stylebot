import React from "react"
import Img from "gatsby-image"
import { useStaticQuery, graphql } from "gatsby"

import { Feature, FeatureDescription, FeatureImage, FeatureSpacer } from './feature'

const Code = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "code.png" }) {
        childImageSharp {
          fluid {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  `)

  return (
    <Feature>
      <FeatureDescription>
        <h3>
          <strong>Code</strong> your own CSS.
        </h3>

        <p>
          Use the Code editor to write your own custom CSS for the page.
        </p>
      </FeatureDescription>

      <FeatureSpacer />

      <FeatureImage>
        <Img fluid={data.file.childImageSharp.fluid} />
      </FeatureImage>
    </Feature>
  )
}

export default Code
