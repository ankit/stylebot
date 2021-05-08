import React from "react";
import Img from "gatsby-image";
import { useStaticQuery, graphql } from "gatsby";

import {
  Feature,
  FeatureImage,
  FeatureDescription,
  FeatureSpacer,
} from "./feature";

const Readability = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "readability1.png" }) {
        childImageSharp {
          fluid {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  `);

  return (
    <Feature>
      <FeatureImage>
        <Img fluid={data.file.childImageSharp.fluid} />
      </FeatureImage>

      <FeatureSpacer />

      <FeatureDescription>
        <h3>
          Enable <strong>readability</strong> for articles.
        </h3>

        <p>
          If enabled for a site, Stylebot will automatically hide clutter on all
          articles for readability.
        </p>

        <p>
          Pick between Light, Dark and Sepia themes. Use any custom font
          available on Google Fonts.
        </p>
      </FeatureDescription>
    </Feature>
  );
};

export default Readability;
