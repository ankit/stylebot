import React from "react"
import Img from "gatsby-image"
import { useStaticQuery, graphql } from "gatsby"

import { Feature, FeatureImage, FeatureSpacer, FeatureDescription } from './feature'

const Basic = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "basic-mode.png" }) {
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
      <FeatureImage>
        <Img fluid={data.file.childImageSharp.fluid} />
      </FeatureImage>

      <FeatureSpacer />

      <FeatureDescription>
        <h3>
          <strong>Pick</strong> and hide ads, change colors, fonts, and lots more.
        </h3>

        <p>
          Launch Stylebot and pick any element to style on a page.
          Use the Basic editor to quickly apply and save changes to the current website.
        </p>
      </FeatureDescription>
    </Feature>
  )
}

export default Basic
