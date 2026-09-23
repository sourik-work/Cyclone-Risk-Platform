"""
IMD (India Meteorological Department) RSMC New Delhi adapter.
Real data source: https://rsmcnewdelhi.imd.gov.in/
Integration: LIVE — wraps IMDFetcherService to parse real-time RSMC and Mausam bulletins.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.services.agency_adapters.base_adapter import MetAgencyAdapter
from backend.services.imd_fetcher import IMDFetcherService


class IMDAdapter(MetAgencyAdapter):
    AGENCY_NAME = "IMD"
    AGENCY_URL = "https://rsmcnewdelhi.imd.gov.in/"
    COVERAGE_REGION = "Bay of Bengal + Arabian Sea"

    def __init__(self, fetcher: Optional[IMDFetcherService] = None):
        self._fetcher = fetcher or IMDFetcherService()

    def fetch_live_bulletins(self) -> List[Dict[str, Any]]:
        status = self._fetcher.get_live_cyclone_status()
        if status.status == "active" and status.active_cyclone:
            cyclone = status.active_cyclone
            return [cyclone.model_dump() if hasattr(cyclone, "model_dump") else cyclone.__dict__]
        return []

    def get_status(self) -> Dict[str, Any]:
        live_status = self._fetcher.get_live_cyclone_status()
        is_active = live_status.status == "active"
        return {
            "agency": self.AGENCY_NAME,
            "status": "active" if is_active else "monitoring",
            "region": self.COVERAGE_REGION,
            "last_checked": live_status.last_updated or datetime.now(timezone.utc).isoformat(),
            "bulletin_count": 1 if is_active else 0,
            "integration_status": "live",
            "data_source": self.AGENCY_URL,
            "documented_path": "Production path: live automated scraper for RSMC New Delhi XML/HTML & Mausam bulletin portals",
        }
