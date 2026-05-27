const n="2024-10-27-ventoy-usb-persistence",e="ventoy-usb-persistence",s={title:"Ventoy USB with Persistence",date:"2024-10-27",author:"jabez007",tags:["ventoy","linux","bootable-usb","lightweight-linux","persistence","tutorial","multi-boot"],excerpt:`Stop asking a 15-year-old laptop to run Windows 10.
With a cheap USB drive and a few specific Linux distros, 
you can turn e-waste back into a functional, fast machine.
`,featured:!0,draft:!1},t=5,o=`<h1>Multi-Boot Linux USBs with Persistence (using Ventoy)</h1>
<p>Most hardware from the early 2010s isn’t actually “obsolete”—it’s just burdened by modern software bloat. A laptop with 2GB of RAM will struggle to even boot a fresh Windows 10 installation, let alone run a browser.</p>
<p>You don’t need more RAM; you just need to stop asking a decade-old CPU to do the heavy lifting of a modern OS. <a href="https://www.ventoy.net/"><strong>Ventoy</strong></a> lets you carry a whole toolkit of lighter systems on a single USB drive. Instead of flashing one ISO at a time, you just drop the files onto the drive and boot them.</p>
<p>The real power comes with <strong>persistence</strong>. This lets the live environment save your changes—installed packages, browser tabs, Wi-Fi passwords—to a file on the USB so they’re still there when you reboot.</p>
<h2>The Goal</h2>
<p>We’re going to set up a 128GB drive split into two sections:</p>
<ol>
<li><strong>Boot Partition (64GB):</strong> For ISOs and persistent storage files.</li>
<li><strong>Storage Partition (64GB):</strong> A standard exFAT partition for moving files between Windows and Linux machines.</li>
</ol>
<h3>Recommended Distros for Old Hardware</h3>
<p>If you’re looking for where to start, here’s what I’ve found works best on older hardware:</p>
<ul>
<li><strong>MX Linux:</strong> My go-to. It’s reliable, mid-weight, and has the best hardware detection for those weird old Wi-Fi chips.</li>
<li><strong>Bodhi Linux:</strong> This is for the truly ancient stuff. It uses the Moksha desktop and is ridiculously light on resources.</li>
<li><strong>LXLE:</strong> Essentially Ubuntu LTS but stripped down for aging PCs. It’s familiar and stable.</li>
<li><strong>Puppy Linux:</strong> The wild card. It loads entirely into RAM, which means it’s lightning-fast even on a slow USB 2.0 drive.</li>
<li><strong>Kali Linux:</strong> Not just for hacking. It’s actually a solid toolkit for network diagnostics when you’re troubleshooting a broken setup.</li>
</ul>
<hr>
<h2>1. Installing Ventoy</h2>
<p><strong>Warning:</strong> This process formats the drive. Back up your data.</p>
<ol>
<li>
<p><strong>Download and Extract:</strong>
Check the <a href="https://github.com/ventoy/Ventoy/releases">latest releases</a> for the current version.</p>
<pre><code class="hljs language-bash">VENTOY_VER=1.0.99
wget <span class="hljs-string">&quot;https://github.com/ventoy/Ventoy/releases/download/v<span class="hljs-variable">\${VENTOY_VER}</span>/ventoy-<span class="hljs-variable">\${VENTOY_VER}</span>-linux.tar.gz&quot;</span>
tar -xzf <span class="hljs-string">&quot;ventoy-<span class="hljs-variable">\${VENTOY_VER}</span>-linux.tar.gz&quot;</span>
<span class="hljs-built_in">cd</span> <span class="hljs-string">&quot;ventoy-<span class="hljs-variable">\${VENTOY_VER}</span>&quot;</span>
</code></pre>
</li>
<li>
<p><strong>Find your drive:</strong>
Run <code>lsblk</code> to identify your USB device (e.g., <code>/dev/sdb</code>). Verify the size to ensure you aren’t targeting your internal hard drive.</p>
</li>
<li>
<p><strong>Flash Ventoy:</strong></p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> ./Ventoy2Disk.sh -i /dev/sdX
</code></pre>
<p><em>(Replace <code>sdX</code> with your USB identifier)</em></p>
</li>
</ol>
<hr>
<h2>2. Partitioning for Utility</h2>
<p>Ventoy usually eats the entire drive. If you want to keep half for regular files (like a normal USB stick), you’ll need to do a little manual resizing.</p>
<ol>
<li>Open <code>gparted</code> and select the USB drive.</li>
<li>Unmount the Ventoy partition if it’s auto-mounted.</li>
<li>Shrink the main Ventoy partition (Partition 1) to 64GB.</li>
<li>In the remaining unallocated space, create a new <strong>exFAT</strong> partition. Label it “Storage.”</li>
<li>Apply changes.</li>
</ol>
<p>You now have a bootable toolkit that doubles as a normal flash drive.</p>
<hr>
<h2>3. Configuring Persistence</h2>
<p>Ventoy boots ISOs as read-only by default. To save changes, we create a “backend” file—basically a virtual hard drive that sits on your USB.</p>
<h3>For MX Linux (and other Debian/Ubuntu-based distros)</h3>
<p>Navigate to your Ventoy partition and create the persistence file:</p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># Create a 4GB empty file</span>
<span class="hljs-built_in">truncate</span> -s 4G mx-persistence.dat

<span class="hljs-comment"># Format it as ext4 with a specific label</span>
mkfs.ext4 -L MX-Persist mx-persistence.dat
</code></pre>
<h3>Linking the ISO to the Persistence File</h3>
<p>Ventoy needs a JSON configuration file to know which ISO should use which persistence file. Create a folder named <code>ventoy</code> on the root of the USB, and inside it, a file named <code>ventoy.json</code>:</p>
<pre><code class="hljs language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;persistence&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
    <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;image&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/MX-23_x64.iso&quot;</span><span class="hljs-punctuation">,</span>
      <span class="hljs-attr">&quot;backend&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/mx-persistence.dat&quot;</span>
    <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
    <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;image&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/bodhi-7.0.0-64-apppack.iso&quot;</span><span class="hljs-punctuation">,</span>
      <span class="hljs-attr">&quot;backend&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;/bodhi-persistence.dat&quot;</span>
    <span class="hljs-punctuation">}</span>
  <span class="hljs-punctuation">]</span>
<span class="hljs-punctuation">}</span>
</code></pre>
<p><em>Note: The paths are relative to the root of the USB drive. If your ISOs are in a subfolder, reflect that in the JSON.</em></p>
<hr>
<h2>4. Technical Nuances by Distro</h2>
<p>Persistence works a bit differently depending on what you’re booting:</p>
<ul>
<li><strong>MX Linux:</strong> Uses the <code>MX-Persist</code> label. When booting, you may need to select “Persistence” from the MX boot menu (after the Ventoy menu).</li>
<li><strong>Ubuntu/Bodhi/LXLE:</strong> These typically look for a file labeled <code>casper-rw</code>. If you use the <code>.dat</code> file method, ensure the label matches what the distro expects.</li>
<li><strong>Kali Linux:</strong> Requires an extra step. Once booted into Kali with persistence enabled, you must mount the persistence partition and create a <code>persistence.conf</code> file:<pre><code class="hljs language-bash"><span class="hljs-built_in">mkdir</span> -p /mnt/my_usb
mount /dev/sdXN /mnt/my_usb  <span class="hljs-comment"># Where N is your persistence partition/file</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;/ union&quot;</span> &gt; /mnt/my_usb/persistence.conf
umount /mnt/my_usb
</code></pre>
</li>
<li><strong>Puppy Linux:</strong> Does not use Ventoy’s persistence files. It will prompt you to create a <code>savefile</code> on the USB drive itself when you first shut down.</li>
</ul>
<hr>
<h2>Why I Carry This</h2>
<p>I keep one of these in my bag because it’s the ultimate “break glass in case of emergency” tool. If a bootloader dies or I need to pull files off a crashed drive, I’m not stuck. Plus, it’s just satisfying to see a laptop from 2012 outperforming a modern budget machine simply because it’s running Bodhi instead of Windows.</p>
<p>Just remember two things: use <strong>exFAT</strong> for the storage half so you don’t run into permission nightmares on Windows, and <strong>always</strong> unmount before pulling the plug. If that persistence file gets corrupted, you’re starting from scratch.</p>
<p>Also, save a backup of your <code>ventoy.json</code> on the storage partition—you’ll thank yourself later when you accidentally format the wrong partition while experimenting.</p>
`,a={id:n,slug:e,frontmatter:s,readingTime:t,content:o};export{o as content,a as default,s as frontmatter,n as id,t as readingTime,e as slug};
