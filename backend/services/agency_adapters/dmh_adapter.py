"""
DMH (Department of Meteorology and Hydrology) Myanmar adapter.
Real data source: https://www.moezala.gov.mm/
Public bulletins: Cyclone warnings, special weather news, Bay of Bengal outlooks
Integration: STUB — real implementation would parse DMH bulletin PDF/HTML
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from backend.services.agency_adapters.base_adapter import MetAgencyAdapter


class DMHAdapter(MetAgencyAdapter):
    AGENCY_NAME = "DMH"
    AGENCY_URL = "https://www.moezala.gov.mm/"
    COVERAGE_REGION = "Myanmar"

    def fetch_live_bulletins(self) -> List[Dict[str, Any]]:
        # STUB — production path: parse DMH bulletin PDF/HTML
        return []

    def get_status(self) -> Dict[str, Any]:
        return {
            "agency": self.AGENCY_NAME,
            "status": "monitoring",
            "region": self.COVERAGE_REGION,
            "last_checked": datetime.now(timezone.utc).isoformat(),
            "bulletin_count": 0,
            "integration_status": "stub",
            "data_source": self.AGENCY_URL,
            "documented_path": "Production path: parse DMH bulletin PDF/HTML",
        }
