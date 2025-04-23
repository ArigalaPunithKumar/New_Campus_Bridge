# backend/sandbox_executor.py

import time
import random

# --- IMPORTANT --- #
# This is a PLACEHOLDER module. Direct code execution is UNSAFE.
# You MUST replace these functions with calls to a secure sandbox environment
# like Docker containers or a code execution API (e.g., Judge0).
# ----------------- #

def execute_code_securely(language: str, code: str, input_data: str):
    """Placeholder for secure code execution.

    Args:
        language: The programming language (e.g., 'python', 'javascript').
        code: The source code to execute.
        input_data: Standard input for the code.

    Returns:
        A dictionary containing: {
            'success': bool,       # True if execution finished (even with errors), False if sandbox failed
            'stdout': str,       # Captured standard output
            'stderr': str,       # Captured standard error (compilation or runtime)
            'error_type': str|None, # Type of error ('compile', 'runtime', 'timeout', etc.) - Optional
            'execution_time': float|None # Execution time in seconds - Optional
        }
    """
    print(f"--- SANDBOX PLACEHOLDER: Executing {language} --- START ---")
    print(f"Code:\n{code}")
    print(f"Input: {input_data}")

    # Simulate execution delay
    time.sleep(random.uniform(0.5, 2.0))

    # --- Simulate Output/Error based on code content (VERY basic) --- #
    stdout = ""
    stderr = ""
    success = True
    error_type = None

    if "error" in code.lower(): # Simulate runtime error
        stderr = f"Traceback (most recent call last):\n  File \"<stdin>\", line {random.randint(1,5)}\nSimulatedRuntimeError: Something went wrong (placeholder)!"
        error_type = 'runtime'
    elif "compile" in code.lower(): # Simulate compile error
        stderr = f"Compilation Error: Invalid syntax near token 'compile_error' on line {random.randint(1,3)} (placeholder)."
        error_type = 'compile'
    elif "timeout" in code.lower(): # Simulate timeout
         stderr = "Execution Timeout: Process exceeded allowed time limit (placeholder)."
         error_type = 'timeout'
    else: # Simulate successful execution
        stdout = f"Hello from {language}!\nProcessed input: {input_data or '[No Input]'}\nSimulated output line 1.\nSimulated output line 2."

    print(f"--- SANDBOX PLACEHOLDER: Execution Result --- > Success: {success}, Stdout: {len(stdout)} chars, Stderr: {len(stderr)} chars, Type: {error_type}")
    print(f"--- SANDBOX PLACEHOLDER: Executing {language} --- END ---")

    return {
        'success': success, # This 'success' might mean the sandbox ran, not the code itself
        'stdout': stdout,
        'stderr': stderr,
        'error_type': error_type,
        'execution_time': random.uniform(0.1, 0.5) # Simulated time
    } 