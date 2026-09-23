"""APAC Meteorological Agency Adapters registry and interface exports."""

from backend.services.agency_adapters.base_adapter import MetAgencyAdapter
from backend.services.agency_adapters.bmkg_adapter import BMKGAdapter
from backend.services.agency_adapters.dmh_adapter import DMHAdapter
from backend.services.agency_adapters.imd_adapter import IMDAdapter
from backend.services.agency_adapters.jtwc_adapter import JTWCAdapter
from backend.services.agency_adapters.pagasa_adapter import PAGASAAdapter

AGENCY_ADAPTERS = {
    "india": IMDAdapter(),
    "jtwc": JTWCAdapter(),
    "philippines": PAGASAAdapter(),
    "indonesia": BMKGAdapter(),
    "myanmar": DMHAdapter(),
}

__all__ = [
    "MetAgencyAdapter",
    "IMDAdapter",
    "JTWCAdapter",
    "PAGASAAdapter",
    "BMKGAdapter",
    "DMHAdapter",
    "AGENCY_ADAPTERS",
]
