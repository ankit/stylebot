const { execSync } = require("child_process");

const templates = [
  {
    src: "dist/editor/templates/page.handlebars",
    dest: "dist/editor/templates/page.js",
  },
];

templates.forEach(({ src, dest }) => {
  console.log(`compiling ${src}...`);

  const execution = execSync(
    `./node_modules/handlebars/bin/handlebars ${src} -f ${dest}`
  );
});
