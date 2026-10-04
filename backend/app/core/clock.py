"""Time helpers. All timestamps are stored as naive UTC."""

from datetime import UTC, datetime


def utcnow() -> datetime:
    """Return the current time as a naive UTC datetime (matches MySQL DATETIME columns).

    Returns:
        Current UTC time without tzinfo.
    """
    return datetime.now(UTC).replace(tzinfo=None)
