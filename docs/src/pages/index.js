import React from "react"

import Layout from "../components/layout"
import Basic from "../components/basic"
import Readability from "../components/readability"
import Code from "../components/code"
import Sync from "../components/sync"
import ChromeDownload from "../components/chrome"
import FirefoxDownload from "../components/firefox"
import SEO from "../components/seo"

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />

    <h2 class="intro">
      Stylebot is a browser extension which lets you modify the appearance of any
      webpage and sync your changes across browsers.
    </h2>

    <div className="downloads">
      <FirefoxDownload />
      <ChromeDownload />
    </div>

    <Basic />
    <Code />
    <Sync />
    <Readability />

    <p>
      Stylebot is an open source and free browser extension. Trusted by more than 200,000 users. <br />
      Developed since 2011. <a href="https://ko-fi.com/stylebot" target="_blank" rel="noreferrer">Buy me a coffee</a>.
    </p>

  </Layout>
)

export default IndexPage
