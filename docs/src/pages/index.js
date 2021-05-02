import React from "react"

import Layout from "../components/layout"
import Demo from "../components/demo"
import BasicMode from "../components/basic-mode"
import Readability from "../components/readability"
import Code from "../components/code"
import Sync from "../components/sync"
import Chrome from "../components/chrome"
import Firefox from "../components/firefox"
import SEO from "../components/seo"

import {
  CarouselProvider,
  Slider,
  Slide,
  ButtonBack,
  ButtonNext,
} from "pure-react-carousel"

import "pure-react-carousel/dist/react-carousel.es.css"

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />

    <h2 style={{ paddingBottom: "20px" }}>
      Change the appearance of the web instantly
    </h2>

    <div className="download-link-list">
      <Firefox />
      <Chrome />
    </div>

    <CarouselProvider
      isPlaying
      totalSlides={5}
      naturalSlideWidth={1200}
      naturalSlideHeight={890}
    >
      <Slider className="slider">
        <Slide index={0}>
          <BasicMode />
        </Slide>

        <Slide index={1}>
          <Code />
        </Slide>

        <Slide index={2}>
          <Readability />
        </Slide>

        <Slide index={3}>
          <Sync />
        </Slide>

        <Slide index={4}>
          <Demo />
        </Slide>
      </Slider>

      <div style={{ textAlign: "center" }}>
        <ButtonBack className="btn">Back</ButtonBack>
        <ButtonNext className="btn">Next</ButtonNext>
      </div>
    </CarouselProvider>
  </Layout>
)

export default IndexPage
