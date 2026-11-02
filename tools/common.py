"""Shared paths and headless Chrome helpers for the lesson tools (standard library only)."""
import http.server, json, os, pathlib, shutil, subprocess, sys, threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENGINE = ROOT / "engine"
LESSONS = ROOT / "lessons"
DIST = ROOT / "dist"
CACHE = ROOT / ".cache"
CHROME_FLAGS = ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-sandbox"]


def lesson_dir(slug):
    d = LESSONS / slug
    if not (d / "lesson.json").exists():
        sys.exit(f"No lesson at {d} (expected lesson.json). Scaffold one with: python3 tools/new_lesson.py {slug}")
    return d


def find_chrome():
    env = os.environ.get("CHROME")
    if env:
        return env
    mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if os.path.exists(mac):
        return mac
    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        found = shutil.which(name)
        if found:
            return found
    sys.exit("Chrome not found. Install Google Chrome, or set CHROME=/path/to/chrome.")


def chrome(url, width, height, *extra, budget=6000, capture=True):
    """One-shot headless run, used for screenshots. Headless viewports are about 143px shorter than --window-size."""
    CACHE.mkdir(exist_ok=True)
    cmd = [find_chrome(), *CHROME_FLAGS, f"--user-data-dir={CACHE / 'chrome'}", f"--window-size={width},{height}",
           f"--virtual-time-budget={budget}", *extra, url]
    return subprocess.run(cmd, stdout=subprocess.PIPE if capture else subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True, timeout=180)


def probe(page_html, name, js, width, height, timeout=90):
    """Load the page in real-time headless Chrome and inject js before </body>; it must call __report(obj). Returns obj.

    Real time matters: under --virtual-time-budget Chrome fires almost no animation frames, so IntersectionObserver and
    requestAnimationFrame never run and animations look broken when they aren't. Results come back over a local POST.
    """
    got = {}
    done = threading.Event()

    class Sink(http.server.BaseHTTPRequestHandler):
        def do_POST(self):
            got["body"] = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            done.set()

        def log_message(self, *args):
            pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Sink)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]
    head = '<script>window.__errs=[];addEventListener("error",e=>__errs.push(e.message+" @"+e.lineno));' \
           f'window.__report=o=>fetch("http://127.0.0.1:{port}/",{{method:"POST",mode:"no-cors",body:JSON.stringify(o)}});</script>'
    html = page_html.replace("<head>", "<head>" + head, 1)
    i = html.rindex("</body>")
    html = html[:i] + "<script>" + js + "</script>" + html[i:]
    CACHE.mkdir(exist_ok=True)
    path = CACHE / f"{name}.html"
    path.write_text(html)
    proc = subprocess.Popen([find_chrome(), *CHROME_FLAGS, f"--user-data-dir={CACHE / name}", f"--window-size={width},{height}", path.as_uri()],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not done.wait(timeout):
            sys.exit(f"The {name} probe never reported back within {timeout}s. The page's scripts probably crashed before it ran.")
    finally:
        proc.terminate()
        try:
            proc.wait(5)
        except subprocess.TimeoutExpired:
            proc.kill()
        server.shutdown()
    return json.loads(got["body"])
