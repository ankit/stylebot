const fs = require('fs');
const Handlebars = require('handlebars');

const templates = [{
    src: 'dist/browseraction/templates/style.handlebars',
    dest: 'dist/browseraction/templates/style.js',
  },
  {
    src: 'dist/editor/templates/page.handlebars',
    dest: 'dist/editor/templates/page.js',
  },
  {
    src: 'dist/options/templates/style.handlebars',
    dest: 'dist/options/templates/style.js',
  },
  {
    src: 'dist/options/templates/style-modal.handlebars',
    dest: 'dist/options/templates/style-modal.js',
  },
];

templates.forEach(({
  src,
  dest
}) => {
  const templateContent = fs.readFileSync(src, 'utf8');
  const compiled = Handlebars.precompile(templateContent);
  console.log(`compiling template to ${dest}...`);
  fs.writeFileSync(dest, compiled);
});