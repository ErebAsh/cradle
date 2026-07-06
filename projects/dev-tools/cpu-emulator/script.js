// --- HARDWARE COMPONENT REPRESENTATION MATRIX ---
const OPCODES = { 
    HALT: 0x00, 
    MOV_LIT: 0x01, 
    ADD: 0x02, 
    SUB: 0x03, 
    JMP: 0x04,
    MOV_REG: 0x05,      // MOV Reg, Reg
    MOV_MEM_R: 0x06,    // MOV Reg, [Addr]
    MOV_R_MEM: 0x07,    // MOV [Addr], Reg
    JNZ: 0x08           // Jump if Not Zero
};

const cpu = {
    registers: { A: 0, B: 0, C: 0, D: 0 },
    PC: 0,       // Program Counter index pointer
    flags: { Z: 1, C: 0 }, // Zero and Carry status indicators
    RAM: new Uint8Array(16), // Strict 16-byte virtual address memory block
    halted: false
};

// Pipeline Registers
let pipeline = {
    IF_ID: { pc: 0, opcode: null, byte1: null, byte2: null, valid: false, instrStr: "NOP" },
    ID_EX: { pc: 0, opcode: null, val1: 0, val2: 0, destReg: null, addr: 0, writeReg: false, memRead: false, memWrite: false, branch: false, branchCond: false, valid: false, instrStr: "NOP", srcReg1: null, srcReg2: null },
    EX_MEM: { pc: 0, opcode: null, aluResult: 0, val2: 0, destReg: null, writeReg: false, memRead: false, memWrite: false, branchTarget: 0, branchTaken: false, valid: false, instrStr: "NOP" },
    MEM_WB: { pc: 0, opcode: null, memData: 0, aluResult: 0, destReg: null, writeReg: false, valid: false, instrStr: "NOP" }
};

let runLoopActive = false;
let isAnimating = false;
let stallPipeline = false;
let flushPipeline = false;

// --- DOM BINDINGS ---
const ramGrid = document.getElementById('ram-matrix');
const consoleOutput = document.getElementById('console-output');
const btnStep = document.getElementById('btn-step');
const btnRun = document.getElementById('btn-run');
const chkAnimate = document.getElementById('chk-animate');
const animationLayer = document.getElementById('animation-layer');

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

function updateHardwareDashboard() {
    document.getElementById('reg-a').textContent = cpu.registers.A.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-b').textContent = cpu.registers.B.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-c').textContent = cpu.registers.C.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-d').textContent = cpu.registers.D.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-pc').textContent = '0x' + cpu.PC.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('reg-flags').textContent = `Z:${cpu.flags.Z} C:${cpu.flags.C}`;

    for (let i = 0; i < 16; i++) {
        const cell = document.getElementById(`ram-cell-${i}`);
        const dataElement = document.getElementById(`ram-data-${i}`);
        dataElement.textContent = cpu.RAM[i].toString(16).toUpperCase().padStart(2, '0');
        if (i === cpu.PC && !cpu.halted) {
            cell.classList.add('active-pc');
        } else {
            cell.classList.remove('active-pc');
        }
    }

    // Update Pipeline UI
    updatePipelineUI('if', pipeline.IF_ID.valid ? pipeline.IF_ID.instrStr : 'NOP', stallPipeline);
    updatePipelineUI('id', pipeline.ID_EX.valid ? pipeline.ID_EX.instrStr : 'NOP', stallPipeline && pipeline.ID_EX.valid);
    updatePipelineUI('ex', pipeline.EX_MEM.valid ? pipeline.EX_MEM.instrStr : 'NOP', false);
    updatePipelineUI('mem', pipeline.MEM_WB.valid ? pipeline.MEM_WB.instrStr : 'NOP', false);
    
    // For WB, it completes in the same cycle, but we show what was written for visual continuity
    updatePipelineUI('wb', pipeline.MEM_WB.valid ? pipeline.MEM_WB.instrStr : 'NOP', false);
}

function updatePipelineUI(stage, instrStr, isStalled) {
    const stageEl = document.getElementById(`stage-${stage}`);
    const instrEl = document.getElementById(`instr-${stage}`);
    if (!stageEl || !instrEl) return;

    instrEl.textContent = instrStr;
    
    stageEl.classList.remove('active', 'bubble', 'stalled');
    if (isStalled) {
        stageEl.classList.add('stalled');
    } else if (instrStr === 'NOP' || instrStr === 'BUBBLE') {
        stageEl.classList.add('bubble');
    } else {
        stageEl.classList.add('active');
    }
}

function printConsole(text, isError = false) {
    consoleOutput.textContent = text;
    consoleOutput.style.color = isError ? '#ef4444' : '#a4b0be';
}

function getCenterCoords(element) {
    const rect = element.getBoundingClientRect();
    const containerRect = document.querySelector('.emulator-container').getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
    };
}

// Concurrent SVG Animation Generator
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

        const start = getCenterCoords(sourceEl);
        const end = getCenterCoords(destEl);

        sourceEl.classList.add('highlight-read');
        destEl.classList.add('highlight-write');

        const path = document.createElementNS("http://www.w3.org/2000/svg", "line");
        path.setAttribute("x1", start.x);
        path.setAttribute("y1", start.y);
        path.setAttribute("x2", end.x);
        path.setAttribute("y2", end.y);
        path.setAttribute("class", "data-path");
        
        const packet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        packet.setAttribute("r", "6");
        packet.setAttribute("cx", start.x);
        packet.setAttribute("cy", start.y);
        packet.setAttribute("class", "data-packet");

        animationLayer.appendChild(path);
        animationLayer.appendChild(packet);

        requestAnimationFrame(() => {
            packet.setAttribute("cx", end.x);
            packet.setAttribute("cy", end.y);
        });

        setTimeout(() => {
            sourceEl.classList.remove('highlight-read');
            destEl.classList.remove('highlight-write');
            path.remove();
            packet.remove();
            resolve();
        }, 450);
    });
}

function getRegElementId(reg) { return 'reg-' + reg.toLowerCase(); }
function getRamElementId(addr) { return 'ram-cell-' + addr; }

function getOpcodeMnemonic(opcode) {
    for (let key in OPCODES) {
        if (OPCODES[key] === opcode) return key;
    }
    return "UNKNOWN";
}

function getInstructionLength(opcode) {
    if (opcode === OPCODES.HALT) return 1;
    if (opcode === OPCODES.JMP || opcode === OPCODES.JNZ) return 2;
    return 3; // Default for Math and MOV
}

// --- COMPILER ---
document.getElementById('btn-assemble').addEventListener('click', () => {
    const rawLines = document.getElementById('assembly-input').value.split('\n');
    cpu.RAM.fill(0);

    let memoryWritePtr = 0;
    printConsole("Initializing compilation pipeline...");

    try {
        for (let rawLine of rawLines) {
            let cleanLine = rawLine.split(';')[0].trim();
            if (!cleanLine) continue; 

            if (memoryWritePtr >= 16) throw new Error("Compilation Error: Out of 16-byte memory limits.");

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

                if (isTargetMem && isSourceMem) throw new Error("Memory-to-Memory MOV not supported.");

                if (isTargetMem) {
                    let addr = parseInt(target.replace(/\[|\]/g, ''));
                    if (!['A', 'B', 'C', 'D'].includes(source) || isNaN(addr)) throw new Error("Invalid MOV syntax.");
                    cpu.RAM[memoryWritePtr++] = OPCODES.MOV_R_MEM;
                    cpu.RAM[memoryWritePtr++] = addr & 0xFF;
                    cpu.RAM[memoryWritePtr++] = source.charCodeAt(0);
                } else if (isSourceMem) {
                    let addr = parseInt(source.replace(/\[|\]/g, ''));
                    if (!['A', 'B', 'C', 'D'].includes(target) || isNaN(addr)) throw new Error("Invalid MOV syntax.");
                    cpu.RAM[memoryWritePtr++] = OPCODES.MOV_MEM_R;
                    cpu.RAM[memoryWritePtr++] = target.charCodeAt(0);
                    cpu.RAM[memoryWritePtr++] = addr & 0xFF;
                } else if (['A', 'B', 'C', 'D'].includes(source)) {
                    if (!['A', 'B', 'C', 'D'].includes(target)) throw new Error("Invalid MOV syntax.");
                    cpu.RAM[memoryWritePtr++] = OPCODES.MOV_REG;
                    cpu.RAM[memoryWritePtr++] = target.charCodeAt(0);
                    cpu.RAM[memoryWritePtr++] = source.charCodeAt(0);
                } else {
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
                if (!['A', 'B', 'C', 'D'].includes(regDest) || !['A', 'B', 'C', 'D'].includes(regSrc)) throw new Error("Invalid Math syntax.");
                cpu.RAM[memoryWritePtr++] = OPCODES[operation];
                cpu.RAM[memoryWritePtr++] = regDest.charCodeAt(0);
                cpu.RAM[memoryWritePtr++] = regSrc.charCodeAt(0);
            }
            else if (operation === 'JMP' || operation === 'JNZ') {
                let targetAddr = parseInt(parts[1]);
                if (isNaN(targetAddr)) throw new Error("Invalid Jump syntax.");
                cpu.RAM[memoryWritePtr++] = OPCODES[operation];
                cpu.RAM[memoryWritePtr++] = targetAddr & 0xFF;
            }
            else {
                throw new Error(`Assembler Exception: Instruction "${operation}" unrecognizable.`);
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

// --- 5-STAGE PIPELINE ENGINE ---
async function executeClockCycleStep() {
    if (cpu.halted && !pipeline.IF_ID.valid && !pipeline.ID_EX.valid && !pipeline.EX_MEM.valid && !pipeline.MEM_WB.valid) {
        runLoopActive = false;
        printConsole("Processor execution finished (System HALT or pipeline empty).");
        return;
    }

    if (isAnimating) return; // Prevent messy overlap of distinct clock cycles
    isAnimating = true;

    let animations = [];
    
    // Reverse processing to simulate parallel latches
    wbStage(animations);
    memStage(animations);
    exStage(animations);
    idStage(); // ID can stall IF
    ifStage();

    if (flushPipeline) {
        pipeline.IF_ID = { pc: 0, opcode: null, valid: false, instrStr: "BUBBLE" };
        pipeline.ID_EX = { pc: 0, opcode: null, writeReg: false, memRead: false, memWrite: false, branch: false, valid: false, instrStr: "BUBBLE" };
        flushPipeline = false;
        printConsole("Control Hazard: Branch mispredicted, pipeline flushed.");
    }

    updateHardwareDashboard();

    // Run SVG animations concurrently
    if (animations.length > 0) {
        await Promise.all(animations);
    } else {
        await new Promise(r => setTimeout(r, 50));
    }

    isAnimating = false;
}

function wbStage(animations) {
    const reg = pipeline.MEM_WB;
    if (reg.valid) {
        if (reg.writeReg && reg.destReg) {
            let writeData = reg.opcode === OPCODES.MOV_MEM_R ? reg.memData : reg.aluResult;
            cpu.registers[reg.destReg] = writeData;
            animations.push(animateDataFlow(getRegElementId(reg.destReg), getRegElementId(reg.destReg), writeData)); // highlight write
        }
        if (reg.opcode === OPCODES.HALT) {
            cpu.halted = true;
        }
    }
}

function memStage(animations) {
    const exReg = pipeline.EX_MEM;
    let memReg = { valid: false, writeReg: false, instrStr: "NOP" };

    if (exReg.valid) {
        memReg = { ...exReg };
        if (exReg.memRead) {
            memReg.memData = cpu.RAM[exReg.aluResult];
            // Simulate memory access animation
            animations.push(animateDataFlow(getRamElementId(exReg.aluResult), getRamElementId(exReg.aluResult), memReg.memData));
        }
        if (exReg.memWrite) {
            cpu.RAM[exReg.aluResult] = exReg.val2;
            animations.push(animateDataFlow(getRegElementId(exReg.destReg || 'a'), getRamElementId(exReg.aluResult), exReg.val2));
        }
    }
    pipeline.MEM_WB = memReg;
}

function exStage(animations) {
    const idReg = pipeline.ID_EX;
    let exReg = { valid: false, writeReg: false, memRead: false, memWrite: false, instrStr: "NOP" };

    if (idReg.valid) {
        exReg = { ...idReg };
        
        // Forwarding Logic (RAW Hazard Resolution)
        let fwdVal1 = idReg.val1;
        let fwdVal2 = idReg.val2;

        // EX/MEM Forwarding
        if (pipeline.EX_MEM.valid && pipeline.EX_MEM.writeReg && pipeline.EX_MEM.destReg !== null) {
            if (pipeline.EX_MEM.destReg === idReg.srcReg1) fwdVal1 = pipeline.EX_MEM.aluResult;
            if (pipeline.EX_MEM.destReg === idReg.srcReg2) fwdVal2 = pipeline.EX_MEM.aluResult;
        }
        // MEM/WB Forwarding
        if (pipeline.MEM_WB.valid && pipeline.MEM_WB.writeReg && pipeline.MEM_WB.destReg !== null) {
            let wbData = pipeline.MEM_WB.opcode === OPCODES.MOV_MEM_R ? pipeline.MEM_WB.memData : pipeline.MEM_WB.aluResult;
            if (pipeline.EX_MEM.destReg !== idReg.srcReg1 && pipeline.MEM_WB.destReg === idReg.srcReg1) fwdVal1 = wbData;
            if (pipeline.EX_MEM.destReg !== idReg.srcReg2 && pipeline.MEM_WB.destReg === idReg.srcReg2) fwdVal2 = wbData;
        }

        // ALU Operations
        switch (idReg.opcode) {
            case OPCODES.ADD:
                exReg.aluResult = fwdVal1 + fwdVal2;
                cpu.flags.C = exReg.aluResult > 255 ? 1 : 0; 
                exReg.aluResult = exReg.aluResult & 0xFF;
                cpu.flags.Z = exReg.aluResult === 0 ? 1 : 0;
                animations.push(animateDataFlow(getRegElementId(idReg.srcReg1), getRegElementId(idReg.destReg), exReg.aluResult));
                break;
            case OPCODES.SUB:
                exReg.aluResult = fwdVal1 - fwdVal2;
                cpu.flags.C = exReg.aluResult < 0 ? 1 : 0;
                exReg.aluResult = (exReg.aluResult < 0 ? exReg.aluResult + 256 : exReg.aluResult) & 0xFF;
                cpu.flags.Z = exReg.aluResult === 0 ? 1 : 0;
                animations.push(animateDataFlow(getRegElementId(idReg.srcReg1), getRegElementId(idReg.destReg), exReg.aluResult));
                break;
            case OPCODES.MOV_LIT:
                exReg.aluResult = fwdVal2; // val2 holds literal
                break;
            case OPCODES.MOV_REG:
                exReg.aluResult = fwdVal2; 
                break;
            case OPCODES.MOV_MEM_R:
                exReg.aluResult = idReg.addr;
                break;
            case OPCODES.MOV_R_MEM:
                exReg.aluResult = idReg.addr;
                exReg.val2 = fwdVal1; // Source reg val for store
                break;
            case OPCODES.JMP:
                exReg.branchTaken = true;
                exReg.branchTarget = idReg.addr;
                break;
            case OPCODES.JNZ:
                exReg.branchTaken = cpu.flags.Z === 0;
                exReg.branchTarget = idReg.addr;
                break;
        }

        // Resolve branch misprediction in EX stage (BTFNT Predictor check)
        if (idReg.branch) {
            let predictedTaken = idReg.addr < idReg.pc; // BTFNT
            if (predictedTaken !== exReg.branchTaken) {
                flushPipeline = true;
                cpu.PC = exReg.branchTaken ? exReg.branchTarget : (idReg.pc + getInstructionLength(idReg.opcode));
            }
        }
    }
    pipeline.EX_MEM = exReg;
}

function idStage() {
    const ifReg = pipeline.IF_ID;
    stallPipeline = false;
    let idReg = { valid: false, writeReg: false, memRead: false, memWrite: false, branch: false, instrStr: "NOP" };

    if (ifReg.valid) {
        let opcode = ifReg.opcode;
        let destRegStr = String.fromCharCode(ifReg.byte1);
        let srcRegStr = String.fromCharCode(ifReg.byte2);
        
        idReg.pc = ifReg.pc;
        idReg.opcode = opcode;
        idReg.valid = true;
        idReg.instrStr = ifReg.instrStr;

        // Decode Logic
        switch (opcode) {
            case OPCODES.MOV_LIT:
                idReg.destReg = destRegStr;
                idReg.val2 = ifReg.byte2;
                idReg.writeReg = true;
                break;
            case OPCODES.MOV_REG:
                idReg.destReg = destRegStr;
                idReg.srcReg2 = srcRegStr;
                idReg.val2 = cpu.registers[srcRegStr];
                idReg.writeReg = true;
                break;
            case OPCODES.MOV_MEM_R:
                idReg.destReg = destRegStr;
                idReg.addr = ifReg.byte2;
                idReg.memRead = true;
                idReg.writeReg = true;
                break;
            case OPCODES.MOV_R_MEM:
                idReg.addr = ifReg.byte1;
                idReg.srcReg1 = srcRegStr;
                idReg.destReg = srcRegStr; // Keep track of source register for dataflow logic in MEM
                idReg.val1 = cpu.registers[srcRegStr];
                idReg.memWrite = true;
                break;
            case OPCODES.ADD:
            case OPCODES.SUB:
                idReg.destReg = destRegStr;
                idReg.srcReg1 = destRegStr; // Dest is also src1
                idReg.srcReg2 = srcRegStr;
                idReg.val1 = cpu.registers[destRegStr];
                idReg.val2 = cpu.registers[srcRegStr];
                idReg.writeReg = true;
                break;
            case OPCODES.JMP:
            case OPCODES.JNZ:
                idReg.branch = true;
                idReg.addr = ifReg.byte1;
                break;
            case OPCODES.HALT:
                break;
        }

        // Load-Use Hazard Detection
        if (pipeline.ID_EX.valid && pipeline.ID_EX.memRead) {
            if (pipeline.ID_EX.destReg === idReg.srcReg1 || pipeline.ID_EX.destReg === idReg.srcReg2) {
                stallPipeline = true;
            }
        }
    }

    if (!stallPipeline) {
        pipeline.ID_EX = idReg;
    } else {
        // Insert bubble into EX if stalled
        pipeline.ID_EX = { pc: 0, opcode: null, writeReg: false, memRead: false, memWrite: false, branch: false, valid: false, instrStr: "BUBBLE" };
    }
}

function ifStage() {
    if (stallPipeline || cpu.halted) return;

    if (cpu.PC >= 16) {
        pipeline.IF_ID = { valid: false, instrStr: "NOP" };
        return;
    }

    let opcode = cpu.RAM[cpu.PC];
    let len = getInstructionLength(opcode);
    
    // Prevent reading past memory
    if (cpu.PC + len > 16) {
        pipeline.IF_ID = { valid: false, instrStr: "NOP" };
        return;
    }

    let mnemonic = getOpcodeMnemonic(opcode);
    let byte1 = len > 1 ? cpu.RAM[cpu.PC + 1] : null;
    let byte2 = len > 2 ? cpu.RAM[cpu.PC + 2] : null;

    let instrStr = mnemonic;
    if (len === 2) instrStr += ` 0x${byte1.toString(16).toUpperCase()}`;
    if (len === 3) instrStr += ` ${String.fromCharCode(byte1)}, ${opcode === OPCODES.MOV_LIT ? byte2 : String.fromCharCode(byte2)}`;

    pipeline.IF_ID = {
        pc: cpu.PC,
        opcode: opcode,
        byte1: byte1,
        byte2: byte2,
        valid: true,
        instrStr: instrStr
    };

    // Static Branch Predictor (BTFNT)
    if (opcode === OPCODES.JMP || opcode === OPCODES.JNZ) {
        let predictedTaken = byte1 < cpu.PC; // Backward branch -> Predict taken
        if (predictedTaken) {
            cpu.PC = byte1;
            return;
        }
    }

    cpu.PC += len;
}

// --- RUNTIME EVENT HOOKS ---
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
    while (runLoopActive && !cpu.halted) {
        await executeClockCycleStep();
        await new Promise(r => setTimeout(r, chkAnimate && chkAnimate.checked ? 100 : 50));
    }
    btnStep.disabled = cpu.halted;
    btnRun.disabled = cpu.halted;
}

btnRun.addEventListener('click', () => {
    if (runLoopActive) return;
    runLoopActive = true;
    btnRun.disabled = true;
    btnStep.disabled = true;
    printConsole("Pipeline execution loop running...");
    executionLoop();
});

function resetHardwareState() {
    runLoopActive = false;
    isAnimating = false;
    stallPipeline = false;
    flushPipeline = false;
    animationLayer.innerHTML = '';
    cpu.registers = { A: 0, B: 0, C: 0, D: 0 };
    cpu.PC = 0;
    cpu.flags = { Z: 1, C: 0 };
    cpu.halted = false;
    
    pipeline = {
        IF_ID: { pc: 0, opcode: null, valid: false, instrStr: "NOP" },
        ID_EX: { pc: 0, opcode: null, valid: false, instrStr: "NOP" },
        EX_MEM: { pc: 0, opcode: null, valid: false, instrStr: "NOP" },
        MEM_WB: { pc: 0, opcode: null, valid: false, instrStr: "NOP" }
    };
    
    updateHardwareDashboard();
}

document.getElementById('btn-reset').addEventListener('click', () => {
    resetHardwareState();
    cpu.RAM.fill(0);
    updateHardwareDashboard();
    btnStep.disabled = true;
    btnRun.disabled = true;
    printConsole("Pipeline state flushed. RAM cleared.");
});

renderInitialHardwareGrid();
updateHardwareDashboard();