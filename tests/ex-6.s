# Test Case 6: Stack and arithmetic test through Febonacci
# File: ex-6.s
# Tests: Fibonacci Series

.equ STACK_TOP, 0xEFFE

.text
.org 0x000
    j  main
.org 0x0020
main:
    li16 sp, STACK_TOP  # Initialize stack pointer
    li a0, 8
    call Fib
    # Final exit
    ecall 0x00A         # Exit system call

Fib:
    li t0, 2
    blt a0, t0, base_case
    j continue
    base_case:
        ret
    continue:
    addi sp, -6
    sw ra , 0(sp)
    sw a0, 2(sp)
    addi a0, -1
    call Fib         # Fib(x-1)

    sw a0, 4(sp)
    lw a0, 2(sp)
    addi a0, -2

    call Fib        # Fib(x-1)
    lw t0, 4(sp)
    add  t0, a0
    mv   a0, t0
    lw ra, 0(sp)
    addi sp, 6

    ret
