export function transformToGraphData(apiData) {
  const nodes = [];
  const links = [];
  const nodeIds = new Set();

  const addNode = (id, label, type, metadata = {}) => {
    if (!nodeIds.has(id)) {
      nodes.push({ id, label, type, val: 1.5, ...metadata });
      nodeIds.add(id);
    }
  };

  const addLink = (source, target, label) => {
    links.push({ source, target, label });
  };

  if (!apiData) return { nodes, links };

  // 1. Social Intelligence Brief (Username scan)
  if (apiData.username) {
    const rootId = `user:${apiData.username}`;
    addNode(rootId, apiData.username, 'Root', { risk: apiData.risk_level });

    if (apiData.platform_footprint) {
      apiData.platform_footprint.forEach(item => {
        if (item.found) {
          const platformId = `platform:${item.platform}`;
          addNode(platformId, item.platform, 'Platform', { url: item.url, data: item.data });
          addLink(rootId, platformId, 'FoundOn');
        }
      });
    }

    if (apiData.extracted_entities) {
      const { locations, organizations, persons } = apiData.extracted_entities;
      locations?.forEach(loc => {
        const locId = `loc:${loc}`;
        addNode(locId, loc, 'Location');
        addLink(rootId, locId, 'MentionsLocation');
      });
      organizations?.forEach(org => {
        const orgId = `org:${org}`;
        addNode(orgId, org, 'Organization');
        addLink(rootId, orgId, 'AssociatedWith');
      });
      persons?.forEach(person => {
        const pId = `person:${person}`;
        addNode(pId, person, 'Person');
        addLink(rootId, pId, 'Knows');
      });
    }
  }

  // 2. Network Intelligence
  if (apiData.target && apiData.coordinates) {
    const rootId = `network:${apiData.target}`;
    addNode(rootId, apiData.target, 'NetworkTarget');

    if (apiData.isp && apiData.isp !== 'Unknown') {
      const ispId = `isp:${apiData.isp}`;
      addNode(ispId, apiData.isp, 'ISP');
      addLink(rootId, ispId, 'HostedBy');
    }
    
    if (apiData.location && apiData.location !== 'Unknown') {
      const locId = `loc:${apiData.location}`;
      addNode(locId, apiData.location, 'Location', { coords: apiData.coordinates });
      addLink(rootId, locId, 'GeoLocatedIn');
    }

    if (apiData.hostname && apiData.hostname !== 'Unknown') {
      const hostId = `host:${apiData.hostname}`;
      addNode(hostId, apiData.hostname, 'Hostname');
      addLink(rootId, hostId, 'ResolvesTo');
    }
  }

  // 3. Domain Scanner
  if (apiData.domain && apiData.main_ip) {
    const domainId = `domain:${apiData.domain}`;
    addNode(domainId, apiData.domain, 'Domain');
    
    const ipId = `ip:${apiData.main_ip}`;
    addNode(ipId, apiData.main_ip, 'IP');
    addLink(domainId, ipId, 'ResolvesTo');

    if (apiData.subdomains) {
      apiData.subdomains.forEach(sub => {
        const subId = `sub:${sub}`;
        addNode(subId, sub, 'Subdomain');
        addLink(domainId, subId, 'HasSubdomain');
      });
    }
  }

  return { nodes, links };
}
