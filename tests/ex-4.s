# Test Case 4: Stack operations using Add down
# File: ex-4.s
# Tests: Managing stack through recursion

.text
.org 0x000
    j  main
.org 0x0020
main:
    li x0, 0
    li x6, 5            # input number for factorial
    jal x1, add_down        # result in x6
    
    # Exit
    ecall 0x00A

add_down:
    beq x6, x0, base_case

    # Save x1 and x6 on stack
    addi x2, -8
    sw x1, 4(x2)
    sw x6, 0(x2)

    addi x6, -1         # x6 = n - 1
    jal x1, add_down        # recursive call

    # Restore original x6 (n)
    lw x5, 0(x2)
    lw x1, 4(x2)
    addi x2, 8

    add x6, x5          # x6 = result_from_recursive + n
    jr x1

base_case:
    li x6, 0
    jr x1

