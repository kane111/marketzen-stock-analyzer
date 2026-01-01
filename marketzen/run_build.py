import subprocess
import os

# Change to marketzen directory
os.chdir('/workspace/marketzen')

# Run the build
result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
