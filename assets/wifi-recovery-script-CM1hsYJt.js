const s="2024-11-24-wifi-recovery-script",n="wifi-recovery-script",e={title:"Wifi Recovery Script",date:"2024-11-24",author:"jabez007",tags:["homelab","bash","NetworkManager","linux","wifi","automation","troubleshooting","self-healing","ssh","scripting"],excerpt:`There's nothing more annoying than trying to SSH into a homelab server only to find it's dropped off the network. Here is a simple script to handle those annoying WiFi disconnects automatically.
`,featured:!1,draft:!1},a=4,t=`<h1>A Simple WiFi Recovery Script for Flaky Homelab Servers</h1>
<p>There is nothing more annoying than trying to SSH into a homelab server only to find it’s dropped off the network. If you’re using an old laptop as a server (like I am), you’ve probably run into this.</p>
<p>My old ThinkPad running Bodhi Linux usually works great, but it has one annoying habit: whenever my router reboots overnight for firmware updates, the laptop loses its connection and stays disconnected. NetworkManager just gives up instead of trying again once the WiFi is back.</p>
<p>I got tired of manually restarting things, so I wrote a quick script to handle it.</p>
<hr>
<h2>Identifying the Problem</h2>
<p>I eventually figured out that it was a simple failure mode: the router reboots overnight, the WiFi drops, and NetworkManager stays idle once it sees the interface is up but lacks an IP. It’s frustrating because a manual <code>sudo systemctl restart NetworkManager</code> always fixes it immediately.</p>
<h2>The WiFi Recovery Script</h2>
<p>The idea is to check for an IP address on the WiFi interface every few minutes. If it’s missing, restart NetworkManager.</p>
<p>Here’s the script I use. Save it as <code>/usr/local/bin/check_wifi.sh</code>:</p>
<pre><code class="hljs language-bash"><span class="hljs-meta">#!/bin/bash</span>

<span class="hljs-comment"># Configuration - adjust these for your setup</span>
WIFI_INTERFACE=<span class="hljs-string">&quot;wlp2s0&quot;</span>  <span class="hljs-comment"># Find yours with: ip link show</span>
LOG_FILE=<span class="hljs-string">&quot;/var/log/wifi_recovery.log&quot;</span>

<span class="hljs-comment"># Function to log with timestamps (because debugging is easier with context)</span>
<span class="hljs-function"><span class="hljs-title">log_message</span></span>() {
    <span class="hljs-built_in">local</span> message=<span class="hljs-string">&quot;<span class="hljs-variable">$1</span>&quot;</span>
    <span class="hljs-built_in">printf</span> <span class="hljs-string">&quot;%s: %s\\\\n&quot;</span> <span class="hljs-string">&quot;<span class="hljs-subst">$(date &#x27;+%Y-%m-%d %H:%M:%S&#x27;)</span>&quot;</span> <span class="hljs-string">&quot;<span class="hljs-variable">$message</span>&quot;</span> &gt;&gt; <span class="hljs-string">&quot;<span class="hljs-variable">$LOG_FILE</span>&quot;</span>
}

<span class="hljs-comment"># The main event: check WiFi status and fix if broken</span>
<span class="hljs-function"><span class="hljs-title">check_wifi_and_restart</span></span>() {
    <span class="hljs-comment"># Extract IP address from the interface (grep magic)</span>
    <span class="hljs-built_in">local</span> ip; ip=$(ip addr show <span class="hljs-string">&quot;<span class="hljs-variable">$WIFI_INTERFACE</span>&quot;</span> | grep -Po <span class="hljs-string">&#x27;inet \\\\K[\\\\d.]+&#x27;</span>)

    <span class="hljs-keyword">if</span> [[ -z <span class="hljs-string">&quot;<span class="hljs-variable">$ip</span>&quot;</span> ]]; <span class="hljs-keyword">then</span>
        log_message <span class="hljs-string">&quot;🚨 No IP address on <span class="hljs-variable">$WIFI_INTERFACE</span>. Attempting rescue...&quot;</span>

        <span class="hljs-comment"># Restart NetworkManager and log the result</span>
        <span class="hljs-keyword">if</span> <span class="hljs-built_in">sudo</span> /usr/bin/systemctl restart NetworkManager; <span class="hljs-keyword">then</span>
            log_message <span class="hljs-string">&quot;✅ NetworkManager restarted successfully&quot;</span>
            <span class="hljs-built_in">sleep</span> 10  <span class="hljs-comment"># Give it a moment to reconnect</span>

            <span class="hljs-comment"># Check if we got an IP back</span>
            <span class="hljs-built_in">local</span> new_ip; new_ip=$(ip addr show <span class="hljs-string">&quot;<span class="hljs-variable">$WIFI_INTERFACE</span>&quot;</span> | grep -Po <span class="hljs-string">&#x27;inet \\\\K[\\\\d.]+&#x27;</span>)
            <span class="hljs-keyword">if</span> [[ -n <span class="hljs-string">&quot;<span class="hljs-variable">$new_ip</span>&quot;</span> ]]; <span class="hljs-keyword">then</span>
                log_message <span class="hljs-string">&quot;🎉 WiFi recovered! New IP: <span class="hljs-variable">$new_ip</span>&quot;</span>
            <span class="hljs-keyword">else</span>
                log_message <span class="hljs-string">&quot;⚠️  NetworkManager restarted but no IP assigned yet&quot;</span>
            <span class="hljs-keyword">fi</span>
        <span class="hljs-keyword">else</span>
            log_message <span class="hljs-string">&quot;❌ Failed to restart NetworkManager&quot;</span>
        <span class="hljs-keyword">fi</span>
    <span class="hljs-keyword">else</span>
        log_message <span class="hljs-string">&quot;✓ WiFi healthy with IP: <span class="hljs-variable">$ip</span>&quot;</span>
    <span class="hljs-keyword">fi</span>
}

<span class="hljs-comment"># Execute the check</span>
check_wifi_and_restart
</code></pre>
<p>Make it executable:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chmod</span> +x /usr/local/bin/check_wifi.sh
</code></pre>
<p>It’s a good idea to test the script manually first by temporarily disconnecting your WiFi to ensure it handles the recovery as expected.</p>
<hr>
<h2>Setting Up Passwordless Sudo</h2>
<p>Since the script needs to restart a system service, it needs to run as root or have sudo privileges. A secure way to do this is to only allow the user account to run that specific command without a password.</p>
<ol>
<li>
<p>Edit the sudoers file with <code>sudo visudo</code>. Don’t edit the file directly in <code>/etc/sudoers</code>.</p>
</li>
<li>
<p>Add this line at the end, replacing <code>jabez</code> with your username:</p>
<pre><code>jabez ALL = NOPASSWD: /usr/bin/systemctl restart NetworkManager
</code></pre>
</li>
</ol>
<p>Now you can test it with <code>sudo /usr/bin/systemctl restart NetworkManager</code> and it should run without prompting for your password.</p>
<h2>Automating the Check</h2>
<p>To make it actually “self-healing,” you can set it to run via cron every few minutes. Open your crontab with <code>crontab -e</code> and add this line:</p>
<pre><code>*/5 * * * * /usr/local/bin/check_wifi.sh
</code></pre>
<p>Running it every five minutes is frequent enough to catch most disconnects quickly without cluttering up the system logs too much. Make sure cron is enabled and running:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl <span class="hljs-built_in">enable</span> --now cron
</code></pre>
<hr>
<h2>Monitoring the Script</h2>
<p>You can check the script’s logs with <code>tail -f /var/log/wifi_recovery.log</code>. A successful recovery will look like this:</p>
<pre><code>2024-11-24 14:40:01: 🚨 No IP address on wlp2s0. Attempting rescue...
2024-11-24 14:40:02: ✅ NetworkManager restarted successfully
2024-11-24 14:40:12: 🎉 WiFi recovered! New IP: 192.168.1.100
</code></pre>
<h2>Troubleshooting and Adapting</h2>
<p>If the script doesn’t seem to be running, verify that cron is active and the script is marked executable. If you have trouble writing to <code>/var/log</code>, you can change the <code>LOG_FILE</code> path in the script to something in your home directory.</p>
<p>This same pattern—<strong>monitor, detect, and restart</strong>—works for other unreliable services too. I’ve used it for restarting Docker containers or VPN tunnels that occasionally hang. It’s often faster than tracking down a weird, deep-seated config bug in NetworkManager.</p>
<p>Sometimes a simple 30-line script is better than weeks of debugging. Now, instead of wondering why SSH is failing, I can trust my server will fix its own connection issues within a few minutes. If you’re running a homelab on old hardware, it’s a small bit of automation that makes a big difference.</p>
`,o={id:s,slug:n,frontmatter:e,readingTime:a,content:t};export{t as content,o as default,e as frontmatter,s as id,a as readingTime,n as slug};
