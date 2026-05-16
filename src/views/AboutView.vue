<template>
  <section class="about-container">
    <div class="parallax-bg" ref="parallaxBg"></div>

    <div class="content">
      <h1>The Arcane Origins of Jabez007</h1>
      <blockquote>
        "All we have to decide is what to do with the code that is given us."
        <br />
        <cite style="display: block; text-align: right; margin-top: 0.5rem;">– a totally real Gandalf quote (probably)</cite>
      </blockquote>

      <p>
        In the far reaches of cyberspace, where forgotten APIs whisper through deprecated endpoints
        and servers flicker like dying stars, one software sorcerer emerged — cloaked in sarcasm,
        armed with enchanted source scrolls, and sustained by black-code rituals brewed beside the
        terminal's glow.
      </p>

      <p>
        I’m <strong>Jimmy</strong>, but across the code-realms I’m known as
        <strong>jabez007</strong> — Backend Architect, conjurer of cloud logic, and summoner of
        RESTful spirits. My usual spellbook includes <code>TypeScript</code>, <code>Node.js</code>,
        <code>Python</code>, <code>Go</code>, <code>.NET</code>, <code>Vue</code>,
        <code>Docker</code>, <code>Kubernetes</code>, and <code>Terraform</code>.
      </p>

      <h2>Domains of Mastery</h2>
      <ul>
        <li>
          <strong>Backend Alchemy:</strong> Architecting resilient, observable APIs and services in
          Go, Python, C#, and TypeScript—integrating systems that were never meant to speak.
        </li>
        <li>
          <strong>Cloud & DevOps Rituals:</strong> Summoning infrastructure from the ether with
          Terraform, Docker, and Kubernetes, bound by CI/CD runes in GitHub Actions.
        </li>
        <li>
          <strong>Automated Familiars:</strong> Researching and developing modular AI agent systems
          and developer tooling to automate the mundane and conquer tech entropy.
        </li>
        <li>
          <strong>Cyber Warding:</strong> Applying ethical hacking and reconnaissance techniques to
          harden infrastructure and protect the sanctum against the dark arts.
        </li>
        <li>
          <strong>Frontend Incantations:</strong> Crafting practical Vue interfaces that make
          complex backend systems usable by actual humans.
        </li>
        <li>
          <strong>Terminal Sorcery:</strong> Navigating the ether efficiently via Neovim, tmux, and
          decoupled git worktrees.
        </li>
      </ul>

      <h2>Guild Leadership & Mentorship</h2>
      <p>
        While I still enjoy delving deep into the code-mines, my journey has evolved into guiding
        parties of developers. I prioritize technical mentorship and architectural strategy,
        crafting onboarding grimoires to pass knowledge to apprentice developers and ensuring our
        collective codebase remains resilient and free of curses.
      </p>

      <h2>Alignment: Chaotic Helpful</h2>
      <p>
        I’m realistic enough to know every system has skeletons in the repo, sarcastic enough to
        name them properly, and helpful enough to document the exorcism afterward. Like Gandalf,
        but with fewer fireworks and more <code>git rebase</code>.
      </p>

      <h2>A Lore-Rich Past</h2>
      <p>
        Through countless quests across enterprise realms, I’ve woven secure integrations with the
        arcane vaults of banking platforms, stabilized Kubernetes nodes within enchanted cloud
        forests, and maintained the dusty tomes of legacy .NET systems.
      </p>
      <p>
        Whether deciphering the cryptic glyphs of undocumented APIs or exorcising haunted
        containers, I do not merely survive the chaos — I catalog its runes. When I solve a problem,
        I leave behind more than code: I leave documentation, templates, and scripts so the next
        poor soul has a map through the dungeon.
      </p>

      <h2>The Path Forward</h2>
      <p>
        I build meaningful tools, fight tech entropy, and make software systems less cursed than I
        found them — all while keeping the sarcasm compiler at full throttle.
      </p>

      <h2>Need a Spell Cast?</h2>
      <p>
        Looking for someone who can design backend systems, untangle integrations, automate
        deployments, or grumble productively about vendor lock-in? I may be your wizard.
      </p>

      <div class="contact-links">
        <a href="https://github.com/jabez007" target="_blank" rel="noopener noreferrer">🧙‍♂️ GitHub</a>
        <a href="https://linkedin.com/in/crafted-by-mccann" target="_blank" rel="noopener noreferrer">🦉 LinkedIn</a>
        <a href="https://discord.com/users/308182638425014273" target="_blank" rel="noopener noreferrer">🔮 Discord</a>
        <a href="https://www.npmjs.com/~jabez007" target="_blank" rel="noopener noreferrer">📦 npm</a>
        <a href="https://pypi.org/user/jabez007/" target="_blank" rel="noopener noreferrer">🐍 PyPI</a>
      </div>
      <br />
      <div class="back-home">
        <router-link to="/" class="home-button">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="nav-arrow"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Return to Sanctum
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const parallaxBg = ref<HTMLElement | null>(null);

const handleParallax = () => {
  const scrolled = window.scrollY;
  // const parallaxBg = this.$refs.parallaxBg;

  if (parallaxBg.value) {
    // Move background slower than scroll for parallax effect
    const speed = scrolled * 0.5;
    parallaxBg.value.style.transform = `translateY(${speed}px)`;
  }
};

onMounted(() => {
  // Add parallax scroll effect
  window.addEventListener("scroll", handleParallax, { passive: true });
});

onBeforeUnmount(() => {
  // Clean up event listener
  window.removeEventListener("scroll", handleParallax);
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap");

.about-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  max-width: 900px;
  margin: 4rem auto;
  background-color: #1a1a1a;
  color: #e0e0e0;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(100, 255, 218, 0.2);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.parallax-bg {
  position: absolute;
  top: -50%;
  left: 0;
  width: 100%;
  height: 150%;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(100, 255, 218, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(128, 203, 196, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(100, 255, 218, 0.05) 0%, transparent 50%),
    linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
  background-size:
    100% 100%,
    100% 100%,
    100% 100%,
    100% 100%;
  z-index: -1;
  will-change: transform;
}

/* Add some floating particles effect */
.parallax-bg::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(3px 3px at 19% 31%, rgba(100, 255, 218, 0.3), transparent),
    radial-gradient(3px 3px at 41% 71%, rgba(128, 203, 196, 0.2), transparent),
    radial-gradient(2px 2px at 61% 17%, rgba(100, 255, 218, 0.4), transparent),
    radial-gradient(2px 2px at 79% 83%, rgba(128, 203, 196, 0.3), transparent),
    radial-gradient(3px 3px at 11% 61%, rgba(100, 255, 218, 0.2), transparent);
  background-size:
    200px 200px,
    300px 300px,
    150px 150px,
    250px 250px,
    180px 180px;
  animation: float 19s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-23px);
  }
}

.content {
  position: relative;
  z-index: 10;
}

.avatar img {
  width: 128px;
  height: 128px;
  image-rendering: pixelated;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.content h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #64ffda;
  text-align: center;
}

.content blockquote {
  width: 75%;
  margin: 2rem auto 3rem;
  font-style: italic;
  color: #a0a0a0;
  border-left: 4px solid #64ffda;
  padding-left: 1rem;
}

.content h2 {
  font-size: 1.5rem;
  margin-top: 1.5rem;
  color: #80cbc4;
}

.content ul {
  margin-left: 2rem;
}

.content p,
.content li {
  font-family: "Cinzel", serif;
  font-size: 1rem;
  line-height: 1.6;
}

.content p {
  text-indent: 2rem;
}

.contact-links {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: space-evenly;
}

.contact-links a {
  background: #64ffda20;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #64ffda;
  text-decoration: none;
  transition: background 0.2s ease;
}

.contact-links a:hover {
  background: #64ffda40;
}

.back-home {
  margin-top: 1.5rem;
  display: flex;
  justify-content: end;
}

.home-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  margin-right: 4rem;
  background: #64ffda30;
  border-radius: 8px;
  color: #64ffda;
  text-decoration: none;
  transition: background 0.2s ease;
  line-height: 1;
}

.home-button:hover {
  background: #64ffda60;
}
</style>
