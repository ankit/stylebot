import { Link } from "gatsby"

import PropTypes from "prop-types"
import React from "react"

import githubImg from "../images/github.svg"
import twitterImg from "../images/twitter.svg"

const Header = ({ siteTitle }) => (
  <header>
    <div
      style={{
        margin: `0 auto`,
        maxWidth: 960,
        display: "flex",
        justifyContent: "end",
        padding: `1.45rem 1.0875rem 0.7em`,
      }}
    >
      <h1 style={{ margin: 0 }}>
        <Link
          to="/"
          style={{
            color: `#333`,
            textDecoration: `none`,
          }}
        >
          {siteTitle}
        </Link>
      </h1>

      <div style={{ marginLeft: "auto", marginTop: "10px" }}>
        <a
          href="https://github.com/ankit/stylebot"
          target="_blank"
          rel="noreferrer"
          title="Fork on Github"
          class="header-link"
        >
          <img src={githubImg} alt="Github" />
        </a>

        <a
          title="@stylebot"
          href="https://twitter.com/stylebot"
          target="_blank"
          rel="noreferrer"
          class="header-link"
        >
          <img src={twitterImg} alt="Twitter" />
        </a>

        <a
          title="Buy me a coffee"
          href="https://ko-fi.com/stylebot"
          target="_blank"
          rel="noreferrer"
          class="header-link"
        >
          Donate
        </a>
      </div>
    </div>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
