"""
PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration) adapter.
Real data source: https://bagong.pagasa.dost.gov.ph/tropical-cyclone
Public bulletins: Severe Weather Bulletins (SWB), Tropical Cyclone Advisories (TCA) in HTML/JSON
Integration: STUB — real implementation would parse PAGASA's tropical cyclone bulletin HTML
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from backend.services.agency_adapters.base_adapter import MetAgencyAdapter


class PAGASAAdapter(MetAgencyAdapter):
    AGENCY_NAME = "PAGASA"
    AGENCY_URL = "https://bagong.pagasa.dost.gov.ph/tropical-cyclone"
    COVERAGE_REGION = "Philippines (PAR)"

    def fetch_live_bulletins(self) -> List[Dict[str, Any]]:
        # STUB — production path: parse PAGASA's tropical cyclone bulletin HTML
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
            "documented_path": "Production path: parse PAGASA's tropical cyclone bulletin HTML",
        }
