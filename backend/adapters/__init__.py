"""APAC Meteorological Agency Adapters (PAGASA, JTWC, IMD, BMKG, DMH)."""

from backend.services.agency_adapters.base_adapter import MetAgencyAdapter
from backend.services.agency_adapters.imd_adapter import IMDAdapter
from backend.services.agency_adapters.pagasa_adapter import PAGASAAdapter
from backend.services.agency_adapters.jtwc_adapter import JTWCAdapter
from backend.services.agency_adapters.bmkg_adapter import BMKGAdapter
from backend.services.agency_adapters.dmh_adapter import DMHAdapter

ADAPTERS = {
    "IMD": IMDAdapter(),
    "PAGASA": PAGASAAdapter(),
    "JTWC": JTWCAdapter(),
    "BMKG": BMKGAdapter(),
    "DMH": DMHAdapter(),
}

__all__ = [
    "MetAgencyAdapter",
    "IMDAdapter",
    "PAGASAAdapter",
    "JTWCAdapter",
    "BMKGAdapter",
    "DMHAdapter",
    "ADAPTERS",
]
