<template>
  <article class="blog-post" v-if="post">
    <header class="post-header">
      <nav class="breadcrumb">
        <router-link to="/blog">← Back to Blog</router-link>
      </nav>

      <div class="post-meta">
        <time>{{ formatDate(post.frontmatter.date) }}</time>
        <span v-if="post.frontmatter.author" class="author">
          by
          <router-link :to="`/blog/author/${post.frontmatter.author}`" class="author-link">
            {{ post.frontmatter.author }}
          </router-link>
        </span>
        <span class="blog-badge blog-badge-reading-time">{{ post.readingTime }} min read</span>
      </div>

      <h1>{{ post.frontmatter.title }}</h1>

      <div class="post-tags" v-if="post.frontmatter.tags">
        <router-link v-for="tag in post.frontmatter.tags" :key="tag" :to="`/blog/tag/${tag}`" class="blog-tag tag-link">
          {{ tag }}
        </router-link>
      </div>
    </header>

    <div class="post-content" v-html="post.content"></div>

    <!-- Related Posts -->
    <section v-if="relatedPosts.length > 0" class="related-posts">
      <h3>Related Posts</h3>
      <div class="related-grid">
        <div v-for="relatedPost in relatedPosts" :key="relatedPost.slug" class="blog-card related-card"
          @click="navigateToPost(relatedPost.slug)">
          <h4>{{ relatedPost.frontmatter.title }}</h4>
          <p>{{ relatedPost.frontmatter.excerpt }}</p>
          <div class="related-meta">
            <time>{{ formatDate(relatedPost.frontmatter.date) }}</time>
            <span class="blog-badge blog-badge-reading-time">{{ relatedPost.readingTime }} min read</span>
          </div>
        </div>
      </div>
    </section>

    <footer class="post-footer">
      <div class="post-navigation">
        <router-link v-if="previousPost" :to="`/blog/${previousPost.slug}`" class="nav-link prev">
          <span class="nav-label">Previous</span>
          <span class="nav-title">{{ previousPost.frontmatter.title }}</span>
        </router-link>

        <router-link v-if="nextPost" :to="`/blog/${nextPost.slug}`" class="nav-link next">
          <span class="nav-label">Next</span>
          <span class="nav-title">{{ nextPost.frontmatter.title }}</span>
        </router-link>
      </div>
    </footer>
  </article>

  <div v-else-if="!postLoading" class="not-found">
    <h1>Post not found</h1>
    <p>The post you're looking for doesn't exist or has been moved.</p>
    <router-link to="/blog" class="blog-btn blog-btn-primary">← Back to Blog</router-link>
  </div>

  <div v-else class="blog-loading">Loading post...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useBlog } from "@/blog/composables/use-blog";
import type { BlogPost, BlogPostMetadata } from "@/blog/types";

interface Props {
  slug: string;
}

const props = defineProps<Props>();
const router = useRouter();

const { posts, postLoading, getPost, getRelatedPostsForPost, loadPosts } = useBlog();

const post = ref<BlogPost | undefined>(undefined);
const relatedPosts = ref<BlogPostMetadata[]>([]);

const allPosts = computed(() => posts.value);

const currentIndex = computed((): number => {
  if (!post.value) return -1;
  return allPosts.value.findIndex((p) => p.slug === post.value?.slug);
});

const previousPost = computed((): BlogPostMetadata | undefined => {
  const index = currentIndex.value;
  return index > 0 ? allPosts.value[index - 1] : undefined;
});

const nextPost = computed((): BlogPostMetadata | undefined => {
  const index = currentIndex.value;
  return index >= 0 && index < allPosts.value.length - 1 ? allPosts.value[index + 1] : undefined;
});

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const navigateToPost = (slug: string): void => {
  router.push(`/blog/${slug}`);
};

const loadPostData = async (): Promise<void> => {
  postLoading.value = true;
  try {
    // Ensure we have the post list for navigation and related posts
    if (allPosts.value.length === 0) {
      loadPosts();
    }

    const foundPost = await getPost(props.slug);
    if (foundPost) {
      post.value = foundPost;
      relatedPosts.value = getRelatedPostsForPost(foundPost);

      // Update page title
      if (foundPost.frontmatter.title) {
        document.title = `${foundPost.frontmatter.title} - Blog`;
      }
    } else {
      post.value = undefined;
    }
  } finally {
    postLoading.value = false;
  }
};

// Watch for slug changes (when navigating between posts)
watch(() => props.slug, loadPostData);

onMounted(() => {
  loadPostData();
});
</script>

<style>
@import "highlight.js/styles/atom-one-dark.css";
@import "@/assets/blog/theme.css";
</style>

<style scoped>
.blog-post {
  max-width: 900px;
  height: 100vh;
  overflow: auto;
  margin: 0 auto;
  padding: var(--blog-spacing-xl);
  background: var(--blog-background);
  border-radius: var(--blog-radius-xl);
  box-shadow: var(--blog-shadow-sm);
}

.breadcrumb {
  margin-bottom: var(--blog-spacing-xl);
}

.breadcrumb-link {
  color: var(--blog-primary);
  text-decoration: none;
  transition: color var(--blog-transition-base);
}

.breadcrumb-link:hover {
  color: var(--blog-primary-dark);
}

.post-header {
  margin-bottom: var(--blog-spacing-2xl);
  text-align: center;
}

.post-meta {
  color: var(--blog-text-muted);
  margin-bottom: var(--blog-spacing-lg);
  font-size: 0.95rem;
  display: flex;
  justify-content: center;
  gap: var(--blog-spacing-lg);
  flex-wrap: wrap;
  align-items: center;
}

.author-link {
  color: var(--blog-primary);
  text-decoration: none;
  transition: color var(--blog-transition-base);
}

.author-link:hover {
  color: var(--blog-primary-dark);
}

.post-header h1 {
  font-size: var(--blog-font-size-4xl);
  margin-bottom: var(--blog-spacing-lg);
  color: var(--blog-text-primary);
  line-height: var(--blog-line-height-tight);
}

.post-tags {
  display: flex;
  gap: var(--blog-spacing-sm);
  justify-content: center;
  flex-wrap: wrap;
}

.tag-link {
  text-decoration: none;
  transition: all var(--blog-transition-base);
}

.post-content {
  font-family: var(--blog-font-primary);
  line-height: var(--blog-line-height-relaxed);
  font-size: var(--blog-font-size-lg);
  color: var(--blog-text-primary);
  margin-bottom: var(--blog-spacing-2xl);
}

.post-content :deep(h1) {
  font-family: var(--blog-font-heading);
  font-weight: 700;
  background: var(--blog-gradient-mystical);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}

.post-content :deep(h2) {
  font-family: var(--blog-font-heading);
  margin-top: calc(var(--blog-spacing-2xl) + var(--blog-spacing-sm));
  margin-bottom: var(--blog-spacing-lg);
  color: var(--blog-text-primary);
  font-size: var(--blog-font-size-2xl);
  line-height: var(--blog-line-height-tight);
}

.post-content :deep(h3) {
  font-family: var(--blog-font-heading);
  margin-top: var(--blog-spacing-xl);
  margin-bottom: var(--blog-spacing-md);
  color: var(--blog-text-primary);
  font-size: var(--blog-font-size-xl);
  line-height: var(--blog-line-height-tight);
}

.post-content :deep(h4) {
  font-family: var(--blog-font-heading);
  margin-top: var(--blog-spacing-lg);
  margin-bottom: var(--blog-spacing-sm);
  color: var(--blog-text-primary);
  font-size: var(--blog-font-size-lg);
  line-height: var(--blog-line-height-tight);
}

.post-content :deep(p) {
  margin-bottom: var(--blog-spacing-lg);
}

.post-content :deep(ul),
.post-content :deep(ol) {
  margin-bottom: var(--blog-spacing-lg);
  padding-left: var(--blog-spacing-xl);
}

.post-content :deep(li) {
  margin-bottom: var(--blog-spacing-sm);
}

.post-content :deep(pre) {
  background: var(--blog-background-light);
  padding: var(--blog-spacing-lg);
  border-radius: var(--blog-radius-md);
  overflow-x: auto;
  margin: var(--blog-spacing-xl) 0;
  border-left: 4px solid var(--blog-primary);
  font-family: var(--blog-font-mono);
}

.post-content :deep(code) {
  background: var(--blog-background-light);
  padding: var(--blog-spacing-xs) var(--blog-spacing-sm);
  border-radius: var(--blog-radius-sm);
  font-size: 0.9em;
  font-family: var(--blog-font-mono);
}

.post-content :deep(pre code) {
  background: none;
  padding: 0;
}

.post-content :deep(blockquote) {
  border-left: 4px solid var(--blog-primary);
  padding-left: var(--blog-spacing-lg);
  margin: var(--blog-spacing-xl) 0;
  font-style: italic;
  color: var(--blog-text-secondary);
  background: var(--blog-background-light);
  padding: var(--blog-spacing-lg);
  border-radius: 0 var(--blog-radius-md) var(--blog-radius-md) 0;
}

.post-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--blog-radius-md);
  margin: var(--blog-spacing-xl) 0;
  box-shadow: var(--blog-shadow-sm);
}

.post-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--blog-spacing-xl) 0;
}

.post-content :deep(th),
.post-content :deep(td) {
  padding: var(--blog-spacing-sm) var(--blog-spacing-md);
  border: 1px solid var(--blog-border);
  text-align: left;
}

.post-content :deep(th) {
  background: var(--blog-background-light);
  font-weight: 600;
  color: var(--blog-text-primary);
}

.related-posts {
  margin: var(--blog-spacing-2xl) 0;
  padding-top: var(--blog-spacing-xl);
  border-top: 2px solid var(--blog-border);
}

.related-posts h3 {
  margin-bottom: var(--blog-spacing-lg);
  color: var(--blog-text-primary);
  text-align: center;
  font-size: var(--blog-font-size-2xl);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--blog-spacing-lg);
}

.related-card {
  padding: var(--blog-spacing-lg);
  cursor: pointer;
  transition: all var(--blog-transition-base);
}

.related-card h4 {
  margin-bottom: var(--blog-spacing-sm);
  color: var(--blog-text-primary);
  font-family: var(--blog-font-heading);
  font-size: var(--blog-font-size-lg);
  line-height: var(--blog-line-height-tight);
}

.related-card p {
  color: var(--blog-text-secondary);
  font-size: 0.9rem;
  font-family: var(--blog-font-primary);
  margin-bottom: var(--blog-spacing-lg);
  line-height: var(--blog-line-height-base);
}

.related-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--blog-text-muted);
}

.post-footer {
  margin-top: var(--blog-spacing-2xl);
  padding-top: var(--blog-spacing-xl);
  border-top: 2px solid var(--blog-border);
}

.post-navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--blog-spacing-xl);
}

.nav-link {
  display: flex;
  flex-direction: column;
  padding: var(--blog-spacing-lg);
  background: var(--blog-background-light);
  border-radius: var(--blog-radius-md);
  text-decoration: none;
  color: var(--blog-text-primary);
  transition: all var(--blog-transition-base);
}

.nav-link:hover {
  background: var(--blog-background-lighter);
  transform: translateY(-2px);
  box-shadow: var(--blog-shadow-sm);
}

.nav-link.next {
  text-align: right;
}

.nav-label {
  font-size: 0.9rem;
  color: var(--blog-text-muted);
  margin-bottom: var(--blog-spacing-sm);
}

.nav-title {
  font-weight: 600;
  line-height: var(--blog-line-height-tight);
}

.not-found {
  text-align: center;
  padding: var(--blog-spacing-2xl);
  max-width: 600px;
  margin: 0 auto;
}

.not-found h1 {
  color: var(--blog-error);
  margin-bottom: var(--blog-spacing-lg);
  font-size: var(--blog-font-size-3xl);
}

.not-found p {
  color: var(--blog-text-muted);
  margin-bottom: var(--blog-spacing-xl);
  font-size: var(--blog-font-size-lg);
}

@media (max-width: 768px) {
  .blog-post {
    padding: var(--blog-spacing-lg);
  }

  .post-header h1 {
    font-size: var(--blog-font-size-3xl);
  }

  .post-navigation {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }

  .post-meta {
    flex-direction: column;
    gap: var(--blog-spacing-sm);
  }
}
</style>
