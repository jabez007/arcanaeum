const t="2025-06-15-proxmox-laptop-install",n="proxmox-laptop-install",e={title:"ProxMox Laptop Install",date:"2025-06-15",author:"jabez007",tags:["proxmox","homelab","virtualization","tutorial","selfhosted"],excerpt:`This post chronicles my **complete installation journey**, including the BIOS rabbit holes I fell into, the partitioning decisions that actually matter, and the **networking mistake that nearly drove me to throw the laptop out the window** (spoiler: I figured it out, and you won't make the same error).
`,featured:!0,draft:!1},o=8,s=`<h1>Installing Proxmox VE 8.4 on a Laptop: My Homelab Journey</h1>
<h2>Introduction</h2>
<p>Picture this: you’re scrolling through r/homelab at 2 AM (as one does), and you see yet another post about someone’s $3,000 server rack setup.
Meanwhile, you’re looking at an old laptop collecting dust in your closet, wondering if it could become something more useful than a very expensive paperweight.</p>
<p>Well, I’m here to tell you it absolutely can.</p>
<p>A few weeks ago, I decided to expand my homelab—but with a twist.
Instead of dropping serious cash on rack-mounted gear, I grabbed an <strong>HP laptop with an AMD Ryzen 5 3500U, 32GB of RAM, and a 512GB SSD</strong> that was destined for the electronics recycling bin.
Total cost? $150 on Facebook Marketplace.
Sometimes the best homelab gear isn’t the shiniest—it’s the most practical.</p>
<p>Proxmox VE (Virtual Environment) became my weapon of choice.
It’s free, open-source, and packed with enterprise-grade features that would make a VMware admin weep with envy—live migration, ZFS support, LXC containers, and clustering capabilities that rival solutions costing thousands.</p>
<p>But here’s the catch: installing enterprise virtualization software on consumer hardware designed for browsing cat videos?
That’s where things get spicy.</p>
<p>This post chronicles my <strong>complete installation journey</strong>, including the BIOS rabbit holes I fell into, the partitioning decisions that actually matter, and the <strong>networking mistake that nearly drove me to throw the laptop out the window</strong> (spoiler: I figured it out, and you won’t make the same error).</p>
<hr>
<h2>Step 1: Downloading Proxmox and Creating a Bootable USB</h2>
<h3>Choosing Your Weapon: The Right ISO</h3>
<p>First stop: <a href="https://www.proxmox.com/">proxmox.com</a> to grab <strong>Proxmox VE 8.4</strong>.
Now, I know what you’re thinking—“Why not the bleeding-edge latest version?”
Because in the homelab world, <strong>stable beats shiny</strong> every single time.
Version 8.4 is battle-tested, well-documented, and won’t surprise you with mysterious bugs at 3 AM when you’re trying to restore a critical VM.</p>
<p><strong>Pro Tip That Saved My Sanity:</strong> Always verify the ISO checksum.
Yes, it takes 30 seconds.
No, it’s not paranoia when that corrupted download costs you 2 hours of troubleshooting:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sha256sum</span> proxmox-ve_8.4-1.iso
</code></pre>
<p>Compare this against the checksum on Proxmox’s download page.
Trust me on this one.</p>
<h3>USB Creation: Why Ventoy Changed My Life</h3>
<p>Forget constantly reformatting USB drives.
<strong>Ventoy</strong> is like having a Swiss Army knife for ISOs—drop multiple installation images on one drive and pick your poison at boot time.</p>
<p>Here’s my setup process:</p>
<ol>
<li>Downloaded Ventoy from <a href="https://www.ventoy.net/">ventoy.net</a></li>
<li>Installed it on my USB drive (<strong>warning:</strong> this nukes everything on the drive)</li>
<li>Simply copied the Proxmox ISO file directly onto the USB—no burning, no special tools, just drag and drop</li>
</ol>
<p><strong>Alternative Weapons:</strong></p>
<ul>
<li><strong>BalenaEtcher</strong>: Simple and foolproof (perfect for newcomers)</li>
<li><strong>Rufus</strong>: Windows-only but lightning fast</li>
<li><strong>dd command</strong>: For the Linux purists who enjoy living dangerously</li>
</ul>
<hr>
<h2>Step 2: BIOS Surgery – Where Dreams Go to Die</h2>
<h3>Breaking Into the BIOS</h3>
<p>Every laptop manufacturer seems to pick their BIOS key by throwing darts at a keyboard.
On this HP, I had to <strong>spam the ESC key</strong> like I was trying to escape a burning building, then hit <strong>F10</strong> when the boot menu appeared.</p>
<p><strong>Universal BIOS Key Cheat Sheet:</strong></p>
<ul>
<li><strong>HP</strong>: ESC then F10</li>
<li><strong>Dell</strong>: F2 or F12</li>
<li><strong>Lenovo</strong>: F1 or Enter then F1</li>
<li><strong>ASUS</strong>: F2 or Delete</li>
<li><strong>When in doubt</strong>: Mash all the function keys and pray</li>
</ul>
<h3>The Settings That Actually Matter</h3>
<p>This is where most installations fail before they even begin.
Miss these settings, and you’ll be troubleshooting phantom problems for hours:</p>
<h4>1. <strong>Enable Virtualization Extensions</strong></h4>
<ul>
<li><strong>AMD</strong>: Look for “SVM Mode” under <em>System Configuration &gt; CPU/Memory Options</em></li>
<li><strong>Intel</strong>: Hunt for “VT-x” or “Intel Virtualization Technology”</li>
<li><strong>Why it matters</strong>: Without this, Proxmox installs but runs like molasses. Your VMs will be so slow you’ll question your life choices.</li>
</ul>
<h4>2. <strong>Disable Secure Boot (The Silent Killer)</strong></h4>
<p>Found under <em>Security &gt; Secure Boot Configuration</em>.
Microsoft’s security feature becomes your virtualization roadblock—Proxmox’s kernel modules aren’t Microsoft-signed, so Secure Boot treats them like malware.</p>
<h4>3. <strong>Boot Mode Reality Check</strong></h4>
<p>Make sure you’re in <strong>UEFI mode</strong>, not Legacy.
Some older laptops default to Legacy, which can cause mysterious boot failures later.</p>
<h4>4. <strong>USB Boot Priority</strong></h4>
<p>Set your USB device as the first boot option, or you’ll be staring at Windows wondering why your installer didn’t load.</p>
<blockquote>
<p><strong>The Hidden Gotcha:</strong>
Some laptops have <strong>Fast Boot</strong> enabled, which skips USB device detection.
Disable it if your USB doesn’t appear in the boot menu.</p>
</blockquote>
<hr>
<h2>Step 3: The Installation Dance – Partitioning Like You Mean It</h2>
<h3>Booting Into Battle</h3>
<p>USB inserted, laptop restarted, and Ventoy’s menu appeared like a choose-your-own-adventure book.
I selected the Proxmox ISO and chose the <strong>Graphical Installer</strong> because life’s too short for text-mode installations when you don’t have to.</p>
<h3>Disk Partitioning: Where Strategy Meets Reality</h3>
<p>Proxmox’s automatic partitioning is fine for testing, but this is a homelab—we optimize everything.
Here’s my battle-tested strategy for a <strong>512GB SSD</strong>:</p>
<table>
<thead>
<tr>
<th>Partition</th>
<th>Size</th>
<th>Purpose</th>
<th>Why This Size?</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong><code>hdsize</code></strong></td>
<td>476GB</td>
<td>Total usable space</td>
<td>512GB SSD ≠ 512GB usable (thanks, marketing)</td>
</tr>
<tr>
<td><strong><code>swapsize</code></strong></td>
<td>12GB</td>
<td>System swap</td>
<td>RAM/3 rule (32GB RAM ÷ 3 ≈ 12GB)</td>
</tr>
<tr>
<td><strong><code>maxroot</code></strong></td>
<td>75GB</td>
<td>Proxmox OS partition</td>
<td>OS + logs + future updates</td>
</tr>
<tr>
<td><strong><code>maxvz</code></strong></td>
<td>389GB</td>
<td>VM/Container storage</td>
<td>Maximum space for the fun stuff</td>
</tr>
</tbody>
</table>
<p><strong>Why Not Follow “Common Wisdom”?</strong></p>
<ul>
<li><strong>Swap = RAM</strong>: With 32GB RAM, I don’t need 32GB swap. Modern systems rarely swap anyway.</li>
<li><strong>Minimal root</strong>: I’ve seen guides suggesting 20GB for root. That’s fine until you need kernel updates, logs pile up, or you install additional packages.</li>
<li><strong>Maximize VM storage</strong>: This is where your actual workloads live—don’t shortchange it.</li>
</ul>
<blockquote>
<p><strong>Advanced Consideration:</strong>
If you want VM snapshots (and you do), consider <strong>LVM-thin</strong> over <strong>ext4</strong> for the VM storage.
It’s more complex but enables instant snapshots.</p>
</blockquote>
<hr>
<h2>Step 4: Basic Configuration (The Boring But Critical Stuff)</h2>
<h3>Geography and Keyboards Matter</h3>
<ul>
<li><strong>Timezone</strong>: Pick correctly or your log timestamps will haunt you forever</li>
<li><strong>Keyboard Layout</strong>: Double-check this. There’s nothing quite like trying to type a password with the wrong keyboard mapping.</li>
</ul>
<h3>Credentials That Actually Work</h3>
<ul>
<li><strong>Root Password</strong>: Make it strong, but memorable. You’ll type this more than your own name.</li>
<li><strong>Email</strong>: Use a real one. Proxmox sends useful alerts about disk failures, memory issues, and update notifications.</li>
</ul>
<blockquote>
<p><strong>Security Note:</strong>
In production, you’d disable root SSH access later and create a dedicated admin user.
For a homelab? Root access is fine, but don’t expose it to the internet.</p>
</blockquote>
<hr>
<h2>Step 5: Networking – My $150 Lesson in Humility</h2>
<h3>The Wi-Fi Reality Check</h3>
<p>Here’s where consumer hardware meets enterprise software expectations: <strong>Proxmox’s installer doesn’t do Wi-Fi.</strong> Period.
It assumes you have enterprise networking with Ethernet everywhere.</p>
<p>For this install, I had to enter <strong>dummy network settings</strong> and fix Wi-Fi post-installation.</p>
<h3>The Mistake That Cost Me 3 Hours</h3>
<p>I configured the dummy IP as <code>192.168.123.100/24</code>—the same subnet as my home Wi-Fi network.
Seemed logical at the time.</p>
<p><strong>Plot twist:</strong> When I later configured actual Wi-Fi, the IP conflict created a networking nightmare that involved:</p>
<ul>
<li>Ping timeouts</li>
<li>Mysterious connection drops</li>
<li>Me questioning my career choices</li>
<li>A lot of colorful language</li>
</ul>
<h3>The Simple Fix (Learn From My Pain)</h3>
<p>Use a <strong>completely different subnet</strong> for dummy settings:</p>
<ul>
<li><strong>Good</strong>: <code>192.168.231.100/24</code> (unlikely to conflict)</li>
<li><strong>Bad</strong>: <code>192.168.1.100/24</code> (conflicts with most home routers)</li>
<li><strong>Terrible</strong>: Same subnet as your actual network (my mistake)</li>
</ul>
<blockquote>
<p><strong>Pro Workaround:</strong>
If you have a <strong>USB-to-Ethernet adapter</strong> lying around, use it during installation.
It’ll make your life infinitely easier.</p>
</blockquote>
<hr>
<h2>What’s Next: The Fun Stuff Awaits</h2>
<p>With Proxmox successfully installed, the real homelab adventure begins:</p>
<ol>
<li><strong>Wi-Fi Configuration</strong>: Making enterprise software play nice with consumer networking</li>
<li><strong>Storage Optimization</strong>: ZFS pools, LVM-thin, and snapshot strategies</li>
<li><strong>First Virtual Machines</strong>: Home Assistant, Pi-hole, and maybe a Kubernetes cluster</li>
<li><strong>Advanced Features</strong>: Clustering, backup strategies, and monitoring</li>
</ol>
<hr>
<h2>Final Thoughts: Why This Matters</h2>
<p>This old laptop is now running <strong>5 virtual machines simultaneously</strong> with room to spare.
It hosts my Home Assistant, Pi-hole, development environments, and a Minecraft server for my kids.
Total additional cost beyond the laptop? $0.</p>
<p><strong>The Real Lessons:</strong></p>
<ul>
<li><strong>Virtualization must be enabled</strong> in BIOS (non-negotiable)</li>
<li><strong>Secure Boot will ruin your day</strong> (disable it)</li>
<li><strong>Network planning prevents headaches</strong> (use different subnets)</li>
<li><strong>Consumer hardware can absolutely run enterprise software</strong> (with some creativity)</li>
</ul>
<p>This setup proves you don’t need enterprise budgets for enterprise capabilities.
Sometimes the best homelab is built from what others consider obsolete.</p>
<hr>
<h3>Coming Up Next</h3>
<p>Part 2 will cover the post-installation configuration that transforms this Proxmox install from “it boots” to “it actually works beautifully.”
We’ll tackle Wi-Fi setup, storage configuration, and deploying your first VMs without breaking anything important.</p>
`,r={id:t,slug:n,frontmatter:e,readingTime:o,content:s};export{s as content,r as default,e as frontmatter,t as id,o as readingTime,n as slug};
