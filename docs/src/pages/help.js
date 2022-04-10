import React from "react";

import styled from "@emotion/styled";

import Layout from "../components/layout";
import SEO from "../components/seo";
import launchGIF from "../images/help/launch.gif";
import basicIMG from "../images/help/basic.png";
import inspectIMG from "../images/help/inspect.png";
import inspectBtnIMG from "../images/help/inspect-btn.png";
import codeIMG from "../images/help/code.png";
import magicIMG from "../images/help/magic.png";
import dockingIMG from "../images/help/docking.png";
import resizeIcon from "../images/help/resize-icon.png";
import shortcutsIMG from "../images/help/shortcuts.png";
import sync1IMG from "../images/help/sync1.png";
import sync2IMG from "../images/help/sync2.png";

const IntroH2 = styled.h2`
  margin-top: 48px;
`;

const List = styled.ul`
  margin: 0;
  list-style-type: none;
  padding-bottom: 24px;
`;

const SectionContent = styled.div`
  display: flex;
`;

const SectionImageContainer = styled.div`
  margin-right: 64px;
  flex: 0 0 20em;
`;

const HelpPage = () => (
  <Layout subtitle="Help">
    <SEO title="Help" />

    <IntroH2>This page will guide you through the Stylebot features.</IntroH2>
    <hr />

    <List>
      <li>
        <a href="#launch">Launching Stylebot</a>
      </li>
      <li>
        <a href="#basic">Basic Editor</a>
      </li>
      <li>
        <a href="#code">Code Editor</a>
      </li>
      <li>
        <a href="#magic">Magic Editor</a>
      </li>
      <li>
        <a href="#sync">Sync and Backup</a>
      </li>
      <li>
        <a href="#url-syntax-rules">URL Syntax Rules</a>
      </li>
      <li>
        <a href="#resize">Resizing and docking the editor</a>
      </li>
      <li>
        <a href="#shortcuts">Keyboard shortcuts</a>
      </li>
      <li>
        <a href="#requests">Bug reports and feature requests</a>
      </li>
      <li>
        <a href="#support">Support Stylebot</a>
      </li>
    </List>

    <hr />

    <section>
      <h3 id="launch">Launching Stylebot</h3>

      <SectionContent>
        <SectionImageContainer>
          <img src={launchGIF} alt="How to launch stylebot" />
        </SectionImageContainer>

        <p>
          You can launch Stylebot via the browser icon or keyboard shortcut{" "}
          <strong>alt+shift+m</strong> (customizable).
        </p>
      </SectionContent>
    </section>

    <hr />

    <section>
      <h3 id="basic">Basic editor</h3>

      <SectionContent>
        <SectionImageContainer>
          <img src={inspectBtnIMG} width={50} alt="Inspect button" />
          <img src={inspectIMG} width={300} alt="Inspect element" />
          <img src={basicIMG} alt="Basic editor" />
        </SectionImageContainer>

        <div>
          <p>
            <strong>Inspect</strong>: Click on the inspect button to select an
            element on the page. Stylebot will automatically generate a CSS
            selector to match similar element(s) on the page.
          </p>

          <p>
            <strong>URL</strong>: By default, Stylebot uses the site's domain
            name to match styles to websites. You can edit the urls in the
            Options page for more flexible matching. See{" "}
            <a href="#url-syntax-rules">syntax rules</a>.
          </p>

          <p>
            <strong>CSS selector</strong>: You can enter your own custom CSS
            selector. If you focus the CSS selector input, it will highlight all
            currently selected element(s).
          </p>

          <p>
            <strong>Apply styles</strong>: Once an element is selected, you can
            apply styling using the basic editor to override existing styling of
            the page. It is automatically saved.
          </p>

          <p>
            <strong>Font family</strong>: You can pick one of the fonts in the
            list. Or you can enter any custom font that exists on your local
            machine. You can also enter any font available on{" "}
            <a
              href="https://fonts.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Google Fonts
            </a>
            .
          </p>

          <p>
            <strong>Auto-generated CSS class names</strong>: With the recent
            popularity of hash-based and auto-generated CSS class names, the CSS
            selectors may change when the site owner updates their site. This
            may break your custom style and you would need to update your style.
          </p>
        </div>
      </SectionContent>
    </section>

    <hr />

    <section>
      <h3 id="code">Code editor</h3>
      <SectionContent>
        <SectionImageContainer>
          <img src={codeIMG} alt="Code editor" />
        </SectionImageContainer>

        <p>
          <strong>Write your own CSS</strong>: You can write any modern CSS
          using the code editor. You can also edit the CSS in the Options page.
        </p>
      </SectionContent>
    </section>

    <hr />

    <section>
      <h3 id="magic">Magic editor</h3>
      <SectionContent>
        <SectionImageContainer>
          <img src={magicIMG} alt="Magic editor" />
        </SectionImageContainer>

        <div>
          <p>
            <strong>Readability</strong>: This will remove noisy elements from
            all the articles on a site. It will not modify any non-article
            pages. You can choose between Dark, Sepia and Light themes, pick any
            font and customize font size, line height and page width.
          </p>

          <p>
            <strong>Grayscale</strong>: This will apply grayscale to the current
            site.
          </p>
        </div>
      </SectionContent>
    </section>

    <hr />

    <section id="sync">
      <h3>Sync and Backup</h3>
      <SectionContent>
        <SectionImageContainer>
          <img src={sync1IMG} alt="Enable sync in Options page" />
          <img src={sync2IMG} alt="Sync now using browser popup" />
        </SectionImageContainer>

        <div>
          <p>
            <strong>Enable Sync via Google Drive</strong>: You will need to
            enable and authorize sync via Google Drive by going to the Stylebot
            Options page.
          </p>

          <p>
            <strong>Sync Now</strong>: Once enabled, you will need to manually
            sync from the browser menu or options page to sync your browser
            styles with styles backed up on Google Drive.
          </p>

          <p>
            <strong>Backup</strong>: You can also export and import your styles
            as JSON.
          </p>

          <p>
            <strong>Auth permissions</strong>: We only ask for permission for
            Stylebot to r/w its own files. Since we do not maintain our own
            server, the OAuth may timeout and you may need to re-authorize when
            you sync next.
          </p>
        </div>
      </SectionContent>
    </section>

    <hr />

    <section id="resize">
      <h3>Resizing and docking the editor</h3>

      <SectionContent>
        <SectionImageContainer>
          <img src={dockingIMG} alt="Resize and dock editor" />
        </SectionImageContainer>

        <div>
          <p>
            <strong>Docking</strong>: You can dock the Stylebot editor on the
            left / right of the browser window.
          </p>
          <p>
            <strong>Resize</strong>: You can resize the stylebot editor by
            clicking the{" "}
            <img
              src={resizeIcon}
              height={30}
              style={{ marginBottom: -10 }}
              alt="Resize stylebot"
            />{" "}
            icon or pressing <code>s</code>.
          </p>
          <p>
            <strong>Adjust page layout</strong>: This will shrink the page width
            so that it does not overlap with the Stylebot editor.
          </p>
        </div>
      </SectionContent>
    </section>

    <hr />

    <section id="url-syntax-rules">
      <h3>URL Syntax Rules</h3>

      <h4>URL without any wildcards (default)</h4>
      <p>
        By default, Stylebot editor uses the site's domain name to match styles
        to websites.
      </p>

      <h4>Wildcards</h4>
      <ul>
        <li>
          <code>**</code> matches any character sequence.
        </li>
        <li>
          <code>*</code> matches any character sequence, until a <code>/</code>{" "}
          is found
        </li>
        <li>
          <code>,</code> separates a list of patterns. Matches a URL if any
          sub-pattern matches it.
        </li>
        <li>
          <code>^</code> at the beginning of the URL turns it into a regular
          expression.
        </li>
      </ul>

      <h4>Examples</h4>
      <ul>
        <li>
          <code>docs.google.com</code>: The domain <code>docs.google.com</code>{" "}
          or any of its subdomains.
        </li>
        <li>
          <code>docs**</code>: Any URL beginning with <code>docs</code>.
        </li>
        <li>
          <code>docs*.google.com</code>: <code>http://docs.google.com</code>,{" "}
          <code>http://docs1.google.com</code>,{" "}
          <code>http://docs2.google.com</code> and so on.
        </li>
        <li>
          <code>*.ycombinator.com</code>:{" "}
          <code>http://news.ycombinator.com</code> and{" "}
          <code>http://apps.ycombinator.com</code>.
        </li>
        <li>
          <code>docs.google.com, spreadsheets.google.com</code>: The domains{" "}
          <code>docs.google.com</code> or <code>spreadsheets.google.com</code>{" "}
          or any of their subdomains.
        </li>
        <li>
          <code>^http://www.reddit.com/$</code>: Reddit homepage.
        </li>
      </ul>
    </section>

    <hr />

    <section id="shortcuts">
      <h3>Keyboard shortcuts</h3>
      <img src={shortcutsIMG} height={500} alt="Stylebot keyboard shortcuts" />
    </section>

    <hr />

    <section id="requests">
      <h3>Bug reports and feature requests</h3>

      <p>
        Have a feature request? Want to report a bug? Please report on{" "}
        <a
          href="https://github.com/ankit/stylebot/issues"
          target="_blank"
          rel="noreferrer"
        >
          Github Issues
        </a>
        .
      </p>
    </section>
    <hr />

    <section id="support">
      <h3>Support Stylebot</h3>
      <p>
        Stylebot is an open source and free browser extension. Trusted by more
        than 200,000 users. <br />
        Developed and maintained since 2011. Support Stylebot by{" "}
        <a href="https://ko-fi.com/stylebot" target="_blank" rel="noreferrer">
          buying me a coffee
        </a>
        .
      </p>
    </section>
  </Layout>
);

export default HelpPage;
