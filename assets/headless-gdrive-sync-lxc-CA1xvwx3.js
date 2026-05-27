const e="2026-05-02-headless-gdrive-sync-lxc",n="headless-gdrive-sync-lxc",o={title:"From rsync to rclone: Building a Safe, Headless Google Drive Backup Pipeline in an LXC",date:"2026-05-02",author:"jabez007",tags:["proxmox","lxc","backups","rclone","gdrive","automation","homelab"],excerpt:`Syncing a home directory to Google Drive sounds simple until you remember Google Drive isn't a filesystem. Learn how to build a safe, automated, headless backup pipeline using rclone inside a Proxmox LXC container.
`,featured:!1,draft:!1},t=7,s=`<h1>From rsync to rclone: Building a Safe, Headless Google Drive Backup Pipeline in an LXC</h1>
<p>There’s a very particular kind of problem that looks simple right up until you try to solve it: <em>“I just want to sync my home directory to Google Drive.”</em></p>
<p>If you’ve spent any time in the Linux world, your brain immediately reaches for <code>rsync</code>. It’s muscle memory at this point. And that instinct is <em>almost</em> correct—just not in the way you think.</p>
<h2>The Initial Assumption (and Why It’s Wrong)</h2>
<p>My first thought was exactly that: this is a sync problem, so I’ll use <code>rsync</code>.</p>
<p>The problem is that <strong>Google Drive is not a filesystem</strong>. It’s an API. There’s nothing for <code>rsync</code> to talk to directly unless you first mount it as a filesystem layer via something like <code>google-drive-ocamlfuse</code>. You <em>can</em> do that, but it adds complexity, overhead, and brittleness for no real benefit.</p>
<p>What you actually want is a tool that speaks cloud APIs natively.</p>
<h2>Enter rclone</h2>
<p>That tool is <strong>rclone</strong>.</p>
<p>Think of it as <code>rsync</code>, but designed from the ground up to understand cloud storage providers. It supports Google Drive out of the box, works perfectly in a headless environment, and has familiar semantics (<code>copy</code>, <code>sync</code>, <code>check</code>).</p>
<h2>Constraint: Headless LXC Container</h2>
<p>I wasn’t running this on a full Ubuntu desktop environment. This was happening inside an LXC container in Proxmox. Which immediately raises an annoying question: <em>How do you authenticate with Google without a web browser?</em></p>
<p>Turns out, this is a solved problem.</p>
<h2>Authentication Without a GUI</h2>
<p>When you run <code>rclone config</code> and tell it you’re setting up Google Drive in a headless environment, it gives you a URL.</p>
<p>The flow is surprisingly painless:</p>
<ol>
<li>Open that URL on your local machine’s browser.</li>
<li>Log into your Google account.</li>
<li>Paste the returned token back into the container’s terminal.</li>
</ol>
<p>No desktop required. No weird port forwarding hacks. Just copy and paste.</p>
<h2>The OAuth Rabbit Hole</h2>
<p>Of course, this is Google, so they decided you should suffer a little bit.</p>
<p>Creating the necessary API credentials in the <strong>Google Cloud Console</strong> involves navigating an OAuth consent screen, defining scopes (that you don’t actually need to define), dismissing “unverified app” warnings, setting up test users, and dealing with token expiration.</p>
<p><strong>Key takeaways to save you an hour:</strong></p>
<ul>
<li>You <strong>don’t need to manually define scopes</strong>; rclone requests what it needs.</li>
<li>You <strong>must add yourself as a test user</strong> in the OAuth consent screen.</li>
<li>You should <strong>publish the app</strong> to “Production” (this removes the annoying 7-day token expiration for testing mode).</li>
<li>You will see a giant warning saying <em>“This app isn’t verified.”</em> That’s fine. You wrote it for yourself. Proceed anyway.</li>
</ul>
<h2>First Sync: Choosing the Right Command</h2>
<p>At this point, you have options. The main two are:</p>
<ul>
<li><code>rclone sync</code> → Mirrors the source to the destination (and deletes files on the destination if they were deleted locally).</li>
<li><code>rclone copy</code> → Additive only. It copies new and changed files, but never deletes anything on the destination.</li>
</ul>
<p>I went with:</p>
<pre><code class="hljs language-bash">rclone copy ~/ gdrive:home
</code></pre>
<p>Why? Because accidental deletion is worse than duplication. Storage is cheap; losing your bash history or config files because of a typo is infuriating.</p>
<h2>The Hidden Problem: Bidirectional Sync</h2>
<p>It’s tempting to want the Holy Grail: <em>“Keep local and Google Drive in sync both ways.”</em></p>
<p>That’s where things get dangerous. Yes, <code>rclone bisync</code> exists, but it introduces conflict resolution complexity, the risk of silent overwrites, and state tracking files that can get corrupted.</p>
<p>Instead, I chose a simpler, more resilient model.</p>
<h2>The Final Architecture</h2>
<p>I settled on a <strong>one-way automated backup + manual controlled pull</strong>.</p>
<h3>Automated (cron):</h3>
<p>Pushes changes up to Google Drive automatically.</p>
<pre><code class="hljs language-bash">rclone copy /home/molty gdrive:home
</code></pre>
<h3>Manual (on demand):</h3>
<p>Pulls changes down only when I explicitly ask for them.</p>
<pre><code class="hljs language-bash">rclone copy gdrive:home /home/molty --update
</code></pre>
<p>This architecture gives you safe backups, controlled restores, and zero surprise deletions.</p>
<h2>Excluding the Junk (Critical Step)</h2>
<p>A home directory is full of garbage you do <em>not</em> want to back up.</p>
<p>My final exclude list (<code>~/.config/rclone/excludes.txt</code>) looked like this:</p>
<pre><code class="hljs language-text"># Security: Exclude private keys and credentials
.ssh/**
.gnupg/**
.config/rclone/**

# Junk: Exclude rebuildable cache and dependencies
**/.cache/**
.npm/_cacache/**
.npm/_npx/**
.npm-global/**
**/node_modules/**
.local/share/Trash/**
*.log
</code></pre>
<p>It is critical to exclude directories like <code>.ssh</code>, <code>.gnupg</code>, and your rclone config files; these contain private keys and credentials that should never be uploaded to cloud storage without robust, client-side encryption.</p>
<p>Used via:</p>
<pre><code class="hljs language-bash">rclone copy ~/ gdrive:home --exclude-from ~/.config/rclone/excludes.txt
</code></pre>
<p>Without this, you’ll end up uploading hundreds of thousands of files and gigabytes of easily rebuildable dependencies. Ask me how I know.</p>
<h2>Verification: Don’t Trust, Verify</h2>
<p>After the first massive sync finished, I needed to know it actually worked.</p>
<pre><code class="hljs language-bash">rclone check ~/ gdrive:home --exclude-from ~/.config/rclone/excludes.txt
</code></pre>
<p><strong>Important detail:</strong> Your <code>check</code> command <em>must</em> use the exact same exclude rules. Otherwise, rclone will report massive mismatches because it sees all your local <code>node_modules</code> that aren’t on the remote.</p>
<h2>Automation in an LXC Container</h2>
<p>Yes, <code>cron</code> works perfectly fine in an LXC container. Just make sure:</p>
<ul>
<li>The <code>cron</code> service is actually running (<code>systemctl status cron</code>).</li>
<li>You use the <strong>user crontab</strong> (<code>crontab -e</code>), not the root one.</li>
<li>You reference the full, absolute paths to everything.</li>
</ul>
<p>Here’s the crontab entry:</p>
<pre><code class="hljs language-bash">0 * * * * flock -n /tmp/rclone.lock /usr/bin/rclone copy /home/molty gdrive:home --exclude-from /home/molty/.config/rclone/excludes.txt --log-file /home/molty/rclone.log --log-level INFO
</code></pre>
<h3>Why <code>flock</code>?</h3>
<p>It prevents overlapping runs. If a sync takes 65 minutes (maybe you downloaded a huge file), the next hourly cron job will silently fail instead of starting a second concurrent upload that thrashes your disk and network.</p>
<h2>Pulling Changes Safely (Human-in-the-Loop)</h2>
<p>This was the key design decision. Instead of automating everything and hoping for the best, I built a controlled “pull” process for when I need to restore something.</p>
<p><strong>Step 1: Preview</strong></p>
<pre><code class="hljs language-bash">rclone copy gdrive:home /home/molty --update --dry-run
</code></pre>
<p><strong>Step 2: Review the output</strong> to ensure it’s not going to overwrite anything important.</p>
<p><strong>Step 3: Execute (only if safe)</strong></p>
<pre><code class="hljs language-bash">rclone copy gdrive:home /home/molty --update
</code></pre>
<p>This completely avoids overwriting newer local files, unexpected merge conflicts, and those terrible “well, that was a mistake” moments.</p>
<h2>Integrating with OpenClaw</h2>
<p>Rather than letting an AI agent blindly run sync commands, I defined a skill in OpenClaw with strict rules for this pipeline:</p>
<ul>
<li>Always run <code>--dry-run</code> first.</li>
<li>Summarize the proposed changes.</li>
<li>Require my explicit confirmation.</li>
<li>Never use <code>rclone sync</code> (only <code>copy</code>).</li>
<li>Always respect the exclude rules.</li>
</ul>
<p>This turns the operation into a controlled workflow, not a blind command execution.</p>
<h2>Lessons Learned</h2>
<ol>
<li><strong><code>rsync</code> isn’t obsolete—it’s just not for cloud APIs.</strong> You still need the right tool for the job.</li>
<li><strong>Bidirectional sync is a trap.</strong> Unless you have a massive engineering team building conflict resolution algorithms, simple one-way syncs fail far less often.</li>
<li><strong>Exclusions matter more than anything else.</strong> They determine the scale, performance, and ultimate sanity of your backup.</li>
<li><strong>Always preview destructive or state-changing operations.</strong> <code>--dry-run</code> is not an optional feature; it’s a critical safety system.</li>
<li><strong>Automation without guardrails is just delayed failure.</strong> Especially when AI agents are involved.</li>
</ol>
<h2>Final Thoughts</h2>
<p>What started as <em>“I just want to sync my home directory”</em> ended up as a headless OAuth flow, a cloud-native backup strategy, a safe automation pipeline, and a human-in-the-loop restore mechanism.</p>
<p>Which, in hindsight, is exactly the level of robustness you want for something as important as your home directory.</p>
<p>What’s next? Maybe versioned backups for point-in-time recovery, or encryption before upload. But honestly, even without those, this setup is already reliable, predictable, and safe—which is more than most homelab backup systems can claim.</p>
`,i={id:e,slug:n,frontmatter:o,readingTime:t,content:s};export{s as content,i as default,o as frontmatter,e as id,t as readingTime,n as slug};
