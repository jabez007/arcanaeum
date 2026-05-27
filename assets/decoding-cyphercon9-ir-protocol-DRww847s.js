const e="2026-04-02-decoding-cyphercon9-ir-protocol",t="decoding-cyphercon9-ir-protocol",s={title:"Resonating with the Machine: Decoding the Cyphercon 9 Infrared Protocol",date:"2026-04-02",author:"jabez007",tags:["flipperzero","cyphercon9","embedded-systems","infrared","reverse-engineering","c-programming","rp2040"],excerpt:"Electronic badges at security conferences are more than just jewelry; they are miniature ecosystems of code, light, and hidden signals designed to be explored. Our journey into the Cyphercon 9 ecosystem began with a forensic analysis of the MicroPython firmware `blue-badge.py`.\n",featured:!0,draft:!1},n=6,a=`<p>Electronic badges at security conferences are more than just jewelry; they are miniature ecosystems of code, light, and hidden signals designed to be explored. Cyphercon 9 featured a particularly intriguing system: a fleet of RP2040-powered “beeper” badges communicating via a custom infrared mesh network. Our journey into this ecosystem began not with hardware in hand, but with an analysis of the MicroPython firmware <a href="https://github.com/jabez007/cyphercon9/tree/development">blue-badge.py</a> on GitHub.</p>
<h2>The Anatomy of a Hidden Signal</h2>
<p>The badge firmware, designed for the Raspberry Pi RP2040 microcontroller, revealed a communication system built on strict physical constraints. Unlike the high-level abstractions of modern networking, this badge used a custom UART-over-Infrared protocol.</p>
<p>By poring over the PIO (Programmable I/O) code in the firmware, we identified the fundamental physics of the system:</p>
<ul>
<li><strong>Carrier Frequency:</strong> 38kHz (standard for IR, modulated via the RP2040’s state machines).</li>
<li><strong>Baud Rate:</strong> 3000. In an age of gigabit speeds, 3000 baud is a slow, deliberate pace where every microsecond matters.</li>
<li><strong>Protocol:</strong> 8N1 (1 start bit ‘0’, 8 data bits LSB-first, 1 stop bit ‘1’).</li>
<li><strong>Signal Logic:</strong> Active Low (UART ‘0’ = IR LED ON, UART ‘1’ = IR LED OFF).</li>
</ul>
<p>The packet structure was equally deliberate. A 47-byte burst containing:</p>
<ol>
<li><strong>Syncword (4 bytes):</strong> Constant <code>0x16</code> (22 decimal) values used to wake the receiver and synchronize the clock.</li>
<li><strong>Checksum (4 bytes):</strong> A 32-bit summation of the body bytes, stored in Big-Endian order.</li>
<li><strong>Header (7 bytes):</strong> Containing the Body Length (16-bit), Event ID, Source ID (16-bit), and Target ID (16-bit).</li>
<li><strong>Body (32 bytes):</strong> A 16-byte Alias followed by a 16-byte Message payload.</li>
</ol>
<h2>The First Hurdle: The Reversed Wire Order</h2>
<p>As we began porting this logic to the Flipper Zero’s C-based SDK, we encountered our first major “gotcha.” The badge firmware constructed its packet in a standard buffer, but the <code>tx()</code> function transmitted it from index 46 down to 0:</p>
<pre><code class="hljs language-python"><span class="hljs-comment"># From blue-badge.py</span>
<span class="hljs-keyword">def</span> <span class="hljs-title function_">tx</span>(<span class="hljs-params">body_len</span>):
    range_top = <span class="hljs-number">15</span> + body_len
    last_byte = range_top - <span class="hljs-number">1</span>
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(<span class="hljs-number">0</span>, range_top):
        uart0.write(tx_buffer[last_byte - i:(last_byte - i) + <span class="hljs-number">1</span>])
</code></pre>
<p>This meant that over the air, the <strong>Syncwords</strong> (at indices 0-3) were actually the <em>last</em> things sent, while the message body (at the end of the buffer) came first. This reversed wire order meant our Flipper app had to be architected with “reverse-first” thinking. If we sent it “forward,” the badge’s receiver would see noise, ignore the checksum, and drop the packet entirely.</p>
<h2>The Drift: Where Math Meets Physics</h2>
<p>Our initial prototype for the Flipper Zero was a simple function: “Quick Greet.” We calculated the bit-time as $1,000,000\\mu s / 3000$ baud $= 333.33\\mu s$. In our first attempt, we rounded this to $333\\mu s$ and used a standard loop with <code>furi_delay_us()</code> to bit-bang the signal.</p>
<p>On paper, $0.33\\mu s$ is a negligible rounding error. In the reality of a 470-bit packet (47 bytes * 10 bits per byte including framing), it is a catastrophic failure. By the time the receiver reached the end of the packet, that error had accumulated:</p>
<ul>
<li><strong>Error per bit:</strong> $0.333\\mu s$</li>
<li><strong>Total bits:</strong> 470</li>
<li><strong>Cumulative Drift:</strong> $156.6\\mu s$</li>
</ul>
<p>Given that a single bit-width is only $333\\mu s$, a drift of $156\\mu s$ is nearly <strong>half a bit</strong>. By the end of the transmission, the Flipper was toggling the IR LED exactly when the badge was sampling the signal, leading to massive framing errors. The badge remained silent and unresponsive.</p>
<h2>Technical Humility and High-Precision Timing</h2>
<p>To solve the drift, we had to implement <strong>Cumulative Timing Logic</strong>. Instead of calculating the duration of a single bit, we calculated the absolute target timestamp for the end of <em>every</em> bit in the sequence relative to the start of the transmission.</p>
<pre><code class="hljs language-c"><span class="hljs-comment">// High-precision bit-banging in our first working prototype</span>
<span class="hljs-type">uint32_t</span> total_bits = (SYNC_PREAMBLE_COUNT + TOTAL_PACKET_BYTES) * <span class="hljs-number">10</span>;
<span class="hljs-type">uint32_t</span> last_time_us = <span class="hljs-number">0</span>;

<span class="hljs-keyword">for</span>(<span class="hljs-type">uint32_t</span> bit_idx = <span class="hljs-number">0</span>; bit_idx &lt; total_bits; bit_idx++) {
    <span class="hljs-comment">// ... logic to determine bit value (Start, Data, or Stop) ...</span>
    
    <span class="hljs-type">bool</span> level = !bit; <span class="hljs-comment">// bit 0 = IR ON, bit 1 = IR OFF</span>
    
    <span class="hljs-comment">// Calculate the exact target time for this bit boundary using floats</span>
    <span class="hljs-type">uint32_t</span> next_time_us = (<span class="hljs-type">uint32_t</span>)((<span class="hljs-type">float</span>)(bit_idx + <span class="hljs-number">1</span>) * BIT_TIME_US_FLOAT);
    
    <span class="hljs-comment">// Convert to a duration for the Flipper&#x27;s IR HAL</span>
    cy9_add_duration(next_time_us - last_time_us, level, &amp;current_duration, &amp;current_level);
    last_time_us = next_time_us;
}
</code></pre>
<p>This ensured that if one bit was slightly short due to integer truncation, the <em>next</em> bit would automatically expand by $1\\mu s$ to compensate. This “self-correcting” clock kept the overall packet edge-aligned to the microsecond, perfectly matching the badge’s expectation.</p>
<h2>Power and Precision: The Flipper HAL</h2>
<p>Transmission wasn’t just about timing; it was about hardware control. The Flipper’s IR LED is powerful, but timing can be ruined if the CPU decides to save power mid-transmission. We had to use <code>furi_hal_power_insomnia_enter()</code> to prevent the processor from downclocking or entering a sleep state during the burst.</p>
<p>We also had to interface with the Flipper’s asynchronous IR driver. This required setting up a callback (<code>cy9_tx_callback</code>) that the system’s interrupt service routine would call every time it needed the next pulse duration.</p>
<pre><code class="hljs language-c"><span class="hljs-type">static</span> FuriHalInfraredTxGetDataState <span class="hljs-title function_">cy9_tx_callback</span><span class="hljs-params">(<span class="hljs-type">void</span>* context, <span class="hljs-type">uint32_t</span>* duration, <span class="hljs-type">bool</span>* level)</span> {
    Cy9Burst* b = (Cy9Burst*)context;
    <span class="hljs-keyword">if</span>(b-&gt;index &gt;= b-&gt;count) <span class="hljs-keyword">return</span> FuriHalInfraredTxGetDataStateLastDone;
    
    *duration = b-&gt;durations[b-&gt;index];
    *level = (b-&gt;index % <span class="hljs-number">2</span> == <span class="hljs-number">0</span>); <span class="hljs-comment">// Burst starts with IR ON</span>
    b-&gt;index++;
    
    <span class="hljs-keyword">return</span> (b-&gt;index &gt;= b-&gt;count) ? FuriHalInfraredTxGetDataStateDone : FuriHalInfraredTxGetDataStateOk;
}
</code></pre>
<h2>The First Success</h2>
<p>The moment of truth came on the second day of Cyphercon. We pointed the Flipper at a test badge and pressed the center button. The badge’s red LED pulsed—a successful CRC check. Moments later, the message “Greetz from Cy9!” appeared on the badge’s screen, sent from “Re1avar3”</p>
<p>Getting that red LED to pulse was a huge payoff for a day’s worth of protocol analysis and bit-time math. We could finally speak the language of the mesh, but it was still a one-way street. We could say ‘hello,’ but we hadn’t figured out how to listen to the rest of the con floor, or how to navigate the complex social hierarchy baked into the badge IDs. The next step was taking this single transmission function and building it into a real, multi-threaded ‘Universal Remote’ app.</p>
`,r={id:e,slug:t,frontmatter:s,readingTime:n,content:a};export{a as content,r as default,s as frontmatter,e as id,n as readingTime,t as slug};
