.equ STACK_TOP, 0xEFFE
.equ TILE_MAP_BUFFER_ADDR, 0xF000
.equ TILE_DEFINITIONS_ADDR, 0xF200
.equ COLOR_PALLETE_ADDR, 0xFA00

.text
.org 0x0000
j main
.org 0x0020
main:
    li16 sp, STACK_TOP # Initialize stack pointer
    li t0, -1
    call read_keyboard
    call move_p1
    call move_p2
    call move_ball
    j main



move_p1:
    # Push the return address and s0
    addi sp, -4
    sw ra, 0(sp)        # save ra (x1)

    la t0, p1_dir
    li t1, 1
    lw s0, 0(t0)            # load p1_dir
    beq s0, t1, p1_move_up
    li t1, -1
    beq s0, t1, p1_should_move_down
    j p1_move_done
    p1_should_move_down:
        j p1_move_down
    p1_move_up:
        la t0, p1_pos
        lbu a0, 0(t0)            # load p1_pos
        li s0, 0
        bz a0, p1_move_up_nothing # if p1_pos == 0, do nothing
        j after_p1_move_up_nothing
        p1_move_up_nothing:
        j p1_move_done
        after_p1_move_up_nothing:
            addi a0, -1             # p1_pos = p1_pos - 1
            sb a0, 0(t0)            # store new position in p1_pos
            call get_offset # Get the offset for the tile map
            la t0, tiles
            add t0, a0              # t0 = &tiles[offset]
            li a1, 2
            sb a1, 0(t0)            # store 1 in tiles at the offset
            # Remove the old position of player 1 that is p1_pos + 4
            # Load the old position into a0
            la t0, p1_pos
            lbu a0, 0(t0)            # load p1_pos
            addi a0, 3              # a0 = p1_pos + 3
            call get_offset # Get the offset for the tile map
            la t0, tiles
            add t0, a0              # t0 = &tiles[offset]
            li a1, 0
            sb a1, 0(t0)            # store 0 in tiles at the old position

            j p1_move_done

    p1_move_down:
        la t0, p1_pos
        lbu a0, 0(t0)            # load p1_pos
        li s0, 12
        beq a0, s0, p1_move_down_nothing # if p1_pos == 0, do nothing
        j after_p1_move_down_nothing
        p1_move_down_nothing:
        j p1_move_done
        after_p1_move_down_nothing:
            addi a0, 1             # p1_pos = p1_pos + 1
            sb a0, 0(t0)            # store new position in p1_pos

            # We will highlight with white the position that is p1_pos + 3
            addi a0, 2
            call get_offset # Get the offset for the tile map
            la t0, tiles
            add t0, a0              # t0 = &tiles[offset]
            li a1, 2
            sb a1, 0(t0)            # store 1 in tiles at the offset

            # Remove the old position of player 1 that is p1_pos - 1
            # Load the old position into a0
            la t0, p1_pos
            lbu a0, 0(t0)            # load p1_pos
            addi a0, -1              # a0 = p1_pos -1
            call get_offset # Get the offset for the tile map
            la t0, tiles
            add t0, a0              # t0 = &tiles[offset]
            li a1, 0
            sb a1, 0(t0)            # store 0 in tiles at the old position

            j p1_move_done

    p1_move_done:
        # Restore the return address and s0
        lw ra, 0(sp)
        addi sp, 4
        ret

move_p2:
    # Push the return address and s0
    addi sp, -4
    sw ra, 0(sp)        # save ra (x1)

    la t0, p2_dir
    li t1, 1
    lw s0, 0(t0)            # load t0 = p2_dir
    beq s0, t1, p2_move_up  # if p2_dir == 1, move up
    li t1, -1 
    beq s0, t1, p2_should_move_down # if p2_dir == -1, move down
    j p2_move_done
    p2_should_move_down:
        j p2_move_down
    p2_move_up:
        la t0, p2_pos
        lbu a0, 0(t0)            # load a0 = p2_pos
        bz a0, p2_move_up_nothing # if p2_pos == 0, do nothing
        j after_p2_move_up_nothing
        p2_move_up_nothing:
        j p2_move_done
        after_p2_move_up_nothing:
            addi a0, -1             # p2_pos = p2_pos - 1
            sb a0, 0(t0)            # store new position in p1_pos
            call get_offset         # Get the offset for the tile map
            addi a0, 19             # The player 2 offset
            la t0, tiles
            add t0, a0              # t0 = &tiles[offset]
            li a1, 3
            sb a1, 0(t0)            # store 1 in tiles at the offset
            # Remove the old position of player 1 that is p1_pos + 4
            # Load the old position into a0
            la t0, p2_pos
            lbu a0, 0(t0)            # load p2_pos
            addi a0, 3              # a0 = p2_pos + 3
            call get_offset # Get the offset for the tile map
            addi a0, 19             # The player 2 offset
            la t0, tiles
            add t0, a0              # t0 = &tiles[offset]
            li a1, 0
            sb a1, 0(t0)            # store 0 in tiles at the old position

            j p2_move_done

    p2_move_down:
        la t0, p2_pos
        lbu a0, 0(t0)            # load p2_pos
        li s0, 12
        beq a0, s0, p2_move_down_nothing # if p2_pos == 0, do nothing
        j after_p2_move_down_nothing
        p2_move_down_nothing:
        j p2_move_done
        after_p2_move_down_nothing:
            addi a0, 1             # p2_pos = p2_pos + 1
            sb a0, 0(t0)            # store new position in p2_pos

            # We will highlight with white the position that is p2_pos + 2
            addi a0, 2
            call get_offset # Get the offset for the tile map
            addi a0, 19             # The player 2 offset
            la t0, tiles
            add t0, a0              # t0 = &tiles[offset]
            li a1, 3
            sb a1, 0(t0)            # store 1 in tiles at the offset

            # Remove the old position of player 1 that is p2_pos - 1
            # Load the old position into a0
            la t0, p2_pos
            lbu a0, 0(t0)            # load p2_pos
            addi a0, -1              # a0 = p2_pos -1
            call get_offset # Get the offset for the tile map
            addi a0, 19
            la t0, tiles
            add t0, a0              # t0 = &tiles[offset]
            li a1, 0
            sb a1, 0(t0)            # store 0 in tiles at the old position

            j p2_move_done

    p2_move_done:
        # Restore the return address and s0
        lw ra, 0(sp)
        addi sp, 4
        ret

read_keyboard:
    li16 a0, 'w'
    ecall 7
    bnz a0, p1_set_up
    j after_p1_set_up
    p1_set_up:
        la t0, p1_dir
        li a0, 1
        sw a0, 0(t0)            # store in p1_dir = 1
    after_p1_set_up:
    li16 a0, 's'
    ecall 7
    bnz a0, p1_set_down
    j after_p1_set_down
    p1_set_down:
        la t0, p1_dir
        li a0, -1
        sw a0, 0(t0)            # store in p1_dir = -1
    after_p1_set_down:

    li16 a0, 'i'
    ecall 7
    bnz a0, p2_set_up
    j after_p2_set_up
    p2_set_up:
        la t0, p2_dir
        li a0, 1
        sw a0, 0(t0)            # store in p2_dir = 1
    after_p2_set_up:
    li16 a0, 'k'
    ecall 7
    bnz a0, p2_set_down
    j after_p2_set_down
    p2_set_down:
        la t0, p2_dir
        li a0, -1
        sw a0, 0(t0)            # store in p2_dir = -1
    after_p2_set_down:
    ret

get_offset: 
    # Get the offset for the tile map based on player's y position
    # Input: a0 = player's y position
    # Output: a0 = offset in tile map
    # There is no multiplication instruction, so we use addition, also we only have access to t0, t1
    # Save the return address, s0, t0, and t1 on the stack

    addi sp, -12
    sw ra, 8(sp)        # save ra
    sw t1, 4(sp)         # save t1
    sw t0, 0(sp)         # save t0

    mv t0, a0          # Move player's y position to t0
    slli t0, 4
    mv t1, a0
    slli t1, 2
    add t0, t1
    mv a0, t0

    # Restore the return address, ra, t0, and t1 from the stack
    lw ra, 8(sp)        # restore ra
    lw t1, 4(sp)         # restore t1
    lw t0, 0(sp)         # restore t0
    addi sp, 12         # restore stack pointer

    ret

move_ball:
    addi sp, -4
    sw ra, 0(sp)        # save ra (x1)

    ###### Save the old position of the ball ########
    la t0, ball_pos_y
    lbu a1, 0(t0)            # load ball_pos_y
    la t0, ball_old_pos_y
    sb a1, 0(t0)            # store old ball_pos_y

    la t0, ball_pos_x
    lbu a1, 0(t0)            # load ball_pos_x
    la t0, ball_old_pos_x
    sb a1, 0(t0)            # store old ball_pos_x

    ######## Calculate the next position of the ball and stores them ########
    # New x position
    la t0, ball_dir_x
    lbu a1, 0(t0)            # load ball_dir_x
    la t0, ball_pos_x
    lbu a0, 0(t0)            # load ball_pos_x
    add a0, a1
    sb a0, 0(t0)            # store new ball_pos_x    

    # New y position
    la t0, ball_dir_y
    lbu a1, 0(t0)            # load ball_dir_x
    la t0, ball_pos_y
    lbu a0, 0(t0)            # load ball_pos_x
    add a0, a1
    sb a0, 0(t0)            # store new ball_pos_x    

    ###### Paint the ball in the tile map ########

    # cheking Check_collision
    
    check_collision_y:
    # change y direction if the ball hits the top or bottom wall
    la t0, ball_pos_y
    li t1, 14
    lbu a0, 0(t0)            # load ball_pos_y
    bz a0, neg_y_dir
    beq a0, t1, neg_y_dir # if ball_pos_y == 14, negate the direction

    j check_collision_x
neg_y_dir:
    la t0, ball_dir_y
    lbu t1, 0(t0)            # load ball_dir_y  
    neg t1
    sb t1, 0(t0)            # store negated ball_dir_y

check_collision_x:
    # change x direction if the ball hits the left or right wall
    la t0, ball_pos_x
    lbu a0, 0(t0)            # load ball_pos_x
    li t1, 19
    bz a0, neg_x_dir_left
    beq a0, t1, should_neg_x_dir_right  # if ball_pos_x == 19, negate the direction

    j paint_ball
should_neg_x_dir_right:
    j neg_x_dir_right

neg_x_dir_left:

    la t0, ball_pos_y
    lbu t1, 0(t0)            # load ball_pos_y
    la t0, p1_pos
    lbu a0, 0(t0)            # load p1_pos
    sub t1, a0   
    li a1, 0
    bge t1, a1, neg_x_dir_double_check_left     # if ball_pos_y >= p1_pos, negate the direction
    j Game_over

neg_x_dir_double_check_left:
    li a1, 3
    blt t1, a1, neg_x_dir_left_done # if ball_pos_y < p1_pos + 3, negate the direction
    j Game_over  

neg_x_dir_left_done:

    la t0, ball_pos_x
    lbu t1, 0(t0)            # load ball_pos_x
    addi t1,2 
    sb t1, 0(t0)            # store new ball_pos_x
    la t0, ball_dir_x
    lbu t1, 0(t0)            # load ball_dir_x
    neg t1
    sb t1, 0(t0)            # store negated ball_dir_x
    j paint_ball
    
  ####################  
neg_x_dir_right:

    la t0, ball_pos_y
    lbu t1, 0(t0)            # load ball_pos_y
    la t0, p2_pos
    lbu a0, 0(t0)            # load p1_pos
    sub t1, a0   
    li a1, 0
    bge t1, a1, neg_x_dir_double_check_right 
    j Game_over

neg_x_dir_double_check_right:
    li a1, 3
    blt t1, a1, neg_x_dir_right_done # if ball_pos_y < p1_pos + 3, negate the direction
j Game_over  

neg_x_dir_right_done:

    la t0, ball_pos_x
    lbu t1, 0(t0)            # load ball_pos_x
    addi t1, -2
    sb t1, 0(t0)            # store new ball_pos_x
    la t0, ball_dir_x
    lbu t1, 0(t0)            # load ball_dir_x
    neg t1
    sb t1, 0(t0)            # store negated ball_dir_x
    j paint_ball



    
paint_ball:
    la t0, ball_pos_y
    lbu a0, 0(t0)            # load ball_pos_y
    call get_offset # Get the offset for the tile map
    la t0, ball_pos_x
    lbu t1, 0(t0)            # load ball_pos_x
    add a0, t1              # a0 = y_offset + ball_pos_x
    la t0, tiles
    add t0, a0              # t0 = &tiles[offset]
    li a1, 1
    sb a1, 0(t0)            # store 1 in tiles at the new position

    # Remove the old position of the ball
    la t0, ball_old_pos_y
    lbu a0, 0(t0)            # load ball_old_pos_y
    call get_offset # Get the offset for the tile map
    la t0, ball_old_pos_x
    lbu t1, 0(t0)            # load ball_old_pos_x
    add a0, t1              # a0 = y_offset + ball_old_pos_x
    la t0, tiles
    add t0, a0              # t0 = &tiles[offset]
    li a1, 0
    sb a1, 0(t0)            # store 0 in tiles at the old position

    

    move_ball_done:
    lw ra, 0(sp)        # restore ra
    addi sp, 4
    ret

Game_over:
    ECALL 10       # Exit program syscall


    


.data
p1_dir:
    .word 0     # 1 for up, -1 for down
p1_pos:
    .byte 6 # Default position of player 1 (min = 0, max = 14)
p2_pos:
    .byte 6 # Default position of player 2 (min = 0, max = 14)
p2_dir:
    .word 0         # 1 for up, -1 for down
ball_pos_y:
    .byte 2     # Default position of the ball (min = 0, max = 14)
ball_pos_x:
    .byte 2 # Default position of the ball (min = 0, max = 19)
ball_old_pos_y:
    .byte 7 # Old position of the ball (min = 0, max = 14)
ball_old_pos_x:
    .byte 9 # Old position of the ball (min = 0, max = 19)
ball_dir_y:
    .byte 1 # 1 for down, -1 for up
ball_dir_x: 
    .byte 1 # 1 for right, -1 for left

.org 0xF000
tiles:
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3
    .byte 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3
    .byte 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    .byte 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0

.org 0xF200




# background tiles
tile0_data:    .fill 128,1,0x00 

# Ball tiles
tile1_data:        
    .byte 0x00, 0x00, 0x00, 0x11, 0x11, 0x00, 0x00, 0x00
    .byte 0x00, 0x00, 0x11, 0x11, 0x11, 0x11, 0x00, 0x00
    .byte 0x00, 0x00, 0x11, 0x11, 0x11, 0x11, 0x00, 0x00
    .byte 0x00, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x00
    .byte 0x00, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11
    .byte 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11
    .byte 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11
    .byte 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11
    .byte 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x00
    .byte 0x00, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x00
    .byte 0x00, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x00
    .byte 0x00, 0x00, 0x11, 0x11, 0x11, 0x11, 0x00, 0x00
    .byte 0x00, 0x00, 0x11, 0x11, 0x11, 0x11, 0x00, 0x00
    .byte 0x00, 0x00, 0x00, 0x11, 0x11, 0x00, 0x00, 0x00

# Player 1 tiles
tile2_data:    
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11
    .byte 0x00, 0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x11

# Player 2 tiles
tile3_data:    
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00
    .byte 0x11, 0x11, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00

tile4_data:    .fill 128,1,0x44  
tile5_data:    .fill 128,1,0x55  
tile6_data:    .fill 128,1,0x66  
tile7_data:    .fill 128,1,0x77  
tile8_data:    .fill 128,1,0x88  
tile9_data:    .fill 128,1,0x99  
tile10_data:   .fill 128,1,0xAA   
tile11_data:   .fill 128,1,0xBB   
tile12_data:   .fill 128,1,0xCC   
tile13_data:   .fill 128,1,0xDD   
tile14_data:   .fill 128,1,0xEE   
tile15_data:   .fill 128,1,0xFF   

.org 0xFA00
palette_data:
    .byte 0x00,  0xDA,  0xDA,  0xB6,  0xB6,  0x92,  0x91,  0x6D
    .byte 0x6D,  0x49,  0x49,  0x24,  0x24,  0x00,  0x00,  0xFF
