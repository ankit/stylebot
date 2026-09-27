/**
 * Derives the style-scoping URL and display source name from the current page.
 */
export const getDomainUrlAndSource = (): { url: string; source: string } => {
  const parts = window.location.href.split('/');
  return { url: `${parts[0]}//${parts[2]}`, source: parts[2] };
};
