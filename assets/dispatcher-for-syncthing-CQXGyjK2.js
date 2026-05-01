const s="2025-07-12-dispatcher-for-syncthing",n="dispatcher-for-syncthing",a={title:"Dispatcher for SyncThing",date:"2025-07-12",author:"jabez007",tags:["syncthing","linux","NetworkManager","debian","wifi-security","bash-scripting","network-dispatcher"],excerpt:`Stop wasting battery on pointless sync attempts.
Learn how to automatically start SyncThing only on trusted networks using NetworkManager scripts with MAC address verification and multi-network support—perfect for local-only setups and travel laptops.
`,featured:!1,draft:!1},t=13,e=`<h1>Smart SyncThing: Auto-Start Only on Trusted Networks</h1>
<p>If you use SyncThing without global discovery or relays, you’ve probably seen it: the “spinning” icon on your laptop tray when you’re away from home. It’s trying to find your home server on a hotel Wi-Fi network that it’ll never reach, chewing through your battery and CPU for no reason.</p>
<p>Running SyncThing exclusively on a local network is a great move for security and speed. It keeps your data off the public internet and simplifies your firewall setup. But it makes the app a resource drain when you’re traveling.</p>
<p>We can solve this by making SyncThing “location-aware.” We’ll set up a script that automatically starts it when you’re on a trusted network and shuts it down the moment you leave, even handling those edge cases where your laptop connects to Wi-Fi before you’ve even logged in.</p>
<h2>The Problem with Local-Only Syncing</h2>
<p>Running SyncThing 24/7 is fine for a server, but for a laptop, it’s often overkill—especially if you’ve disabled global discovery and relays for better privacy.</p>
<p>When you’re at a coffee shop or a hotel:</p>
<ul>
<li><strong>It’s a battery hog:</strong> SyncThing keeps polling for devices it can’t see.</li>
<li><strong>It’s noisy:</strong> It keeps trying to probe the network, which is unnecessary on public Wi-Fi.</li>
<li><strong>It’s useless:</strong> If your “source” devices are all back home on a private LAN, SyncThing has nothing to do.</li>
</ul>
<p>The solution is a NetworkManager dispatcher script. This is a small script that runs whenever your network status changes. Combined with a simple login handler, we can ensure SyncThing only fires up when it actually has a chance of working.</p>
<h2>The Goal</h2>
<p>We’re going to set up a system that:</p>
<ul>
<li>Runs SyncThing as a <strong>user service</strong> (the right way to do it on Linux).</li>
<li>Starts/stops automatically based on <strong>trusted SSIDs or MAC addresses</strong>.</li>
<li>Sends a <strong>desktop notification</strong> so you know when it’s active.</li>
<li>Handles <strong>boot-time connections</strong> (when the Wi-Fi connects before you’ve even typed your password).</li>
</ul>
<h2>Prerequisites</h2>
<p>This guide assumes you’re running:</p>
<ul>
<li>A Debian-based Linux distribution (Ubuntu, Mint, etc.)</li>
<li>NetworkManager for Wi-Fi management</li>
<li>SyncThing already installed</li>
</ul>
<h2>Step 1: Configure SyncThing Service Behavior</h2>
<p>First, let’s move SyncThing from a system service to a user service and configure it properly.</p>
<p>If you’re currently running SyncThing as a system service, stop it:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> systemctl <span class="hljs-built_in">disable</span> --now syncthing@yourusername
</code></pre>
<p>Now we have two options for the user service:</p>
<h3>Option A: Manual Start Only (Recommended)</h3>
<p>If you want SyncThing to ONLY run when on trusted networks:</p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># Make sure the service is not enabled for auto-start</span>
systemctl --user <span class="hljs-built_in">disable</span> syncthing
<span class="hljs-comment"># Make sure it&#x27;s stopped now</span>
systemctl --user stop syncthing
</code></pre>
<p>This way, SyncThing will never auto-start on boot and will only be started by our dispatcher script when you connect to trusted networks.</p>
<h3>Option B: Auto-start but Stop on Untrusted Networks</h3>
<p>If you want SyncThing to start on boot but stop when on untrusted networks:</p>
<pre><code class="hljs language-bash">systemctl --user <span class="hljs-built_in">enable</span> --now syncthing
</code></pre>
<p><strong>Important</strong>: If you choose Option A, SyncThing will only start when you connect to a trusted network.
If you choose Option B, it will start on boot but our script will stop it when you connect to untrusted networks.</p>
<p>For most travel laptop scenarios, <strong>Option A is recommended</strong> because it saves battery and resources when you’re not on trusted networks.</p>
<h2>Step 2: Identify Your Trusted Networks</h2>
<p>We’ll support two methods of identifying trusted networks: SSID-based (simple) and MAC address-based (more secure).</p>
<h3>Method 1: By SSID (Simple)</h3>
<p>Find your current network’s SSID:</p>
<pre><code class="hljs language-bash">nmcli -t -f active,ssid dev wifi | grep <span class="hljs-string">&#x27;^yes&#x27;</span> | <span class="hljs-built_in">cut</span> -d: -f2
</code></pre>
<h3>Method 2: By Router MAC Address (More Secure)</h3>
<p>SSIDs can be spoofed, but MAC addresses are harder to fake. Get your router’s MAC address:</p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># Get the gateway MAC address</span>
ip route show default | awk <span class="hljs-string">&#x27;{print $3}&#x27;</span> | <span class="hljs-built_in">head</span> -1 | xargs ip neigh show | awk <span class="hljs-string">&#x27;{print $5}&#x27;</span> | <span class="hljs-built_in">head</span> -1
</code></pre>
<p>Or check your current connection details:</p>
<pre><code class="hljs language-bash">nmcli -f GENERAL.CONNECTION,IP4.GATEWAY dev show | grep -A1 <span class="hljs-string">&quot;GENERAL.CONNECTION&quot;</span> | grep -E <span class="hljs-string">&quot;(CONNECTION|GATEWAY)&quot;</span>
</code></pre>
<p><strong>Pro tip</strong>: Document multiple trusted networks (home, office, etc.) with their SSIDs and MAC addresses.
We’ll handle multiple networks in our script.</p>
<h2>Step 3: Create the Detection Script</h2>
<p>We’ll use a NetworkManager dispatcher script to handle the heavy lifting. This script supports multiple networks and uses both SSID and MAC address verification to make sure it’s not being fooled by a spoofed network name.</p>
<p>Create the script:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> nano /etc/NetworkManager/dispatcher.d/99-syncthing
</code></pre>
<p>Paste in this logic:</p>
<pre><code class="hljs language-bash"><span class="hljs-meta">#!/bin/bash</span>
<span class="hljs-comment"># File: /etc/NetworkManager/dispatcher.d/99-syncthing</span>
INTERFACE=<span class="hljs-string">&quot;<span class="hljs-variable">$1</span>&quot;</span>
STATUS=<span class="hljs-string">&quot;<span class="hljs-variable">$2</span>&quot;</span>
USER_NAME=<span class="hljs-string">&quot;yourusername&quot;</span>  <span class="hljs-comment"># Change this to your username</span>
USER_UID=$(<span class="hljs-built_in">id</span> -u <span class="hljs-string">&quot;<span class="hljs-variable">$USER_NAME</span>&quot;</span>)
<span class="hljs-built_in">export</span> XDG_RUNTIME_DIR=<span class="hljs-string">&quot;/run/user/<span class="hljs-variable">$USER_UID</span>&quot;</span>
DBUS_SESSION=<span class="hljs-string">&quot;unix:path=<span class="hljs-variable">$XDG_RUNTIME_DIR</span>/bus&quot;</span>

<span class="hljs-comment"># Define trusted networks (add your networks here)</span>
<span class="hljs-built_in">declare</span> -A TRUSTED_NETWORKS=(
    [<span class="hljs-string">&quot;HomeNetwork&quot;</span>]=<span class="hljs-string">&quot;aa:bb:cc:dd:ee:ff&quot;</span>      <span class="hljs-comment"># Home router MAC</span>
    [<span class="hljs-string">&quot;OfficeWiFi&quot;</span>]=<span class="hljs-string">&quot;11:22:33:44:55:66&quot;</span>       <span class="hljs-comment"># Office router MAC</span>
    [<span class="hljs-string">&quot;ParentsHouse&quot;</span>]=<span class="hljs-string">&quot;&quot;</span>                      <span class="hljs-comment"># SSID-only (leave MAC empty)</span>
)

<span class="hljs-comment"># Function to get current network info</span>
<span class="hljs-function"><span class="hljs-title">get_network_info</span></span>() {
    CURRENT_SSID=$(nmcli -t -f active,ssid dev wifi | grep <span class="hljs-string">&#x27;^yes&#x27;</span> | <span class="hljs-built_in">cut</span> -d: -f2)

    <span class="hljs-comment"># Get gateway MAC address</span>
    GATEWAY_IP=$(ip route show default | awk <span class="hljs-string">&#x27;{print $3}&#x27;</span> | <span class="hljs-built_in">head</span> -1)
    <span class="hljs-keyword">if</span> [ -n <span class="hljs-string">&quot;<span class="hljs-variable">$GATEWAY_IP</span>&quot;</span> ]; <span class="hljs-keyword">then</span>
        ping -c1 -W1 <span class="hljs-string">&quot;<span class="hljs-variable">$GATEWAY_IP</span>&quot;</span> &gt;/dev/null 2&gt;&amp;1 || <span class="hljs-literal">true</span>   <span class="hljs-comment"># prime ARP cache</span>
        GATEWAY_MAC=$(ip neigh show <span class="hljs-string">&quot;<span class="hljs-variable">$GATEWAY_IP</span>&quot;</span> | awk <span class="hljs-string">&#x27;$5 ~ /^[0-9a-f:]{17}$/ {print $5}&#x27;</span> | <span class="hljs-built_in">head</span> -1)
    <span class="hljs-keyword">else</span>
        GATEWAY_MAC=<span class="hljs-string">&quot;&quot;</span>
    <span class="hljs-keyword">fi</span>
}

<span class="hljs-comment"># Function to check if current network is trusted</span>
<span class="hljs-function"><span class="hljs-title">is_trusted_network</span></span>() {
    get_network_info

    <span class="hljs-comment"># Check each trusted network</span>
    <span class="hljs-keyword">for</span> ssid <span class="hljs-keyword">in</span> <span class="hljs-string">&quot;<span class="hljs-variable">\${!TRUSTED_NETWORKS[@]}</span>&quot;</span>; <span class="hljs-keyword">do</span>
        expected_mac=<span class="hljs-string">&quot;<span class="hljs-variable">\${TRUSTED_NETWORKS[$ssid]}</span>&quot;</span>

        <span class="hljs-keyword">if</span> [ <span class="hljs-string">&quot;<span class="hljs-variable">$CURRENT_SSID</span>&quot;</span> = <span class="hljs-string">&quot;<span class="hljs-variable">$ssid</span>&quot;</span> ]; <span class="hljs-keyword">then</span>
            <span class="hljs-comment"># If MAC is specified, verify it matches</span>
            <span class="hljs-keyword">if</span> [ -n <span class="hljs-string">&quot;<span class="hljs-variable">$expected_mac</span>&quot;</span> ]; <span class="hljs-keyword">then</span>
                <span class="hljs-keyword">if</span> [ <span class="hljs-string">&quot;<span class="hljs-variable">$GATEWAY_MAC</span>&quot;</span> = <span class="hljs-string">&quot;<span class="hljs-variable">$expected_mac</span>&quot;</span> ]; <span class="hljs-keyword">then</span>
                    <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Trusted network: <span class="hljs-variable">$ssid</span> (MAC verified: <span class="hljs-variable">$expected_mac</span>)&quot;</span>
                    <span class="hljs-built_in">return</span> 0
                <span class="hljs-keyword">else</span>
                    <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;SSID matches but MAC doesn&#x27;t: expected <span class="hljs-variable">$expected_mac</span>, got <span class="hljs-variable">$GATEWAY_MAC</span>&quot;</span>
                    <span class="hljs-built_in">continue</span>
                <span class="hljs-keyword">fi</span>
            <span class="hljs-keyword">else</span>
                <span class="hljs-comment"># SSID-only check (no MAC verification)</span>
                <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Trusted network: <span class="hljs-variable">$ssid</span> (SSID-only)&quot;</span>
                <span class="hljs-built_in">return</span> 0
            <span class="hljs-keyword">fi</span>
        <span class="hljs-keyword">fi</span>
    <span class="hljs-keyword">done</span>

    <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Untrusted network: <span class="hljs-variable">$CURRENT_SSID</span>&quot;</span>
    <span class="hljs-built_in">return</span> 1
}

<span class="hljs-comment"># Function to check if user session is available</span>
<span class="hljs-function"><span class="hljs-title">is_user_session_available</span></span>() {
    <span class="hljs-comment"># Check if user session bus exists and is responsive</span>
    <span class="hljs-keyword">if</span> [ -S <span class="hljs-string">&quot;<span class="hljs-variable">$XDG_RUNTIME_DIR</span>/bus&quot;</span> ]; <span class="hljs-keyword">then</span>
        <span class="hljs-keyword">if</span> runuser -u <span class="hljs-string">&quot;<span class="hljs-variable">$USER_NAME</span>&quot;</span> -- \\
            <span class="hljs-built_in">env</span> DBUS_SESSION_BUS_ADDRESS=<span class="hljs-string">&quot;<span class="hljs-variable">$DBUS_SESSION</span>&quot;</span> \\
            systemctl --user list-units &gt;/dev/null 2&gt;&amp;1; <span class="hljs-keyword">then</span>
            <span class="hljs-built_in">return</span> 0
        <span class="hljs-keyword">fi</span>
    <span class="hljs-keyword">fi</span>
    <span class="hljs-built_in">return</span> 1
}

<span class="hljs-comment"># Function to check if SyncThing is running (as the specified user)</span>
<span class="hljs-function"><span class="hljs-title">is_syncthing_running</span></span>() {
    <span class="hljs-keyword">if</span> ! is_user_session_available; <span class="hljs-keyword">then</span>
        <span class="hljs-built_in">return</span> 1  <span class="hljs-comment"># Can&#x27;t check if session isn&#x27;t available</span>
    <span class="hljs-keyword">fi</span>

    runuser -u <span class="hljs-string">&quot;<span class="hljs-variable">$USER_NAME</span>&quot;</span> -- \\
        <span class="hljs-built_in">env</span> DBUS_SESSION_BUS_ADDRESS=<span class="hljs-string">&quot;<span class="hljs-variable">$DBUS_SESSION</span>&quot;</span> \\
        systemctl --user is-active --quiet syncthing
}

<span class="hljs-comment"># Function to start SyncThing</span>
<span class="hljs-function"><span class="hljs-title">start_syncthing</span></span>() {
    <span class="hljs-comment"># Check if user session is available</span>
    <span class="hljs-keyword">if</span> ! is_user_session_available; <span class="hljs-keyword">then</span>
        <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;User session not available, cannot start SyncThing&quot;</span>
        <span class="hljs-built_in">return</span> 1
    <span class="hljs-keyword">fi</span>

    <span class="hljs-comment"># Check if SyncThing is already running</span>
    <span class="hljs-keyword">if</span> ! is_syncthing_running; <span class="hljs-keyword">then</span>
        runuser -u <span class="hljs-string">&quot;<span class="hljs-variable">$USER_NAME</span>&quot;</span> -- \\
            <span class="hljs-built_in">env</span> DBUS_SESSION_BUS_ADDRESS=<span class="hljs-string">&quot;<span class="hljs-variable">$DBUS_SESSION</span>&quot;</span> \\
            systemctl --user start syncthing

        <span class="hljs-comment"># Try to send notification (may fail if no display session)</span>
        runuser -u <span class="hljs-string">&quot;<span class="hljs-variable">$USER_NAME</span>&quot;</span> -- \\
            <span class="hljs-built_in">env</span> DBUS_SESSION_BUS_ADDRESS=<span class="hljs-string">&quot;<span class="hljs-variable">$DBUS_SESSION</span>&quot;</span> DISPLAY=:0 \\
            notify-send <span class="hljs-string">&quot;SyncThing&quot;</span> <span class="hljs-string">&quot;Started on trusted network: <span class="hljs-variable">$CURRENT_SSID</span>&quot;</span> --icon=dialog-information 2&gt;/dev/null || <span class="hljs-literal">true</span>
    <span class="hljs-keyword">fi</span>
}

<span class="hljs-comment"># Function to stop SyncThing</span>
<span class="hljs-function"><span class="hljs-title">stop_syncthing</span></span>() {
    <span class="hljs-comment"># Check if user session is available</span>
    <span class="hljs-keyword">if</span> ! is_user_session_available; <span class="hljs-keyword">then</span>
        <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;User session not available, cannot stop SyncThing&quot;</span>
        <span class="hljs-built_in">return</span> 1
    <span class="hljs-keyword">fi</span>

    <span class="hljs-comment"># Check if SyncThing is actually running before stopping</span>
    <span class="hljs-keyword">if</span> is_syncthing_running; <span class="hljs-keyword">then</span>
        runuser -u <span class="hljs-string">&quot;<span class="hljs-variable">$USER_NAME</span>&quot;</span> -- \\
            <span class="hljs-built_in">env</span> DBUS_SESSION_BUS_ADDRESS=<span class="hljs-string">&quot;<span class="hljs-variable">$DBUS_SESSION</span>&quot;</span> \\
            systemctl --user stop syncthing

        <span class="hljs-comment"># Try to send notification (may fail if no display session)</span>
        runuser -u <span class="hljs-string">&quot;<span class="hljs-variable">$USER_NAME</span>&quot;</span> -- \\
            <span class="hljs-built_in">env</span> DBUS_SESSION_BUS_ADDRESS=<span class="hljs-string">&quot;<span class="hljs-variable">$DBUS_SESSION</span>&quot;</span> DISPLAY=:0 \\
            notify-send <span class="hljs-string">&quot;SyncThing&quot;</span> <span class="hljs-string">&quot;Stopped (untrusted network: <span class="hljs-variable">$CURRENT_SSID</span>)&quot;</span> --icon=dialog-warning 2&gt;/dev/null || <span class="hljs-literal">true</span>
    <span class="hljs-keyword">fi</span>
}

<span class="hljs-comment"># Function to create a flag file indicating we should start SyncThing when user logs in</span>
<span class="hljs-function"><span class="hljs-title">create_pending_start_flag</span></span>() {
    <span class="hljs-built_in">mkdir</span> -p <span class="hljs-string">&quot;/tmp/syncthing-flags&quot;</span>
    <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;<span class="hljs-variable">$CURRENT_SSID</span>&quot;</span> &gt; <span class="hljs-string">&quot;/tmp/syncthing-flags/pending-start-<span class="hljs-variable">$USER_NAME</span>&quot;</span>
    <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Created flag to start SyncThing on trusted network when user logs in&quot;</span>
}

<span class="hljs-comment"># Function to remove the pending start flag</span>
<span class="hljs-function"><span class="hljs-title">remove_pending_start_flag</span></span>() {
    <span class="hljs-built_in">rm</span> -f <span class="hljs-string">&quot;/tmp/syncthing-flags/pending-start-<span class="hljs-variable">$USER_NAME</span>&quot;</span>
}

<span class="hljs-comment"># Main logic - only run if called directly (not sourced)</span>
<span class="hljs-keyword">if</span> [ <span class="hljs-string">&quot;<span class="hljs-variable">\${BASH_SOURCE[0]}</span>&quot;</span> = <span class="hljs-string">&quot;<span class="hljs-variable">\${0}</span>&quot;</span> ]; <span class="hljs-keyword">then</span>
    <span class="hljs-keyword">if</span> [ <span class="hljs-string">&quot;<span class="hljs-variable">$STATUS</span>&quot;</span> = <span class="hljs-string">&quot;up&quot;</span> ]; <span class="hljs-keyword">then</span>
        <span class="hljs-keyword">if</span> is_trusted_network; <span class="hljs-keyword">then</span>
            <span class="hljs-keyword">if</span> is_user_session_available; <span class="hljs-keyword">then</span>
                start_syncthing
                remove_pending_start_flag
            <span class="hljs-keyword">else</span>
                <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Trusted network detected but user session not available&quot;</span>
                create_pending_start_flag
            <span class="hljs-keyword">fi</span>
        <span class="hljs-keyword">else</span>
            <span class="hljs-comment"># Stop SyncThing if connecting to untrusted network and remove any pending flags</span>
            <span class="hljs-keyword">if</span> is_user_session_available; <span class="hljs-keyword">then</span>
                stop_syncthing
            <span class="hljs-keyword">fi</span>
            remove_pending_start_flag
        <span class="hljs-keyword">fi</span>
    <span class="hljs-keyword">elif</span> [ <span class="hljs-string">&quot;<span class="hljs-variable">$STATUS</span>&quot;</span> = <span class="hljs-string">&quot;down&quot;</span> ]; <span class="hljs-keyword">then</span>
        <span class="hljs-comment"># Always stop on disconnect and remove pending flags</span>
        <span class="hljs-keyword">if</span> is_user_session_available; <span class="hljs-keyword">then</span>
            stop_syncthing
        <span class="hljs-keyword">fi</span>
        remove_pending_start_flag
    <span class="hljs-keyword">fi</span>
<span class="hljs-keyword">fi</span>
</code></pre>
<p><strong>Important</strong>: Update the <code>TRUSTED_NETWORKS</code> array with your actual network names and MAC addresses.
Leave the MAC address empty (<code>&quot;&quot;</code>) if you want SSID-only verification for that network.</p>
<p>Make the script executable:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chmod</span> +x /etc/NetworkManager/dispatcher.d/99-syncthing
</code></pre>
<h2>Step 4: Create the Login Handler</h2>
<p>The dispatcher script handles immediate connections, but what if your laptop boots up, connects to WiFi, and then you don’t log in for a few minutes? We need a login handler to catch these scenarios.</p>
<p>Create the login handler script:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> nano /usr/local/bin/syncthing-login-handler.sh
</code></pre>
<p>Add this content:</p>
<pre><code class="hljs language-bash"><span class="hljs-meta">#!/bin/bash</span>
<span class="hljs-comment"># File: /usr/local/bin/syncthing-login-handler.sh</span>
<span class="hljs-comment"># This script runs when the user logs in to handle delayed SyncThing startup</span>

USER_NAME=<span class="hljs-string">&quot;yourusername&quot;</span>  <span class="hljs-comment"># Change this to your username</span>
FLAG_FILE=<span class="hljs-string">&quot;/tmp/syncthing-flags/pending-start-<span class="hljs-variable">$USER_NAME</span>&quot;</span>

<span class="hljs-comment"># Give the user session a moment to fully initialize</span>
<span class="hljs-built_in">sleep</span> 3

<span class="hljs-comment"># Source the functions from the dispatcher script</span>
<span class="hljs-built_in">source</span> /etc/NetworkManager/dispatcher.d/99-syncthing

<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Login handler: Checking for SyncThing startup conditions...&quot;</span>

<span class="hljs-comment"># Method 1: Check if there&#x27;s a pending start flag (from when network came up but user wasn&#x27;t logged in)</span>
<span class="hljs-keyword">if</span> [ -f <span class="hljs-string">&quot;<span class="hljs-variable">$FLAG_FILE</span>&quot;</span> ]; <span class="hljs-keyword">then</span>
    FLAGGED_NETWORK=$(<span class="hljs-built_in">cat</span> <span class="hljs-string">&quot;<span class="hljs-variable">$FLAG_FILE</span>&quot;</span>)
    <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Found pending start flag for network: <span class="hljs-variable">$FLAGGED_NETWORK</span>&quot;</span>

    <span class="hljs-comment"># Verify we&#x27;re still on a trusted network (network might have changed)</span>
    <span class="hljs-keyword">if</span> is_trusted_network &amp;&amp; ! is_syncthing_running; <span class="hljs-keyword">then</span>
        <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Starting SyncThing due to pending flag...&quot;</span>
        start_syncthing
    <span class="hljs-keyword">fi</span>

    <span class="hljs-comment"># Remove the flag either way</span>
    <span class="hljs-built_in">rm</span> -f <span class="hljs-string">&quot;<span class="hljs-variable">$FLAG_FILE</span>&quot;</span>
<span class="hljs-keyword">fi</span>

<span class="hljs-comment"># Method 2: Also check current network status regardless of flag</span>
<span class="hljs-keyword">if</span> is_trusted_network &amp;&amp; ! is_syncthing_running; <span class="hljs-keyword">then</span>
    <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;User logged in on trusted network, starting SyncThing...&quot;</span>
    start_syncthing
<span class="hljs-keyword">fi</span>

<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;Login handler: Complete&quot;</span>
</code></pre>
<p><strong>Important</strong>: Update <code>yourusername</code> to your actual username in this script too.</p>
<p>Make it executable:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">sudo</span> <span class="hljs-built_in">chmod</span> +x /usr/local/bin/syncthing-login-handler.sh
</code></pre>
<h2>Step 5: Set Up Automatic Login Handling</h2>
<p>Create an autostart entry that runs the login handler when you log into your desktop:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">mkdir</span> -p ~/.config/autostart
</code></pre>
<p>Create the autostart file:</p>
<pre><code class="hljs language-bash">nano ~/.config/autostart/syncthing-login-check.desktop
</code></pre>
<p>Add this content:</p>
<pre><code class="hljs language-ini"><span class="hljs-section">[Desktop Entry]</span>
<span class="hljs-attr">Type</span>=Application
<span class="hljs-attr">Name</span>=SyncThing Network Check
<span class="hljs-attr">Exec</span>=/usr/local/bin/syncthing-login-handler.sh
<span class="hljs-attr">Hidden</span>=<span class="hljs-literal">false</span>
<span class="hljs-attr">NoDisplay</span>=<span class="hljs-literal">true</span>
<span class="hljs-attr">X-GNOME-Autostart-enabled</span>=<span class="hljs-literal">true</span>
<span class="hljs-attr">X-GNOME-Autostart-Delay</span>=<span class="hljs-number">10</span>
</code></pre>
<p>This will run the login handler 10 seconds after you log in, giving your desktop session time to fully initialize.</p>
<h2>Step 6: Testing the Setup</h2>
<p>You can test this by toggling your Wi-Fi or switching between networks.</p>
<h3>Test 1: Immediate Login</h3>
<ol>
<li>Stop SyncThing manually: <code>systemctl --user stop syncthing</code></li>
<li>Connect to your home Wi-Fi. SyncThing should start immediately and send a notification.</li>
</ol>
<h3>Test 2: The “Boot and Wait” scenario</h3>
<ol>
<li>Reboot.</li>
<li>Let the laptop connect to Wi-Fi at the login screen.</li>
<li>Wait a minute, then log in.</li>
<li>The login handler should see the “pending” flag created by the dispatcher and start SyncThing.</li>
</ol>
<h2>How it Works</h2>
<p>The system handles two different states:</p>
<ol>
<li><strong>Immediate Handling:</strong> If you’re already logged in, the dispatcher script starts/stops the service as soon as the network changes.</li>
<li><strong>Deferred Handling:</strong> If the network connects before you log in, the dispatcher can’t talk to your user session yet. It leaves a “pending” flag in <code>/tmp</code>. When you eventually log in, the login handler sees that flag and finishes the job.</li>
</ol>
<p>This covers every common scenario: switching networks while working, booting up at a cafe, or coming home and opening your laptop.</p>
<h2>Troubleshooting &amp; Debugging</h2>
<h3>Not working as expected?</h3>
<p>Add detailed logging to your dispatcher script by adding this line after the <code>DBUS_SESSION=</code> line:</p>
<pre><code class="hljs language-bash">LOG_FILE=<span class="hljs-string">&quot;/tmp/syncthing-dispatch.log&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;<span class="hljs-subst">$(date)</span> - <span class="hljs-variable">$STATUS</span> on <span class="hljs-variable">$INTERFACE</span>&quot;</span> &gt;&gt; <span class="hljs-string">&quot;<span class="hljs-variable">$LOG_FILE</span>&quot;</span>
</code></pre>
<p>Check the logs:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">tail</span> -f /tmp/syncthing-dispatch.log
</code></pre>
<h3>Common issues:</h3>
<ul>
<li><strong>Login handler not running</strong>: Check that the desktop file is in <code>~/.config/autostart/</code> and has the correct permissions</li>
<li><strong>SyncThing starts but login handler doesn’t see it</strong>: The login handler waits 3 seconds after login - this might need adjustment for slower systems</li>
<li><strong>Pending flags not cleared</strong>: Check the <code>/tmp/syncthing-flags/</code> directory for leftover flag files</li>
<li><strong>SyncThing keeps running on untrusted networks</strong>: Check that the script is executable and the <code>TRUSTED_NETWORKS</code> array is configured correctly</li>
<li><strong>Multiple desktop environments</strong>: Some desktop environments might not honor the autostart delay - try increasing <code>X-GNOME-Autostart-Delay</code></li>
</ul>
<h3>Debugging the login handler</h3>
<p>Test the login handler manually:</p>
<pre><code class="hljs language-bash">/usr/local/bin/syncthing-login-handler.sh
</code></pre>
<p>This will show you exactly what it’s detecting and doing.</p>
<h2>Advanced Customizations</h2>
<h3>Alternative to Autostart: Systemd User Service</h3>
<p>Instead of using autostart, you can create a systemd user service for the login handler:</p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># Create ~/.config/systemd/user/syncthing-login-handler.service</span>
<span class="hljs-built_in">mkdir</span> -p ~/.config/systemd/user
<span class="hljs-built_in">cat</span> &gt; ~/.config/systemd/user/syncthing-login-handler.service &lt;&lt; <span class="hljs-string">&#x27;EOF&#x27;</span>
[Unit]
Description=SyncThing Login Handler
After=graphical-session.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/syncthing-login-handler.sh
RemainAfterExit=<span class="hljs-literal">true</span>

[Install]
WantedBy=default.target
EOF

<span class="hljs-comment"># Enable it</span>
systemctl --user <span class="hljs-built_in">enable</span> syncthing-login-handler.service
</code></pre>
<h3>Adding more trusted networks</h3>
<p>Simply add them to the <code>TRUSTED_NETWORKS</code> array in both the dispatcher script and login handler:</p>
<pre><code class="hljs language-bash"><span class="hljs-built_in">declare</span> -A TRUSTED_NETWORKS=(
    [<span class="hljs-string">&quot;HomeNetwork&quot;</span>]=<span class="hljs-string">&quot;aa:bb:cc:dd:ee:ff&quot;</span>
    [<span class="hljs-string">&quot;OfficeWiFi&quot;</span>]=<span class="hljs-string">&quot;11:22:33:44:55:66&quot;</span>
    [<span class="hljs-string">&quot;ParentsHouse&quot;</span>]=<span class="hljs-string">&quot;&quot;</span>                    <span class="hljs-comment"># SSID-only</span>
    [<span class="hljs-string">&quot;VacationRental&quot;</span>]=<span class="hljs-string">&quot;99:88:77:66:55:44&quot;</span> <span class="hljs-comment"># Another MAC-verified network</span>
)
</code></pre>
<h3>Enhanced logging for debugging</h3>
<p>Add more detailed logging to track the login handling flow:</p>
<pre><code class="hljs language-bash"><span class="hljs-comment"># Add to both scripts</span>
LOG_FILE=<span class="hljs-string">&quot;/tmp/syncthing-handler.log&quot;</span>
<span class="hljs-function"><span class="hljs-title">log_message</span></span>() {
    <span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;<span class="hljs-subst">$(date &#x27;+%Y-%m-%d %H:%M:%S&#x27;)</span> - <span class="hljs-variable">$1</span>&quot;</span> | <span class="hljs-built_in">tee</span> -a <span class="hljs-string">&quot;<span class="hljs-variable">$LOG_FILE</span>&quot;</span>
}
</code></pre>
<h2>Why This Matters for Local Setups</h2>
<p>This setup effectively makes SyncThing “quiet” when it’s not useful. Your travel laptop stops fruitlessly searching for your home server while you’re at a hotel, which saves battery and stops cluttering your logs with connection errors.</p>
<p>The best part is that it’s set-and-forget. Whether you log in immediately or come back to your laptop an hour after booting, the sync will start exactly when it should. When you get back home, your files just start appearing without you having to touch a single setting.</p>
<h2>A Note on Security</h2>
<p>Using MAC address verification adds a nice layer of protection against SSID spoofing, but remember that MAC addresses can be faked too. This setup is a great way to reduce your attack surface (by not running the service on public Wi-Fi), but it shouldn’t be your <em>only</em> security measure. Always use strong Wi-Fi passwords and keep your SyncThing device IDs private.</p>
<h2>Wrapping Up</h2>
<p>Managing SyncThing manually is a pain, and letting it run 24/7 on a laptop is wasteful. By offloading the “thinking” to a dispatcher script, you get the best of both worlds: a secure, local-only sync setup that only consumes resources when it’s actually capable of syncing.</p>
<p>It’s a simple fix that solves a common annoyance for Linux road warriors. Once it’s running, you can stop worrying about your battery or your bandwidth and just let the scripts handle the logistics.</p>
`,l={id:s,slug:n,frontmatter:a,readingTime:t,content:e};export{e as content,l as default,a as frontmatter,s as id,t as readingTime,n as slug};
