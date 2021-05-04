import React from "react"
import styled from "@emotion/styled"

const DownloadLink = styled.a`
  display: flex;
  margin: 0 auto;
  align-items: center;
  text-decoration: none;
  padding: 10px 20px;
  margin-bottom: 20px;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  color: #333;
  margin-top: 20px;
  border: 1px solid #ccc;
  margin-right: 12px;
  border-radius: 32px;

  &:hover {
    background: #eee;
  }

  &:visited {
    color: #333;
  }

  & img {
    height: 45px;
    margin-right: 10px;
    margin-bottom: 0;
  }
`
const Download = ({ href, children, altText, src }) => (
  <DownloadLink href={href} target="_blank" rel="noreferrer">
    <img alt={altText} src={src} />
    <span>{children}</span>
  </DownloadLink>
)

export default Download
