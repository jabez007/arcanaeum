<template>
  <Transition name="fade-slide" mode="out-in">
    <article class="blog-post" v-if="post" :key="post.slug" ref="postContainer" @scroll="handleScroll">
      <header class="post-header">
        <nav class="breadcrumb">
          <router-link to="/blog" class="back-link">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-arrow">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Blog
          </router-link>
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
          <router-link v-if="olderPost" :to="`/blog/${olderPost.slug}`" class="nav-link prev">
            <span class="nav-label">Previous Post</span>
            <span class="nav-title">{{ olderPost.frontmatter.title }}</span>
          </router-link>

          <router-link v-if="newerPost" :to="`/blog/${newerPost.slug}`" class="nav-link next">
            <span class="nav-label">Next Post</span>
            <span class="nav-title">{{ newerPost.frontmatter.title }}</span>
          </router-link>
        </div>
      </footer>

      <!-- Back to Top Button -->
      <Transition name="fade">
        <button v-if="showBackToTop" @click="scrollToTop" class="blog-btn-scroll-top" aria-label="Back to top">
          <svg viewBox="0 0 24 24" class="scroll-arrow" width="24" height="24">
            <path d="M12 4l-8 8h6v8h4v-8h6l-8-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 11l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </Transition>
      </article>

    <div v-else-if="!postLoading && error" class="blog-error" key="error">
      <h1>Error Loading Post</h1>
      <p>{{ error }}</p>
      <router-link to="/blog" class="blog-btn blog-btn-primary">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-arrow">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Blog
      </router-link>
    </div>

    <div v-else-if="!postLoading" class="not-found" key="not-found">
      <h1>Post not found</h1>
      <p>The post you're looking for doesn't exist or has been moved.</p>
      <router-link to="/blog" class="blog-btn blog-btn-primary">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-arrow">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Blog
      </router-link>
    </div>

    <div v-else class="blog-loading" key="loading">Loading post...</div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useBlog } from "@/blog/composables/use-blog";
import type { BlogPost, BlogPostMetadata } from "@/blog/types";

interface Props {
  slug: string;
}

const props = defineProps<Props>();
const router = useRouter();

const { posts, postLoading, error, getPost, getRelatedPostsForPost, loadPosts } = useBlog();

// Synchronously set loading true before any rendering to prevent "not found" flash
postLoading.value = true;

const post = ref<BlogPost | undefined>(undefined);
const relatedPosts = ref<BlogPostMetadata[]>([]);

const allPosts = computed(() => posts.value);

const currentIndex = computed((): number => {
  if (!post.value) return -1;
  return allPosts.value.findIndex((p) => p.slug === post.value?.slug);
});

const olderPost = computed((): BlogPostMetadata | undefined => {
  const index = currentIndex.value;
  return index >= 0 && index < allPosts.value.length - 1 ? allPosts.value[index + 1] : undefined;
});

const newerPost = computed((): BlogPostMetadata | undefined => {
  const index = currentIndex.value;
  return index > 0 ? allPosts.value[index - 1] : undefined;
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

const postContainer = ref<HTMLElement | null>(null);
const showBackToTop = ref(false);

const handleScroll = () => {
  if (postContainer.value) {
    showBackToTop.value = postContainer.value.scrollTop > 500;
  }
};

const scrollToTop = () => {
  if (postContainer.value) {
    postContainer.value.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const loadPostData = async (): Promise<void> => {
  postLoading.value = true;
  post.value = undefined;
  relatedPosts.value = [];
  showBackToTop.value = false;

  try {
    // Ensure we have the post list for navigation and related posts
    // Use preserveError=true so we don't clear an error if one already exists
    if (allPosts.value.length === 0) {
      loadPosts(true);
    }

    const foundPost = await getPost(props.slug);
    if (foundPost) {
      post.value = foundPost;
      relatedPosts.value = getRelatedPostsForPost(foundPost);

      // Wait for the new post to be rendered before scrolling
      await nextTick();
      if (postContainer.value) {
        postContainer.value.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Update page title
      if (foundPost.frontmatter.title) {
        document.title = `${foundPost.frontmatter.title} - Blog`;
      }
    } else {
      post.value = undefined;
    }
  } catch (err) {
    console.error(`Error in loadPostData for ${props.slug}:`, err);
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
  max-width: 1200px;
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
  text-align: left;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--blog-spacing-xs);
  color: var(--blog-text-muted);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all var(--blog-transition-base);
  padding: var(--blog-spacing-xs) var(--blog-spacing-sm);
  border-radius: var(--blog-radius-md);
  border: 1px solid transparent;
  line-height: 1;
}

.back-link:hover {
  color: var(--blog-primary-light);
  background: var(--blog-background-elevated);
  border-color: var(--blog-border-mystical);
  transform: translateX(-4px);
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
  grid-template-areas: "prev next";
  gap: var(--blog-spacing-xl);
}

.nav-link.prev {
  grid-area: prev;
}

.nav-link.next {
  grid-area: next;
  text-align: right;
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
    grid-template-areas: "prev" "next";
  }

  .nav-link.next {
    text-align: left;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }

  .post-meta {
    flex-direction: column;
    gap: var(--blog-spacing-sm);
  }
}

/* Transition Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.blog-btn-scroll-top {
  position: fixed;
  bottom: var(--blog-spacing-xl);
  right: calc(50% - 580px); /* Position relative to the 1200px container */
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--blog-gradient-mystical);
  border: 2px solid var(--blog-border-mystical);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--blog-shadow-lg);
  transition: all var(--blog-transition-base);
  z-index: 100;
}

.blog-btn-scroll-top:hover {
  transform: translateY(-8px);
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.6);
  border-color: var(--blog-primary-light);
}

.blog-btn-scroll-top .scroll-arrow {
  color: white;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
  transition: transform var(--blog-transition-base);
}

.blog-btn-scroll-top:hover .scroll-arrow {
  animation: arrow-float 1.5s ease-in-out infinite;
}

@keyframes arrow-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1250px) {
  .blog-btn-scroll-top {
    right: var(--blog-spacing-lg);
  }
}
</style>
