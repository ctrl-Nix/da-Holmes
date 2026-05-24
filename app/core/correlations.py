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
            self.rule_new_domain_mx_record,
            self.rule_registrar_mismatch,
            self.rule_nameserver_mismatch,
            self.rule_expired_domain_reregistered,
            self.rule_wildcard_ssl,
            self.rule_self_signed_ssl,
            self.rule_multiple_mx_providers,
            self.rule_executive_email_exposed,
            self.rule_employee_personal_email_breach,
            self.rule_username_too_many_platforms,
            self.rule_port_21_open,
            self.rule_telnet_open,
            self.rule_rdp_exposed,
            self.rule_database_port_exposed,
            self.rule_known_cve_detected,
            self.rule_too_many_open_ports,
            self.rule_fresh_paste_leak,
            self.rule_multiple_ransomware_groups,
            self.rule_breach_password_included,
            self.rule_startup_high_valuation_no_security,
            self.rule_tech_stack_eol,
            self.rule_react_native_app_no_ssl_pinning,
            self.rule_large_btc_balance_no_activity,
            self.rule_crypto_address_exchange,
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

    def rule_new_domain_mx_record(self, f):
        # Domain < 90 days old + MX record present
        # = fresh domain already set up for email
        # = phishing infra setup
        age = f.get("domain_age_days", 9999)
        mx = f.get("mx_records", [])
        if age < 90 and len(mx) > 0:
            return {
                "rule": "FRESH_DOMAIN_EMAIL_READY",
                "severity": "HIGH",
                "description": f"Domain only {age} days old but already has MX — phishing infra likely",
                "recommendation": "Block and investigate immediately"
            }

    def rule_registrar_mismatch(self, f):
        # Cheap/anonymous registrar + corporate domain name
        # = brand impersonation
        registrar = str(f.get("registrar", "")).lower()
        domain = str(f.get("domain", "")).lower()
        cheap = ["namecheap", "godaddy", "reg.ru", "nicenic", "alibaba"]
        big_brands = ["google", "microsoft", "apple", "amazon", "meta"]
        if any(b in domain for b in big_brands) and any(r in registrar for r in cheap):
            return {
                "rule": "BRAND_IMPERSONATION_REGISTRAR",
                "severity": "HIGH",
                "description": f"Big brand name in domain but registered with cheap registrar — impersonation risk",
                "recommendation": "Report to brand protection team"
            }

    def rule_nameserver_mismatch(self, f):
        # NS records pointing to different provider than hosting
        # = DNS hijack risk or misconfiguration
        ns = f.get("ns_records", [])
        asn_name = str(f.get("asn_name", "")).lower()
        if ns and asn_name:
            ns_str = " ".join(ns).lower()
            if "cloudflare" in ns_str and "cloudflare" not in asn_name:
                return {
                    "rule": "NS_HOSTING_MISMATCH",
                    "severity": "MEDIUM",
                    "description": "DNS on Cloudflare but hosting elsewhere — verify intentional",
                    "recommendation": "Confirm CDN config is intentional"
                }

    def rule_expired_domain_reregistered(self, f):
        # Domain created recently but has old Wayback entries
        # = expired domain re-registered — reputation hijack
        age = f.get("domain_age_days", 9999)
        wayback = f.get("latest_snapshot")
        if age < 365 and wayback:
            return {
                "rule": "EXPIRED_DOMAIN_REREGISTERED",
                "severity": "HIGH",
                "description": "Recently registered domain has old archive history — likely expired domain reuse",
                "recommendation": "Old backlinks/reputation may be exploited"
            }

    def rule_wildcard_ssl(self, f):
        # Wildcard SSL cert (*.domain.com)
        # = infinite subdomains, harder to monitor
        san = f.get("san_domains", [])
        wildcards = [s for s in san if s.startswith("*")]
        if len(wildcards) > 2:
            return {
                "rule": "EXCESSIVE_WILDCARD_SSL",
                "severity": "MEDIUM",
                "description": f"{len(wildcards)} wildcard SSL entries — subdomains unmonitorable",
                "recommendation": "Audit all subdomains actively"
            }

    def rule_self_signed_ssl(self, f):
        issuer = str(f.get("issuer_org", "")).lower()
        if any(x in issuer for x in ["self", "localhost", "unknown", "example"]):
            return {
                "rule": "SELF_SIGNED_CERTIFICATE",
                "severity": "HIGH",
                "description": "Self-signed SSL certificate — no trusted CA verification",
                "recommendation": "Replace with trusted CA certificate immediately"
            }

    def rule_multiple_mx_providers(self, f):
        # MX records from 2+ different providers
        # = email split — possible shadow IT email
        mx = f.get("mx_records", [])
        providers = set()
        for m in mx:
            m_lower = m.lower()
            if "google" in m_lower: providers.add("Google")
            elif "microsoft" in m_lower or "outlook" in m_lower: providers.add("Microsoft")
            elif "mailgun" in m_lower: providers.add("Mailgun")
            elif "sendgrid" in m_lower: providers.add("Sendgrid")
            else: providers.add("other")
        if len(providers) >= 2:
            return {
                "rule": "SPLIT_EMAIL_INFRASTRUCTURE",
                "severity": "MEDIUM",
                "description": f"MX records from {len(providers)} different providers: {', '.join(providers)}",
                "recommendation": "Verify all email providers are authorized"
            }

    def rule_executive_email_exposed(self, f):
        # C-suite email found in breach
        # = targeted spear phishing risk
        breaches = f.get("breaches", [])
        email = str(f.get("email", "")).lower()
        exec_patterns = ["ceo", "cto", "cfo", "coo", "founder", "director", "vp", "head"]
        if breaches and any(p in email for p in exec_patterns):
            return {
                "rule": "EXECUTIVE_CREDENTIALS_LEAKED",
                "severity": "CRITICAL",
                "description": f"Executive email {email} found in {len(breaches)} breach(es)",
                "recommendation": "Force password reset, enable MFA, brief security team"
            }

    def rule_employee_personal_email_breach(self, f):
        # Company employee using personal email for work systems
        # detected via breach data
        email = str(f.get("email", "")).lower()
        free_providers = ["gmail", "yahoo", "hotmail", "outlook.com", "proton"]
        breaches = f.get("breaches", [])
        if any(p in email for p in free_providers) and len(breaches) > 2:
            return {
                "rule": "PERSONAL_EMAIL_BREACH_RISK",
                "severity": "HIGH",
                "description": "Personal email with multiple breaches — password reuse risk on corporate systems",
                "recommendation": "Enforce corporate email policy, check for credential stuffing"
            }

    def rule_username_too_many_platforms(self, f):
        # Username found on 50+ platforms
        # = high digital footprint = easier to social engineer
        found_count = f.get("platforms_found", 0)
        if found_count > 50:
            return {
                "rule": "HIGH_DIGITAL_FOOTPRINT",
                "severity": "MEDIUM",
                "description": f"Username found on {found_count} platforms — extensive social footprint",
                "recommendation": "High risk of social engineering / account takeover attempts"
            }

    def rule_port_21_open(self, f):
        # FTP open = unencrypted file transfer
        ports = [p.get("port") for p in f.get("open_ports", []) if isinstance(p, dict)]
        if 21 in ports:
            return {
                "rule": "FTP_PORT_OPEN",
                "severity": "HIGH",
                "description": "FTP (port 21) is open — unencrypted file transfer protocol",
                "recommendation": "Disable FTP, use SFTP/SCP instead"
            }

    def rule_telnet_open(self, f):
        ports = [p.get("port") for p in f.get("open_ports", []) if isinstance(p, dict)]
        if 23 in ports:
            return {
                "rule": "TELNET_PORT_OPEN",
                "severity": "CRITICAL",
                "description": "Telnet (port 23) open — completely unencrypted remote access",
                "recommendation": "Disable Telnet immediately, use SSH"
            }

    def rule_rdp_exposed(self, f):
        ports = [p.get("port") for p in f.get("open_ports", []) if isinstance(p, dict)]
        if 3389 in ports:
            return {
                "rule": "RDP_PUBLICLY_EXPOSED",
                "severity": "CRITICAL",
                "description": "RDP (port 3389) exposed to internet — common ransomware entry point",
                "recommendation": "Move behind VPN or disable public access immediately"
            }

    def rule_database_port_exposed(self, f):
        DB_PORTS = {3306: "MySQL", 5432: "PostgreSQL",
                    27017: "MongoDB", 6379: "Redis",
                    9200: "Elasticsearch", 1433: "MSSQL"}
        ports = [p.get("port") for p in f.get("open_ports", []) if isinstance(p, dict)]
        exposed_dbs = [DB_PORTS[p] for p in ports if p in DB_PORTS]
        if exposed_dbs:
            return {
                "rule": "DATABASE_PORT_EXPOSED",
                "severity": "CRITICAL",
                "description": f"Database ports publicly accessible: {', '.join(exposed_dbs)}",
                "recommendation": "Firewall database ports immediately — never expose to internet"
            }

    def rule_known_cve_detected(self, f):
        vulns = f.get("known_vulns", [])
        critical_cves = ["CVE-2021-44228", "CVE-2022-0847", "CVE-2021-26855"]
        found_critical = [v for v in vulns if v in critical_cves]
        if found_critical:
            return {
                "rule": "CRITICAL_CVE_DETECTED",
                "severity": "CRITICAL",
                "description": f"Known critical CVEs detected: {', '.join(found_critical)}",
                "recommendation": "Patch immediately — these are actively exploited"
            }
        elif vulns:
            return {
                "rule": "KNOWN_VULNERABILITIES_DETECTED",
                "severity": "HIGH",
                "description": f"{len(vulns)} known CVEs detected on this IP",
                "recommendation": "Patch and update affected services"
            }

    def rule_too_many_open_ports(self, f):
        ports = f.get("open_ports", [])
        if len(ports) > 20:
            return {
                "rule": "EXCESSIVE_OPEN_PORTS",
                "severity": "MEDIUM",
                "description": f"{len(ports)} ports open — large attack surface",
                "recommendation": "Audit and close unnecessary ports"
            }

    def rule_fresh_paste_leak(self, f):
        # Paste found recently = active leak, not old
        pastes = f.get("psbdmp_results", [])
        recent = [p for p in pastes if "2024" in str(p.get("date", "")) or "2025" in str(p.get("date", ""))]
        if recent:
            return {
                "rule": "RECENT_PASTE_LEAK",
                "severity": "CRITICAL",
                "description": f"{len(recent)} recent paste(s) found — likely active data leak",
                "recommendation": "Investigate paste content immediately, rotate credentials"
            }

    def rule_multiple_ransomware_groups(self, f):
        hits = f.get("ransomware_hits", [])
        groups = set(h.get("group") for h in hits)
        if len(groups) > 1:
            return {
                "rule": "MULTIPLE_RANSOMWARE_LISTINGS",
                "severity": "CRITICAL",
                "description": f"Listed by {len(groups)} ransomware groups: {', '.join(groups)}",
                "recommendation": "Immediate incident response — multiple threat actors involved"
            }

    def rule_breach_password_included(self, f):
        breaches = f.get("breaches", [])
        for b in breaches:
            data_classes = b.get("data_classes", [])
            if "password" in [d.lower() for d in data_classes]:
                return {
                    "rule": "PASSWORD_IN_BREACH",
                    "severity": "CRITICAL",
                    "description": "Password included in breach data — not just email",
                    "recommendation": "Force password reset everywhere this email is used"
                }

    def rule_startup_high_valuation_no_security(self, f):
        # Young company, high funding, weak security headers
        # = target for financially motivated attacks
        domain_age = f.get("domain_age_days", 9999)
        security_score = f.get("security_score", 100)
        if domain_age < 730 and security_score < 40:
            return {
                "rule": "STARTUP_WEAK_SECURITY",
                "severity": "HIGH",
                "description": "Young company with poor security headers — high-value target with low defenses",
                "recommendation": "Implement security headers, WAF, and security review"
            }

    def rule_tech_stack_eol(self, f):
        # Outdated technology detected
        technologies = f.get("technologies", [])
        EOL_TECH = ["php/5", "php/7.0", "php/7.1", "apache/2.2",
                    "nginx/1.10", "wordpress 4", "drupal 7",
                    "jquery/1.", "jquery/2."]
        found_eol = []
        for tech in technologies:
            name = str(tech.get("name", "") or tech).lower()
            if any(eol in name for eol in EOL_TECH):
                found_eol.append(name)
        if found_eol:
            return {
                "rule": "END_OF_LIFE_TECHNOLOGY",
                "severity": "HIGH",
                "description": f"End-of-life technology detected: {', '.join(found_eol)}",
                "recommendation": "Upgrade immediately — no security patches available"
            }

    def rule_react_native_app_no_ssl_pinning(self, f):
        # React Native app detected but SSL issues
        tech_signals = f.get("tech_signals", [])
        ssl_status = f.get("ssl_status", "OK")
        if "React Native" in tech_signals and ssl_status in ["WARN", "CRITICAL"]:
            return {
                "rule": "MOBILE_APP_SSL_RISK",
                "severity": "HIGH",
                "description": "React Native app detected with SSL issues — MITM attack risk",
                "recommendation": "Fix SSL, implement certificate pinning in app"
            }

    def rule_large_btc_balance_no_activity(self, f):
        # Large balance, no recent transactions
        # = cold wallet or abandoned funds
        try:
            balance_str = str(f.get("balance", "0")).split()[0]
            balance = float(balance_str) if balance_str else 0.0
        except ValueError:
            balance = 0.0
        last_seen = str(f.get("last_seen", ""))
        if balance > 1.0 and "2020" in last_seen:
            return {
                "rule": "DORMANT_HIGH_VALUE_WALLET",
                "severity": "MEDIUM",
                "description": f"Wallet holds {balance} BTC with no activity since 2020",
                "recommendation": "Likely cold storage or lost wallet"
            }

    def rule_crypto_address_exchange(self, f):
        # Address belongs to known exchange
        # = not a person's wallet
        org = str(f.get("org", "")).lower()
        exchanges = ["binance", "coinbase", "kraken", "bitfinex", "huobi"]
        if any(ex in org for ex in exchanges):
            return {
                "rule": "EXCHANGE_WALLET_DETECTED",
                "severity": "INFO",
                "description": f"Address belongs to exchange: {org} — not personal wallet",
                "recommendation": "Contact exchange with legal request for KYC data if needed"
            }
