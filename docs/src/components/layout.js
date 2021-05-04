import React from "react"
import PropTypes from "prop-types"
import styled from "@emotion/styled"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"

import "./layout.css"

const Content = styled.div`
  margin: 0 auto;
  max-width: 960px;
  padding: 0 1.0875rem 1.45rem;
`

const Footer = styled.footer`
  margin-top: 40px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  line-height: 30px;
  font-size: 16px;

  & a {
    color: #131313;
    opacity: 0.8;
    text-decoration: none;

    &:hover {
      color: #0095dd;
      opacity: 1;
    }
  }
`

const Layout = ({ subtitle, children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header title={data.site.siteMetadata.title} subtitle={subtitle} />
      <Content>
        <main>{children}</main>
        <Footer>
          © {new Date().getFullYear()}{" "}
          <a href="http://ankitahuja.com" target="_blank" rel="noreferrer">
            Ankit Ahuja
          </a>
        </Footer>
      </Content>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
