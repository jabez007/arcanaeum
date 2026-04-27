---
title: "The Ghost in the Circular Buffer: Architecting a Universal Remote"
date: 2026-04-04
author: jabez007
tags:
  - flipperzero
  - cyphercon9
  - embedded-systems
  - mvc
  - software-architecture
  - c-programming
  - unit-testing
excerpt: |
  With the core IR protocol verified, the challenge shifted from a single script to a comprehensive system. A "Universal Remote" requires state, concurrency, and persistence. It also requires the ability to fail gracefully—a lesson the Flipper Zero taught us multiple times.
featured: true
draft: false
---

With the core IR protocol verified and the "Quick Greet" prototype successful, the challenge shifted from a single-function script to a comprehensive, multi-featured system. A "Universal Remote" for the Cyphercon 9 ecosystem required more than just transmission; it needed state management, background sniffing, and data persistence. It also required the ability to fail gracefully—a lesson the Flipper Zero taught us multiple times through a series of system-wide crashes.

## Architectural Turmoil: The Debugging Odyssey

Expanding the app into a multi-threaded, menu-driven interface introduced a cascade of "Fatal Errors." These crashes were fundamental violations of the Flipper SDK's constraints, often caused by the strict timing and memory requirements of the platform.

### 1. The "NULL Pointer" and the Uninitialized Heap
Early in the development, the Flipper would crash instantly upon opening the sniffer log. We discovered that we were using `malloc()` to allocate our application structure but failing to zero-initialize it. 

```c
Cy9RemoteApp* app = malloc(sizeof(Cy9RemoteApp));
furi_check(app); 
memset(app, 0, sizeof(Cy9RemoteApp)); // This line was missing!
```

In a standard OS, uninitialized memory might cause minor glitches. In an embedded C environment, an uninitialized `logged_count` variable containing random garbage (like `0x4F2A`) caused the UI thread to try and draw 20,000 non-existent Badge IDs, leading to an immediate out-of-bounds memory access and a system reboot.

### 2. The "furi_check" Double-Stop
The most persistent crash occurred when pressing the "Back" button to exit the sniffer. We learned that the Flipper's Infrared HAL is strictly stateful. If you call `furi_hal_infrared_async_rx_stop()` on a receiver that is *already* stopped, the driver triggers a safety crash. We had to implement a `rx_active` flag and a "stop-before-start" sequence to satisfy the hardware's internal mutexes.

## The Mystery of IDs 16128 and 768

As the Sniffer Log came to life, we encountered a puzzling new bug: the Flipper was capturing Badge IDs like `16128` and `768`, which were far outside the valid range of 0-675. 

By analyzing the binary representation of these numbers, we uncovered the final nuance of the protocol. Because the "wire order" was reversed over the air, the high and low bytes of the 16-bit IDs were being swapped in our circular buffer relative to their position in the MicroPython memory. `16128` (Hex `0x3F00`) was actually `0x003F`—ID 63 (an "Extreme" badge).

### The Endianness Trap

This was a classic collision between architecture and protocol. The RP2040 is natively **Little-Endian**, meaning it stores the low byte of a 16-bit integer first. While the conference protocol header was designed to be Big-Endian, the badge firmware often packed the ID field in the RP2040's native order: `[11:Low, 12:High]`.

When the badge transmitted the packet in reverse (`46 -> 0`), the **High Byte (Index 12)** was actually sent over the air **before** the Low Byte (Index 11). Consequently, in our Flipper's circular buffer, the byte that arrived earlier (and thus sat "further back" from the Syncword) was the High Byte. 

```c
// CORRECTED BYTE ORDER: Index 12 is Hi, 11 is Lo in the reversed wire stream
uint16_t id = (pkt_circ[(p_idx + 47 - 12) % 47] << 8) | 
               pkt_circ[(p_idx + 47 - 11) % 47];
```

Solving this required a "detective" mindset—realizing that 16128 wasn't just a random number, but a bit-perfect swap of the ID we were expecting.

## The Ghost in the Thread: Background RX

The most complex part of the "Universal Remote" was the background sniffer. We couldn't decode IR in the main UI thread without freezing the screen, so we spawned a dedicated RX thread (`cy9_rx_thread`).

This thread listened to a message queue fed by an interrupt-driven capture callback. It maintained a circular buffer of the last 47 bytes seen on the wire, constantly looking for the `0x16` syncwords.

```c
static int32_t cy9_rx_thread(void* context) {
    // ... setup ...
    while(app->running) {
        if(furi_message_queue_get(app->rx_queue, &msg, 100) == FuriStatusOk) {
            // Robust center-sampling for 3000 baud
            int n = (int)(( (float)msg.duration + (BIT_TIME_US / 2.0f) ) / BIT_TIME_US);
            for(int i = 0; i < n; i++) {
                // State machine for 8N1 UART recovery
                if(state == DecodeStateIdle) {
                    if(!bit) { state = DecodeStateData; bit_acc = 0; bits = 0; }
                } else if(bits < 8) {
                    if(bit) bit_acc |= (1 << bits); bits++;
                } else {
                    pkt_circ[p_idx] = (uint8_t)bit_acc;
                    if(pkt_circ[p_idx] == 22) { // 0x16 Syncword found!
                        // Process ID...
                    }
                    p_idx = (p_idx + 1) % 47;
                    state = DecodeStateIdle;
                }
            }
        }
    }
}
```

## Verification through Simulation

To ensure our decoding logic was truly reliable, we built a host-side unit test suite. Testing on hardware is slow and silent. Testing on a laptop is fast and verbose. We wrote a C test runner that simulated the entire IR bitstream—including jitter and noise—and fed it into a mock of our sniffer's state machine. 

This revealed that our initial decoder was consuming the **Start Bit** as a data bit! By fixing the logic to "center-sample" the bit-stream (waiting for the middle of a bit-time to sample its value), we achieved 100% accuracy even in the noisy environment of the conference floor.

## Professionalism and Persistence: Features of the Remote

The finalized **Cy9 Remote** is now a production-grade tool. It features:
- **Model-View-Controller (MVC) Architecture:** Separating background ID sniffing from the UI thread using the Flipper's `ViewDispatcher`.
- **Settings Persistence:** Using the Flipper's `Storage` API to save custom greeting messages and selected identity classes to the SD card.
- **Identity Spoofing:** A hierarchical ID generator that can masquerade as a "Founder" (ID 1-25) or "Extreme" staff (ID 26-100).
- **Visual Identity:** Automatic injection of icons (♦ for Founder, ♠ for Extreme) into the `Alias` field of transmitted packets, a trick discovered by manually inserting non-ASCII characters into the badge's font map.

While the first version of the app got us through the second day of the con, I didn't finish the full "Universal Remote" version until after Cyphercon was over. Testing it out on my own and my friends' badges allowed me to refine the features without the chaos of the con floor, and it forced me to confront the actual limits of the Flipper Zero's hardware—from memory allocation quirks to precise interrupt timing. Even if you're not spoofing a Founder's diamond icon or messing with "Chaos Mode," building the app proved that even a simple 3000-baud "beeper" mesh can be a great technical playground.

If you're building your own Flipper app for a badge con, a few parting tips:
- **Zero-initialize your structures**: `memset(app, 0, sizeof(Cy9RemoteApp))` will save you from random reboots.
- **HAL State Control**: Always check your current state before stopping the receiver, or you'll trigger a safety crash.
- **Host-side Testing**: Use unit tests for your decoding logic. It’s way easier to debug a bit-stream on your laptop than it is on the con floor.

Hopefully, this gives you a head start on your next project. Just remember to keep your code clean and your timing precise—or you'll be the one staring at a "Fatal Error" screen when the action starts.

## Source Code

You can find the full source code for the Cy9 Remote Flipper app and my research into the badge firmware on GitHub: [jabez007/cyphercon9](https://github.com/jabez007/cyphercon9/tree/development).
