# Test Case 1: Basic Instructions Test
# File: test1_basic.s
# Tests: All instruction formats, basic operands

.text
.org 0x000
    j  main
.org 0x0020
main:    
    # Branch instructions (short range branches)
    beq x1, x2, loop    # Branch if equal
    blt x5, x6, loop    # Branch if less than
    bz x1, zero_case    # Branch if zero
    bnz x2, nonzero     # Branch if not zero

loop:
    addi x1, 1
    j end_section       # Jump to avoid fall-through
    
zero_case:
    li x7, 0
    j end_section
    
nonzero:
    addi x2, 1

end_section:
    # Jump instructions
    jal x1, function    # Jump and link
    jr x1               # Jump register
    jalr x2, x3         # Jump and link register
    j final_section     # Jump to final section
    
function:
    # Upper immediate instructions (9-bit immediate: 0-511)
    lui x1, 0x100       # Load upper immediate (256)
    auipc x2, 0x1FF     # Add upper immediate to PC (511 - max 9-bit)
    
    # System call
    ecall 0x008         # System call
    ret                 # Return from function
    
final_section:
    nop                 # No operation
    
    # Final exit
    ecall 0x00A         # Exit system call
