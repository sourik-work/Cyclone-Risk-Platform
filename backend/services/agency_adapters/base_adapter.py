"""Base interface for APAC meteorological agency adapters."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class MetAgencyAdapter(ABC):
    """
    Abstract interface for APAC meteorological agency adapters.
    Each adapter normalizes its agency's data format to our internal schema.
    """

    AGENCY_NAME: str = "Unknown"
    AGENCY_URL: str = ""
    COVERAGE_REGION: str = ""

    @abstractmethod
    def fetch_live_bulletins(self) -> List[Dict[str, Any]]:
        """Return list of active cyclone bulletins in internal format."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """
        Return:
        {
            "agency": str,
            "status": "active" | "monitoring" | "unavailable",
            "region": str,
            "last_checked": str,
            "bulletin_count": int,
            "integration_status": "stub" | "partial" | "live"
        }
        """
        pass
