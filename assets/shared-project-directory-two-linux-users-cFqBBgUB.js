const e="2026-07-18-shared-project-directory-two-linux-users",s="shared-project-directory-two-linux-users",o={title:"One Project, Two Linux Users: setgid, Default ACLs, and `/srv`",date:"2026-07-18",author:"jabez007",tags:["linux","permissions","acl","git","homelab","ubuntu","troubleshooting"],excerpt:"I needed two accounts on my laptop, jabez and molty, to share full read/write access to the same project checkout.\nThe answer was a shared group, a setgid directory, and default ACLs under /srv. Along the way I learned what the\n`s` and `+` in `drwxrws---+` mean, and why `sudo -u` still cares about the directory you're standing in.\n",featured:!1,draft:!1},t=9,n=`<h1>One Project, Two Linux Users: setgid, Default ACLs, and <code>/srv</code></h1>
<p><em>Or: What the <code>s</code> and the <code>+</code> in <code>drwxrws---+</code> actually mean</em></p>
<p>My laptop has two user accounts now: <code>jabez</code>, which is me, and <code>molty</code>, which my Hermes Agent profiles use. Hermes runs in a small, streamlined LXC on my Proxmox host. For heavier development, I let its profiles use the laptop and help with projects I’m working on. <code>molty</code> is a regular user, deliberately outside sudoers.</p>
<p>For my Minecraft bot project, <code>chunk-tether</code>, I wanted both accounts to work from and run the same checkout. One working tree, with both users able to read and write the files and run the code. That meant giving <code>molty</code> access to the project without giving it root.</p>
<p>The project lived at <code>/home/jabez/source/repos/chunk-tether</code>. The simple question was whether to leave it there and loosen permissions, or move it somewhere both users could reach.</p>
<h2>Why you can’t just <code>chmod</code> your way out of your home directory</h2>
<p>The project directory itself was already <code>775</code>. Group-writable, world-readable. That doesn’t matter when the parents block you:</p>
<pre><code class="hljs language-bash">namei -l /home/jabez/source/repos/chunk-tether
</code></pre>
<p><code>/home/jabez</code> is <code>750</code>. <code>molty</code> isn’t in my group, so it can’t even traverse into my home directory, and the permissions on anything below it are irrelevant.</p>
<p>I could have opened up my home directory. I didn’t want to. Moving the project out to a neutral, shared location was cleaner.</p>
<h2>The plan: a group, a directory, and inheritance</h2>
<p>The first suggestion was a group named <code>chunk-tether</code>. I plan to share other projects the same way later, so I went with something generic:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> groupadd -f project-devs
<span class="hljs-built_in">sudo</span> usermod -aG project-devs jabez
<span class="hljs-built_in">sudo</span> usermod -aG project-devs molty

<span class="hljs-built_in">sudo</span> <span class="hljs-built_in">mkdir</span> -p /srv/projects
<span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chown</span> root:project-devs /srv/projects
<span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chmod</span> 2770 /srv/projects
<span class="hljs-built_in">sudo</span> setfacl -m d:u::rwx,d:g::rwx,d:m::rwx,d:o::--- /srv/projects
</code></pre>
<p>There are two separate inheritance mechanisms in there.</p>
<p><strong>The setgid bit</strong>, the <code>2</code> in <code>2770</code>. On a directory, it means new files and subdirectories inherit the directory’s <em>group</em> instead of the creating user’s primary group. Without it, a file <code>molty</code> creates would belong to group <code>molty</code>, and <code>jabez</code> might not be able to touch it.</p>
<p><strong>The default ACL</strong>, the <code>d:</code> entries. Setgid fixes the group, but not the permissions. If one user has a restrictive <code>umask</code>, their new files might come out <code>644</code>, which isn’t group-writable. A default ACL on a directory sets the permissions new entries start with, and it overrides the <code>umask</code>, so the group keeps write access no matter who created the file. It can’t add bits the creating program didn’t ask for, though. A regular file created with mode <code>0666</code> comes out group <code>rw-</code>, while a new directory gets the full <code>rwx</code>.</p>
<p>You need both. Setgid gives the group ownership of new files, and the default ACL makes sure that group can write to them.</p>
<h2>Reading <code>drwxrws---+</code></h2>
<p>After my first attempt, <code>ls</code> showed this, and I had no idea what two of the characters meant:</p>
<pre><code class="hljs language-text">d rwx rw s --- +
│ │   │    │   └─ an extended ACL exists (see getfacl)
│ │   │    └───── others: no access
│ │   └────────── group: rwx, and the setgid bit is set
│ └────────────── owner: rwx
└──────────────── directory
</code></pre>
<p>A lowercase <code>s</code> in the group execute slot means setgid plus execute. A capital <code>S</code> would mean setgid <em>without</em> execute, which on a directory is almost never what you want.</p>
<p>The <code>+</code> means “there’s more than the classic permission bits here”. <code>getfacl</code> shows the rest:</p>
<pre><code class="hljs language-text">$ getfacl -p /srv/projects
# file: /srv/projects
# owner: root
# group: project-devs
# flags: -s-
user::rwx
group::rwx
other::---
default:user::rwx
default:group::rwx
default:mask::rwx
default:other::---
</code></pre>
<h2>My detour through <code>/srv</code> itself</h2>
<p>I’ll admit I applied all of this to <code>/srv</code> on purpose the first time, not <code>/srv/projects</code>. I figured <code>/srv</code> was just an empty directory nobody used.</p>
<p>It isn’t nobody’s. <code>/srv</code> is part of the <a href="https://refspecs.linuxfoundation.org/FHS_3.0/fhs/ch03s17.html">Filesystem Hierarchy Standard</a>, meant for site-specific data the machine serves: web roots, Git repos, FTP. Ubuntu leaves it empty, but a future service could reasonably expect to traverse it, and with <code>other::---</code> nothing outside <code>project-devs</code> could.</p>
<p>So I put <code>/srv</code> back to normal and scoped everything to <code>/srv/projects</code>:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> setfacl -k /srv          <span class="hljs-comment"># remove the default ACL</span>
<span class="hljs-built_in">sudo</span> setfacl -b /srv          <span class="hljs-comment"># remove all extended ACL entries</span>
<span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chown</span> root:root /srv
<span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chmod</span> 0755 /srv
</code></pre>
<p>That left one thing behind. <code>ls</code> showed <code>/srv</code> as <code>drwxr-sr-x</code>. The setgid bit survived the <code>chmod 0755</code>. On a directory, GNU <code>chmod</code> keeps setgid when you give it a normal octal mode. You have to clear it explicitly, either with a symbolic mode or with an extra leading zero:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chmod</span> g-s /srv      <span class="hljs-comment"># or: sudo chmod 00755 /srv</span>
</code></pre>
<p>The other lesson from the detour: <strong>default ACLs aren’t retroactive.</strong> <code>/srv/projects</code> had been created before I set the default ACL on <code>/srv</code>, so it never got one. Anything that already exists keeps its permissions. Set the ACL on the directory you mean to share.</p>
<p>Final layout:</p>
<pre><code class="hljs language-text">drwxr-xr-x   root root          /srv
drwxrws---+  root project-devs  /srv/projects
</code></pre>
<p>That <code>---</code> at the end of <code>/srv/projects</code> is doing more work than it looks like. The checkout I moved in still had <code>other::r-x</code> on its own files. That’s fine, because nobody outside <code>project-devs</code> can traverse <code>/srv/projects</code> to reach them. It’s the same rule that kept <code>molty</code> out of my home directory, now working in my favor. The parent decides who gets in.</p>
<h2>Test it like you don’t trust it</h2>
<p>There’s one catch before testing: <strong>new group membership only applies to new login sessions.</strong> <code>usermod -aG</code> updates <code>/etc/group</code>, but any shell that was already running keeps its old group list. Check with <code>id</code>. If <code>project-devs</code> isn’t listed, log out and back in, or start a subshell with <code>newgrp project-devs</code>. A long-lived <code>tmux</code> server has the same problem: its panes inherit whatever groups the server had when it started.</p>
<p>Before moving any real code in, I ran an end-to-end check with both users:</p>
<pre><code class="hljs language-bash"><span class="hljs-keyword">if</span> <span class="hljs-built_in">sudo</span> -u jabez <span class="hljs-built_in">mkdir</span> /srv/projects/permission-test; <span class="hljs-keyword">then</span>
  <span class="hljs-built_in">sudo</span> -u jabez <span class="hljs-built_in">touch</span> /srv/projects/permission-test/from-jabez
  <span class="hljs-built_in">sudo</span> -u molty <span class="hljs-built_in">touch</span> /srv/projects/permission-test/from-molty
  <span class="hljs-built_in">sudo</span> -u molty sh -c <span class="hljs-string">&#x27;echo molty-wrote-here &gt;&gt; /srv/projects/permission-test/from-jabez&#x27;</span>

  <span class="hljs-built_in">stat</span> -c <span class="hljs-string">&#x27;%A %U:%G %n&#x27;</span> /srv/projects/permission-test{,/*}
  <span class="hljs-built_in">sudo</span> <span class="hljs-built_in">rm</span> -rf /srv/projects/permission-test
<span class="hljs-keyword">fi</span>
</code></pre>
<p>The <code>if</code> matters. Plain <code>mkdir</code> fails when the directory already exists, and without the guard, the <code>rm -rf</code> at the end would delete whatever was already there. This way the cleanup only removes a directory this test created.</p>
<p>Everything should belong to group <code>project-devs</code>. The directory should show <code>s</code>, both files should be group-writable, and <code>molty</code> should be able to append to the file <code>jabez</code> created.</p>
<h2>Moving the project (no sudo required)</h2>
<p>I had Codex helping with this, and its first plan for the move put <code>sudo</code> in front of everything. That made me stop and ask why. <code>sudo</code> for a <code>chown</code> makes sense. But if my shell has <code>project-devs</code> membership and I own every file in the checkout, the permissions we’d just set up should allow the move without root. A quick check confirmed every file in the checkout belonged to <code>jabez</code>, so nothing needed root.</p>
<p>That’s the point of setting this up properly. You shouldn’t need <code>sudo</code> for day-to-day work in a shared directory.</p>
<p>Once <code>id</code> showed the group:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">mv</span> /home/jabez/source/repos/chunk-tether /srv/projects/
<span class="hljs-built_in">chgrp</span> -R project-devs /srv/projects/chunk-tether
<span class="hljs-built_in">chmod</span> -R g+rwX /srv/projects/chunk-tether
find /srv/projects/chunk-tether -<span class="hljs-built_in">type</span> d -<span class="hljs-built_in">exec</span> <span class="hljs-built_in">chmod</span> g+s {} +
find /srv/projects/chunk-tether -<span class="hljs-built_in">type</span> d \\
  -<span class="hljs-built_in">exec</span> setfacl -m d:u::rwx,d:g::rwx,d:m::rwx,d:o::--- {} +

git -C /srv/projects/chunk-tether config core.sharedRepository group
</code></pre>
<p>One more wrinkle here, and it’s a sandbox one. Codex runs commands inside a sandbox, and that sandbox wasn’t allowed to write to <code>/srv</code>. So the first attempt at the move failed partway. It left the original checkout untouched and created nothing at the destination, which is the good outcome. But a half-finished <code>mv</code> is exactly when you should look at both paths before trying again. You don’t want to end up with two checkouts, or one nested inside the other. The retry, with real filesystem access, went through fine.</p>
<p>The capital <code>X</code> in <code>g+rwX</code> is worth knowing. It adds execute only to directories, plus files that are already executable for someone, so you don’t mark every source file executable.</p>
<p><code>core.sharedRepository group</code> tells Git to keep its own object files group-writable. Otherwise one user’s <code>git commit</code> can create objects the other user can’t update.</p>
<h2>Git’s <code>safe.directory</code>, and the <code>sudo -u</code> trap</h2>
<p>Git refuses to operate in a repository owned by a different user unless you’ve marked it safe. Since the files belong to <code>jabez</code>, <code>molty</code> has to opt in:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> -u molty -H git config --global --add safe.directory /srv/projects/chunk-tether
</code></pre>
<p><code>-H</code> sets <code>$HOME</code> to molty’s home, so the setting lands in molty’s <code>~/.gitconfig</code> and not mine. I ran it and got:</p>
<pre><code class="hljs language-text">fatal: failed to stat &#x27;/home/jabez/source/repos&#x27;: Permission denied
</code></pre>
<p><code>sudo -u</code> changes the user and, with <code>-H</code>, the home directory. It does <strong>not</strong> change the working directory. I was standing in <code>/home/jabez/source/repos</code>, which <code>molty</code> can’t traverse, and Git’s first move is to stat the current directory.</p>
<p>Run it from somewhere both users can reach:</p>
<pre><code class="hljs language-bash">(
  <span class="hljs-built_in">cd</span> /
  <span class="hljs-built_in">sudo</span> -u molty -H git config --global --add safe.directory /srv/projects/chunk-tether
  <span class="hljs-built_in">sudo</span> -u molty -H git -C /srv/projects/chunk-tether status
)
</code></pre>
<p>The parentheses run it in a subshell, so your own shell stays where it was.</p>
<h2>The caveat I accepted on purpose</h2>
<p>Sharing one working tree means sharing everything in it: the Git index, uncommitted changes, <code>node_modules</code>, build output, lock files. If both users edit at the same time, they’ll trip over each other.</p>
<p>For most setups, two separate clones are safer. In my case the shared runtime checkout is the whole point, so I took the trade knowingly. If you copy this setup, decide that deliberately.</p>
<h2>Final thoughts</h2>
<p>The commands themselves are short. Understanding them took longer:</p>
<ul>
<li><strong>Traversal beats permissions.</strong> A <code>775</code> directory under a <code>750</code> parent is still unreachable. That cuts both ways, and a locked parent can protect a loose child.</li>
<li><strong>Setgid gives new files the group. A default ACL gives them group-write.</strong> You need both.</li>
<li><strong>Default ACLs aren’t retroactive.</strong> Apply them to the directory you actually want to share.</li>
<li><strong>New groups need a new session.</strong> <code>id</code> tells you what your current shell can do.</li>
<li><strong><code>sudo -u</code> keeps your working directory.</strong> If the target user can’t stand where you’re standing, <code>cd /</code> first.</li>
<li><strong>Ask why <code>sudo</code> is there.</strong> If the permissions are right, everyday work shouldn’t need it.</li>
</ul>
<p>Now both accounts can work in the same project. I’m sure that won’t cause any problems at all.</p>
`,r={id:e,slug:s,frontmatter:o,readingTime:t,content:n};export{n as content,r as default,o as frontmatter,e as id,t as readingTime,s as slug};
