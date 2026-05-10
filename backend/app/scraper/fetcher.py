import requests
from bs4 import BeautifulSoup
from .exceptions import ScrapeError

HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}


def fetch_page(url: str) -> tuple[str, str]:
    """Fetch Boîte à Chansons page. Returns (html, canonical_url)."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise ScrapeError(f"Erreur réseau : {e}") from e

    html = resp.text
    soup = BeautifulSoup(html, "html.parser")

    if not soup.find(id="divPartition"):
        raise ScrapeError(
            "Page non reconnue — pas de partition trouvée. "
            "Vérifie l'URL ou connecte-toi si la chanson est privée."
        )

    canonical = url
    tag = soup.find("link", rel="canonical")
    if tag and tag.get("href"):
        canonical = tag["href"]

    return html, canonical


def fetch_ug_page(url: str) -> tuple[str, str]:
    """Fetch Ultimate Guitar page using cloudscraper to bypass Cloudflare."""
    try:
        import cloudscraper
    except ImportError as e:
        raise ScrapeError("cloudscraper non installé") from e

    try:
        scraper = cloudscraper.create_scraper(
            browser={"browser": "chrome", "platform": "windows", "mobile": False}
        )
        resp = scraper.get(url, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        msg = str(e).lower()
        if any(k in msg for k in ("cloudflare", "403", "challenge", "captcha")):
            raise ScrapeError(
                f"Cloudflare bloque l'accès à Ultimate Guitar : {e}"
            ) from e
        raise ScrapeError(f"Erreur réseau UG : {e}") from e

    html = resp.text
    if "js-store" not in html:
        raise ScrapeError(
            "Cloudflare bloque l'accès à Ultimate Guitar — "
            "utilise le mode 'coller le texte' à la place."
        )

    return html, url
