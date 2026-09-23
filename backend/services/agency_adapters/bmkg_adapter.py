"""
BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) Indonesia adapter.
Real data source: https://www.bmkg.go.id/cuaca/siklon-tropis
Public bulletins: TCWC Jakarta tropical cyclone warnings & outlooks
Integration: STUB — real implementation would parse BMKG cyclone bulletin JSON API
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from backend.services.agency_adapters.base_adapter import MetAgencyAdapter


class BMKGAdapter(MetAgencyAdapter):
    AGENCY_NAME = "BMKG"
    AGENCY_URL = "https://www.bmkg.go.id/cuaca/siklon-tropis"
    COVERAGE_REGION = "Indonesia (TCWC Jakarta)"

    def fetch_live_bulletins(self) -> List[Dict[str, Any]]:
        # STUB — production path: parse BMKG cyclone bulletin JSON API
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
            "documented_path": "Production path: parse BMKG cyclone bulletin JSON API",
        }
