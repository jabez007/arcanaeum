---
title: "Resonating with the Machine: Decoding the Cyphercon 9 Infrared Protocol"
date: 2026-04-02
author: jabez007
tags:
  - flipperzero
  - cyphercon9
  - embedded-systems
  - infrared
  - reverse-engineering
  - c-programming
  - rp2040
excerpt: |
  Electronic badges at security conferences are more than just jewelry; they are miniature ecosystems of code, light, and hidden signals designed to be explored. Our journey into the Cyphercon 9 ecosystem began with a forensic analysis of the MicroPython firmware `blue-badge.py`.
featured: true
draft: false
---

Electronic badges at security conferences are more than just jewelry; they are miniature ecosystems of code, light, and hidden signals designed to be explored. Cyphercon 9 featured a particularly intriguing system: a fleet of RP2040-powered "beeper" badges communicating via a custom infrared mesh network. Our journey into this ecosystem began not with hardware in hand, but with an analysis of the MicroPython firmware [blue-badge.py](https://github.com/jabez007/cyphercon9/tree/development) on GitHub.

## The Anatomy of a Hidden Signal

The badge firmware, designed for the Raspberry Pi RP2040 microcontroller, revealed a communication system built on strict physical constraints. Unlike the high-level abstractions of modern networking, this badge used a custom UART-over-Infrared protocol. 

By poring over the PIO (Programmable I/O) code in the firmware, we identified the fundamental physics of the system:
- **Carrier Frequency:** 38kHz (standard for IR, modulated via the RP2040's state machines).
- **Baud Rate:** 3000. In an age of gigabit speeds, 3000 baud is a slow, deliberate pace where every microsecond matters.
- **Protocol:** 8N1 (1 start bit '0', 8 data bits LSB-first, 1 stop bit '1').
- **Signal Logic:** Active Low (UART '0' = IR LED ON, UART '1' = IR LED OFF).

The packet structure was equally deliberate. A 47-byte burst containing:
1.  **Syncword (4 bytes):** Constant `0x16` (22 decimal) values used to wake the receiver and synchronize the clock.
2.  **Checksum (4 bytes):** A 32-bit summation of the body bytes, stored in Big-Endian order.
3.  **Header (7 bytes):** Containing the Body Length (16-bit), Event ID, Source ID (16-bit), and Target ID (16-bit).
4.  **Body (32 bytes):** A 16-byte Alias followed by a 16-byte Message payload.

## The First Hurdle: The Reversed Wire Order

As we began porting this logic to the Flipper Zero’s C-based SDK, we encountered our first major "gotcha." The badge firmware constructed its packet in a standard buffer, but the `tx()` function transmitted it from index 46 down to 0:

```python
# From blue-badge.py
def tx(body_len):
    range_top = 15 + body_len
    last_byte = range_top - 1
    for i in range(0, range_top):
        uart0.write(tx_buffer[last_byte - i:(last_byte - i) + 1])
```

This meant that over the air, the **Syncwords** (at indices 0-3) were actually the *last* things sent, while the message body (at the end of the buffer) came first. This reversed wire order meant our Flipper app had to be architected with "reverse-first" thinking. If we sent it "forward," the badge's receiver would see noise, ignore the checksum, and drop the packet entirely.

## The Drift: Where Math Meets Physics

Our initial prototype for the Flipper Zero was a simple function: "Quick Greet." We calculated the bit-time as $1,000,000\mu s / 3000$ baud $= 333.33\mu s$. In our first attempt, we rounded this to $333\mu s$ and used a standard loop with `furi_delay_us()` to bit-bang the signal.

On paper, $0.33\mu s$ is a negligible rounding error. In the reality of a 470-bit packet (47 bytes * 10 bits per byte including framing), it is a catastrophic failure. By the time the receiver reached the end of the packet, that error had accumulated:
- **Error per bit:** $0.333\mu s$
- **Total bits:** 470
- **Cumulative Drift:** $156.6\mu s$

Given that a single bit-width is only $333\mu s$, a drift of $156\mu s$ is nearly **half a bit**. By the end of the transmission, the Flipper was toggling the IR LED exactly when the badge was sampling the signal, leading to massive framing errors. The badge remained silent and unresponsive.

## Technical Humility and High-Precision Timing

To solve the drift, we had to implement **Cumulative Timing Logic**. Instead of calculating the duration of a single bit, we calculated the absolute target timestamp for the end of *every* bit in the sequence relative to the start of the transmission.

```c
// High-precision bit-banging in our first working prototype
uint32_t total_bits = (SYNC_PREAMBLE_COUNT + TOTAL_PACKET_BYTES) * 10;
uint32_t last_time_us = 0;

for(uint32_t bit_idx = 0; bit_idx < total_bits; bit_idx++) {
    // ... logic to determine bit value (Start, Data, or Stop) ...
    
    bool level = !bit; // bit 0 = IR ON, bit 1 = IR OFF
    
    // Calculate the exact target time for this bit boundary using floats
    uint32_t next_time_us = (uint32_t)((float)(bit_idx + 1) * BIT_TIME_US_FLOAT);
    
    // Convert to a duration for the Flipper's IR HAL
    cy9_add_duration(next_time_us - last_time_us, level, &current_duration, &current_level);
    last_time_us = next_time_us;
}
```

This ensured that if one bit was slightly short due to integer truncation, the *next* bit would automatically expand by $1\mu s$ to compensate. This "self-correcting" clock kept the overall packet edge-aligned to the microsecond, perfectly matching the badge's expectation.

## Power and Precision: The Flipper HAL

Transmission wasn't just about timing; it was about hardware control. The Flipper's IR LED is powerful, but timing can be ruined if the CPU decides to save power mid-transmission. We had to use `furi_hal_power_insomnia_enter()` to prevent the processor from downclocking or entering a sleep state during the burst.

We also had to interface with the Flipper's asynchronous IR driver. This required setting up a callback (`cy9_tx_callback`) that the system's interrupt service routine would call every time it needed the next pulse duration.

```c
static FuriHalInfraredTxGetDataState cy9_tx_callback(void* context, uint32_t* duration, bool* level) {
    Cy9Burst* b = (Cy9Burst*)context;
    if(b->index >= b->count) return FuriHalInfraredTxGetDataStateLastDone;
    
    *duration = b->durations[b->index];
    *level = (b->index % 2 == 0); // Burst starts with IR ON
    b->index++;
    
    return (b->index >= b->count) ? FuriHalInfraredTxGetDataStateDone : FuriHalInfraredTxGetDataStateOk;
}
```

## The First Success

The moment of truth came on the second day of Cyphercon. We pointed the Flipper at a test badge and pressed the center button. The badge’s red LED pulsed—a successful CRC check. Moments later, the message "Greetz from Cy9!" appeared on the badge's screen, sent from "Re1avar3"

Getting that red LED to pulse was a huge payoff for a day's worth of protocol analysis and bit-time math. We could finally speak the language of the mesh, but it was still a one-way street. We could say 'hello,' but we hadn't figured out how to listen to the rest of the con floor, or how to navigate the complex social hierarchy baked into the badge IDs. The next step was taking this single transmission function and building it into a real, multi-threaded 'Universal Remote' app.

