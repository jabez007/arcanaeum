<template>
  <div class="tag-page">
    <header class="tag-header">
      <nav class="breadcrumb">
        <router-link to="/blog">← Back to Blog</router-link>
      </nav>

      <div class="tag-info">
        <h1><span class="tag-symbol">#</span>{{ tag }}</h1>
        <p v-if="taggedPosts.length > 0">
          {{ taggedPosts.length }} post{{ taggedPosts.length !== 1 ? "s" : "" }} tagged with "{{
            tag
          }}"
        </p>
      </div>
    </header>

    <!-- Additional Controls -->
    <div class="tag-controls" v-if="taggedPosts.length > 0">
      <div class="sort-container">
        <label for="sort-select">Sort by:</label>
        <select v-model="sortBy" id="sort-select" class="blog-input sort-select">
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
      </div>

      <div class="view-toggle">
        <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }"
          class="blog-btn blog-btn-secondary view-btn">
          Grid
        </button>
        <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }"
          class="blog-btn blog-btn-secondary view-btn">
          List
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="postsLoading" class="blog-loading">Loading posts...</div>

    <!-- Error State -->
    <div v-if="error" class="blog-error">
      {{ error }}
    </div>

    <!-- Posts Grid/List -->
    <div v-if="!postsLoading && !error && taggedPosts.length > 0" :class="['posts-container', `posts-${viewMode}`]">
      <article v-for="post in paginatedPosts" :key="post.slug" class="blog-card post-card"
        @click="navigateToPost(post.slug)">
        <div class="post-meta">
          <time>{{ formatDate(post.frontmatter.date) }}</time>
          <span v-if="post.frontmatter.featured" class="blog-badge blog-badge-featured">
            Featured
          </span>
          <span class="blog-badge blog-badge-reading-time">{{ post.readingTime }} min read</span>
        </div>

        <h2>{{ post.frontmatter.title }}</h2>

        <p class="excerpt">{{ post.frontmatter.excerpt }}</p>

        <div class="post-footer">
          <div class="post-tags">
            <span v-for="postTag in post.frontmatter.tags?.filter((t) => t !== tag).slice(0, 3)" :key="postTag"
              class="blog-tag tag" @click.stop="selectTag(postTag)">
              {{ postTag }}
            </span>
            <span v-if="
              post.frontmatter.tags && post.frontmatter.tags.filter((t) => t !== tag).length > 3
            " class="tag-more">
              +{{post.frontmatter.tags.filter((t) => t !== tag).length - 3}}
            </span>
          </div>

          <div class="post-author" v-if="post.frontmatter.author">
            <span @click.stop="selectAuthor(post.frontmatter.author!)">
              by {{ post.frontmatter.author }}
            </span>
          </div>
        </div>

        <div class="read-more">Read more →</div>
      </article>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && taggedPosts.length === 0" class="empty-state">
      <h3>No posts found for "{{ tag }}"</h3>
      <p>This tag doesn't exist or no posts have been tagged with it yet.</p>
      <div class="empty-actions">
        <router-link to="/blog" class="blog-btn blog-btn-primary">← Back to Blog</router-link>
        <router-link to="/blog/search" class="blog-btn blog-btn-secondary">Search Posts</router-link>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="blog-pagination">
      <button @click="currentPage--" :disabled="currentPage === 1" class="blog-page-btn">
        Previous
      </button>

      <span class="blog-page-info"> Page {{ currentPage }} of {{ totalPages }} </span>

      <button @click="currentPage++" :disabled="currentPage === totalPages" class="blog-page-btn">
        Next
      </button>
    </div>

    <!-- Related Tags -->
    <section v-if="relatedTags.length > 0" class="related-tags">
      <h3>Related Tags</h3>
      <div class="related-tags-grid">
        <router-link v-for="relatedTag in relatedTags" :key="relatedTag.tag" :to="`/blog/tag/${relatedTag.tag}`"
          class="blog-tag tag-link related-tag">
          {{ relatedTag.tag }} ({{ relatedTag.count }})
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useBlog } from "@/blog/composables/use-blog";
import type { BlogPostMetadata } from "@/blog/types";

interface Props {
  tag: string;
}

const props = defineProps<Props>();
const router = useRouter();

const { posts, postsLoading, error, loadPosts } = useBlog();

const sortBy = ref<string>("date-desc");
const viewMode = ref<"grid" | "list">("grid");
const currentPage = ref(1);
const postsPerPage = 12;

const taggedPosts = computed((): BlogPostMetadata[] => {
  const filtered = posts.value.filter((post) => post.frontmatter.tags?.includes(props.tag));

  // Sort posts based on selected sort option
  return filtered.sort((a, b) => {
    switch (sortBy.value) {
      case "date-asc":
        return new Date(a.frontmatter.date).getTime() - new Date(b.frontmatter.date).getTime();
      case "date-desc":
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
      case "title-asc":
        return a.frontmatter.title.localeCompare(b.frontmatter.title);
      case "title-desc":
        return b.frontmatter.title.localeCompare(a.frontmatter.title);
      default:
        return 0;
    }
  });
});

const totalPages = computed((): number => {
  return Math.ceil(taggedPosts.value.length / postsPerPage);
});

const paginatedPosts = computed((): BlogPostMetadata[] => {
  const start = (currentPage.value - 1) * postsPerPage;
  const end = start + postsPerPage;
  return taggedPosts.value.slice(start, end);
});

const relatedTags = computed(() => {
  const tagCounts = new Map<string, number>();

  // Count occurrences of other tags in posts that have the current tag
  taggedPosts.value.forEach((post) => {
    post.frontmatter.tags?.forEach((postTag) => {
      if (postTag !== props.tag) {
        tagCounts.set(postTag, (tagCounts.get(postTag) || 0) + 1);
      }
    });
  });

  // Convert to array and sort by count, then take top 8
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
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

const selectTag = (tag: string): void => {
  router.push(`/blog/tag/${tag}`);
};

const selectAuthor = (author: string): void => {
  if (author) {
    router.push(`/blog/author/${author}`);
  }
};

// Reset page when sort changes
watch(sortBy, () => {
  currentPage.value = 1;
});

// Reset page when tag changes
watch(
  () => props.tag,
  () => {
    currentPage.value = 1;
  },
);

onMounted(() => {
  document.title = `#${props.tag} - Blog`;
  loadPosts();
});
</script>

<style>
@import "@/assets/blog/theme.css";
</style>

<style scoped>
.tag-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--blog-spacing-xl);
}

.breadcrumb {
  margin-bottom: var(--blog-spacing-xl);
}

.breadcrumb a {
  color: var(--blog-primary);
  text-decoration: none;
  transition: color var(--blog-transition-base);
}

.breadcrumb a:hover {
  color: var(--blog-primary-dark);
}

.tag-header {
  text-align: center;
  margin-bottom: var(--blog-spacing-2xl);
}

.tag-info h1 {
  font-size: var(--blog-font-size-4xl);
  margin-bottom: var(--blog-spacing-md);
  color: var(--blog-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--blog-spacing-sm);
}

.tag-symbol {
  color: var(--blog-primary);
  font-weight: 300;
}

.tag-info p {
  font-size: var(--blog-font-size-lg);
  color: var(--blog-text-muted);
}

.tag-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--blog-spacing-xl);
  flex-wrap: wrap;
  gap: var(--blog-spacing-lg);
}

.sort-container {
  display: flex;
  align-items: center;
  gap: var(--blog-spacing-sm);
}

.sort-container label {
  color: var(--blog-text-secondary);
  font-weight: 500;
}

.sort-select {
  min-width: 150px;
}

.view-toggle {
  display: flex;
  gap: var(--blog-spacing-xs);
}

.view-btn {
  padding: var(--blog-spacing-sm) var(--blog-spacing-md);
  font-size: 0.9rem;
}

.view-btn.active {
  background: var(--blog-primary);
  color: white;
  border-color: var(--blog-primary);
}

.posts-container {
  margin-bottom: var(--blog-spacing-2xl);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--blog-spacing-xl);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--blog-spacing-lg);
}

.posts-list .post-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--blog-spacing-lg);
  padding: var(--blog-spacing-lg);
}

.posts-list .post-card .post-content {
  flex: 1;
}

.posts-list .post-card h2 {
  font-size: var(--blog-font-size-xl);
  margin-bottom: var(--blog-spacing-sm);
}

.posts-list .post-card .excerpt {
  margin-bottom: var(--blog-spacing-sm);
  font-size: 0.95rem;
}

.post-card {
  padding: var(--blog-spacing-lg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--blog-spacing-md);
  font-size: 0.9rem;
  color: var(--blog-text-muted);
  flex-wrap: wrap;
  gap: var(--blog-spacing-sm);
}

.post-card h2 {
  font-family: var(--blog-font-heading);
  margin-bottom: var(--blog-spacing-md);
  color: var(--blog-text-primary);
  line-height: var(--blog-line-height-tight);
  flex-grow: 0;
}

.excerpt {
  font-family: var(--blog-font-primary);
  color: var(--blog-text-secondary);
  line-height: var(--blog-line-height-base);
  margin-bottom: var(--blog-spacing-md);
  flex-grow: 1;
}

.post-footer {
  margin-top: auto;
  margin-bottom: var(--blog-spacing-md);
}

.post-tags {
  display: flex;
  gap: var(--blog-spacing-sm);
  margin-bottom: var(--blog-spacing-sm);
  flex-wrap: wrap;
  align-items: center;
}

.tag {
  cursor: pointer;
  transition: all var(--blog-transition-base);
}

.tag:hover {
  background: var(--blog-primary);
  color: white;
  transform: translateY(-1px);
}

.tag-more {
  color: var(--blog-text-muted);
  font-size: 0.8rem;
}

.post-author {
  font-size: 0.9rem;
  color: var(--blog-text-muted);
}

.post-author span {
  cursor: pointer;
  transition: color var(--blog-transition-base);
}

.post-author span:hover {
  color: var(--blog-primary);
}

.read-more {
  color: var(--blog-primary);
  font-weight: 500;
  margin-top: var(--blog-spacing-sm);
}

.empty-state {
  text-align: center;
  padding: var(--blog-spacing-2xl);
  color: var(--blog-text-muted);
}

.empty-state h3 {
  color: var(--blog-text-primary);
  margin-bottom: var(--blog-spacing-lg);
  font-size: var(--blog-font-size-2xl);
}

.empty-state p {
  margin-bottom: var(--blog-spacing-xl);
  font-size: var(--blog-font-size-lg);
}

.empty-actions {
  display: flex;
  gap: var(--blog-spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.related-tags {
  margin-top: var(--blog-spacing-2xl);
  padding-top: var(--blog-spacing-xl);
  border-top: 2px solid var(--blog-border);
}

.related-tags h3 {
  text-align: center;
  margin-bottom: var(--blog-spacing-lg);
  color: var(--blog-text-primary);
  font-size: var(--blog-font-size-xl);
}

.related-tags-grid {
  display: flex;
  gap: var(--blog-spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.related-tag {
  text-decoration: none;
  transition: all var(--blog-transition-base);
}

.related-tag:hover {
  background: var(--blog-primary);
  color: white;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .tag-page {
    padding: var(--blog-spacing-lg);
  }

  .tag-info h1 {
    font-size: var(--blog-font-size-3xl);
    flex-direction: column;
    gap: var(--blog-spacing-xs);
  }

  .tag-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-container {
    justify-content: space-between;
  }

  .view-toggle {
    justify-content: center;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }

  .posts-list .post-card {
    flex-direction: column;
  }

  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
