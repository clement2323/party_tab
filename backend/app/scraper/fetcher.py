import requests
from bs4 import BeautifulSoup
from .exceptions import ScrapeError

HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}


def fetch_page(url: str) -> tuple[str, str]:
    """Fetch raw HTML from a Boîte à Chansons URL.

    Returns (html, canonical_url).
    Raises ScrapeError if the page is not a valid song page.
    """
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
