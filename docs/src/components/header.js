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
          <span class="version"> v3</span>
        </Link>
      </h1>

      <div style={{ marginLeft: "auto", marginTop: "10px" }}>
        <a
          href="https://github.com/ankit/stylebot"
          target="_blank"
          title="Fork on Github"
          class="header-link"
        >
          <img src={githubImg} />
        </a>

        <a
          title="@stylebot"
          href="https://twitter.com/stylebot"
          target="_blank"
          class="header-link"
        >
          <img src={twitterImg} />
        </a>

        <a href="/changelog" class="header-link">
          Changelog
        </a>

        <a href="#" class="header-link">
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
