import { Link } from "gatsby"

import React from "react"
import PropTypes from "prop-types"

import githubImg from "../images/github.svg"
import twitterImg from "../images/twitter.svg"

const Header = ({ title, subtitle }) => {
  return (
    <header class="header">
      <h1 style={{ margin: 0 }}>
        <Link
          to="/"
          style={{
            color: `#333`,
            textDecoration: `none`
          }}
        >
          {title}
        </Link>

        <span style={{ fontWeight: 200, paddingLeft: '12px' }}>{subtitle}</span>
      </h1>

      <div style={{ marginLeft: "auto", marginTop: "10px" }}>
        <a
          href="https://github.com/ankit/stylebot"
          target="_blank"
          rel="noreferrer"
          title="Fork on Github"
          className="header-link"
        >
          <img src={githubImg} alt="Github" />
        </a>

        <a
          title="@stylebot"
          href="https://twitter.com/stylebot"
          target="_blank"
          rel="noreferrer"
          className="header-link"
        >
          <img src={twitterImg} alt="Twitter" />
        </a>

        <a
          title="Donate"
          href="https://ko-fi.com/stylebot"
          target="_blank"
          rel="noreferrer"
          className="header-link buy-coffee"
        >
          Donate
        </a>
      </div>
    </header>
  )
}

Header.propTypes = {
  siteTitle: PropTypes.string
}

Header.defaultProps = {
  siteTitle: ``
}

export default Header
