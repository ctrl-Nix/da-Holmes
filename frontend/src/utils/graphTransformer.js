export function transformToGraphData(apiData) {
  const nodes = [];
  const links = [];
  const nodeIds = new Set();

  const addNode = (id, label, type, metadata = {}) => {
    const safeId = String(id).replace(/[^a-zA-Z0-9._@:-]/g, '_');
    if (!nodeIds.has(safeId) && label) {
      nodes.push({ id: safeId, label: String(label).slice(0, 40), type, val: 1.5, ...metadata });
      nodeIds.add(safeId);
    }
    return safeId;
  };

  const addLink = (source, target, label) => {
    const s = String(source).replace(/[^a-zA-Z0-9._@:-]/g, '_');
    const t = String(target).replace(/[^a-zA-Z0-9._@:-]/g, '_');
    if (nodeIds.has(s) && nodeIds.has(t) && s !== t) {
      links.push({ source: s, target: t, label });
    }
  };

  if (!apiData) return { nodes, links };

  const dataType = apiData._type || apiData.type;

  // ─────────────────────────────────────────────────────────
  // 1. USERNAME / SOCIAL FOOTPRINT
  // ─────────────────────────────────────────────────────────
  if (dataType === 'username' || apiData.username) {
    const rootId = addNode(`user:${apiData.username}`, apiData.username, 'Root', { risk: apiData.risk_level });

    // Platform profiles
    if (apiData.platform_footprint) {
      apiData.platform_footprint.forEach(item => {
        if (item.found || item.status === 'found') {
          const pid = addNode(`platform:${item.platform}`, item.platform, 'Platform', { url: item.url, data: item.data });
          addLink(rootId, pid, 'FoundOn');
        }
      });
    }

    // Extracted named entities
    if (apiData.extracted_entities) {
      const { locations, organizations, persons } = apiData.extracted_entities;
      locations?.forEach(loc => {
        const id = addNode(`loc:${loc}`, loc, 'Location');
        addLink(rootId, id, 'MentionsLocation');
      });
      organizations?.forEach(org => {
        const id = addNode(`org:${org}`, org, 'Organization');
        addLink(rootId, id, 'AssociatedWith');
      });
      persons?.forEach(person => {
        const id = addNode(`person:${person}`, person, 'Person');
        addLink(rootId, id, 'Knows');
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2. DOMAIN SCAN (unified scan result for domain type)
  // ─────────────────────────────────────────────────────────
  if (dataType === 'domain') {
    const query = apiData.query || apiData.username || 'domain';
    const domainId = addNode(`domain:${query}`, query, 'Domain');
    const scanData = apiData.data || {};

    // BGP / IP
    const ip = scanData?.bgp?.ip;
    if (ip) {
      const ipId = addNode(`ip:${ip}`, ip, 'IP');
      addLink(domainId, ipId, 'ResolvesTo');

      const asn = scanData?.bgp?.asn;
      if (asn) {
        const asnLabel = `${asn}${scanData.bgp.asn_name ? ` (${scanData.bgp.asn_name})` : ''}`;
        const asnId = addNode(`asn:${asn}`, asnLabel, 'ISP');
        addLink(ipId, asnId, 'ASN');
      }
    }

    // Subdomains (high-value first)
    const highVal = scanData?.subdomains?.high_value || [];
    const allSubs = scanData?.subdomains?.subdomains || [];
    [...new Set([...highVal, ...allSubs])].slice(0, 10).forEach(sub => {
      const id = addNode(`sub:${sub}`, sub, 'Subdomain');
      addLink(domainId, id, 'subdomain');
    });

    // Takeover vulnerable
    (scanData?.subdomains?.takeover_vulnerable || []).forEach(sub => {
      const id = addNode(`takeover:${sub}`, `⚠ ${sub}`, 'Threat');
      addLink(domainId, id, 'TAKEOVER RISK');
    });

    // Email pattern
    const emailFmt = scanData?.email_format?.most_likely_format;
    if (emailFmt) {
      const id = addNode(`email:${emailFmt}`, emailFmt, 'Email');
      addLink(domainId, id, 'email pattern');
    }

    // GitHub
    if (scanData?.github_intel?.repos?.length > 0) {
      const ghId = addNode(`github:${query}`, `GitHub: ${query}`, 'Organization');
      addLink(domainId, ghId, 'github org');
      scanData.github_intel.repos
        .filter(r => r.intel_value === 'HIGH')
        .slice(0, 4)
        .forEach(r => {
          const rid = addNode(`repo:${r.name}`, `📦 ${r.name}`, 'Organization');
          addLink(ghId, rid, 'repo');
        });
    }

    // Breach / paste
    const pasteCount = scanData?.paste_check?.psbdmp_results?.length || 0;
    if (pasteCount > 0) {
      const id = addNode('paste_leak', `🔴 Paste Leaks (${pasteCount})`, 'Threat');
      addLink(domainId, id, 'paste found');
    }

    // Ransomware
    if (scanData?.ransomwatch?.ransomware_hits?.length > 0) {
      const id = addNode('ransomware', '☠ Ransomware Listed', 'Threat');
      addLink(domainId, id, 'CRITICAL');
    }

    // Correlations
    (scanData?.correlations || []).forEach((c, i) => {
      const sev = (c.severity || 'info').toLowerCase();
      const label = (c.rule || c.rule_name || 'finding').replace(/_/g, ' ');
      const id = addNode(`corr:${i}`, label, sev === 'critical' || sev === 'high' ? 'Threat' : 'Location');
      addLink(domainId, id, c.severity);
    });
  }

  // ─────────────────────────────────────────────────────────
  // 3. NETWORK / IP SCAN
  // ─────────────────────────────────────────────────────────
  if (dataType === 'network' || (apiData.target && apiData.coordinates)) {
    const target = apiData.target || apiData.query || 'target';
    const rootId = addNode(`network:${target}`, target, 'NetworkTarget');

    const netData = apiData.data?.network_intel || apiData;

    if (netData.isp && netData.isp !== 'Unknown') {
      const id = addNode(`isp:${netData.isp}`, netData.isp, 'ISP');
      addLink(rootId, id, 'HostedBy');
    }
    if (netData.org && netData.org !== netData.isp) {
      const id = addNode(`org:${netData.org}`, netData.org, 'Organization');
      addLink(rootId, id, 'ManagedBy');
    }
    if (netData.location || apiData.location) {
      const loc = netData.location || apiData.location;
      const id = addNode(`loc:${loc}`, loc, 'Location', { coords: netData.coordinates || apiData.coordinates });
      addLink(rootId, id, 'GeoLocatedIn');
    }
    if (netData.hostname || apiData.hostname) {
      const host = netData.hostname || apiData.hostname;
      const id = addNode(`host:${host}`, host, 'Hostname');
      addLink(rootId, id, 'ResolvesTo');
    }
    // Open ports as threat nodes
    (netData.ports || []).forEach(port => {
      const id = addNode(`port:${port}`, `Port ${port}`, 'Threat');
      addLink(rootId, id, 'open port');
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. EMAIL SCAN
  // ─────────────────────────────────────────────────────────
  if (dataType === 'email') {
    const query = apiData.query || apiData.username;
    const rootId = addNode(`email:${query}`, query, 'Email');
    const breachData = apiData.data?.breaches || {};

    if (breachData.status === 'compromised' && breachData.details) {
      breachData.details.forEach((b, i) => {
        const id = addNode(`breach:${b.name || i}`, b.name, 'Threat');
        addLink(rootId, id, 'leaked in');
      });
    }

    // Pivot to domain
    const parts = query?.split('@');
    if (parts?.[1]) {
      const id = addNode(`domain:${parts[1]}`, parts[1], 'Domain');
      addLink(rootId, id, 'belongs to domain');
    }
  }

  // ─────────────────────────────────────────────────────────
  // 5. BTC WALLET SCAN
  // ─────────────────────────────────────────────────────────
  if (dataType === 'btc') {
    const query = apiData.query || apiData.username;
    const rootId = addNode(`btc:${query}`, query?.slice(0, 16) + '…', 'Root');
    const btcData = apiData.data || {};

    if (btcData.balance_btc) {
      const id = addNode('btc_balance', `${btcData.balance_btc} BTC`, 'Organization');
      addLink(rootId, id, 'balance');
    }
    if (btcData.tx_count) {
      const id = addNode('btc_tx', `${btcData.tx_count} Transactions`, 'Location');
      addLink(rootId, id, 'activity');
    }
  }

  return { nodes, links };
}
