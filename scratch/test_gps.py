from google_play_scraper import search

def main():
    try:
        results = search("Zepto", lang="en", country="us")
        if results:
            first = results[0]
            print(f"Title: {first.get('title')}")
            print(f"AppId: {first.get('appId')}")
            print(f"Developer: {first.get('developer')}")
            print(f"Score: {first.get('score')}")
            print(f"Installs: {first.get('installs')}")
        else:
            print("No results found.")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
