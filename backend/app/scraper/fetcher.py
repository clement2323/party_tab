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


def fetch_ug_api(url: str) -> dict:
    """Fetch tab data from UG's mobile API — not behind Cloudflare."""
    import re
    match = re.search(r"-(\d+)/?$", url.strip())
    if not match:
        raise ScrapeError("Impossible d'extraire l'ID de tab depuis l'URL UG")
    tab_id = match.group(1)
    api_url = (
        f"https://api.ultimate-guitar.com/api/v1/tab/view"
        f"?tab_id={tab_id}&marketing_type=NONE"
    )
    try:
        resp = requests.get(api_url, headers={
            "User-Agent": "UGT_ANDROID/4.10.12 (Linux; Android 11)",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
        }, timeout=10)
    except requests.RequestException as e:
        raise ScrapeError(f"Erreur réseau API UG : {e}") from e

    if resp.status_code in (401, 403):
        raise ScrapeError(f"API UG requiert une authentification ({resp.status_code})")
    if not resp.ok:
        raise ScrapeError(f"API UG a retourné {resp.status_code}")

    try:
        data = resp.json()
    except Exception as e:
        raise ScrapeError(f"Réponse API UG non valide : {e}") from e

    if "tab_view" not in data or "wiki_tab" not in data.get("tab_view", {}):
        raise ScrapeError("Structure API UG inattendue")
    return data


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
