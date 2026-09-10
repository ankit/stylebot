import React from "react";

import Layout from "../../components/layout";
import SEO from "../../components/seo";
import readabilityPNG from "../../images/3.2/readability.png";
import popupPNG from "../../images/3.2/popup.png";

const IndexPage = () => (
  <Layout subtitle="Release 3.2">
    <SEO title="Stylebot 3.2 Release" />

    <h2 style={{ marginTop: "48px" }}>What's new in 3.2</h2>
    <p style={{ fontStyle: "italic", color: "#666" }}>
      Stylebot is back in active development, with more updates planned
      ahead.
    </p>
    <hr />

    <h3>Faster, flicker-free styling</h3>
    <p>
      CSS is now cached and applied instantly, so pages no longer
      flash unstyled while your styles catch up, and everything feels
      snappier as a result.
    </p>

    <hr />

    <h3>A redesigned Readability mode</h3>
    <div style={{ margin: "24px auto", textAlign: "center" }}>
      <img
        src={readabilityPNG}
        height={400}
        style={{ maxWidth: "100%", border: "1px solid #eee" }}
        alt="Readability mode's new inline theme and typography controls"
      />
    </div>
    <ul>
      <li>Newer article-extraction algorithm, better at cleaning up pages</li>
      <li>Faster activation, applying before the rest of the page loads</li>
      <li>Inline customization for theme and typography</li>
      <li>Smoother loading animation</li>
      <li>Keyboard shortcut to toggle it</li>
    </ul>

    <hr />

    <h3>A cleaner popup</h3>
    <div style={{ margin: "24px auto", textAlign: "center" }}>
      <img
        src={popupPNG}
        height={400}
        style={{ maxWidth: "100%", border: "1px solid #eee" }}
        alt="Stylebot's redesigned popup"
      />
    </div>
    <ul>
      <li>Fully clickable toggle rows</li>
      <li>Direct settings button</li>
      <li>Dark mode support</li>
    </ul>

    <hr />

    <h3>
      And lots of{" "}
      <a
        href="https://github.com/ankit/stylebot/blob/main/CHANGELOG.md"
        target="_blank"
        rel="noreferrer"
      >
        bugfixes
      </a>
      ...
    </h3>

    <p style={{ marginTop: "48px" }}>
      Stylebot is an open source and free browser extension. Trusted by more
      than 200,000 users. <br />
      Developed since 2011.{" "}
      <a href="https://ko-fi.com/stylebot" target="_blank" rel="noreferrer">
        Buy me a coffee
      </a>
      .
    </p>
  </Layout>
);

export default IndexPage;
