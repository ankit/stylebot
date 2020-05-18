const {
  execSync
} = require('child_process');

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
  console.log(`compiling ${src}...`);
  const execution = execSync(`./node_modules/handlebars/bin/handlebars ${src} -f ${dest}`);
});