import fs from "fs";
import path from "path";
import matter from "front-matter";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

const POSTS_DIR = path.resolve("src/blog/posts");
const OUTPUT_DIR = path.resolve("src/blog/rendered");
const INDEX_FILE = path.resolve("src/blog/posts-index.json");

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

function generateIndex() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error: Blog posts directory not found at ${POSTS_DIR}`);
    process.exit(1);
  }

  // Ensure output directory exists
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

    // Skip draft posts
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

    // Render post and save as JSON
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

  // Sort by date (newest first)
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
  console.log(`Successfully generated blog index and rendered ${postsMetadata.length} posts.`);
}

generateIndex();
