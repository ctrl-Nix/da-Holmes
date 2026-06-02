import urllib.request
import sys

try:
    url = "http://localhost:8000/api/scan/full?target=sreeansh11@gmail.com&save=true"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        for line in response:
            print(line.decode('utf-8').strip())
            sys.stdout.flush()
except Exception as e:
    print("Error:", e)
