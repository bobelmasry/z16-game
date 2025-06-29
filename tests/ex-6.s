# Test Case 6: Stack and arithmetic test through Febonacci
# File: ex-6.s
# Tests: Fibonacci Series

.text
.org 0x000
    j  main
.org 0x0020
main:

    li x6, 5
    jal x1, Fib
    # Final exit
    ecall 0x00A         # Exit system call

Fib:
    addi x2, -6
    sw x1 , 0(x2)
    sw x6, 2(x2)
    addi x6, x6, -1
    jal x1, Fib         # Fib(x-1)

    sw x6, 4(x2)
    lw x6, 2(x2)
    addi x6, -2

    jal x1, Fib         # Fib(x-1)
    lw t0, 4(x2)
    add x6, t0
    lw x1, 0(x2)
    addi x2, 12

    jr x1       # return
