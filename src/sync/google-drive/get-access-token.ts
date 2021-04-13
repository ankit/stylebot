// Code from https://github.com/mdn/webextensions-examples/tree/master/google-userinfo
export type AccessToken = string;

const CLIENT_ID =
  '662998053209-s49tq55ic3td87m08gi8vpjqm5t7r9st.apps.googleusercontent.com';

const extractAccessToken = (redirectUri: string) => {
  const m = redirectUri.match(/[#?](.*)/);

  if (!m || m.length < 1) {
    return null;
  }

  const params = new URLSearchParams(m[1].split('#')[0]);
  return params.get('access_token');
};

/**
 * Validate the token contained in redirectURL.
 * This follows essentially the process here:
 * https://developers.google.com/identity/protocols/OAuth2UserAgent#tokeninfo-validation
 * - make a GET request to the validation URL, including the access token
 * - if the response is 200, and contains an "aud" property, and that property
 * matches the clientID, then the response is valid
 * - otherwise it is not valid
 * Note that the Google page talks about an "audience" property, but in fact
 * it seems to be "aud".
 */
const validate = async (redirectURL?: string): Promise<AccessToken> => {
  if (!redirectURL) {
    throw 'Authorization failure';
  }

  const accessToken = extractAccessToken(redirectURL);
  if (!accessToken) {
    throw 'Authorization failure';
  }

  const validationBaseURL = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
  const validationURL = `${validationBaseURL}?access_token=${accessToken}`;
  const validationRequest = new Request(validationURL, {
    method: 'GET',
  });

  const checkResponse = (response: Response) => {
    return new Promise<AccessToken>((resolve, reject) => {
      if (response.status != 200) {
        reject('Token validation error');
        return;
      }

      response.json().then((json: { aud: string }) => {
        if (json.aud && json.aud === CLIENT_ID) {
          resolve(accessToken);
        } else {
          reject('Token validation error');
        }
      });
    });
  };

  const response = await fetch(validationRequest);
  return checkResponse(response);
};

const authorize = (): Promise<string | undefined> => {
  return new Promise(resolve => {
    const redirectURL = chrome.identity.getRedirectURL();
    const scopes = ['https://www.googleapis.com/auth/drive.file'];

    let authURL = 'https://accounts.google.com/o/oauth2/auth';
    authURL += `?client_id=${CLIENT_ID}`;
    authURL += `&response_type=token`;
    authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
    authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;

    return chrome.identity.launchWebAuthFlow(
      {
        interactive: true,
        url: authURL,
      },
      responseURL => resolve(responseURL)
    );
  });
};

export default async (): Promise<AccessToken> => {
  const redirectURL = await authorize();
  return validate(redirectURL);
};
