import React from "react";

import Layout from "../../components/layout";
import SEO from "../../components/seo";
import syncGIF from "../../images/3.1/sync.gif";
import resizeGIF from "../../images/3.1/resize.gif";
import colorsGIF from "../../images/3.1/colors.gif";

const IndexPage = () => (
  <Layout subtitle="Release 3.1">
    <SEO title="Stylebot 3.1 Release" />

    <h2 style={{ marginTop: "48px" }}>What's new in 3.1</h2>
    <hr />

    <h3>Sync and backup via Google Drive</h3>
    <div style={{ margin: "24px auto", textAlign: "center" }}>
      <img src={syncGIF} height={400} alt="Sync and backup" />
    </div>

    <p>
      You need to enable and authorize sync via Google Drive by going to the
      Stylebot <strong>Options page</strong>.
    </p>
    <p>
      Once enabled, you can click on <strong>Sync Now</strong> via the icon or
      options page to sync your browser styles with styles backed up on Google
      Drive.
    </p>

    <hr />

    <h3>Resize the Stylebot editor</h3>
    <div style={{ margin: "24px auto", textAlign: "center" }}>
      <img src={resizeGIF} height={400} alt="Resize stylebot editor" />
    </div>

    <p>
      You can now resize the stylebot editor. You can optionally enable the
      option to adjust the page width so that the page content does not overlap
      with the Stylebot editor.
    </p>

    <hr />

    <h3>Color Palettes</h3>
    <div style={{ margin: "24px auto", textAlign: "center" }}>
      <img src={colorsGIF} height={400} alt="Using color palette in Stylebot" />
    </div>

    <p>
      Improved color picker with color palettes to make it easier to pick
      beautiful colors.
    </p>
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
