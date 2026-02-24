const n="2024-10-27-ventoy-usb-persistence",e="ventoy-usb-persistence",t={title:"Ventoy USB with Persistence",date:"2024-10-27",author:"jabez007",tags:["ventoy","linux","bootable-usb","lightweight-linux","persistence","tutorial","multi-boot"],excerpt:`That 15-year-old laptop gathering dust in your closet?
The one that wheezes trying to boot Windows 10?
Don't trash it just yet.
`,featured:!0,draft:!1},s=7,o=`<h1>Reviving Old Hardware with Ventoy: Multi-Distro USB with Persistence</h1>
<p>That 15-year-old laptop gathering dust in your closet?
The one that wheezes trying to boot Windows 10?
Don’t trash it just yet.
With a single 128GB USB drive and some Linux wizardry, you can transform that forgotten machine into a surprisingly capable workstation—or turn it into your new favorite hacking rig.</p>
<p>Modern operating systems have gotten bloated.
Meanwhile, perfectly functional hardware from the early 2000s sits unused because it can’t handle today’s resource-hungry requirements.
But here’s the thing: <strong>lightweight Linux distributions don’t care about your ancient CPU or measly 2GB of RAM.</strong>
They’ll run circles around what you thought was possible.</p>
<p>The secret weapon? <a href="https://www.ventoy.net/"><strong>Ventoy</strong></a>—a tool that lets you boot multiple Linux distributions from a single USB drive, complete with persistence so your changes actually stick around.</p>
<p>In this guide, I’ll show you how to create the ultimate revival USB featuring:</p>
<ul>
<li><strong>MX Linux</strong> (the Swiss Army knife of distros)</li>
<li><strong>Bodhi Linux</strong> (elegant and lightning-fast)</li>
<li><strong>LXLE</strong> (Ubuntu’s lightweight cousin)</li>
<li><strong>Puppy Linux</strong> (runs on hardware from the stone age)</li>
<li><strong>Kali Linux</strong> (because sometimes you need to look intimidating)</li>
</ul>
<blockquote>
<p><strong>Plot twist:</strong>
I’m only using half my USB drive for this setup.
The other 64GB remains a perfectly normal USB drive for file storage.</p>
</blockquote>
<hr>
<h2>🧙 What Makes Ventoy Magical?</h2>
<p>Traditional bootable USB creation is a pain.
Flash an ISO, test it, wipe it, flash another ISO, repeat ad nauseam.
Ventoy changes the game completely.</p>
<p><strong>Here’s how it works:</strong> You literally just copy ISO files to your USB drive like regular files.
No flashing, no special tools, no ceremony.
Ventoy creates a boot menu that lets you pick any ISO and boot it directly.</p>
<p>But the real magic happens with <strong>persistence</strong>—the ability to save your changes, installed programs, and personal files across reboots.
Install software, customize your desktop, save documents, and they’ll all be there next time you boot up.</p>
<p>Think of it as carrying multiple complete operating systems in your pocket, each remembering exactly how you left it.</p>
<hr>
<h2>🔧 What You’ll Need</h2>
<ul>
<li><strong>128GB USB drive</strong> (or larger—trust me, you’ll want the space)</li>
<li>A Linux system to do the setup (WSL on Windows works too)</li>
<li><a href="https://www.ventoy.net/en/download.html">Ventoy</a></li>
<li>ISO files for your chosen distros</li>
<li>About 30 minutes and a willingness to partition things</li>
</ul>
<hr>
<h2>🛠️ Step 1: Install Ventoy (The Foundation)</h2>
<blockquote>
<p><strong>⚠️ Fair warning:</strong>
This nukes everything on your USB drive.
Back up first if needed.</p>
</blockquote>
<ol>
<li>
<p><strong>Grab Ventoy and extract it:</strong></p>
<p><em>Find latest version <a href="https://github.com/ventoy/Ventoy/releases">here</a> and update the command below</em></p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># 👉 Always look up the latest version first: https://github.com/ventoy/Ventoy/releases</span>
VENTOY_VER=1.0.99
wget <span class="hljs-string">&quot;https://github.com/ventoy/Ventoy/releases/download/v<span class="hljs-variable">\${VENTOY_VER}</span>/ventoy-<span class="hljs-variable">\${VENTOY_VER}</span>-linux.tar.gz&quot;</span>
tar -xzf <span class="hljs-string">&quot;ventoy-<span class="hljs-variable">\${VENTOY_VER}</span>-linux.tar.gz&quot;</span>
<span class="hljs-built_in">cd</span> <span class="hljs-string">&quot;ventoy-<span class="hljs-variable">\${VENTOY_VER}</span>&quot;</span>
</code></pre>
</li>
<li>
<p><strong>Identify your USB drive:</strong></p>
<pre><code class="hljs language-bash">lsblk
</code></pre>
<p>Look for your USB device (something like <code>/dev/sdb</code> or <code>/dev/sdc</code>).
<strong>Make sure you get the right one</strong>—this is the “format the wrong drive and cry” moment.</p>
</li>
<li>
<p><strong>Install Ventoy:</strong></p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ./Ventoy2Disk.sh -i /dev/sdX
</code></pre>
<p>Replace <code>sdX</code> with your actual USB device.</p>
</li>
</ol>
<p>After installation, you’ll have a USB that can boot multiple ISOs.
But we’re not done yet—we want that dual-partition setup.</p>
<hr>
<h2>📦 Step 2: Create the Perfect Dual-Partition Layout</h2>
<p>Here’s where we get clever.
Instead of dedicating the entire 128GB to Ventoy, let’s split it 50/50:</p>
<ol>
<li>
<p><strong>Resize the Ventoy partition to 64GB</strong> using <code>gparted</code>:</p>
<ul>
<li>Launch <code>gparted</code> and select your USB drive</li>
<li>Right-click the main Ventoy partition and choose “Resize/Move”</li>
<li>Shrink it to 64GB, leaving 64GB unallocated</li>
<li>Create a new partition in the unallocated space (I recommend exFAT for cross-platform compatibility)</li>
<li>Label it something memorable like “Storage”</li>
</ul>
</li>
<li>
<p><strong>Your final layout:</strong></p>
<pre><code>/dev/sdX1 - Ventoy (64GB) - Your bootable partition
/dev/sdX2 - Storage (64GB) - Regular USB storage
</code></pre>
</li>
</ol>
<p>Now you have the best of both worlds: a powerful multi-boot system AND a normal USB drive for everyday file transfers.</p>
<hr>
<h2>📁 Step 3: Add ISOs and Configure Persistence</h2>
<p>Time to populate your USB with operating systems. Copy your ISO files to the Ventoy partition (usually auto-mounted at <code>/media/$USER/Ventoy</code>).</p>
<p>But here’s where it gets interesting—<strong>persistence files</strong> let each distro remember its changes.</p>
<h3>Creating Persistence for MX Linux</h3>
<p>MX Linux is fantastic for older hardware, so let’s give it 4GB of persistence:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">cd</span> /media/<span class="hljs-variable">$USER</span>/Ventoy
<span class="hljs-built_in">truncate</span> -s 4G mx-persistence.dat
mkfs.ext4 -L MX-Persist mx-persistence.dat
</code></pre>
<h3>Tell Ventoy How to Use It</h3>
<p>Create a <code>ventoy</code> folder and add a <code>ventoy.json</code> configuration file:</p>
<pre><code class="hljs language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;persistence&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
    <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;image&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/MX-23_x64.iso&quot;</span><span class="hljs-punctuation">,</span>
      <span class="hljs-attr">&quot;backend&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/mx-persistence.dat&quot;</span>
    <span class="hljs-punctuation">}</span>
  <span class="hljs-punctuation">]</span>
<span class="hljs-punctuation">}</span>
</code></pre>
<h3>Adding More Distros</h3>
<p>Let’s add Bodhi Linux with 2GB persistence:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">truncate</span> -s 2G bodhi-persistence.dat
mkfs.ext4 -L BodhiPersist bodhi-persistence.dat
</code></pre>
<p>Update your <code>ventoy.json</code>:</p>
<pre><code class="hljs language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;persistence&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
    <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;image&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/MX-23_x64.iso&quot;</span><span class="hljs-punctuation">,</span>
      <span class="hljs-attr">&quot;backend&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/mx-persistence.dat&quot;</span>
    <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
    <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;image&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/bodhi-6.0.0.iso&quot;</span><span class="hljs-punctuation">,</span>
      <span class="hljs-attr">&quot;backend&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/bodhi-persistence.dat&quot;</span>
    <span class="hljs-punctuation">}</span>
  <span class="hljs-punctuation">]</span>
<span class="hljs-punctuation">}</span>
</code></pre>
<blockquote>
<p><strong>Pro tip:</strong>
File names don’t have to match the ISO names—just make sure the paths in your JSON are correct.</p>
</blockquote>
<hr>
<h2>🐧 Distro-Specific Notes (The Gotchas)</h2>
<p>Each Linux distribution has its own personality when it comes to persistence:</p>
<ul>
<li>
<p><strong>MX Linux</strong>: Works perfectly with the <code>.dat</code> file approach above. It’s like the golden retriever of Linux distros—friendly and reliable.</p>
</li>
<li>
<p><strong>Bodhi Linux</strong>: Ubuntu-based, so it follows the same persistence pattern as MX Linux. Incredibly lightweight and beautiful.</p>
</li>
<li>
<p><strong>LXLE</strong>: Another Ubuntu derivative. Use the same setup as Bodhi Linux. Great for machines with limited resources.</p>
</li>
<li>
<p><strong>Puppy Linux</strong>: This little guy is special. It has its own persistence system—just boot it and it’ll offer to create a save file automatically. Perfect for machines with ridiculously low specs.</p>
</li>
<li>
<p><strong>Kali Linux</strong>: For persistence, create a file named <code>persistence</code> (not <code>persistence.dat</code>) and add a <code>persistence.conf</code> file inside it. Check the <a href="https://www.kali.org/docs/usb/kali-linux-live-usb-persistence/">official Kali documentation</a> for details.</p>
</li>
</ul>
<hr>
<h2>🚀 The Moment of Truth: Booting Up</h2>
<p>Plug your creation into that ancient laptop, mash F12 (or whatever gets you to the boot menu), select USB, and watch the magic happen.
You should see a clean Ventoy menu listing all your ISOs.</p>
<p>Pick one, boot it up, and start customizing.
Install software, change wallpapers, create documents.
When you reboot, everything will be exactly as you left it—<strong>if you set up persistence correctly.</strong></p>
<p>The first time you see a 2008 netbook running a modern Linux desktop smoothly, you’ll understand why this approach is so satisfying.</p>
<hr>
<h2>🎯 Real-World Results</h2>
<p>I’ve used this exact setup to:</p>
<ul>
<li>Transform a 2008 netbook into a surprisingly capable Bodhi Linux workstation for writing and light development</li>
<li>Convert spare laptops into portable penetration testing rigs with Kali Linux</li>
<li>Create emergency rescue systems that can diagnose and fix problems on any computer</li>
<li>Give new life to friends’ “broken” computers that just needed a lightweight OS</li>
</ul>
<p>The flexibility is incredible. One USB drive becomes a complete toolkit for hardware revival.</p>
<hr>
<h2>🔧 Pro Tips for Success</h2>
<ul>
<li><strong>Always safely eject</strong> your USB after making changes to persistence files</li>
<li><strong>Keep a backup</strong> of your <code>ventoy.json</code> file—you’ll thank me later</li>
<li><strong>Consider adding utility ISOs</strong> like GParted Live or SystemRescue for emergencies</li>
<li><strong>Label your persistence files clearly</strong>—future you will appreciate the organization</li>
<li><strong>Test each distro</strong> after setting up persistence to make sure everything works</li>
</ul>
<hr>
<h2>🏆 The Final Verdict</h2>
<p>With a 128GB USB drive, some lightweight Linux distros, and Ventoy’s magic, you can resurrect practically any piece of hardware from the last 15 years. That “obsolete” laptop becomes a portable Linux workstation. That old desktop becomes a home server. That forgotten netbook becomes your new favorite writing machine.</p>
<p>The best part?
You’re not just breathing life into old hardware—you’re learning about Linux, exploring different desktop environments, and developing skills that transfer to modern systems.</p>
<p>Plus, there’s something deeply satisfying about making a 15-year-old computer run better than it did when it was new.</p>
<hr>
<p><em>Now stop reading and go rescue that laptop from your closet. It’s been waiting long enough.</em></p>
`,a={id:n,slug:e,frontmatter:t,readingTime:s,content:o};export{o as content,a as default,t as frontmatter,n as id,s as readingTime,e as slug};
