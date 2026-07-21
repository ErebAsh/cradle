# CPU Emulator Architecture Documentation

## Overview
The Core8 CPU Emulator is a virtual 8-bit pipelined CPU environment with a 16-byte RAM space, 4 general-purpose registers (A, B, C, D), Program Counter (PC), status flags (Zero and Carry), and a 5-stage instruction pipeline simulator.

## System Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    Assembly Text IDE                    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│              Assembler Compiler (assembler.js)          │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               16-Byte System RAM Vector                 │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│           Pipelined CPU Core Engine (emulatorCore.js)   │
│  [IF] -> [ID] -> [EX (ALU / Logic)] -> [MEM] -> [WB]    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│            Interactive SVG & DOM Dashboard              │
└─────────────────────────────────────────────────────────┘
```

## Hardware Specifications
- **Word Size**: 8-bit data, 4-bit memory addresses (0x0 to 0xF).
- **Registers**: `A` (Accumulator), `B`, `C`, `D` (8-bit width).
- **Flags**:
  - `Z` (Zero Flag): Set to 1 if the output of an ALU or bitwise operation is zero.
  - `C` (Carry Flag): Set to 1 if an arithmetic operation overflows 255 or underflows 0.
- **Pipeline Stages**:
  1. `IF` (Instruction Fetch)
  2. `ID` (Instruction Decode & Load-Use Hazard Detection)
  3. `EX` (ALU/Logic Execution, Forwarding Resolution & Misprediction Flush)
  4. `MEM` (RAM Read/Write)
  5. `WB` (Register File Write Back)

## Opcodes & Instruction Set
| Opcode (Hex) | Mnemonic | Format | Description |
|---|---|---|---|
| `0x00` | `HALT` | `HALT` | Stops CPU clock execution loop |
| `0x01` | `MOV_LIT` | `MOV R, Lit` | Loads 8-bit immediate value into register |
| `0x02` | `ADD` | `ADD R1, R2` | `R1 = (R1 + R2) & 0xFF`, updates Z and C flags |
| `0x03` | `SUB` | `SUB R1, R2` | `R1 = (R1 - R2) & 0xFF`, updates Z and C flags |
| `0x04` | `JMP` | `JMP Addr` | Unconditional jump to target RAM address |
| `0x05` | `MOV_REG` | `MOV R1, R2` | Copies value of R2 into R1 |
| `0x06` | `MOV_MEM_R` | `MOV R, [Addr]` | Reads RAM address into register |
| `0x07` | `MOV_R_MEM` | `MOV [Addr], R` | Writes register value to RAM address |
| `0x08` | `JNZ` | `JNZ Addr` | Jumps to target RAM address if Zero Flag Z == 0 |
| `0x09` | `AND` | `AND R1, R2` | Bitwise AND between R1 and R2, stores in R1 |
| `0x0A` | `OR` | `OR R1, R2` | Bitwise OR between R1 and R2, stores in R1 |
| `0x0B` | `XOR` | `XOR R1, R2` | Bitwise XOR between R1 and R2, stores in R1 |
| `0x0C` | `NOT` | `NOT R` | Bitwise NOT on register R |
| `0x0D` | `INC` | `INC R` | Increments register R by 1 |
| `0x0E` | `DEC` | `DEC R` | Decrements register R by 1 |

## Folder Hierarchy
```text
projects/dev-tools/cpu-emulator/
├── ARCHITECTURE.md    # Architecture documentation
├── assembler.js       # Assembly parser & byte code generator
├── emulatorCore.js    # CPU execution state & opcode engine
├── index.html         # User interface structure
├── script.js          # DOM binding & animation layer
└── style.css          # Theme styles & responsive CSS
```
