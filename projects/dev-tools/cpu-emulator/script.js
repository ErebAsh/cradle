// --- HARDWARE COMPONENT REPRESENTATION MATRIX ---
const cpu = {
    registers: { A: 0, B: 0, C: 0, D: 0 },
    PC: 0,       // Program Counter index pointer
    flags: { Z: 1, C: 0 }, // Zero and Carry status indicators
    RAM: new Uint8Array(16), // Strict 16-byte virtual address memory block
    halted: false
};

// Instruction-to-Opcode hex mapping dictionary
const OPCODES = { 
    HALT: 0x00, 
    MOV_LIT: 0x01, 
    ADD: 0x02, 
    SUB: 0x03, 
    JMP: 0x04,
    MOV_REG: 0x05,      // MOV Reg, Reg
    MOV_MEM_R: 0x06,    // MOV Reg, [Addr]
    MOV_R_MEM: 0x07     // MOV [Addr], Reg
};

let runLoopActive = false;
let isAnimating = false;

// --- DOM BINDINGS ---
const ramGrid = document.getElementById('ram-matrix');
const consoleOutput = document.getElementById('console-output');
const btnStep = document.getElementById('btn-step');
const btnRun = document.getElementById('btn-run');
const chkAnimate = document.getElementById('chk-animate');
const animationLayer = document.getElementById('animation-layer');

// Generate structural UI elements for the 16-byte RAM visualization grid
function renderInitialHardwareGrid() {
    ramGrid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const hexAddress = '0x' + i.toString(16).toUpperCase();
        ramGrid.innerHTML += `
            <div class="ram-cell" id="ram-cell-${i}">
                <span class="ram-addr">${hexAddress}</span>
                <span class="ram-data" id="ram-data-${i}">00</span>
            </div>
        `;
    }
}

// Update the glowing UI dashboard fields with current CPU states
function updateHardwareDashboard() {
    document.getElementById('reg-a').textContent = cpu.registers.A.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-b').textContent = cpu.registers.B.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-c').textContent = cpu.registers.C.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-d').textContent = cpu.registers.D.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-pc').textContent = '0x' + cpu.PC.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-flags').textContent = `Z:${cpu.flags.Z} C:${cpu.flags.C}`;

    // Update RAM visualization indicators dynamically
    for (let i = 0; i < 16; i++) {
        const cell = document.getElementById(`ram-cell-${i}`);
        const dataElement = document.getElementById(`ram-data-${i}`);

        dataElement.textContent = cpu.RAM[i].toString(16).toUpperCase().padStart(2, '0');

        // Highlight cell if the Program Counter is targeting it
        if (i === cpu.PC && !cpu.halted) {
            cell.classList.add('active-pc');
        } else {
            cell.classList.remove('active-pc');
        }
    }
}

function printConsole(text, isError = false) {
    consoleOutput.textContent = text;
    consoleOutput.style.color = isError ? '#ef4444' : '#a4b0be';
}

// --- DATA FLOW ANIMATION ENGINE ---
function getCenterCoords(element) {
    const rect = element.getBoundingClientRect();
    const containerRect = document.querySelector('.emulator-container').getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
    };
}

function animateDataFlow(sourceElId, destElId, labelValue) {
    return new Promise(resolve => {
        if (!chkAnimate || !chkAnimate.checked) {
            resolve();
            return;
        }

        const sourceEl = document.getElementById(sourceElId);
        const destEl = document.getElementById(destElId);
        if (!sourceEl || !destEl) {
            resolve();
            return;
        }

        isAnimating = true;
        const start = getCenterCoords(sourceEl);
        const end = getCenterCoords(destEl);

        // Highlight source and destination
        sourceEl.classList.add('highlight-read');
        destEl.classList.add('highlight-write');

        // Create Path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "line");
        path.setAttribute("x1", start.x);
        path.setAttribute("y1", start.y);
        path.setAttribute("x2", end.x);
        path.setAttribute("y2", end.y);
        path.setAttribute("class", "data-path");
        
        // Create Packet
        const packet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        packet.setAttribute("r", "6");
        packet.setAttribute("cx", start.x);
        packet.setAttribute("cy", start.y);
        packet.setAttribute("class", "data-packet");

        animationLayer.appendChild(path);
        animationLayer.appendChild(packet);

        // Trigger animation
        requestAnimationFrame(() => {
            packet.setAttribute("cx", end.x);
            packet.setAttribute("cy", end.y);
        });

        setTimeout(() => {
            sourceEl.classList.remove('highlight-read');
            destEl.classList.remove('highlight-write');
            animationLayer.innerHTML = '';
            isAnimating = false;
            resolve();
        }, 450); // Matches CSS transition duration + slight buffer
    });
}

function getRegElementId(reg) {
    return 'reg-' + reg.toLowerCase();
}

function getRamElementId(addr) {
    return 'ram-cell-' + addr;
}

// --- COMPILER STRATEGY ENGINE (LEXER & PARSER) ---
document.getElementById('btn-assemble').addEventListener('click', () => {
    const rawLines = document.getElementById('assembly-input').value.split('\n');
    cpu.RAM.fill(0); // Wipe memory for fresh compile load

    let memoryWritePtr = 0;
    printConsole("Initializing compilation pipeline...");

    try {
        for (let rawLine of rawLines) {
            let cleanLine = rawLine.split(';')[0].trim();
            if (!cleanLine) continue; 

            if (memoryWritePtr >= 16) throw new Error("Compilation Error: Out of 16-byte memory limits.");

            // Basic tokenization
            let parts = cleanLine.replace(/,/g, ' ').split(/\s+/);
            let operation = parts[0].toUpperCase();

            if (operation === 'HALT') {
                cpu.RAM[memoryWritePtr++] = OPCODES.HALT;
            }
            else if (operation === 'MOV') {
                let target = parts[1].toUpperCase();
                let source = parts[2].toUpperCase();
                
                let isTargetMem = target.startsWith('[') && target.endsWith(']');
                let isSourceMem = source.startsWith('[') && source.endsWith(']');

                if (isTargetMem && isSourceMem) {
                    throw new Error("Memory-to-Memory MOV not supported.");
                }

                if (isTargetMem) {
                    // MOV [Addr], Reg
                    let addr = parseInt(target.replace(/\[|\]/g, ''));
                    if (!['A', 'B', 'C', 'D'].includes(source) || isNaN(addr)) throw new Error("Invalid MOV syntax.");
                    cpu.RAM[memoryWritePtr++] = OPCODES.MOV_R_MEM;
                    cpu.RAM[memoryWritePtr++] = addr & 0xFF;
                    cpu.RAM[memoryWritePtr++] = source.charCodeAt(0);
                } else if (isSourceMem) {
                    // MOV Reg, [Addr]
                    let addr = parseInt(source.replace(/\[|\]/g, ''));
                    if (!['A', 'B', 'C', 'D'].includes(target) || isNaN(addr)) throw new Error("Invalid MOV syntax.");
                    cpu.RAM[memoryWritePtr++] = OPCODES.MOV_MEM_R;
                    cpu.RAM[memoryWritePtr++] = target.charCodeAt(0);
                    cpu.RAM[memoryWritePtr++] = addr & 0xFF;
                } else if (['A', 'B', 'C', 'D'].includes(source)) {
                    // MOV Reg, Reg
                    if (!['A', 'B', 'C', 'D'].includes(target)) throw new Error("Invalid MOV syntax.");
                    cpu.RAM[memoryWritePtr++] = OPCODES.MOV_REG;
                    cpu.RAM[memoryWritePtr++] = target.charCodeAt(0);
                    cpu.RAM[memoryWritePtr++] = source.charCodeAt(0);
                } else {
                    // MOV Reg, Literal
                    let val = parseInt(source);
                    if (!['A', 'B', 'C', 'D'].includes(target) || isNaN(val)) throw new Error("Invalid MOV syntax.");
                    cpu.RAM[memoryWritePtr++] = OPCODES.MOV_LIT;
                    cpu.RAM[memoryWritePtr++] = target.charCodeAt(0);
                    cpu.RAM[memoryWritePtr++] = val & 0xFF;
                }
            }
            else if (operation === 'ADD' || operation === 'SUB') {
                let regDest = parts[1].toUpperCase();
                let regSrc = parts[2].toUpperCase();

                if (!['A', 'B', 'C', 'D'].includes(regDest) || !['A', 'B', 'C', 'D'].includes(regSrc)) {
                    throw new Error("Invalid Math operation syntax.");
                }

                cpu.RAM[memoryWritePtr++] = OPCODES[operation];
                cpu.RAM[memoryWritePtr++] = regDest.charCodeAt(0);
                cpu.RAM[memoryWritePtr++] = regSrc.charCodeAt(0);
            }
            else {
                throw new Error(`Assembler Exception: Token pattern instruction "${operation}" unrecognizable.`);
            }
        }

        resetHardwareState();
        btnStep.disabled = false;
        btnRun.disabled = false;
        printConsole("Compilation successful. Machine code map injected safely into RAM vectors.");
    } catch (err) {
        printConsole(err.message, true);
    }
});

// --- FETCH-DECODE-EXECUTE PROCESSOR RUNTIME PASS ---
async function executeClockCycleStep() {
    if (cpu.halted || cpu.PC >= 16) {
        cpu.halted = true;
        runLoopActive = false;
        printConsole("Processor execution finished (System HALT or memory out of bounds).");
        return;
    }

    if (isAnimating) return; // Prevent overlap

    let currentOpcode = cpu.RAM[cpu.PC];
    let prevPC = cpu.PC;

    switch (currentOpcode) {
        case OPCODES.HALT:
            cpu.halted = true;
            break;

        case OPCODES.MOV_LIT: {
            let regLetter = String.fromCharCode(cpu.RAM[cpu.PC + 1]);
            let value = cpu.RAM[cpu.PC + 2];
            await animateDataFlow(getRamElementId(cpu.PC + 2), getRegElementId(regLetter), value);
            cpu.registers[regLetter] = value;
            cpu.PC += 3;
            break;
        }

        case OPCODES.MOV_REG: {
            let destReg = String.fromCharCode(cpu.RAM[cpu.PC + 1]);
            let srcReg = String.fromCharCode(cpu.RAM[cpu.PC + 2]);
            let value = cpu.registers[srcReg];
            await animateDataFlow(getRegElementId(srcReg), getRegElementId(destReg), value);
            cpu.registers[destReg] = value;
            cpu.PC += 3;
            break;
        }

        case OPCODES.MOV_MEM_R: {
            let destReg = String.fromCharCode(cpu.RAM[cpu.PC + 1]);
            let addr = cpu.RAM[cpu.PC + 2];
            let value = cpu.RAM[addr];
            await animateDataFlow(getRamElementId(addr), getRegElementId(destReg), value);
            cpu.registers[destReg] = value;
            cpu.PC += 3;
            break;
        }

        case OPCODES.MOV_R_MEM: {
            let addr = cpu.RAM[cpu.PC + 1];
            let srcReg = String.fromCharCode(cpu.RAM[cpu.PC + 2]);
            let value = cpu.registers[srcReg];
            await animateDataFlow(getRegElementId(srcReg), getRamElementId(addr), value);
            cpu.RAM[addr] = value;
            cpu.PC += 3;
            break;
        }

        case OPCODES.ADD: {
            let destReg = String.fromCharCode(cpu.RAM[cpu.PC + 1]);
            let srcReg = String.fromCharCode(cpu.RAM[cpu.PC + 2]);
            await animateDataFlow(getRegElementId(srcReg), getRegElementId(destReg), cpu.registers[srcReg]);
            
            let result = cpu.registers[destReg] + cpu.registers[srcReg];
            cpu.flags.C = result > 255 ? 1 : 0; 
            cpu.registers[destReg] = result & 0xFF;
            cpu.flags.Z = cpu.registers[destReg] === 0 ? 1 : 0;
            cpu.PC += 3;
            break;
        }

        case OPCODES.SUB: {
            let destReg = String.fromCharCode(cpu.RAM[cpu.PC + 1]);
            let srcReg = String.fromCharCode(cpu.RAM[cpu.PC + 2]);
            await animateDataFlow(getRegElementId(srcReg), getRegElementId(destReg), cpu.registers[srcReg]);

            let result = cpu.registers[destReg] - cpu.registers[srcReg];
            cpu.flags.C = result < 0 ? 1 : 0;
            cpu.registers[destReg] = (result < 0 ? result + 256 : result) & 0xFF;
            cpu.flags.Z = cpu.registers[destReg] === 0 ? 1 : 0;
            cpu.PC += 3;
            break;
        }

        default:
            cpu.PC++; 
            break;
    }

    updateHardwareDashboard();
}

// --- MACHINE RUN/RESET EVENT HOOKS ---
btnStep.addEventListener('click', async () => {
    btnStep.disabled = true;
    btnRun.disabled = true;
    await executeClockCycleStep();
    if (!cpu.halted) {
        btnStep.disabled = false;
        btnRun.disabled = false;
    }
});

async function executionLoop() {
    while (runLoopActive && !cpu.halted && cpu.PC < 16) {
        await executeClockCycleStep();
        if (chkAnimate && chkAnimate.checked) {
            // Wait extra time if animations are enabled so it's pleasant to watch
            await new Promise(r => setTimeout(r, 100));
        } else {
            // When animations are disabled, throttle slightly so it doesn't instantly finish
            await new Promise(r => setTimeout(r, 100));
        }
    }
    btnStep.disabled = cpu.halted;
    btnRun.disabled = cpu.halted;
}

btnRun.addEventListener('click', () => {
    if (runLoopActive) return;
    runLoopActive = true;
    btnRun.disabled = true;
    btnStep.disabled = true;
    printConsole("Processor running at variable clock speed execution loop...");
    executionLoop();
});

function resetHardwareState() {
    runLoopActive = false;
    isAnimating = false;
    animationLayer.innerHTML = '';
    cpu.registers = { A: 0, B: 0, C: 0, D: 0 };
    cpu.PC = 0;
    cpu.flags = { Z: 1, C: 0 };
    cpu.halted = false;
    updateHardwareDashboard();
}

document.getElementById('btn-reset').addEventListener('click', () => {
    resetHardwareState();
    cpu.RAM.fill(0);
    updateHardwareDashboard();
    btnStep.disabled = true;
    btnRun.disabled = true;
    printConsole("System architecture clear. Awaiting fresh compilation pass...");
});

// App Initialization entry points
renderInitialHardwareGrid();
updateHardwareDashboard();