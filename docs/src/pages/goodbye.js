import React from "react";
import styled from "@emotion/styled";

import Layout from "../components/layout";
import SEO from "../components/seo";

import goodbye from "../images/goodbye.jpg";

const IntroH2 = styled.h2`
  font-size: 24px;
  line-height: 36px;
  margin: 48px 0 24px 0;
`;

const GoodbyeImage = styled.img`
  margin: 48px auto 0 auto;
  width: 700px;
`;

const Content = styled.div`
  text-align: center;

  & a {
    color: #0062cc;

    &:visited {
      color: #0062cc;
    }
  }
`;

const IndexPage = () => (
  <Layout>
    <SEO title="Goodbye" />

    <Content>
      <GoodbyeImage src={goodbye} altText="Goodbye from Stylebot" />

      <IntroH2>
        Thank you for using Stylebot.{" "}
        <a href="mailto:stylebot+ahuja.ankit@gmail.com">Leave feedback</a>.
      </IntroH2>
    </Content>
  </Layout>
);

export default IndexPage;
