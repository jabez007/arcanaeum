const e="2026-04-04-architecting-universal-remote",t="architecting-universal-remote",s={title:"The Ghost in the Circular Buffer: Architecting a Universal Remote",date:"2026-04-04",author:"jabez007",tags:["flipperzero","cyphercon9","embedded-systems","mvc","software-architecture","c-programming","unit-testing"],excerpt:`With the core IR protocol verified, the challenge shifted from a single script to a comprehensive system. A "Universal Remote" requires state, concurrency, and persistence. It also requires the ability to fail gracefully—a lesson the Flipper Zero taught us multiple times.
`,featured:!0,draft:!1},n=6,a=`<p>With the core IR protocol verified and the “Quick Greet” prototype successful, the challenge shifted from a single-function script to a comprehensive, multi-featured system. A “Universal Remote” for the Cyphercon 9 ecosystem required more than just transmission; it needed state management, background sniffing, and data persistence. It also required the ability to fail gracefully—a lesson the Flipper Zero taught us multiple times through a series of system-wide crashes.</p>
<h2>Architectural Turmoil: The Debugging Odyssey</h2>
<p>Expanding the app into a multi-threaded, menu-driven interface introduced a cascade of “Fatal Errors.” These crashes were fundamental violations of the Flipper SDK’s constraints, often caused by the strict timing and memory requirements of the platform.</p>
<h3>1. The “NULL Pointer” and the Uninitialized Heap</h3>
<p>Early in the development, the Flipper would crash instantly upon opening the sniffer log. We discovered that we were using <code>malloc()</code> to allocate our application structure but failing to zero-initialize it.</p>
<pre><code class="hljs language-c">Cy9RemoteApp* app = <span class="hljs-built_in">malloc</span>(<span class="hljs-keyword">sizeof</span>(Cy9RemoteApp));
furi_check(app); 
<span class="hljs-built_in">memset</span>(app, <span class="hljs-number">0</span>, <span class="hljs-keyword">sizeof</span>(Cy9RemoteApp)); <span class="hljs-comment">// This line was missing!</span>
</code></pre>
<p>In a standard OS, uninitialized memory might cause minor glitches. In an embedded C environment, an uninitialized <code>logged_count</code> variable containing random garbage (like <code>0x4F2A</code>) caused the UI thread to try and draw 20,000 non-existent Badge IDs, leading to an immediate out-of-bounds memory access and a system reboot.</p>
<h3>2. The “furi_check” Double-Stop</h3>
<p>The most persistent crash occurred when pressing the “Back” button to exit the sniffer. We learned that the Flipper’s Infrared HAL is strictly stateful. If you call <code>furi_hal_infrared_async_rx_stop()</code> on a receiver that is <em>already</em> stopped, the driver triggers a safety crash. We had to implement a <code>rx_active</code> flag and a “stop-before-start” sequence to satisfy the hardware’s internal mutexes.</p>
<h2>The Mystery of IDs 16128 and 768</h2>
<p>As the Sniffer Log came to life, we encountered a puzzling new bug: the Flipper was capturing Badge IDs like <code>16128</code> and <code>768</code>, which were far outside the valid range of 0-675.</p>
<p>By analyzing the binary representation of these numbers, we uncovered the final nuance of the protocol. Because the “wire order” was reversed over the air, the high and low bytes of the 16-bit IDs were being swapped in our circular buffer relative to their position in the MicroPython memory. <code>16128</code> (Hex <code>0x3F00</code>) was actually <code>0x003F</code>—ID 63 (an “Extreme” badge).</p>
<h3>The Endianness Trap</h3>
<p>This was a classic collision between architecture and protocol. The RP2040 is natively <strong>Little-Endian</strong>, meaning it stores the low byte of a 16-bit integer first. While the conference protocol header was designed to be Big-Endian, the badge firmware often packed the ID field in the RP2040’s native order: <code>[11:Low, 12:High]</code>.</p>
<p>When the badge transmitted the packet in reverse (<code>46 -&gt; 0</code>), the <strong>High Byte (Index 12)</strong> was actually sent over the air <strong>before</strong> the Low Byte (Index 11). Consequently, in our Flipper’s circular buffer, the byte that arrived earlier (and thus sat “further back” from the Syncword) was the High Byte.</p>
<pre><code class="hljs language-c"><span class="hljs-comment">// CORRECTED BYTE ORDER: Index 12 is Hi, 11 is Lo in the reversed wire stream</span>
<span class="hljs-type">uint16_t</span> id = (pkt_circ[(p_idx + <span class="hljs-number">47</span> - <span class="hljs-number">12</span>) % <span class="hljs-number">47</span>] &lt;&lt; <span class="hljs-number">8</span>) | 
               pkt_circ[(p_idx + <span class="hljs-number">47</span> - <span class="hljs-number">11</span>) % <span class="hljs-number">47</span>];
</code></pre>
<p>Solving this required a “detective” mindset—realizing that 16128 wasn’t just a random number, but a bit-perfect swap of the ID we were expecting.</p>
<h2>The Ghost in the Thread: Background RX</h2>
<p>The most complex part of the “Universal Remote” was the background sniffer. We couldn’t decode IR in the main UI thread without freezing the screen, so we spawned a dedicated RX thread (<code>cy9_rx_thread</code>).</p>
<p>This thread listened to a message queue fed by an interrupt-driven capture callback. It maintained a circular buffer of the last 47 bytes seen on the wire, constantly looking for the <code>0x16</code> syncwords.</p>
<pre><code class="hljs language-c"><span class="hljs-type">static</span> <span class="hljs-type">int32_t</span> <span class="hljs-title function_">cy9_rx_thread</span><span class="hljs-params">(<span class="hljs-type">void</span>* context)</span> {
    <span class="hljs-comment">// ... setup ...</span>
    <span class="hljs-keyword">while</span>(app-&gt;running) {
        <span class="hljs-keyword">if</span>(furi_message_queue_get(app-&gt;rx_queue, &amp;msg, <span class="hljs-number">100</span>) == FuriStatusOk) {
            <span class="hljs-comment">// Robust center-sampling for 3000 baud</span>
            <span class="hljs-type">int</span> n = (<span class="hljs-type">int</span>)(( (<span class="hljs-type">float</span>)msg.duration + (BIT_TIME_US / <span class="hljs-number">2.0f</span>) ) / BIT_TIME_US);
            <span class="hljs-keyword">for</span>(<span class="hljs-type">int</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) {
                <span class="hljs-comment">// State machine for 8N1 UART recovery</span>
                <span class="hljs-keyword">if</span>(state == DecodeStateIdle) {
                    <span class="hljs-keyword">if</span>(!bit) { state = DecodeStateData; bit_acc = <span class="hljs-number">0</span>; bits = <span class="hljs-number">0</span>; }
                } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span>(bits &lt; <span class="hljs-number">8</span>) {
                    <span class="hljs-keyword">if</span>(bit) bit_acc |= (<span class="hljs-number">1</span> &lt;&lt; bits); bits++;
                } <span class="hljs-keyword">else</span> {
                    pkt_circ[p_idx] = (<span class="hljs-type">uint8_t</span>)bit_acc;
                    <span class="hljs-keyword">if</span>(pkt_circ[p_idx] == <span class="hljs-number">22</span>) { <span class="hljs-comment">// 0x16 Syncword found!</span>
                        <span class="hljs-comment">// Process ID...</span>
                    }
                    p_idx = (p_idx + <span class="hljs-number">1</span>) % <span class="hljs-number">47</span>;
                    state = DecodeStateIdle;
                }
            }
        }
    }
}
</code></pre>
<h2>Verification through Simulation</h2>
<p>To ensure our decoding logic was truly reliable, we built a host-side unit test suite. Testing on hardware is slow and silent. Testing on a laptop is fast and verbose. We wrote a C test runner that simulated the entire IR bitstream—including jitter and noise—and fed it into a mock of our sniffer’s state machine.</p>
<p>This revealed that our initial decoder was consuming the <strong>Start Bit</strong> as a data bit! By fixing the logic to “center-sample” the bit-stream (waiting for the middle of a bit-time to sample its value), we achieved 100% accuracy even in the noisy environment of the conference floor.</p>
<h2>Professionalism and Persistence: Features of the Remote</h2>
<p>The finalized <strong>Cy9 Remote</strong> is now a production-grade tool. It features:</p>
<ul>
<li><strong>Model-View-Controller (MVC) Architecture:</strong> Separating background ID sniffing from the UI thread using the Flipper’s <code>ViewDispatcher</code>.</li>
<li><strong>Settings Persistence:</strong> Using the Flipper’s <code>Storage</code> API to save custom greeting messages and selected identity classes to the SD card.</li>
<li><strong>Identity Spoofing:</strong> A hierarchical ID generator that can masquerade as a “Founder” (ID 1-25) or “Extreme” staff (ID 26-100).</li>
<li><strong>Visual Identity:</strong> Automatic injection of icons (♦ for Founder, ♠ for Extreme) into the <code>Alias</code> field of transmitted packets, a trick discovered by manually inserting non-ASCII characters into the badge’s font map.</li>
</ul>
<p>While the first version of the app got us through the second day of the con, I didn’t finish the full “Universal Remote” version until after Cyphercon was over. Testing it out on my own and my friends’ badges allowed me to refine the features without the chaos of the con floor, and it forced me to confront the actual limits of the Flipper Zero’s hardware—from memory allocation quirks to precise interrupt timing. Even if you’re not spoofing a Founder’s diamond icon or messing with “Chaos Mode,” building the app proved that even a simple 3000-baud “beeper” mesh can be a great technical playground.</p>
<p>If you’re building your own Flipper app for a badge con, a few parting tips:</p>
<ul>
<li><strong>Zero-initialize your structures</strong>: <code>memset(app, 0, sizeof(Cy9RemoteApp))</code> will save you from random reboots.</li>
<li><strong>HAL State Control</strong>: Always check your current state before stopping the receiver, or you’ll trigger a safety crash.</li>
<li><strong>Host-side Testing</strong>: Use unit tests for your decoding logic. It’s way easier to debug a bit-stream on your laptop than it is on the con floor.</li>
</ul>
<p>Hopefully, this gives you a head start on your next project. Just remember to keep your code clean and your timing precise—or you’ll be the one staring at a “Fatal Error” screen when the action starts.</p>
<h2>Source Code</h2>
<p>You can find the full source code for the Cy9 Remote Flipper app and my research into the badge firmware on GitHub: <a href="https://github.com/jabez007/cyphercon9/tree/development">jabez007/cyphercon9</a>.</p>
`,r={id:e,slug:t,frontmatter:s,readingTime:n,content:a};export{a as content,r as default,s as frontmatter,e as id,n as readingTime,t as slug};
