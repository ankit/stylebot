import React from "react"
import styled from "@emotion/styled"

import Layout from "../components/layout"
import Basic from "../components/basic"
import Readability from "../components/readability"
import Code from "../components/code"
import Sync from "../components/sync"
import ChromeDownload from "../components/chrome"
import FirefoxDownload from "../components/firefox"
import SEO from "../components/seo"

const IntroH2 = styled.h2`
  font-size: 24px; 
  line-height: 36px;
  margin: 48px 0 24px 0;
`

const Downloads = styled.div`
  display: flex;
  width: 600px;
  margin: 0 auto;
  margin-bottom: 24px;
`

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />

    <IntroH2>
      Stylebot is a browser extension which lets you modify the appearance of any
      webpage and sync your changes across browsers.
    </IntroH2>

    <Downloads>
      <FirefoxDownload />
      <ChromeDownload />
    </Downloads>

    <Basic />
    <Code />
    <Readability />
    <Sync />

    <p>
      Stylebot is an open source and free browser extension. Trusted by more than 200,000 users. <br />
      Developed since 2011. Support Stylebot by <a href="https://ko-fi.com/stylebot" target="_blank" rel="noreferrer">buying me a coffee</a>.
    </p>
  </Layout>
)

export default IndexPage
