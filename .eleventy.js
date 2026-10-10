import { HtmlBasePlugin } from "@11ty/eleventy";
import fs from "node:fs";
import path from "node:path";

// Our own ES modules under assets/js; Massively's vendor scripts are not modules.
function moduleFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  return fs
    .readdirSync(root, { recursive: true })
    .map((name) => path.join(root, name))
    .filter((file) => file.endsWith(".js") && !file.includes(`${path.sep}massively${path.sep}`));
}

export default function (eleventyConfig) {
  // Rewrites root-relative href/src URLs when built with --pathprefix (GitHub Pages
  // serves the site from /pollok-baptist-site/). A plain build stays at "/".
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/assets/images/logo-white.png": "favicon.png" });

  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());
  // Changes every build; appended to our CSS/JS links so a publish is never mixed
  // with the browser's cached copy (GitHub Pages allows 10 minutes of caching).
  const assetVersion = Date.now().toString(36);
  eleventyConfig.addGlobalData("assetVersion", () => assetVersion);

  // site.js loads ./lib/*.js by relative import, which the ?v= above does not reach.
  // After the build, version those imports in the output copies (sources stay clean).
  // `directories` honours --output; the older `dir` argument does not.
  eleventyConfig.on("eleventy.after", ({ directories }) => {
    const jsRoot = path.join(directories.output, "assets", "js");
    for (const file of moduleFiles(jsRoot)) {
      const code = fs.readFileSync(file, "utf8");
      const versioned = code.replace(/(from\s+["'])(\.{1,2}\/[^"'?]+\.js)(["'])/g, `$1$2?v=${assetVersion}$3`);
      if (versioned !== code) {
        fs.writeFileSync(file, versioned);
      }
    }
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
