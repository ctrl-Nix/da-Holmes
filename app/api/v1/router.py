"""
da Holmes v2.0 - Centralized API v1 Route Aggregator
Consolidates and standardizes all modular OSINT, Forensics, and Recon routers.
"""

from fastapi import APIRouter

from app.api.routes import (
    analyze,
    scanner,
    domain,
    security,
    network,
    forensics,
    email,
    crypto,
    geoint,
    archive,
    techstack,
    spoofing,
    threatintel,
    certificates,
    trackers,
    friendship,
    unified,
    history,
    keys,
    vault,
    github,
    report,
    mobile_recon,
    phone,
    corporate_intel,
    iot,
    darkweb,
    metadata,
    reddit,
    image_osint,
    vehicle,
    aviation,
    hash as hash_router,
    mac,
    advanced,
    ml_intel,
    monitor as monitor_router,
    export as export_router,
    auth as auth_router,
)

api_v1_router = APIRouter()

# ---------------------------------------------------------------------------
# Core Scanners & Analysis
# ---------------------------------------------------------------------------
api_v1_router.include_router(scanner.router, tags=["OSINT Scanner"])
api_v1_router.include_router(analyze.router, tags=["Intelligence Analyst"])
api_v1_router.include_router(domain.router, prefix="/scan", tags=["Domain Recon"])
api_v1_router.include_router(security.router, prefix="/security", tags=["Security Hunter"])
api_v1_router.include_router(network.router, prefix="/network", tags=["Network Intelligence"])
api_v1_router.include_router(forensics.router, prefix="/forensics", tags=["Forensics Engine"])
api_v1_router.include_router(email.router, prefix="/email", tags=["Email OSINT"])
api_v1_router.include_router(crypto.router, prefix="/crypto", tags=["Cryptocurrency OSINT"])
api_v1_router.include_router(geoint.router, prefix="/geoint", tags=["Geospatial Intelligence"])
api_v1_router.include_router(archive.router, prefix="/archive", tags=["Archive OSINT"])
api_v1_router.include_router(techstack.router, prefix="/techstack", tags=["Technographics"])
api_v1_router.include_router(spoofing.router, prefix="/spoofing", tags=["Email Spoofing Check"])
api_v1_router.include_router(threatintel.router, prefix="/threatintel", tags=["Threat Intelligence"])
api_v1_router.include_router(certificates.router, prefix="/certificates", tags=["Certificate Transparency"])
api_v1_router.include_router(trackers.router, prefix="/trackers", tags=["Cross-Linked Trackers"])
api_v1_router.include_router(friendship.router, tags=["Friendship Graph"])
api_v1_router.include_router(advanced.router, tags=["Advanced OSINT"])
api_v1_router.include_router(ml_intel.router, tags=["ML Intelligence"])
api_v1_router.include_router(unified.router, tags=["Unified OSINT"])

# ---------------------------------------------------------------------------
# Investigation History, Vault & Configuration
# ---------------------------------------------------------------------------
api_v1_router.include_router(history.router, tags=["Investigation History"])
api_v1_router.include_router(keys.router, tags=["API Keys"])
api_v1_router.include_router(vault.router)
api_v1_router.include_router(export_router.router)
api_v1_router.include_router(auth_router.router)

# ---------------------------------------------------------------------------
# Specialized Recon Modules
# ---------------------------------------------------------------------------
api_v1_router.include_router(github.router, prefix="/github", tags=["GitHub Organization Scan"])
api_v1_router.include_router(report.router, tags=["PDF Reports"])
api_v1_router.include_router(mobile_recon.router, tags=["Mobile App Recon"])
api_v1_router.include_router(phone.router, tags=["Phone Intelligence"])
api_v1_router.include_router(corporate_intel.router, tags=["Corporate Entity Intel"])
api_v1_router.include_router(iot.router, prefix="/iot", tags=["IoT OSINT"])
api_v1_router.include_router(darkweb.router, prefix="/darkweb", tags=["Dark Web Intelligence"])
api_v1_router.include_router(metadata.router, prefix="/metadata", tags=["Document Forensics"])
api_v1_router.include_router(reddit.router, prefix="/reddit", tags=["Social Media Intel"])
api_v1_router.include_router(image_osint.router, prefix="/image", tags=["Image OSINT"])
api_v1_router.include_router(vehicle.router, prefix="/vehicle", tags=["Vehicle OSINT"])
api_v1_router.include_router(aviation.router, prefix="/aviation", tags=["Aviation OSINT"])
api_v1_router.include_router(hash_router.router, prefix="/hash", tags=["Cryptography Intel"])
api_v1_router.include_router(mac.router, prefix="/mac", tags=["MAC Vendor Intel"])
api_v1_router.include_router(monitor_router.router)
