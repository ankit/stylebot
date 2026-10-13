// Fills in the Mac App Store version that's being prepared: its version
// number, every language's listing from store/safari/listing/ (run
// `yarn store:safari-text` first), the screenshots in store/safari/, and the
// newest processed build of package.json's version. Signs with the API key
// that APP_STORE_CONNECT_KEY_PATH, _KEY_ID and _ISSUER_ID point to.
//
//   yarn upload:safari-listing

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAll, request } from './app-store-connect.mjs';

const BUNDLE_ID = 'dev.stylebot.Stylebot';
const SITE = 'https://stylebot.dev';
const SUPPORT_URL = 'https://github.com/ankit/stylebot/issues';
const EDITABLE_STATES = [
  'PREPARE_FOR_SUBMISSION',
  'DEVELOPER_REJECTED',
  'REJECTED',
  'METADATA_REJECTED',
];

// stylebot.dev's path prefix for each App Store Connect locale.
const SITE_LOCALES = {
  'en-US': '',
  'en-GB': '',
  'de-DE': 'de/',
  'es-ES': 'es/',
  'fr-FR': 'fr/',
  id: 'id/',
  it: 'it/',
  ja: 'ja/',
  ko: 'ko/',
  'pt-BR': 'pt-br/',
  'pt-PT': 'pt-pt/',
  ro: 'ro/',
  ru: 'ru/',
  vi: 'vi/',
  'zh-Hans': 'zh-cn/',
  'zh-Hant': 'zh-tw/',
};

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const listingDir = path.join(rootDir, 'store/safari/listing');
const screenshotsDir = path.join(rootDir, 'store/safari');
const { version } = JSON.parse(
  readFileSync(path.join(rootDir, 'package.json'), 'utf8')
);

if (!existsSync(listingDir)) {
  console.error('Run `yarn store:safari-text` first.');
  process.exit(1);
}

const readListing = locale => {
  const read = field =>
    readFileSync(path.join(listingDir, locale, `${field}.txt`), 'utf8').trim();

  return {
    name: read('name'),
    subtitle: read('subtitle'),
    keywords: read('keywords'),
    description: read('description'),
  };
};

const upsert = async (existing, type, attributes, relationship) => {
  if (existing) {
    await request('PATCH', `/v1/${type}/${existing.id}`, {
      data: { type, id: existing.id, attributes },
    });
    return existing;
  }

  const { data } = await request('POST', `/v1/${type}`, {
    data: { type, attributes, relationships: relationship },
  });
  return data;
};

const findApp = async () => {
  const [app] = await getAll(`/v1/apps?filter[bundleId]=${BUNDLE_ID}`);
  if (!app) {
    throw new Error(`No app with the bundle id ${BUNDLE_ID}.`);
  }
  return app;
};

const findEditable = async (pathname, label) => {
  const items = await getAll(pathname);
  const editable = items.find(item =>
    EDITABLE_STATES.includes(item.attributes.appStoreState)
  );
  if (!editable) {
    throw new Error(
      `No ${label} is being prepared; add a new version in App Store Connect.`
    );
  }
  return editable;
};

const updateVersion = async versionId => {
  await request('PATCH', `/v1/appStoreVersions/${versionId}`, {
    data: {
      type: 'appStoreVersions',
      id: versionId,
      attributes: {
        versionString: version,
        copyright: `${new Date().getFullYear()} Ankit Ahuja`,
      },
    },
  });
  console.log(`✓ version ${version}`);
};

const updateLocalizations = async (appInfoId, versionId) => {
  const infoLocalizations = await getAll(
    `/v1/appInfos/${appInfoId}/appInfoLocalizations`
  );
  const getVersionLocalizations = () =>
    getAll(`/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
  const byLocale = items =>
    Object.fromEntries(items.map(item => [item.attributes.locale, item]));
  const infoByLocale = byLocale(infoLocalizations);
  let versionByLocale = byLocale(await getVersionLocalizations());
  const locales = readdirSync(listingDir)
    .filter(locale => locale !== 'en-US')
    .sort();
  locales.unshift('en-US');
  const results = {};

  for (const locale of locales) {
    const listing = readListing(locale);
    const sitePrefix = SITE_LOCALES[locale] ?? '';

    await upsert(
      infoByLocale[locale],
      'appInfoLocalizations',
      {
        ...(!infoByLocale[locale] && { locale }),
        name: listing.name,
        subtitle: listing.subtitle,
        privacyPolicyUrl: `${SITE}/${sitePrefix}privacy/`,
      },
      { appInfo: { data: { type: 'appInfos', id: appInfoId } } }
    );

    // Adding a language to the app info adds it to the version too.
    if (!versionByLocale[locale]) {
      versionByLocale = byLocale(await getVersionLocalizations());
    }

    results[locale] = await upsert(
      versionByLocale[locale],
      'appStoreVersionLocalizations',
      {
        ...(!versionByLocale[locale] && { locale }),
        description: listing.description,
        keywords: listing.keywords,
        supportUrl: SUPPORT_URL,
        marketingUrl: `${SITE}/${sitePrefix}`,
      },
      { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } }
    );

    console.log(`✓ ${locale}`);
  }

  return results;
};

const md5 = buffer => createHash('md5').update(buffer).digest('hex');

const uploadScreenshot = async (setId, fileName, buffer) => {
  const { data } = await request('POST', '/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize: buffer.length },
      relationships: {
        appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } },
      },
    },
  });

  for (const operation of data.attributes.uploadOperations) {
    const response = await fetch(operation.url, {
      method: operation.method,
      headers: Object.fromEntries(
        operation.requestHeaders.map(({ name, value }) => [name, value])
      ),
      body: buffer.subarray(
        operation.offset,
        operation.offset + operation.length
      ),
    });
    if (!response.ok) {
      throw new Error(`Uploading ${fileName} failed: ${response.status}`);
    }
  }

  await request('PATCH', `/v1/appScreenshots/${data.id}`, {
    data: {
      type: 'appScreenshots',
      id: data.id,
      attributes: { uploaded: true, sourceFileChecksum: md5(buffer) },
    },
  });

  return data.id;
};

/**
 * Uploads store/safari/'s screenshots to the primary language, which the
 * other languages fall back to. Skips ones already there unchanged and
 * removes ones that aren't in the folder any more.
 */
const updateScreenshots = async localizationId => {
  const files = readdirSync(screenshotsDir)
    .filter(file => file.endsWith('.png'))
    .sort();
  const sets = await getAll(
    `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets`
  );
  let set = sets.find(
    item => item.attributes.screenshotDisplayType === 'APP_DESKTOP'
  );

  if (!set) {
    ({ data: set } = await request('POST', '/v1/appScreenshotSets', {
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: 'APP_DESKTOP' },
        relationships: {
          appStoreVersionLocalization: {
            data: { type: 'appStoreVersionLocalizations', id: localizationId },
          },
        },
      },
    }));
  }

  const existing = await getAll(
    `/v1/appScreenshotSets/${set.id}/appScreenshots`
  );
  const matches = files.map(file => {
    const buffer = readFileSync(path.join(screenshotsDir, file));
    const match = existing.find(
      item =>
        item.attributes.fileName === file &&
        item.attributes.sourceFileChecksum === md5(buffer) &&
        item.attributes.assetDeliveryState?.state !== 'FAILED'
    );
    return { file, buffer, match };
  });

  // Removed first, since a set holds at most 10 screenshots.
  for (const item of existing.filter(
    item => !matches.some(({ match }) => match === item)
  )) {
    await request('DELETE', `/v1/appScreenshots/${item.id}`);
    console.log(`✓ removed ${item.attributes.fileName}`);
  }

  const ids = [];

  for (const { file, buffer, match } of matches) {
    ids.push(match ? match.id : await uploadScreenshot(set.id, file, buffer));
    console.log(`✓ ${file}${match ? ' (unchanged)' : ''}`);
  }

  await request(
    'PATCH',
    `/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`,
    { data: ids.map(id => ({ type: 'appScreenshots', id })) }
  );
};

const attachBuild = async (appId, versionId) => {
  const builds = await getAll(
    `/v1/builds?filter[app]=${appId}&filter[preReleaseVersion.version]=${version}` +
      '&filter[processingState]=VALID&sort=-uploadedDate&limit=1'
  );
  const [build] = builds;

  if (!build) {
    console.log(`… no processed ${version} build yet; run this again later`);
    return;
  }

  await request(
    'PATCH',
    `/v1/appStoreVersions/${versionId}/relationships/build`,
    { data: { type: 'builds', id: build.id } }
  );
  console.log(`✓ build ${build.attributes.version}`);
};

const app = await findApp();
const appVersion = await findEditable(
  `/v1/apps/${app.id}/appStoreVersions?filter[platform]=MAC_OS`,
  'macOS version'
);
const appInfo = await findEditable(`/v1/apps/${app.id}/appInfos`, 'app info');

await request('PATCH', `/v1/apps/${app.id}`, {
  data: {
    type: 'apps',
    id: app.id,
    attributes: {
      contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT',
    },
  },
});
await request('PATCH', `/v1/appInfos/${appInfo.id}`, {
  data: {
    type: 'appInfos',
    id: appInfo.id,
    relationships: {
      primaryCategory: {
        data: { type: 'appCategories', id: 'PRODUCTIVITY' },
      },
      secondaryCategory: {
        data: { type: 'appCategories', id: 'DEVELOPER_TOOLS' },
      },
    },
  },
});
console.log('✓ category and content rights');

await updateVersion(appVersion.id);
const localizations = await updateLocalizations(appInfo.id, appVersion.id);
await updateScreenshots(localizations[app.attributes.primaryLocale].id);
await attachBuild(app.id, appVersion.id);

console.log(`
Filled in ${version}. App Privacy, the age rating, pricing and the review
notes are set in App Store Connect itself.
`);
