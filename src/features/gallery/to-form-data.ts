/**
 * A style's details, which editing one sends without a new version.
 */
export type StyleDetailsForm = {
  name: string;
  description: string;
  // Required for a new style; leaving it out keeps the style's.
  screenshot?: Blob;
};

/**
 * What publishing a style or a new version of it sends.
 */
export type StyleForm = StyleDetailsForm & {
  css: string;
  // What changed, for a new version; the gallery shows it in the history.
  notes?: string;
};

const appendScreenshot = (data: FormData, screenshot?: Blob): void => {
  // The server reads the type from the file itself, so the name is only a label.
  if (screenshot) {
    data.append('screenshot', screenshot, 'screenshot');
  }
};

/**
 * The multipart form the gallery takes for a style, with its site when it's
 * a new one.
 */
export const toFormData = (form: StyleForm, site?: string): FormData => {
  const data = new FormData();

  if (site !== undefined) {
    data.append('site', site);
  }

  data.append('name', form.name);

  if (form.description) {
    data.append('description', form.description);
  }

  if (form.notes) {
    data.append('notes', form.notes);
  }

  data.append('css', form.css);
  appendScreenshot(data, form.screenshot);

  return data;
};

/**
 * The multipart form for editing a style's details. The description is
 * always sent, since an edit changes only the fields it has and an empty one
 * clears it.
 */
export const toDetailsFormData = (form: StyleDetailsForm): FormData => {
  const data = new FormData();

  data.append('name', form.name);
  data.append('description', form.description);
  appendScreenshot(data, form.screenshot);

  return data;
};
