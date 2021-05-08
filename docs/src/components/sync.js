import React from "react";
import Img from "gatsby-image";
import { useStaticQuery, graphql } from "gatsby";

import {
  Feature,
  FeatureDescription,
  FeatureImage,
  FeatureSpacer,
} from "./feature";

const Sync = () => {
  const data = useStaticQuery(graphql`
    query {
      sync: file(relativePath: { eq: "sync2.png" }) {
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
      <FeatureDescription>
        <h3>
          <strong>Sync</strong> your styles across browsers.
        </h3>

        <p>
          Enable sync via Google Drive and keep your styles across profiles and
          browsers in sync and backed up.
        </p>

        <p>Or download your styles locally.</p>
      </FeatureDescription>

      <FeatureSpacer />

      <FeatureImage>
        <Img fluid={data.sync.childImageSharp.fluid} />
      </FeatureImage>
    </Feature>
  );
};

export default Sync;
