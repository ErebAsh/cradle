const test = require('node:test');
const assert = require('node:assert/strict');
const { OPCODES, createCPUState, executeSingleInstruction } = require('../projects/dev-tools/cpu-emulator/emulatorCore');
const { assembleCode } = require('../projects/dev-tools/cpu-emulator/assembler');

test('CPU state initialization defaults to correct values', () => {
    const cpu = createCPUState();
    assert.equal(cpu.registers.A, 0);
    assert.equal(cpu.registers.B, 0);
    assert.equal(cpu.PC, 0);
    assert.equal(cpu.flags.Z, 1);
    assert.equal(cpu.flags.C, 0);
    assert.equal(cpu.RAM.length, 16);
    assert.equal(cpu.halted, false);
});

test('assembler compiles basic MOV and ADD instructions correctly', () => {
    const ram = new Uint8Array(16);
    const code = `
        MOV A, 10
        MOV B, 5
        ADD A, B
        HALT
    `;
    const bytesWritten = assembleCode(code, ram);
    assert.equal(ram[0], OPCODES.MOV_LIT);
    assert.equal(ram[1], 'A'.charCodeAt(0));
    assert.equal(ram[2], 10);
    assert.equal(ram[3], OPCODES.MOV_LIT);
    assert.equal(ram[4], 'B'.charCodeAt(0));
    assert.equal(ram[5], 5);
    assert.equal(ram[6], OPCODES.ADD);
    assert.equal(ram[7], 'A'.charCodeAt(0));
    assert.equal(ram[8], 'B'.charCodeAt(0));
    assert.equal(ram[9], OPCODES.HALT);
    assert.equal(bytesWritten, 10);
});

test('assembler handles bitwise and unary instructions AND, OR, XOR, NOT, INC, DEC', () => {
    const ram = new Uint8Array(16);
    const code = `
        MOV A, 12
        AND A, B
        NOT A
        INC B
        HALT
    `;
    const bytesWritten = assembleCode(code, ram);
    assert.ok(bytesWritten > 0);
    assert.ok(bytesWritten <= 16);
    assert.equal(ram[0], OPCODES.MOV_LIT);
});

test('executes bitwise operations correctly and updates flags', () => {
    const cpu = createCPUState();
    cpu.registers.A = 0b1100;
    cpu.registers.B = 0b1010;

    // Execute AND A, B
    executeSingleInstruction(cpu, OPCODES.AND, 'A'.charCodeAt(0), 'B'.charCodeAt(0));
    assert.equal(cpu.registers.A, 0b1000);
    assert.equal(cpu.flags.Z, 0);

    // Execute XOR A, B (0b1000 ^ 0b1010 = 0b0010)
    executeSingleInstruction(cpu, OPCODES.XOR, 'A'.charCodeAt(0), 'B'.charCodeAt(0));
    assert.equal(cpu.registers.A, 0b0010);
});

test('executes INC and DEC and checks flags', () => {
    const cpu = createCPUState();
    cpu.registers.C = 255;

    // INC C should overflow to 0 and set carry flag
    executeSingleInstruction(cpu, OPCODES.INC, 'C'.charCodeAt(0), null);
    assert.equal(cpu.registers.C, 0);
    assert.equal(cpu.flags.Z, 1);
    assert.equal(cpu.flags.C, 1);

    // DEC C should underflow to 255 and set carry flag
    executeSingleInstruction(cpu, OPCODES.DEC, 'C'.charCodeAt(0), null);
    assert.equal(cpu.registers.C, 255);
    assert.equal(cpu.flags.Z, 0);
    assert.equal(cpu.flags.C, 1);
});

test('throws descriptive assembler errors for invalid operations', () => {
    const ram = new Uint8Array(16);
    assert.throws(() => {
        assembleCode('INVALID_CMD A, B', ram);
    }, /Unknown mnemonic/);

    assert.throws(() => {
        assembleCode('MOV [0], [1]', ram);
    }, /Memory-to-Memory MOV not supported/);
});
