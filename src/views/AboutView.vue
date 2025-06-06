<template>
  <section class="about-container">
    <div class="content">
      <h1>The Arcane Origins of Jabez007</h1>
      <blockquote>
        "All we have to decide is what to do with the code that is given us."
        <br />
        <span style="float: right">– a totally real Gandalf quote (probably)</span>
      </blockquote>
      <p>
        In the far reaches of cyberspace, where forgotten APIs whisper through deprecated endpoints
        and servers flicker like dying stars, one software sorcerer emerged — cloaked in sarcasm,
        armed with enchanted source scrolls, and sustained by black-code rituals brewed beside the
        terminal's glow.
      </p>
      <br />
      <p>
        I’m <strong>Jimmy</strong>, but across the code-realms I’m known as
        <strong>jabez007</strong> — conjurer of cloud logic, summoner of RESTful spirits, and
        wielder of tools both ancient (<code>.NET</code>) and modern (<code>Go</code>,
        <code>Node.js</code>, <code>Python</code>).
      </p>

      <h2>Domains of Mastery</h2>
      <ul>
        <li>
          <strong>Backend Alchemy:</strong> Architecting resilient services in Node.js, Go, C#, and
          Python.
        </li>
        <li>
          <strong>Frontend Incantations:</strong> Vue.js spells for rendering arcane interfaces.
        </li>
        <li>
          <strong>DevOps Rituals:</strong> Docker, CI/CD, and scripting to bind the tech realm
          together.
        </li>
      </ul>

      <h2>Alignment: Chaotic Helpful</h2>
      <p>
        Cursed with realism and sarcasm, yet ever ready to help in moments of darkness — like
        Gandalf with fewer fireworks and more <code>git rebase</code>.
      </p>

      <h2>A Lore-Rich Past</h2>
      <p>
        Through countless quests across enterprise realms, I’ve woven secure integrations with the
        arcane vaults of banking platforms, summoned infrastructure from the ether using
        incantations of Terraform, and stabilized Kubernetes nodes within enchanted cloud forests.
        I’ve etched CI/CD runes in GitHub Actions, maintained the dusty tomes of legacy .NET
        systems, and crafted onboarding grimoires to pass knowledge to apprentice developers.
        Whether deciphering the cryptic glyphs of undocumented APIs or exorcising haunted
        containers, I do not merely survive the chaos — I catalog its runes and publish the scrolls.
      </p>

      <h2>The Path Forward</h2>
      <p>
        I build meaningful tools, fight tech entropy, and push pixels with purpose — all while
        keeping my sarcasm compiler at full throttle.
      </p>

      <h2>Need a Spell Cast?</h2>
      <p>
        Whether you're looking for a backend conjurer, a full-stack glyphwright, or someone to
        grumble with about vendor lock-in — I’m your wizard.
      </p>

      <div class="contact-links">
        <a href="https://github.com/jabez007" target="_blank">🧙‍♂️ GitHub</a>
        <a href="https://linkedin.com/in/crafted-by-mccann" target="_blank">🦉 LinkedIn</a>
        <a href="https://discord.com/users/308182638425014273" target="_blank">🔮 Discord</a>
        <a href="https://www.npmjs.com/~jabez007" target="_blank">📦 npm</a>
        <a href="https://pypi.org/user/jabez007/" target="_blank">🐍 PyPI</a>
      </div>
      <br />
      <div class="back-home">
        <router-link to="/" class="home-button">🏠 Return to Sanctum</router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap");

.about-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  background-color: #1a1a1a;
  color: #e0e0e0;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(100, 255, 218, 0.2);
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
  display: inline-block;
  padding: 0.5rem 1.25rem;
  margin-right: 4rem;
  background: #64ffda30;
  border-radius: 8px;
  color: #64ffda;
  text-decoration: none;
  transition: background 0.2s ease;
}

.home-button:hover {
  background: #64ffda60;
}
</style>
