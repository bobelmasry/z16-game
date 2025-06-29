# Test Case 1: Basic Instructions Test
# File: test1_basic.s
# Tests: All instruction formats, basic operands

.text
.org 0x000
    j  main
.org 0x0030
main:
    # R-Type instructions
    add x1, x2          # Basic arithmetic
    sub x3, x4          # Subtraction
    and x5, x6          # Logical AND
    or x6, x7           # Logical OR
    xor x1, x2          # Logical XOR
    slt x3, x4          # Set less than
    sltu x5, x6         # Set less than unsigned
    sll x1, x2          # Shift left logical
    srl x3, x4          # Shift right logical
    sra x5, x6          # Shift right arithmetic
    mv x7, x1           # Move register
    
    # I-Type instructions
    addi x1, 42         # Add immediate
    addi x2, -15        # Negative immediate
    slti x3, 63         # Set less than immediate (7-bit max)
    sltui x4, 50        # Set less than unsigned immediate
    ori x5, 0x0F        # OR immediate
    andi x6, 0x3F       # AND immediate (7-bit max)
    xori x7, 0x7F       # XOR immediate (7-bit max)
    
    # Shift immediates
    slli x1, 4          # Shift left logical immediate
    srli x2, 8          # Shift right logical immediate
    srai x3, 2          # Shift right arithmetic immediate
    
    # Load immediate (7-bit range)
    li x1, 42           # Real LI instruction
    li x2, -32          # Real LI instruction
    li x3, 63           # Real LI instruction
    
    # Memory operations (ZX16 has 4-bit signed offset: -8 to +7)
    lw x1, 4(x2)        # Load word
    lb x3, -2(x4)       # Load byte
    lbu x5, 0(x6)       # Load byte unsigned
    sw x1, 7(x2)        # Store word (max offset +7)
    sb x3, -1(x4)       # Store byte
    
    # Final exit
    ecall 0x00A         # Exit system call
