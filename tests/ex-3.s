# Test Case 3: arithmetic tests
# File: ex-3.s
# Tests: Addition, subtraction, shifting(normal and arithmetic), and 2's complement

.text
.org 0x000
    j  main
.org 0x0020

main:
    li x0, 8    # a = 8
    li x5, 6    # b = 6
    addi x0, 2  # a = a + 2
    add x5, x0  # b = b + a = 16
    slli x5, 2  # b = 4b = 64
    li x6, 0    
    sub x6, x0  # -a = -10
    li x0, -10  
    srli x0, 2  
    srai x6, 2  # test 2 types of shifting right

    # exit program
    ecall 0x00A 

