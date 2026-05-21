from Wappalyzer import Wappalyzer, WebPage

w = Wappalyzer.latest()
page = WebPage(
    url="https://google.com", 
    html='<html><head><script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script></head><body></body></html>', 
    headers={"server": "Apache", "Server": "Apache"}
)
res = w.analyze_with_categories(page)
print("Result categories:", res)
