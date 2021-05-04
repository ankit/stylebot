import React from "react"
import styled from "@emotion/styled"

import Layout from "../components/layout"
import SEO from "../components/seo"

import LostImage from "../images/404.svg"

const Image = styled.img`
  margin: 48px auto;
`

const Container = styled.div`
  text-align: center
`

const NotFoundPage = () => (
  <Layout>
    <SEO title="404: Not found" />
    <Container>
      <Image src={LostImage} height={300} />
    </Container>
  </Layout>
)

export default NotFoundPage
