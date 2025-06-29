# Test Case 5: Logical tests
# File: ex-5.s
# Tests: AND, OR, XOR, ANDi, ORi, and XORi

.text
.org 0x000
    j  main
.org 0x0020

main:

    li x0, 0xff
    li x1, 0x0A

    And x0, x1      # x0 = x1 & x0 = x1 
    xor x1, x1      # x1 = x1 ^ x1 = 0

    li x0, 0xff
    li x1, 0x0A     

    ori x1, 0x01    # x1 = x1 or 1 = 11
    andi x0, 0x08   # x0 = 8
    xori x0, 0x07    # x0 = 15
    xor x0, x1      # x0 = x0 ^ x1 = 4

      # Exit
    ecall 0x00A
