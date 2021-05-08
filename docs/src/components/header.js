import React from "react";
import PropTypes from "prop-types";
import styled from "@emotion/styled";
import { Link } from "gatsby";

import githubImg from "../images/github.svg";
import twitterImg from "../images/twitter.svg";

const StyledHeader = styled.header`
  margin: 0 auto;
  max-width: 960px;
  display: flex;
  justify-content: end;
  padding: 1.45rem 1.0875rem 0.7em;
`;

const Title = styled.h1`
  margin: 0;

  & a {
    color: #333;
    text-decoration: none;
  }
`;

const Subtitle = styled.span`
  font-weight: 200;
  padding-left: 12px;
`;

const LinksContainer = styled.div`
  margin-top: 10px;
  margin-left: auto;
`;

const HeaderLink = styled.a`
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  color: #131313;
  opacity: 0.8;
  font-size: 15px;
  margin-left: 12px;
  text-decoration: none;

  &:hover {
    opacity: 1;
  }

  & img {
    height: 20px;
    margin-bottom: -4px;
  }
`;

const BuyCoffeeLink = styled.a`
  background-color: #0062cc;
  padding: 3px 12px 4px 12px;
  border-radius: 16px;
  color: #fff;
  margin-left: 8px;
  text-decoration: none;
  font-size: 15px;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
`;

const HelpLink = styled.a`
  background-color: #ddd;
  padding: 3px 12px 4px 12px;
  border-radius: 16px;
  color: #333;
  margin-left: 16px;
  text-decoration: none;
  font-size: 15px;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
`;

const Header = ({ title, subtitle }) => {
  return (
    <StyledHeader>
      <Title>
        <Link to="/">{title}</Link>

        <Subtitle>{subtitle}</Subtitle>
      </Title>

      <LinksContainer>
        <HeaderLink
          target="_blank"
          rel="noreferrer"
          title="Fork on Github"
          href="https://github.com/ankit/stylebot"
        >
          <img src={githubImg} alt="Github" />
        </HeaderLink>

        <HeaderLink
          target="_blank"
          rel="noreferrer"
          title="@stylebot"
          href="https://twitter.com/stylebot"
        >
          <img src={twitterImg} alt="Twitter" />
        </HeaderLink>

        <HelpLink href="/help" title="Help">
          Help
        </HelpLink>

        <BuyCoffeeLink
          title="Donate"
          target="_blank"
          rel="noreferrer"
          href="https://ko-fi.com/stylebot"
        >
          Donate
        </BuyCoffeeLink>
      </LinksContainer>
    </StyledHeader>
  );
};

Header.propTypes = {
  title: PropTypes.string,
};

Header.defaultProps = {
  title: ``,
};

export default Header;
