import fs from "fs";
import path from "path";
import matter from "front-matter";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

const POSTS_DIR = path.resolve("src/blog/posts");
const OUTPUT_DIR = path.resolve("src/blog/rendered");
const INDEX_FILE = path.resolve("src/blog/posts-index.json");
const RSS_FILE = path.resolve("public/rss.xml");
const SITE_URL = "https://archonsarcanaeum.xyz";
const BLOG_URL = `${SITE_URL}/#/blog`;
const FEED_URL = `${SITE_URL}/rss.xml`;

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      } catch (err) {
        console.error(err);
      }
    }
    return "";
  },
});

function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function extractExcerpt(content, maxLength = 160) {
  const plainText = content.replace(/[#*`]/g, "").trim();
  return plainText.length > maxLength ? plainText.substring(0, maxLength) + "..." : plainText;
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatRssDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return new Date().toUTCString();
  }
  return date.toUTCString();
}

function generateRssFeed(postsMetadata) {
  const latestPostDate = postsMetadata[0]?.frontmatter.date;
  const lastBuildDate = formatRssDate(latestPostDate || new Date().toISOString());

  const items = postsMetadata
    .map((post) => {
      const postUrl = `${BLOG_URL}/${encodeURIComponent(post.slug)}`;
      const categories = (post.frontmatter.tags || [])
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");
      const author = post.frontmatter.author
        ? `      <author>${escapeXml(post.frontmatter.author)}</author>\n`
        : "";

      return `    <item>
      <title>${escapeXml(post.frontmatter.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid>${escapeXml(postUrl)}</guid>
      <pubDate>${formatRssDate(post.frontmatter.date)}</pubDate>
      <description>${escapeXml(post.frontmatter.excerpt || "")}</description>
${author}${categories ? `${categories}\n` : ""}    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Commits &amp; Conjurations</title>
    <link>${escapeXml(BLOG_URL)}</link>
    <description>Crafting code, weaving algorithms, and brewing solutions in the realm of technology</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(FEED_URL)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function generateIndex() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error: Blog posts directory not found at ${POSTS_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(POSTS_DIR).filter((file) => file.endsWith(".md"));
  const postsMetadata = [];
  const tags = new Set();
  const authors = new Set();

  files.forEach((file) => {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const { attributes, body } = matter(content);

    if (attributes.draft) {
      return;
    }

    const key = path.basename(file, ".md");
    const slug = attributes.slug || key.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    const excerpt = attributes.excerpt || extractExcerpt(body);

    const date = attributes.date;
    let dateStr = "";
    if (date instanceof Date) {
      dateStr = date.toISOString().split("T")[0];
    } else if (date) {
      dateStr = String(date);
    }

    const metadata = {
      id: key,
      slug,
      frontmatter: {
        ...attributes,
        excerpt,
        date: dateStr,
      },
      readingTime: calculateReadingTime(body),
    };

    postsMetadata.push(metadata);

    const renderedContent = md.render(body);
    const postData = {
      ...metadata,
      content: renderedContent,
    };

    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.json`), JSON.stringify(postData, null, 2));

    if (attributes.tags) {
      attributes.tags.forEach((tag) => tags.add(tag));
    }
    if (attributes.author) {
      authors.add(attributes.author);
    }
  });

  postsMetadata.sort((a, b) => {
    const timeA = new Date(a.frontmatter.date).getTime() || 0;
    const timeB = new Date(b.frontmatter.date).getTime() || 0;
    return timeB - timeA;
  });

  const index = {
    posts: postsMetadata,
    tags: Array.from(tags).sort(),
    authors: Array.from(authors).sort(),
    totalPosts: postsMetadata.length,
  };

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  fs.writeFileSync(RSS_FILE, generateRssFeed(postsMetadata));
  console.log(`Successfully generated blog index, RSS feed, and rendered ${postsMetadata.length} posts.`);
}

generateIndex();
