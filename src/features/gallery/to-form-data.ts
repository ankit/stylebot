/**
 * What publishing a style or a new version of it sends.
 */
export type StyleForm = {
  name: string;
  description: string;
  css: string;
  // Required for a new style; a new version without one keeps the style's.
  screenshot?: Blob;
  // What changed, for a new version; the gallery shows it in the history.
  notes?: string;
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

  // The server reads the type from the file itself, so the name is only a label.
  if (form.screenshot) {
    data.append('screenshot', form.screenshot, 'screenshot');
  }

  return data;
};
