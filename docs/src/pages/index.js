import React from "react"

import Layout from "../components/layout"
import BasicMode from "../components/basic-mode"
import Readability from "../components/readability"
import Code from "../components/code"
import Shortcuts from "../components/shortcuts"
import Chrome from "../components/chrome"
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

    <Chrome />

    <CarouselProvider
      isPlaying
      totalSlides={4}
      naturalSlideWidth={1200}
      naturalSlideHeight={890}
    >
      <Slider>
        <Slide index={0}>
          <BasicMode />
        </Slide>

        <Slide index={1}>
          <Readability />
        </Slide>

        <Slide index={2}>
          <Code />
        </Slide>

        <Slide index={3}>
          <Shortcuts />
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
