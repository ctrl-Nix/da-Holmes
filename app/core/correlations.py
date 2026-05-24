class CorrelationEngine:
    def run_all(self, findings: dict) -> list[dict]:
        rules = [
            self.rule_phishing_domain,
            self.rule_shadow_it,
            self.rule_exposed_devtools,
            self.rule_missing_email_security,
            self.rule_subdomain_takeover_risk,
            self.rule_credential_exposure,
            self.rule_github_secret_risk,
            self.rule_ransomware_victim,
            self.rule_expired_ssl,
            self.rule_admin_panel_exposed,
            self.rule_typosquat_risk,
            self.rule_young_domain_no_privacy,
        ]
        results = []
        for rule in rules:
            try:
                result = rule(findings)
                if result:
                    results.append(result)
            except:
                pass
        return results

    def rule_phishing_domain(self, f):
        age = f.get("domain_age_days", 9999)
        spf = str(f.get("spf_record", "")).lower()
        dmarc = str(f.get("dmarc_record", "")).lower()
        if age < 180 and ("fail" in spf or "fail" in dmarc):
            return {
                "rule": "PHISHING_DOMAIN_RISK",
                "severity": "CRITICAL",
                "description": f"Domain is {age} days old with broken email auth — classic phishing setup",
                "recommendation": "Block domain. Verify legitimacy before any interaction."
            }

    def rule_shadow_it(self, f):
        main_asn = f.get("asn", "")
        sub_asns = f.get("subdomain_asns", [])
        foreign = [a for a in sub_asns if a and a != main_asn]
        if len(foreign) >= 3:
            return {
                "rule": "SHADOW_IT_DETECTED",
                "severity": "MEDIUM",
                "description": f"{len(foreign)} subdomains on different infrastructure than main domain",
                "recommendation": "Audit all subdomains for unauthorized cloud deployments."
            }

    def rule_exposed_devtools(self, f):
        DEV_KEYWORDS = ["jenkins", "grafana", "kibana", "prometheus",
                        "gitlab", "jira", "confluence", "admin", "staging",
                        "dev.", "test.", "uat.", "vault", "sonarqube",
                        "portainer", "k8s", "dashboard", "traefik"]
        subdomains = f.get("subdomains", [])
        exposed = [s for s in subdomains if any(kw in s.lower() for kw in DEV_KEYWORDS)]
        if exposed:
            return {
                "rule": "DEVTOOLS_PUBLICLY_EXPOSED",
                "severity": "CRITICAL",
                "description": f"Dev/admin tools publicly accessible: {', '.join(exposed[:5])}",
                "recommendation": "Restrict to VPN/internal network immediately."
            }

    def rule_missing_email_security(self, f):
        missing = []
        if not f.get("spf_record") or "fail" in str(f.get("spf_record","")).lower():
            missing.append("SPF")
        if not f.get("dmarc_record") or "fail" in str(f.get("dmarc_record","")).lower():
            missing.append("DMARC")
        if not f.get("dkim_record"):
            missing.append("DKIM")
        if len(missing) >= 2:
            return {
                "rule": "EMAIL_SPOOFING_RISK",
                "severity": "HIGH",
                "description": f"Missing: {', '.join(missing)} — domain can be spoofed for phishing",
                "recommendation": "Implement full SPF + DKIM + DMARC stack."
            }

    def rule_subdomain_takeover_risk(self, f):
        vulnerable = f.get("takeover_vulnerable", [])
        if vulnerable:
            return {
                "rule": "SUBDOMAIN_TAKEOVER_CONFIRMED",
                "severity": "CRITICAL",
                "description": f"Takeover possible on: {', '.join(vulnerable[:3])}",
                "recommendation": "Remove dangling DNS records immediately."
            }

    def rule_credential_exposure(self, f):
        breaches = f.get("breach_count", 0)
        paste_hits = f.get("paste_count", 0)
        if breaches > 0 and paste_hits > 0:
            return {
                "rule": "CREDENTIAL_EXPOSURE_CONFIRMED",
                "severity": "CRITICAL",
                "description": f"Found in {breaches} breaches AND {paste_hits} paste sites — credentials likely public",
                "recommendation": "Force password reset. Enable MFA immediately."
            }

    def rule_github_secret_risk(self, f):
        repos = f.get("github_repos", [])
        risky = [r for r in repos if any(kw in r.get("name","").lower()
                 for kw in ["config","secret","key","token","credential","env","password","private"])]
        if risky:
            return {
                "rule": "GITHUB_SECRET_EXPOSURE_RISK",
                "severity": "HIGH",
                "description": f"Suspicious repos: {', '.join(r['name'] for r in risky[:3])}",
                "recommendation": "Audit with truffleHog or gitleaks immediately."
            }

    def rule_ransomware_victim(self, f):
        hits = f.get("ransomware_hits", [])
        if hits:
            groups = list(set(r.get("group","Unknown") for r in hits))
            return {
                "rule": "RANSOMWARE_VICTIM_LISTED",
                "severity": "CRITICAL",
                "description": f"Listed as ransomware victim by: {', '.join(groups)}",
                "recommendation": "Immediate incident response required."
            }

    def rule_expired_ssl(self, f):
        days = f.get("ssl_days_remaining", 999)
        if days < 0:
            return {"rule": "SSL_EXPIRED", "severity": "CRITICAL",
                    "description": "SSL certificate has expired",
                    "recommendation": "Renew immediately."}
        elif days < 14:
            return {"rule": "SSL_EXPIRING", "severity": "HIGH",
                    "description": f"SSL expires in {days} days",
                    "recommendation": "Renew now."}

    def rule_admin_panel_exposed(self, f):
        ADMIN_PATHS = ["/admin","/wp-admin","/administrator","/dashboard",
                       "/cpanel","/phpmyadmin","/manager","/panel"]
        open_paths = f.get("open_paths", [])
        exposed = [p for p in open_paths if any(a in p.lower() for a in ADMIN_PATHS)]
        if exposed:
            return {
                "rule": "ADMIN_PANEL_EXPOSED",
                "severity": "HIGH",
                "description": f"Admin panels accessible: {', '.join(exposed[:3])}",
                "recommendation": "Restrict to IP whitelist or VPN."
            }

    def rule_typosquat_risk(self, f):
        live = [t for t in f.get("typosquat_domains", []) if t.get("alive")]
        if len(live) >= 3:
            return {
                "rule": "TYPOSQUAT_CAMPAIGN_DETECTED",
                "severity": "HIGH",
                "description": f"{len(live)} live typosquat domains found — possible phishing campaign",
                "recommendation": "Register defensive domains. Report active phishing."
            }

    def rule_young_domain_no_privacy(self, f):
        age = f.get("domain_age_days", 9999)
        privacy = f.get("whois_privacy", True)
        if age < 365 and not privacy:
            return {
                "rule": "YOUNG_UNPROTECTED_DOMAIN",
                "severity": "MEDIUM",
                "description": "Domain under 1 year with no WHOIS privacy — registrant details exposed",
                "recommendation": "Enable WHOIS privacy protection."
            }
