import type { RouteRecordRaw } from "vue-router";

export const blogRoutes: RouteRecordRaw[] = [
  {
    path: "/blog",
    name: "BlogList",
    component: () => import("@/components/blog/BlogList.vue"),
    meta: {
      title: "Blog",
    },
  },
  /*
  {
    path: "/blog/search",
    name: "BlogSearch",
    component: () => import("@/components/blog/BlogSearch.vue"),
    meta: {
      title: "Search Blog",
    },
  },
  */
  {
    path: "/blog/tag/:tag",
    name: "BlogTag",
    component: () => import("@/components/blog/BlogTag.vue"),
    props: true,
    meta: {
      title: "Posts by Tag",
    },
  },
  /*
  {
    path: "/blog/author/:author",
    name: "BlogAuthor",
    component: () => import("@/components/blog/BlogAuthor.vue"),
    props: true,
    meta: {
      title: "Posts by Author",
    },
  },
  */
  {
    path: "/blog/:slug",
    name: "BlogPost",
    component: () => import("@/components/blog/BlogPost.vue"),
    props: true,
    meta: {
      title: "Blog Post",
    },
  },
];
