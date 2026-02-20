import fs from "fs";
import path from "path";
import matter from "front-matter";

const POSTS_DIR = path.resolve("src/blog/posts");
const OUTPUT_FILE = path.resolve("src/blog/posts-index.json");

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

  const files = fs.readdirSync(POSTS_DIR).filter((file) => file.endsWith(".md"));
  const posts = [];
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
    // Format date string if it's a Date object, otherwise handle undefined/null
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

    posts.push(metadata);

    if (attributes.tags) {
      attributes.tags.forEach((tag) => tags.add(tag));
    }
    if (attributes.author) {
      authors.add(attributes.author);
    }
  });

  // Sort by date (newest first)
  posts.sort((a, b) => {
    const timeA = new Date(a.frontmatter.date).getTime() || 0;
    const timeB = new Date(b.frontmatter.date).getTime() || 0;
    return timeB - timeA;
  });

  const index = {
    posts,
    tags: Array.from(tags).sort(),
    authors: Array.from(authors).sort(),
    totalPosts: posts.length,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`Successfully generated blog index with ${posts.length} posts.`);
}

generateIndex();
