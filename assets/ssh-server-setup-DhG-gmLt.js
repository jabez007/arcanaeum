const s="2024-11-10-ssh-server-setup",n="ssh-server-setup",a={title:"SSH Server Setup",date:"2024-11-10",author:"jabez007",tags:["homelab","ssh","ufw","linux","server-setup","security","home-network","firewall","ssh-hardening","tutorial","beginner-friendly"],excerpt:`Don't throw away that old laptop just yet. It might not be your daily driver anymore,
but it's a perfect candidate for a secure, SSH-accessible Linux box for your homelab.
`,featured:!0,draft:!1},e=8,t=`<h1>Repurposing an Old Laptop as an SSH Server</h1>
<p>🖥️ <em>That dusty ThinkPad in your closet? It’s about to become your new favorite server.</em></p>
<p>I have a hard time throwing away old hardware. That laptop gathering dust might not be your daily driver anymore, but it’s perfect for a homelab—especially if you just need an SSH-accessible Linux box to poke around in.</p>
<p>In this guide, I’ll show you how to set up and harden an SSH server on old hardware. I’ve also included a script at the end if you just want to get it done.</p>
<p><strong>What you’ll need:</strong></p>
<ul>
<li>An old laptop (anything from the last decade should work)
<ul>
<li>For context, I’ve run this on an old Gateway with 4 GB of RAM</li>
</ul>
</li>
<li>A fresh Linux installation (Ubuntu, Debian, or similar)</li>
<li>About 20 minutes</li>
</ul>
<hr>
<h2>🚀 Step 1: Install OpenSSH Server</h2>
<p>First, you need the SSH server software. Most Linux distros come with the client (to connect <em>from</em>), but you often have to install the server (to connect <em>to</em>) yourself.</p>
<p>On Debian-based distros:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> apt update
<span class="hljs-built_in">sudo</span> apt install openssh-server
</code></pre>
<p>Check the service status:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl status ssh
</code></pre>
<p>If the status shows “active (running),” you’re ready to go. Your laptop is now listening for connections on port 22, which we’ll want to change soon for better security.</p>
<hr>
<h2>🔒 Step 2: Harden Your SSH Configuration</h2>
<p>Default SSH settings are okay, but they’re not great for security. Changing a few lines in the config file makes your server a lot harder to poke at.</p>
<p><strong>Why change the default port?</strong>
Security through obscurity isn’t a silver bullet, but it stops a lot of the background noise from bots. Most bots just scan port 22; moving to something like 2222 keeps your logs a lot cleaner.</p>
<p>Edit the config file:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> nano /etc/ssh/sshd_config
</code></pre>
<p>Change these lines:</p>
<pre><code class="hljs language-toml">Port 2222                    <span class="hljs-comment"># Custom port (use any port 1024-65535)</span>
PermitRootLogin no           <span class="hljs-comment"># Don&#x27;t let root login directly</span>
MaxAuthTries 3               <span class="hljs-comment"># Limit brute-force attempts</span>
PasswordAuthentication yes   <span class="hljs-comment"># Keeping this simple for now</span>
LoginGraceTime 30s           <span class="hljs-comment"># Kill dead connections fast</span>
ClientAliveInterval 300      <span class="hljs-comment"># Heartbeat to keep you connected</span>
ClientAliveCountMax 2        <span class="hljs-comment"># Kill it if the heartbeat fails twice</span>
</code></pre>
<blockquote>
<p><strong>A note on passwords:</strong> If you’re planning to access this from outside your local network, switch <code>PasswordAuthentication</code> to <code>no</code> and use SSH keys. It’s much safer.</p>
</blockquote>
<p>Restart SSH to apply:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl restart ssh
</code></pre>
<p>Test it from another machine:</p>
<pre><code class="hljs language-bash">ssh yourusername@192.168.1.100 -p 2222
</code></pre>
<p>Replace the IP with your server’s actual address. If it asks for your password, you’re set.</p>
<hr>
<h2>🛡️ Step 3: Install UFW</h2>
<p>A firewall is a basic layer of defense. Even inside your network, it’s worth setting up. UFW (Uncomplicated Firewall) is just a simpler wrapper for <code>iptables</code>.</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> apt install ufw
</code></pre>
<hr>
<h2>🔧 Step 4: Configure the Firewall</h2>
<p>Before turning it on, make sure you don’t lock yourself out. We’ll set some sensible defaults first.</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ufw default deny incoming
<span class="hljs-built_in">sudo</span> ufw default allow outgoing
</code></pre>
<p>This blocks everything coming in but lets the server reach out for updates.</p>
<p>Now, tell the firewall to allow SSH on your custom port:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ufw allow 2222/tcp
</code></pre>
<p>Enable it:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ufw <span class="hljs-built_in">enable</span>
</code></pre>
<p>Check the status:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ufw status verbose
</code></pre>
<p>You should see:</p>
<pre><code>Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
2222/tcp                   ALLOW IN    Anywhere
2222/tcp (v6)              ALLOW IN    Anywhere (v6)
</code></pre>
<p>The server is now blocked to everything except your SSH port.</p>
<hr>
<h2>📈 Extra Tweaks</h2>
<h3>Set a Static IP or DHCP Reservation</h3>
<p>Nothing’s more frustrating than trying to connect to a server that just changed its IP. You should either set a static IP on the server itself or (my preference) set up a DHCP reservation in your router’s settings. This saves you from hunting for the IP every time you reboot.</p>
<h3>Set a Hostname</h3>
<p>By default, the machine might have a generic name. You can change it to something recognizable:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> hostnamectl set-hostname lab-server-01
</code></pre>
<p>To make it permanent, update <code>/etc/hosts</code>:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;127.0.1.1 lab-server-01&quot;</span> | <span class="hljs-built_in">sudo</span> <span class="hljs-built_in">tee</span> -a /etc/hosts
</code></pre>
<p>Refresh your shell:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">exec</span> bash
</code></pre>
<h3>Use SSH Keys</h3>
<p>If you’re tired of typing passwords, SSH keys are faster and more secure. Generate a key pair on your local machine, copy the public key to your server, and then you can disable password auth entirely in <code>sshd_config</code>.</p>
<hr>
<h2>🎯 What’s Next?</h2>
<p>Once the SSH server is running, you’ve got a solid base for other projects. This old laptop is now ready to host:</p>
<ul>
<li>A dedicated testing environment for code.</li>
<li>A basic file server or Nextcloud instance.</li>
<li>A monitoring node using Prometheus.</li>
<li>A jump box if you want to access your network from outside.</li>
</ul>
<p>The best part of using an old laptop is that you can experiment without worrying about breaking your main computer. If you mess up the configuration, you can just wipe it and start over.</p>
<hr>
<h2>🤖 Automate with a Script</h2>
<p>If you’re setting up a few of these or just want to save time, here’s a script I use to handle the setup and hardening in one go.</p>
<h3><code>setup-ssh-server.sh</code></h3>
<pre><code class="hljs language-bash"><span class="hljs-meta">#!/bin/bash</span>

<span class="hljs-built_in">set</span> -e

<span class="hljs-comment"># Color codes for pretty output</span>
RED=<span class="hljs-string">&#x27;\\033[0;31m&#x27;</span>
GREEN=<span class="hljs-string">&#x27;\\033[0;32m&#x27;</span>
BLUE=<span class="hljs-string">&#x27;\\033[0;34m&#x27;</span>
YELLOW=<span class="hljs-string">&#x27;\\033[1;33m&#x27;</span>
NC=<span class="hljs-string">&#x27;\\033[0m&#x27;</span> <span class="hljs-comment"># No Color</span>

<span class="hljs-comment"># Default values</span>
SSH_PORT=2222
HOSTNAME=<span class="hljs-string">&quot;lab-server&quot;</span>

<span class="hljs-comment"># Parse command line arguments</span>
<span class="hljs-keyword">while</span> [[ <span class="hljs-variable">$#</span> -gt 0 ]]; <span class="hljs-keyword">do</span>
  <span class="hljs-keyword">case</span> <span class="hljs-string">&quot;<span class="hljs-variable">$1</span>&quot;</span> <span class="hljs-keyword">in</span>
    --port)
      SSH_PORT=<span class="hljs-string">&quot;<span class="hljs-variable">$2</span>&quot;</span>
      <span class="hljs-built_in">shift</span> 2
      ;;
    --hostname)
      HOSTNAME=<span class="hljs-string">&quot;<span class="hljs-variable">$2</span>&quot;</span>
      <span class="hljs-built_in">shift</span> 2
      ;;
    -h|--<span class="hljs-built_in">help</span>)
      <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Usage: <span class="hljs-variable">$0</span> [--port PORT] [--hostname HOSTNAME]&quot;</span>
      <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;&quot;</span>
      <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Options:&quot;</span>
      <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;  --port     Set custom SSH port (default: 2222)&quot;</span>
      <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;  --hostname Set server hostname (default: lab-server)&quot;</span>
      <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;  -h, --help Show this help message&quot;</span>
      <span class="hljs-built_in">exit</span> 0
      ;;
    *)
      <span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${RED}</span>Unknown option: $1<span class="hljs-variable">\${NC}</span>&quot;</span>
      <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Use -h or --help for usage information&quot;</span>
      <span class="hljs-built_in">exit</span> 1
      ;;
  <span class="hljs-keyword">esac</span>
<span class="hljs-keyword">done</span>

<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${BLUE}</span>🛠  SSH Server Setup Script<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${YELLOW}</span>📡 Using SSH port: $SSH_PORT<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${YELLOW}</span>🖥  Setting hostname to: $HOSTNAME<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;&quot;</span>

<span class="hljs-comment"># Install required packages</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${BLUE}</span>📦 Installing required packages...<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">sudo</span> apt update -qq
<span class="hljs-built_in">sudo</span> apt install -y openssh-server ufw

<span class="hljs-comment"># Backup original SSH config</span>
<span class="hljs-built_in">sudo</span> <span class="hljs-built_in">cp</span> /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

<span class="hljs-comment"># SSH configuration hardening</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${BLUE}</span>🔒 Hardening SSH configuration...<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&quot;s/^#\\?Port .*/Port <span class="hljs-variable">$SSH_PORT</span>/&quot;</span> /etc/ssh/sshd_config
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&quot;s/^#\\?PermitRootLogin .*/PermitRootLogin no/&quot;</span> /etc/ssh/sshd_config
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&quot;s/^#\\?MaxAuthTries .*/MaxAuthTries 3/&quot;</span> /etc/ssh/sshd_config

<span class="hljs-comment"># Add additional hardening options if they don&#x27;t exist</span>
grep -qxF <span class="hljs-string">&#x27;LoginGraceTime 30s&#x27;</span> /etc/ssh/sshd_config || <span class="hljs-built_in">echo</span> <span class="hljs-string">&#x27;LoginGraceTime 30s&#x27;</span> | <span class="hljs-built_in">sudo</span> <span class="hljs-built_in">tee</span> -a /etc/ssh/sshd_config &gt; /dev/null
grep -qxF <span class="hljs-string">&#x27;ClientAliveInterval 300&#x27;</span> /etc/ssh/sshd_config || <span class="hljs-built_in">echo</span> <span class="hljs-string">&#x27;ClientAliveInterval 300&#x27;</span> | <span class="hljs-built_in">sudo</span> <span class="hljs-built_in">tee</span> -a /etc/ssh/sshd_config &gt; /dev/null
grep -qxF <span class="hljs-string">&#x27;ClientAliveCountMax 2&#x27;</span> /etc/ssh/sshd_config || <span class="hljs-built_in">echo</span> <span class="hljs-string">&#x27;ClientAliveCountMax 2&#x27;</span> | <span class="hljs-built_in">sudo</span> <span class="hljs-built_in">tee</span> -a /etc/ssh/sshd_config &gt; /dev/null

<span class="hljs-comment"># Restart SSH service</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${BLUE}</span>🔄 Restarting SSH service...<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">sudo</span> systemctl restart ssh

<span class="hljs-comment"># Configure UFW firewall</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${BLUE}</span>🛡️  Configuring firewall...<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">sudo</span> ufw --force default deny incoming
<span class="hljs-built_in">sudo</span> ufw --force default allow outgoing
<span class="hljs-built_in">sudo</span> ufw --force allow <span class="hljs-string">&quot;<span class="hljs-variable">\${SSH_PORT}</span>/tcp&quot;</span>
<span class="hljs-built_in">sudo</span> ufw --force <span class="hljs-built_in">enable</span>

<span class="hljs-comment"># Set hostname</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${BLUE}</span>🏷️  Setting hostname...<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">sudo</span> hostnamectl set-hostname <span class="hljs-string">&quot;<span class="hljs-variable">$HOSTNAME</span>&quot;</span>
grep -q <span class="hljs-string">&quot;127.0.1.1.*<span class="hljs-variable">$HOSTNAME</span>&quot;</span> /etc/hosts || <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;127.0.1.1 <span class="hljs-variable">$HOSTNAME</span>&quot;</span> | <span class="hljs-built_in">sudo</span> <span class="hljs-built_in">tee</span> -a /etc/hosts &gt; /dev/null

<span class="hljs-comment"># Display completion message</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;&quot;</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${GREEN}</span>✅ Setup complete!<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${GREEN}</span>📡 SSH is now running on port $SSH_PORT<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${GREEN}</span>💻 Hostname set to $HOSTNAME<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${GREEN}</span>🛡️  Firewall is active and configured<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;&quot;</span>
<span class="hljs-built_in">echo</span> -e <span class="hljs-string">&quot;<span class="hljs-variable">\${YELLOW}</span>Next steps:<span class="hljs-variable">\${NC}</span>&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;1. Test SSH connection: ssh <span class="hljs-subst">$(whoami)</span>@<span class="hljs-subst">$(hostname -I | awk &#x27;{print $1}&#x27;)</span> -p <span class="hljs-variable">$SSH_PORT</span>&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;2. Consider setting up SSH key authentication&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;3. Set a static IP or DHCP reservation for this server&quot;</span>
</code></pre>
<h3>Usage</h3>
<p>You can run it with the defaults:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">chmod</span> +x setup-ssh-server.sh
./setup-ssh-server.sh
</code></pre>
<p>Or pass in your own port and name:</p>
<pre><code class="hljs language-bash">./setup-ssh-server.sh --port 2244 --hostname webnode-01
</code></pre>
<p>It handles the config, firewall rules, and reloads everything automatically.</p>
<hr>
<h2>🎉 Done</h2>
<p>You’ve now got a secure server that’s ready for whatever you want to host next. More importantly, you’ve handled the basic hardening and firewall configuration that makes managing servers safer.</p>
<p>Instead of sitting in a closet, that old laptop is actually doing something useful. Whether you’re using it to learn system administration or as a lightweight file server, it’s a great piece of gear to have in your network.</p>
<p>Good luck with the build.</p>
<hr>
<blockquote>
<p><em>Pro tip: Keep a record of the IP address and the SSH port you chose. You’ll thank yourself at 2 AM when you’re trying to fix a connection issue.</em></p>
</blockquote>
`,l={id:s,slug:n,frontmatter:a,readingTime:e,content:t};export{t as content,l as default,a as frontmatter,s as id,e as readingTime,n as slug};
