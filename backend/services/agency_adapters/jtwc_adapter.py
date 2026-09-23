"""
JTWC (Joint Typhoon Warning Center) adapter — Pacific-wide tropical cyclone warnings.
Real data source: https://www.metoc.navy.mil/jtwc/jtwc.html
Public bulletins: TC warnings in text (TXT) + shapefiles
Integration: STUB — real implementation would parse https://www.metoc.navy.mil/jtwc/products/*.txt
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from backend.services.agency_adapters.base_adapter import MetAgencyAdapter


class JTWCAdapter(MetAgencyAdapter):
    AGENCY_NAME = "JTWC"
    AGENCY_URL = "https://www.metoc.navy.mil/jtwc/jtwc.html"
    COVERAGE_REGION = "Western Pacific + Indian Ocean"

    def fetch_live_bulletins(self) -> List[Dict[str, Any]]:
        # STUB — production path: parse https://www.metoc.navy.mil/jtwc/products/*.txt
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
            "documented_path": "Production path: parse TC warning TXT + shapefiles at /jtwc/products/",
        }
