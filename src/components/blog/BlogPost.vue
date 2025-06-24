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
          <router-link :to="`/blog/author/${post.frontmatter.author}`">
            {{ post.frontmatter.author }}
          </router-link>
        </span>
        <span class="reading-time">{{ post.readingTime }} min read</span>
      </div>

      <h1>{{ post.frontmatter.title }}</h1>

      <div class="post-tags" v-if="post.frontmatter.tags">
        <router-link v-for="tag in post.frontmatter.tags" :key="tag" :to="`/blog/tag/${tag}`" class="tag">
          {{ tag }}
        </router-link>
      </div>
    </header>

    <div class="post-content" v-html="post.content"></div>

    <!-- Related Posts -->
    <section v-if="relatedPosts.length > 0" class="related-posts">
      <h3>Related Posts</h3>
      <div class="related-grid">
        <div v-for="relatedPost in relatedPosts" :key="relatedPost.slug" class="related-card"
          @click="navigateToPost(relatedPost.slug)">
          <h4>{{ relatedPost.frontmatter.title }}</h4>
          <p>{{ relatedPost.frontmatter.excerpt }}</p>
          <div class="related-meta">
            <time>{{ formatDate(relatedPost.frontmatter.date) }}</time>
            <span>{{ relatedPost.readingTime }} min read</span>
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

  <div v-else-if="!loading" class="not-found">
    <h1>Post not found</h1>
    <p>The post you're looking for doesn't exist or has been moved.</p>
    <router-link to="/blog" class="back-link">← Back to Blog</router-link>
  </div>

  <div v-else class="loading">Loading post...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useBlog } from "@/blog/composables/use-blog";
import type { BlogPost } from "@/blog/types";

interface Props {
  slug: string;
}

const props = defineProps<Props>();
const router = useRouter();

const { posts, loading, getPost, getRelatedPostsForPost } = useBlog();

const post = ref<BlogPost | undefined>(undefined);
const relatedPosts = ref<BlogPost[]>([]);

const allPosts = computed(() => posts.value);

const currentIndex = computed((): number => {
  if (!post.value) return -1;
  return allPosts.value.findIndex((p) => p.slug === post.value?.slug);
});

const previousPost = computed((): BlogPost | undefined => {
  const index = currentIndex.value;
  return index > 0 ? allPosts.value[index - 1] : undefined;
});

const nextPost = computed((): BlogPost | undefined => {
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

const loadPost = (): void => {
  const foundPost = getPost(props.slug);
  if (foundPost) {
    post.value = foundPost;
    relatedPosts.value = getRelatedPostsForPost(foundPost);

    // Update page title
    if (foundPost.frontmatter.title) {
      document.title = `${foundPost.frontmatter.title} - Blog`;
    }
  }
};

// Watch for slug changes (when navigating between posts)
watch(() => props.slug, loadPost);

onMounted(() => {
  loadPost();
});
</script>

<style scoped>
.blog-post {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
}

.breadcrumb {
  margin-bottom: 2rem;
}

.breadcrumb a {
  color: #3498db;
  text-decoration: none;
  transition: color 0.3s ease;
}

.breadcrumb a:hover {
  color: #2980b9;
}

.post-header {
  margin-bottom: 3rem;
  text-align: center;
}

.post-meta {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.post-meta .author a {
  color: #3498db;
  text-decoration: none;
}

.post-meta .reading-time {
  background: #ecf0f1;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
}

.post-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  line-height: 1.2;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.tag {
  background: #ecf0f1;
  color: #2c3e50;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.tag:hover {
  background: #3498db;
  color: white;
}

.post-content {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 3rem;
}

.post-content :deep(h2) {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.8rem;
}

.post-content :deep(h3) {
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  color: #2c3e50;
  font-size: 1.4rem;
}

.post-content :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-size: 1.2rem;
}

.post-content :deep(p) {
  margin-bottom: 1.5rem;
}

.post-content :deep(ul),
.post-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.post-content :deep(li) {
  margin-bottom: 0.5rem;
}

.post-content :deep(pre) {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 2rem 0;
  border-left: 4px solid #3498db;
}

.post-content :deep(code) {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}

.post-content :deep(pre code) {
  background: none;
  padding: 0;
}

.post-content :deep(blockquote) {
  border-left: 4px solid #3498db;
  padding-left: 1.5rem;
  margin: 2rem 0;
  font-style: italic;
  color: #5a6c7d;
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0 8px 8px 0;
}

.post-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
}

.post-content :deep(th),
.post-content :deep(td) {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  text-align: left;
}

.post-content :deep(th) {
  background: #f8f9fa;
  font-weight: 600;
}

.related-posts {
  margin: 3rem 0;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.related-posts h3 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
  text-align: center;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.related-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.related-card:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.related-card h4 {
  margin-bottom: 0.75rem;
  color: #2c3e50;
  font-size: 1.1rem;
}

.related-card p {
  color: #5a6c7d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.related-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #7f8c8d;
}

.post-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.post-navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.nav-link {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.nav-link.next {
  text-align: right;
}

.nav-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.nav-title {
  font-weight: 600;
  line-height: 1.3;
}

.not-found {
  text-align: center;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
}

.not-found h1 {
  color: #e74c3c;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.not-found p {
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.back-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border: 2px solid #3498db;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.back-link:hover {
  background: #3498db;
  color: white;
}

@media (max-width: 768px) {
  .blog-post {
    padding: 1rem;
  }

  .post-header h1 {
    font-size: 2rem;
  }

  .post-navigation {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }

  .post-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
