const s="2024-11-10-ssh-server-setup",n="ssh-server-setup",a={title:"SSH Server Setup",date:"2024-11-10",author:"jabez007",tags:["homelab","ssh","ufw","linux","server-setup","security","home-network","firewall","ssh-hardening","tutorial","beginner-friendly"],excerpt:`Like many of you in the homelab community, I have a soft spot for old hardware.
That laptop collecting dust might seem obsolete for daily use,
but it's actually perfect for a home lab — especially when repurposed as an SSH-accessible Linux server.
`,featured:!0,draft:!1},e=8,t=`<h1>Breathing New Life into an Old Laptop: An SSH Server for Your Home Lab</h1>
<p>🖥️ <em>That dusty ThinkPad in your closet? It’s about to become your new favorite server.</em></p>
<p>Like many of you in the homelab community, I have a soft spot for old hardware.
That laptop collecting dust might seem obsolete for daily use,
but it’s actually perfect for a home lab — especially when repurposed as an SSH-accessible Linux server.</p>
<p>Today I’ll walk you through transforming forgotten hardware into a reliable, secure SSH server.
We’ll cover everything from basic setup to hardening, plus I’ve included a script to automate the whole process.
Whether you’re just starting your homelab journey or adding another node to your existing setup, this guide has you covered.</p>
<p><strong>What you’ll need:</strong></p>
<ul>
<li>An old laptop (pretty much anything from the last 10 years will work)
<ul>
<li>I’ve even done this on a Gateway from 2010 with <em>only</em> 4 GB of RAM</li>
</ul>
</li>
<li>A fresh Linux installation (Ubuntu, Debian, or similar)</li>
<li>20 minutes of your time</li>
</ul>
<hr>
<h2>🚀 Step 1: Install OpenSSH Server</h2>
<p>First things first — we need SSH access to the machine.
Most Linux distros ship with the SSH <em>client</em> pre-installed, but not always the <em>server</em> component.
Think of it this way: the client lets you connect to other machines, but the server lets other machines connect to you.</p>
<p>On Debian-based distros (Ubuntu, Linux Mint, Pop!_OS, etc.):</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> apt update
<span class="hljs-built_in">sudo</span> apt install openssh-server
</code></pre>
<p>Let’s verify it’s running:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl status ssh
</code></pre>
<p>If you see “active (running)” in green, congratulations!
Your laptop is now listening for SSH connections on port 22.
But don’t celebrate just yet — we’re about to make it much more secure.</p>
<hr>
<h2>🔒 Step 2: Harden Your SSH Configuration</h2>
<p>Here’s where most tutorials stop, but we’re just getting started.
Default SSH configurations are functional but not secure.
We’re going to fix that.</p>
<p><strong>Why change the default port?</strong>
While security through obscurity isn’t a complete solution, it dramatically reduces automated attack noise.
Bots constantly scan port 22, so moving to a custom port gives you cleaner logs and fewer intrusion attempts.</p>
<p>Edit the SSH server configuration:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> nano /etc/ssh/sshd_config
</code></pre>
<p>Update or add these lines:</p>
<pre><code class="hljs language-toml">Port 2222                    <span class="hljs-comment"># Custom port (use any port 1024-65535)</span>
PermitRootLogin no           <span class="hljs-comment"># Root access = unnecessary risk</span>
MaxAuthTries 3               <span class="hljs-comment"># Limit brute-force attempts</span>
PasswordAuthentication yes   <span class="hljs-comment"># We&#x27;ll keep this for now (see note below)</span>
LoginGraceTime 30s           <span class="hljs-comment"># Don&#x27;t let connections hang forever</span>
ClientAliveInterval 300      <span class="hljs-comment"># Keep connections alive</span>
ClientAliveCountMax 2        <span class="hljs-comment"># But not indefinitely</span>
</code></pre>
<blockquote>
<p><strong>Pro tip:</strong> Planning to access this server from outside your network?
Set <code>PasswordAuthentication no</code> and use SSH keys instead.
It’s more secure and honestly more convenient once you’re used to it.</p>
</blockquote>
<p>After saving your changes:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl restart ssh
</code></pre>
<p>Test from another machine on your network:</p>
<pre><code class="hljs language-bash">ssh yourusername@192.168.1.100 -p 2222
</code></pre>
<p>Replace the IP with your server’s actual IP address.
If you can connect, you’re golden!</p>
<hr>
<h2>🛡️ Step 3: Install UFW (Because Firewalls Matter)</h2>
<p>Even if this server lives safely inside your network, defense in depth is a good habit.
UFW (Uncomplicated Firewall) lives up to its name — it’s iptables made simple.</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> apt install ufw
</code></pre>
<hr>
<h2>🔧 Step 4: Configure Your Firewall Like a Pro</h2>
<p>Before enabling UFW, we’ll set sensible defaults.
The last thing you want is to lock yourself out of your own server!</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ufw default deny incoming
<span class="hljs-built_in">sudo</span> ufw default allow outgoing
</code></pre>
<p>This configuration means:</p>
<ul>
<li><strong>Deny incoming</strong>: Block all inbound connections by default</li>
<li><strong>Allow outgoing</strong>: Let your server make outbound connections (for updates, etc.)</li>
</ul>
<p>Now allow SSH on your custom port:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ufw allow 2222/tcp
</code></pre>
<p>Enable the firewall:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ufw <span class="hljs-built_in">enable</span>
</code></pre>
<p>Check your handiwork:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ufw status verbose
</code></pre>
<p>You should see something like:</p>
<pre><code>Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
2222/tcp                   ALLOW IN    Anywhere
2222/tcp (v6)              ALLOW IN    Anywhere (v6)
</code></pre>
<p>Perfect! Your server is now locked down tight, with only SSH access allowed.</p>
<hr>
<h2>📈 Level Up Your Setup (Bonus Tips)</h2>
<h3>Set a Static IP or DHCP Reservation</h3>
<p>Nothing’s more frustrating than a server that changes IP addresses.
Either configure a static IP on the server itself,
or (better yet) set up a DHCP reservation on your router.
Your future self will thank you.</p>
<h3>Give Your Server a Proper Hostname</h3>
<p>Generic hostnames are boring.
Let’s fix that:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> hostnamectl set-hostname lab-server-01
</code></pre>
<p>Make it permanent by adding it to <code>/etc/hosts</code>:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;127.0.1.1 lab-server-01&quot;</span> | <span class="hljs-built_in">sudo</span> <span class="hljs-built_in">tee</span> -a /etc/hosts
</code></pre>
<p>Refresh your shell:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">exec</span> bash
</code></pre>
<h3>Consider SSH Key Authentication</h3>
<p>If you’re comfortable with it, SSH keys are both more secure and more convenient than passwords.
Generate a key pair, copy the public key to your server, then disable password authentication in <code>sshd_config</code>.
Your connections will be faster and more secure.</p>
<hr>
<h2>🎯 The Big Picture</h2>
<p>What you’ve just built isn’t just an SSH server — it’s the foundation of your home lab infrastructure.
This little machine can now serve as:</p>
<ul>
<li>A development environment for testing code</li>
<li>A file server using tools like Nextcloud or Samba</li>
<li>A monitoring station running Prometheus or Grafana</li>
<li>A jump box for accessing other network resources</li>
<li>A learning platform for system administration</li>
</ul>
<p>The beauty of repurposing old hardware is that you can experiment fearlessly.
Break something?
No problem — you’re not risking your main workstation.</p>
<hr>
<h2>🤖 Automate Everything (Because We’re Lazy in the Best Way)</h2>
<p>If you’re setting up multiple servers or just want to save time, here’s a script that automates the entire process.
It handles SSH configuration, firewall setup, and basic hardening with customizable options.</p>
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
<h3>Usage Examples</h3>
<p>Run with default settings:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">chmod</span> +x setup-ssh-server.sh
./setup-ssh-server.sh
</code></pre>
<p>Customize the port and hostname:</p>
<pre><code class="hljs language-bash">./setup-ssh-server.sh --port 2244 --hostname webnode-01
</code></pre>
<p>The script includes colored output, error handling, and helpful next steps. Perfect for consistent deployments across multiple machines.</p>
<hr>
<h2>🎉 Wrapping Up</h2>
<p>You’ve just transformed an old laptop into a secure, accessible server that’s ready for whatever your home lab throws at it.
More importantly, you’ve learned the fundamentals of SSH hardening and firewall configuration — skills that transfer directly to managing production servers.</p>
<p>What started as forgotten hardware is now a valuable piece of infrastructure.
Whether you use it for development, file sharing, monitoring, or just SSH practice, you’ve given that old laptop a new purpose.</p>
<p>Happy homelabbing!</p>
<hr>
<blockquote>
<p><em>Pro tip: Document your server’s IP address, SSH port, and any special configurations in a simple text file or password manager.
Your future self (especially at 2 AM when something breaks) will be grateful.</em></p>
</blockquote>
`,l={id:s,slug:n,frontmatter:a,readingTime:e,content:t};export{t as content,l as default,a as frontmatter,s as id,e as readingTime,n as slug};
