interrupt = False
interrupt_callback = None

def set_interrupt(callback):
    global interrupt, interrupt_callback
    interrupt = True
    interrupt_callback = callback
    print("Interrupted")

def clear_interrupt():
    global interrupt, interrupt_callback
    interrupt = False
    if (interrupt_callback):
        interrupt_callback()
    interrupt_callback = None
    