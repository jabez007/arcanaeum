const t="2025-06-20-proxmox-lxc-ubuntu-template",e="proxmox-lxc-ubuntu-template",n={title:"Deploying Your First LXC – Ubuntu on Proxmox",date:"2025-06-20",author:"jabez007",tags:["proxmox","homelab","lxc","ubuntu","tutorial","virtualization"],excerpt:`Now that Proxmox is installed and (mostly) behaving, it's time to actually build something.
We're skipping the heavy VMs and diving straight into **LXC containers**—the lightweight, high-performance secret weapon of the homelab world.
Learn how to grab an Ubuntu template and spin up your first container in minutes.
`,featured:!0,draft:!1},o=6,a=`<h1>From Bare Metal to Running Code: Deploying Your First Ubuntu LXC</h1>
<h2>Introduction</h2>
<p>So, you’ve survived the Proxmox installation. Maybe you even wrestled with Wi-Fi drivers or the laptop lid settings (if you’re following my previous sagas).
You’re staring at that clean, empty Proxmox dashboard, and it’s doing that thing where it feels like a giant blank canvas that you’re about to ruin.</p>
<p>In the enterprise world, people love their Virtual Machines (VMs). They’re great, they’re isolated, and they’re also <strong>absolute resource hogs</strong>.
If you’re running on a repurposed laptop with limited RAM, you need to be a bit more tactical.</p>
<p>Enter <strong>LXC (Linux Containers)</strong>.</p>
<p>Unlike a VM, which emulates an entire hardware stack, a container shares the host’s kernel.
It’s lightning-fast, uses almost no overhead, and starts up before you can even finish a sip of coffee.
Today, we’re going to grab an Ubuntu template and spin up our first container so this laptop actually starts earning its keep.</p>
<hr>
<h2>Step 1: Priming the Pump – The Template Database</h2>
<p>Before we can create a container, we need a “template”—basically a pre-baked image of an OS.
Proxmox keeps a list of these, but it doesn’t always have the latest versions indexed right out of the box.</p>
<p>First, let’s make sure Proxmox knows what’s available.
Open your Proxmox node’s <strong>Shell</strong> and run this:</p>
<pre><code class="hljs language-bash">pveam update
</code></pre>
<p>This tells the Proxmox Entity Appliance Manager to refresh its list. It’s the “apt update” of the container world.</p>
<hr>
<h2>Step 2: Grabbing the Template</h2>
<p>Now, let’s go shopping.</p>
<ol>
<li>In the side panel, click on your <strong>local</strong> storage (under your node name).</li>
<li>Select <strong>CT Templates</strong>.</li>
<li>Click the <strong>Templates</strong> button at the top.</li>
</ol>
<p>You’ll see a massive list of Turnkey Linux apps, Alpine, Arch, Fedora, and more.
Search for <code>ubuntu-24.04</code> (or whatever the latest LTS is for you).</p>
<p><strong>Pro Tip:</strong> If you’re really tight on disk space, <strong>Alpine Linux</strong> templates are usually around 5MB.
Ubuntu is closer to 120MB, but it’s much friendlier if you’re just starting out and don’t want to Google every single command.</p>
<p>Select Ubuntu and hit <strong>Download</strong>.
Once the task shows “OK,” you’re ready to build.</p>
<hr>
<h2>Step 3: The “Create CT” Dance</h2>
<p>Look at the top right of your Proxmox dashboard. See that <strong>Create CT</strong> button?
Click it. This is where we actually build the thing.</p>
<h3>1. General Settings</h3>
<p>This is where you give your container a name and a password.</p>
<pre><code class="hljs language-text">┌──────────────────────────────────────────────────────────────────────────┐
│ Create: Linux Container                                          [ X ]   │
├───────────┬──────────┬────────┬───────┬────────┬─────────┬───────┬───────┤
│ &gt; General │ Template │ Disks  │ CPU   │ Memory │ Network │ DNS   │ Confirm│
├───────────┴──────────┴────────┴───────┴────────┴─────────┴───────┴───────┤
│                                                                          │
│ Node:      pve                                                           │
│ CT ID:     100                                                           │
│ Hostname:  ubuntu-lab-01                                                 │
│                                                                          │
│ [X] Unprivileged container                                               │
│                                                                          │
│ Password:  [ ************ ]                                              │
│ Confirm:   [ ************ ]                                              │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ [ ] Advanced                 [ &lt; Back ] [ Next &gt; ] [ Finish ] [ Cancel ] │
└──────────────────────────────────────────────────────────────────────────┘
</code></pre>
<p><strong>The “Unprivileged” Trap:</strong> Keep <strong>Unprivileged container</strong> checked.
Privileged containers are easier to work with if you’re doing complex hardware passthrough, but they’re a massive security hole.
In a homelab, it’s better to start secure and only open things up if you absolutely have to.</p>
<h3>2. Template Selection</h3>
<p>Pick the Ubuntu image you just downloaded from the <code>local</code> storage.</p>
<h3>3. Disks</h3>
<p>If you check the <a href="https://help.ubuntu.com/community/Installation/SystemRequirements">official Ubuntu requirements</a>, they recommend <strong>25GB</strong> for a full desktop install, or at least <strong>8.6GB</strong> for a minimal install.</p>
<p>Since we’re running a headless LXC container, <strong>8GB or 10GB</strong> is the perfect starting point. It’s enough to hold the OS and a few apps without wasting space.
Remember: You can always grow a disk later in Proxmox, but shrinking one is a nightmare you don’t want to live through.</p>
<h3>4. CPU &amp; Memory</h3>
<p>Ubuntu Desktop officially asks for a <strong>2 GHz dual-core processor</strong> and <strong>2048 MiB (2 GB) of RAM</strong> for virtualized installs. But because we’re skipping the overhead of a full virtual machine:</p>
<ul>
<li><strong>CPU:</strong> <strong>1 Core</strong> is usually plenty for most homelab utility scripts and light servers.</li>
<li><strong>Memory:</strong> <strong>512MB RAM / 512MB Swap</strong> is the “Goldilocks” zone for a headless Ubuntu container.
It’s enough to run comfortably without starving your laptop of its precious RAM.</li>
</ul>
<p>This is the beauty of LXC—you’re running an “official” OS with a fraction of the hardware requirements.</p>
<h3>5. Networking – The Bridge to Reality</h3>
<pre><code class="hljs language-text">┌──────────────────────────────────────────────────────────────────────────┐
│ Create: Linux Container                                          [ X ]   │
├─────────┬──────────┬────────┬───────┬────────┬───────────┬───────┬───────┤
│ General │ Template │ Disks  │ CPU   │ Memory │ &gt; Network │ DNS   │ Confirm│
├─────────┴──────────┴────────┴───────┴────────┴───────────┴───────┴───────┤
│                                                                          │
│ Bridge:    vmbr0                                                         │
│ VLAN Tag:  [         ]                                                   │
│                                                                          │
│ IPv4:      (X) DHCP   ( ) Static                                         │
│ IPv6:      ( ) DHCP   ( ) Static   (X) SLAAC                             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ [ ] Advanced                 [ &lt; Back ] [ Next &gt; ] [ Finish ] [ Cancel ] │
└──────────────────────────────────────────────────────────────────────────┘
</code></pre>
<p><strong>The “vmbr0” bridge</strong> is your virtual switch. It connects your container to your home network.
Set IPv4 to <strong>DHCP</strong> for now—we can mess with static IPs later once we know the container actually works.</p>
<hr>
<h2>Step 4: The Moment of Truth</h2>
<p>Hit <strong>Finish</strong> and watch the task log at the bottom.
Proxmox will carve out the disk space, extract the Ubuntu template, and wire up the networking.</p>
<p>Once it says “TASK OK,” right-click your new container (ID 100) and hit <strong>Start</strong>.
Click <strong>Console</strong>, and you should see a login prompt.</p>
<p><strong>Default Login:</strong></p>
<ul>
<li><strong>User:</strong> <code>root</code></li>
<li><strong>Password:</strong> Whatever you set in Step 1.</li>
</ul>
<h3>First Order of Business</h3>
<p>Once you’re in, do the usual ritual:</p>
<pre><code class="hljs language-bash">apt update &amp;&amp; apt upgrade -y
</code></pre>
<p>If it connects and starts downloading updates, <strong>congratulations</strong>.
You are now running a virtualized Linux environment that’s taking up less than 50MB of RAM.</p>
<hr>
<h2>Final Thoughts: Don’t Be a Hero</h2>
<p>You’ve just built your first container. Now, before you go and install 50 different things and break it:</p>
<ol>
<li><strong>Take a Snapshot:</strong> Go to the container’s “Snapshots” tab and create one named “Fresh Install.” If you mess up a config file later, you can teleport back to this exact moment in seconds.</li>
<li><strong>Back it up:</strong> Set up a simple backup job. A container you can’t restore is just a tragedy waiting to happen.</li>
</ol>
<p>Next time, we’ll talk about <strong>Bind Mounts</strong>—how to let your containers talk to your host’s storage without making a total mess of things.</p>
<p>Until then, happy labbing!</p>
`,r={id:t,slug:e,frontmatter:n,readingTime:o,content:a};export{a as content,r as default,n as frontmatter,t as id,o as readingTime,e as slug};
