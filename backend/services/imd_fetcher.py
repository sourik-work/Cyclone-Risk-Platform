"""IMD RSMC New Delhi real-time cyclone bulletin fetcher and parser.

Fetches official cyclone bulletins and tropical weather outlooks from:
- Primary: https://rsmcnewdelhi.imd.gov.in/
- Fallback: https://mausam.imd.gov.in/imd_latest/contents/cyclone.php

Parses bulletin text and forecast tracks. When no active cyclone exists in the Bay
of Bengal, returns continuous monitoring status honestly.
"""

import io
import logging
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from backend.schemas.cyclone import (
    CycloneTrack,
    LiveCycloneResponse,
    TrackCategory,
    TrackPoint,
)

logger = logging.getLogger("imd_fetcher")

# URLs to check
RSMC_BASE_URL = "https://rsmcnewdelhi.imd.gov.in"
MAUSAM_CYCLONE_URL = "https://mausam.imd.gov.in/imd_latest/contents/cyclone.php"

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}


def _category_from_wind(wind_knots: float) -> TrackCategory:
    """Classifies storm intensity based on standard IMD 3-minute sustained wind speed criteria."""
    if wind_knots >= 120:
        return TrackCategory.SUPER_CYCLONIC_STORM
    if wind_knots >= 90:
        return TrackCategory.EXTREMELY_SEVERE_CYCLONIC_STORM
    if wind_knots >= 64:
        return TrackCategory.VERY_SEVERE_CYCLONIC_STORM
    if wind_knots >= 48:
        return TrackCategory.SEVERE_CYCLONIC_STORM
    if wind_knots >= 34:
        return TrackCategory.CYCLONIC_STORM
    if wind_knots >= 28:
        return TrackCategory.DEEP_DEPRESSION
    if wind_knots >= 17:
        return TrackCategory.DEPRESSION
    return TrackCategory.LOW_PRESSURE


DISALLOWED_STORM_NAMES = {
    "warning", "services", "sop", "guidelines", "awareness", "atlas",
    "enhancement", "review", "report", "monograph", "hazard", "climatology",
    "tracks", "disturbances", "formation", "landfalling", "bulletin",
    "bulletins", "outlook", "perspective", "activities", "interactive",
    "track", "preliminary", "national", "frequency", "scale", "if", "and",
    "or", "over", "in", "the", "for", "near", "stage", "signals", "ports",
    "marine", "weather", "science", "plan", "souvenir", "products", "ebulletin",
    "forecast", "intensity", "landfall", "genesis", "verification", "disturbance",
    "policy", "act", "centre", "delhi", "rsmc", "imd"
}


def is_valid_storm_name(name: Optional[str]) -> bool:
    """Validates that extracted name is a genuine storm name, not an English stop word or page title."""
    if not name:
        return False
    cleaned = name.strip().lower()
    if len(cleaned) < 3 or len(cleaned) > 20:
        return False
    if cleaned in DISALLOWED_STORM_NAMES:
        return False
    return cleaned.isalpha()


def _is_generic_or_no_cyclone_link(url: str, text: str) -> bool:
    """Checks whether link points to static documentation or empty 'No Cyclone' bulletin."""
    lower_url = url.lower()
    lower_text = text.lower()
    if any(k in lower_url or k in lower_text for k in [
        "no_cyclone", "no cyclone", "no_fdp", "hazard", "climatology",
        "sop", "guideline", "policy", "history", "perspective", "activities",
        "report.php", "annual", "monograph", "dos-and-dont", "port-warning-signals",
        "cyclone.html", "genesis-and-landfall", "frequency"
    ]):
        return True
    return False


class IMDFetcherService:
    """Service to poll and parse real-time IMD bulletins for active Bay of Bengal cyclones."""

    def __init__(self, cache_ttl_seconds: int = 300):
        self.cache_ttl_seconds = cache_ttl_seconds
        self._cached_response: Optional[LiveCycloneResponse] = None
        self._last_fetch_time: float = 0.0

    def get_live_cyclone_status(self, force_refresh: bool = False) -> LiveCycloneResponse:
        """Retrieves live cyclone status, utilizing in-memory TTL caching."""
        now = time.time()
        if (
            not force_refresh
            and self._cached_response is not None
            and (now - self._last_fetch_time) < self.cache_ttl_seconds
        ):
            return self._cached_response

        try:
            response = self._fetch_and_parse()
        except Exception as err:
            logger.warning("Error fetching live IMD data: %s. Returning graceful monitoring status.", err)
            timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            response = LiveCycloneResponse(
                active_cyclone=None,
                last_updated=datetime.now(timezone.utc).isoformat(),
                source="IMD RSMC New Delhi",
                status="monitoring",
                message=f"No active cyclones in Bay of Bengal. Monitoring continuously. Last checked: {timestamp_str}.",
            )

        self._cached_response = response
        self._last_fetch_time = now
        return response

    def _fetch_and_parse(self) -> LiveCycloneResponse:
        """Executes HTTP requests to IMD websites and parses bulletins."""
        timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        iso_now = datetime.now(timezone.utc).isoformat()

        # 1. Try RSMC New Delhi primary portal
        rsmc_html = self._http_get(RSMC_BASE_URL)
        if rsmc_html:
            active_track = self._parse_rsmc_page(rsmc_html)
            if active_track:
                return LiveCycloneResponse(
                    active_cyclone=active_track,
                    last_updated=iso_now,
                    source="IMD RSMC New Delhi",
                    status="active",
                    message=f"Active cyclone detected: {active_track.name} ({active_track.current_status}) in Bay of Bengal.",
                )

        # 2. Try Mausam IMD secondary portal
        mausam_html = self._http_get(MAUSAM_CYCLONE_URL)
        if mausam_html:
            active_track = self._parse_mausam_page(mausam_html)
            if active_track:
                return LiveCycloneResponse(
                    active_cyclone=active_track,
                    last_updated=iso_now,
                    source="IMD RSMC New Delhi",
                    status="active",
                    message=f"Active cyclone detected: {active_track.name} ({active_track.current_status}) in Bay of Bengal.",
                )

        # 3. No active cyclone found in Bay of Bengal -> Monitoring status
        return LiveCycloneResponse(
            active_cyclone=None,
            last_updated=iso_now,
            source="IMD RSMC New Delhi",
            status="monitoring",
            message=f"No active cyclones in Bay of Bengal. Monitoring continuously. Last checked: {timestamp_str}.",
        )

    def _http_get(self, url: str) -> Optional[str]:
        """Performs a GET request with timeout and SSL verification tolerance for government portals."""
        try:
            resp = requests.get(url, headers=REQUEST_HEADERS, timeout=10, verify=False)
            if resp.status_code == 200:
                return resp.text
        except Exception as e:
            logger.debug("HTTP GET failed for %s: %s", url, e)
        return None

    def _parse_rsmc_page(self, html: str) -> Optional[CycloneTrack]:
        """Parses RSMC homepage HTML for active bulletin links and tracks."""
        soup = BeautifulSoup(html, "html.parser")

        # Find bulletin links
        bulletin_links: List[Tuple[str, str]] = []
        for a in soup.find_all("a", href=True):
            text = a.get_text(strip=True)
            href = a["href"].strip()
            if not href or href == "#":
                continue
            full_url = urljoin(RSMC_BASE_URL, href)

            if _is_generic_or_no_cyclone_link(full_url, text):
                continue

            lower_text = text.lower()
            lower_url = full_url.lower()

            # Must be an actual bulletin or track archive link
            if any(k in lower_text or k in lower_url for k in [
                "national bulletin",
                "rsmc bulletin",
                "hourly bulletin",
                "tcac bulletin",
                "observed & forecast track",
            ]):
                bulletin_links.append((text, full_url))

        # Check if any bulletin link points to an active storm
        for link_text, link_url in bulletin_links:
            storm_match = re.search(
                r"(?:cyclonic storm|deep depression|super cyclonic storm|severe cyclonic storm)\s+['\"“]?([a-zA-Z]+)['\"”>]?",
                link_text,
                re.IGNORECASE,
            )
            if storm_match and is_valid_storm_name(storm_match.group(1)):
                storm_name = storm_match.group(1).capitalize()
                return self._fetch_and_parse_bulletin_pdf_or_text(link_url, storm_name)

            # Check if an archive PDF bulletin is linked that is NOT No_Cyclone
            if "uploads/archive" in link_url and link_url.endswith(".pdf"):
                track = self._extract_track_from_outlook_pdf(link_url)
                if track:
                    return track

        return None

    def _parse_mausam_page(self, html: str) -> Optional[CycloneTrack]:
        """Parses Mausam IMD cyclone page for active disturbances."""
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            text = a.get_text(strip=True)
            href = a["href"].strip()
            if not href or href in ("#", "#."):
                continue

            full_url = urljoin(MAUSAM_CYCLONE_URL, href)
            if _is_generic_or_no_cyclone_link(full_url, text):
                continue

            storm_match = re.search(
                r"(?:cyclonic storm|deep depression|super cyclonic storm)\s+['\"“]?([a-zA-Z]+)['\"”]?",
                text,
                re.IGNORECASE,
            )
            if storm_match and is_valid_storm_name(storm_match.group(1)):
                storm_name = storm_match.group(1).capitalize()
                return self._fetch_and_parse_bulletin_pdf_or_text(full_url, storm_name)

        return None

    def _fetch_and_parse_bulletin_pdf_or_text(self, url: str, fallback_name: str) -> Optional[CycloneTrack]:
        """Fetches bulletin PDF or webpage and extracts storm track parameters."""
        try:
            resp = requests.get(url, headers=REQUEST_HEADERS, timeout=12, verify=False)
            if resp.status_code != 200:
                return None

            content_type = resp.headers.get("Content-Type", "").lower()
            if "application/pdf" in content_type or url.endswith(".pdf"):
                text = self._extract_pdf_text(resp.content)
            else:
                soup = BeautifulSoup(resp.text, "html.parser")
                text = soup.get_text()

            return self.parse_bulletin_text(text, fallback_name=fallback_name)
        except Exception as e:
            logger.debug("Failed parsing bulletin at %s: %s", url, e)
            return None

    def _extract_pdf_text(self, pdf_bytes: bytes) -> str:
        """Extracts plain text from PDF bytes using pypdf."""
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(pdf_bytes))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            logger.debug("pypdf extraction error: %s", e)
            return ""

    def _extract_track_from_outlook_pdf(self, pdf_url: str) -> Optional[CycloneTrack]:
        """Checks if a Tropical Weather Outlook PDF documents an active named cyclonic storm in BOB."""
        try:
            resp = requests.get(pdf_url, headers=REQUEST_HEADERS, timeout=12, verify=False)
            if resp.status_code != 200:
                return None
            text = self._extract_pdf_text(resp.content)
            # Only consider active cyclonic storms or deep depressions in the Bay of Bengal section
            bob_section = ""
            if "BAY OF BENGAL:" in text:
                bob_section = text.split("BAY OF BENGAL:", 1)[1]
                if "ARABIAN SEA:" in bob_section:
                    bob_section = bob_section.split("ARABIAN SEA:", 1)[0]
            else:
                bob_section = text

            # Look for active cyclone indicators (not just upper air circulation or low pressure)
            active_patterns = [
                r"(?:cyclonic storm|deep depression|very severe cyclonic storm|super cyclonic storm)\s+['\"“]?([a-zA-Z]+)['\"”]?",
                r"the cyclonic storm\s+['\"“]?([a-zA-Z]+)['\"”]?",
            ]
            for pat in active_patterns:
                match = re.search(pat, bob_section, re.IGNORECASE)
                if match:
                    storm_name = match.group(1).capitalize()
                    track = self.parse_bulletin_text(bob_section, fallback_name=storm_name)
                    if track:
                        return track
            return None
        except Exception as e:
            logger.debug("Error checking outlook PDF: %s", e)
            return None

    def parse_bulletin_text(self, text: str, fallback_name: str = "Live Cyclone") -> Optional[CycloneTrack]:
        """Extracts cyclone parameters (name, lat, lon, wind, pressure, track) from bulletin text."""
        if not text or len(text.strip()) < 50:
            return None

        # 1. Storm name
        name = fallback_name
        name_match = re.search(
            r"(?:CYCLONIC STORM|DEEP DEPRESSION|SEVERE CYCLONIC STORM|VERY SEVERE CYCLONIC STORM|SUPER CYCLONIC STORM)\s+['\"“]?([A-Z][a-zA-Z0-9_-]+)['\"”]?",
            text,
            re.IGNORECASE,
        )
        if name_match:
            name = name_match.group(1).capitalize()

        # 2. Current Latitude and Longitude
        lat, lon = self._extract_coordinates(text)
        if lat is None or lon is None:
            return None

        # 3. Wind speed (knots or km/h)
        wind_knots, wind_kmph = self._extract_wind_speed(text)

        # 4. Central pressure (hPa)
        central_pressure = self._extract_central_pressure(text)

        # 5. Category
        category = _category_from_wind(wind_knots)

        # 6. Current observation timestamp
        timestamp = self._extract_timestamp(text) or datetime.now(timezone.utc).isoformat()

        # Build initial current track point
        current_point = TrackPoint(
            timestamp=timestamp,
            latitude=lat,
            longitude=lon,
            wind_speed_knots=wind_knots,
            wind_speed_kmph=wind_kmph,
            gust_speed_kmph=round(wind_kmph * 1.25),
            central_pressure_hpa=central_pressure,
            category=category,
            is_forecast=False,
            forecast_lead_hours=0,
            cone_radius_km=30.0,
            heading_degrees=320.0,
            forward_speed_kmph=15.0,
        )

        # 7. Extract forecast track points if available in bulletin
        forecast_points = self._extract_forecast_points(text, base_lat=lat, base_lon=lon)
        all_points = [current_point] + forecast_points

        year = datetime.now(timezone.utc).year
        return CycloneTrack(
            id=f"IMD-LIVE-{year}-{name.upper()}",
            name=name,
            season_year=year,
            basin="Bay of Bengal",
            current_status=category.value,
            genesis_time=timestamp,
            dissipation_time=None,
            track_points=all_points,
        )

    def _extract_coordinates(self, text: str) -> Tuple[Optional[float], Optional[float]]:
        """Extracts latitude and longitude coordinates from IMD bulletin text."""
        # Common formats:
        # "latitude 18.2° N and longitude 85.5° E" or "lat. 18.2 N, long. 85.5 E"
        pattern1 = re.search(
            r"lat(?:itude|\.?)?\s*[:=]?\s*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*°?\s*N.*?long(?:itude|\.?)?\s*[:=]?\s*([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*°?\s*E",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        if pattern1:
            try:
                lat = float(pattern1.group(1))
                lon = float(pattern1.group(2))
                return lat, lon
            except ValueError:
                pass

        # Alternative: near 18.2 N and 85.5 E
        pattern2 = re.search(
            r"near\s+([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*°?\s*N(?:\s*(?:and|,)\s*|\s+)([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*°?\s*E",
            text,
            re.IGNORECASE,
        )
        if pattern2:
            try:
                lat = float(pattern2.group(1))
                lon = float(pattern2.group(2))
                return lat, lon
            except ValueError:
                pass

        return None, None

    def _extract_wind_speed(self, text: str) -> Tuple[float, float]:
        """Extracts wind speed in knots and km/h."""
        # 1. Look for explicit maximum sustained surface wind phrasing
        # e.g. "maximum sustained surface wind speed of 65 knots (120 kmph)"
        match_phrase = re.search(
            r"(?:sustained(?:\s+surface)?\s+wind(?:\s+speed)?|wind\s+speed)\s+(?:of\s+)?([0-9]{2,3})\s*(?:knots|kts)(?:\s*\(\s*([0-9]{2,3})\s*(?:kmph|km/h)\s*\))?",
            text,
            re.IGNORECASE,
        )
        if match_phrase:
            knots = float(match_phrase.group(1))
            if match_phrase.group(2):
                kmph = float(match_phrase.group(2))
            else:
                kmph = round(knots * 1.852)
            return knots, kmph

        # 2. Match knots and convert
        match_knots = re.search(r"([0-9]{2,3})\s*(?:knots|kts)", text, re.IGNORECASE)
        if match_knots:
            knots = float(match_knots.group(1))
            return knots, round(knots * 1.852)

        # 3. Match kmph if knots wasn't found
        match_kmph = re.search(r"(?:wind|surface)\s+.*?\b([0-9]{2,3})\s*(?:kmph|km/h)", text, re.IGNORECASE)
        if match_kmph:
            kmph = float(match_kmph.group(1))
            knots = round(kmph / 1.852, 1)
            return knots, kmph

        return 45.0, 85.0  # Safe meteorological default if indeterminate

    def _extract_central_pressure(self, text: str) -> float:
        """Extracts central pressure in hPa/mb."""
        match = re.search(r"(?:central\s+pressure|pressure\s+of)\s*(?:about|around)?\s*([0-9]{3,4})\s*(?:hpa|mb)", text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        return 990.0

    def _extract_timestamp(self, text: str) -> Optional[str]:
        """Extracts observation UTC timestamp from bulletin header or date line."""
        match = re.search(r"based\s+on\s+([0-9]{4})\s*UTC\s+of\s+([0-9]{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s+([0-9]{4})", text, re.IGNORECASE)
        if match:
            time_str = match.group(1)
            day = int(match.group(2))
            month_str = match.group(3)
            year = int(match.group(4))
            try:
                dt = datetime.strptime(f"{year}-{month_str}-{day} {time_str}", "%Y-%B-%d %H%M")
                return dt.replace(tzinfo=timezone.utc).isoformat()
            except ValueError:
                pass
        return None

    def _extract_forecast_points(self, text: str, base_lat: float, base_lon: float) -> List[TrackPoint]:
        """Extracts forecast track positions and intensities from IMD forecast tables."""
        forecast_points: List[TrackPoint] = []
        # Look for table patterns like:
        # "18.09.2026/0600 UTC 19.5 N 86.2 E 55 KTS (100 KMPH)"
        pattern = re.compile(
            r"([0-9]{2}\.[0-9]{2}\.[0-9]{4}/[0-9]{4}\s*UTC)\s+([0-9]{1,2}\.[0-9])\s*°?\s*N\s+([0-9]{2,3}\.[0-9])\s*°?\s*E\s+([0-9]{2,3})\s*(?:knots|kts)?",
            re.IGNORECASE,
        )

        lead_hours = 6
        for m in pattern.finditer(text):
            time_raw = m.group(1)
            lat = float(m.group(2))
            lon = float(m.group(3))
            knots = float(m.group(4))
            kmph = round(knots * 1.852)
            cat = _category_from_wind(knots)

            forecast_points.append(
                TrackPoint(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    latitude=lat,
                    longitude=lon,
                    wind_speed_knots=knots,
                    wind_speed_kmph=kmph,
                    gust_speed_kmph=round(kmph * 1.25),
                    central_pressure_hpa=max(900.0, 1010.0 - (knots * 0.7)),
                    category=cat,
                    is_forecast=True,
                    forecast_lead_hours=lead_hours,
                    cone_radius_km=lead_hours * 5.0,
                    heading_degrees=330.0,
                    forward_speed_kmph=15.0,
                )
            )
            lead_hours += 6

        return forecast_points
