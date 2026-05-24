import { useState, useRef } from "react";

const NODE_COLORS = {
  domain:    "#2383e2",
  ip:        "#e27023",
  email:     "#9b59b6",
  subdomain: "#1abc9c",
  breach:    "#e74c3c",
  github:    "#24292e",
  asn:       "#7f8c8d",
  critical:  "#e74c3c",
  high:      "#e67e22",
  medium:    "#f1c40f",
  low:       "#27ae60",
  info:      "#3498db",
  default:   "#95a5a6",
};

function buildGraphData(scanData, target) {
  const nodes = [];
  const links = [];
  const addedIds = new Set();

  function addNode(id, type, label, extra = {}) {
    if (!id || addedIds.has(String(id))) return;
    addedIds.add(String(id));
    nodes.push({ id: String(id), type, label: label || String(id), ...extra });
  }

  function addLink(source, target, label = "") {
    if (source && target && String(source) !== String(target)) {
      links.push({ source: String(source), target: String(target), label });
    }
  }

  // Center node
  addNode(target, "domain", target, { isCenter: true });

  // BGP / IP
  const bgp = scanData?.bgp;
  if (bgp?.ip) {
    addNode(bgp.ip, "ip", bgp.ip);
    addLink(target, bgp.ip, "resolves to");
    if (bgp.asn) {
      addNode(bgp.asn, "asn", `${bgp.asn} (${bgp.asn_name || ""})`);
      addLink(bgp.ip, bgp.asn, "ASN");
    }
  }

  // Subdomains
  const highVal = scanData?.subdomains?.high_value || [];
  const allSubs = scanData?.subdomains?.subdomains || [];
  const showSubs = [...new Set([...highVal, ...allSubs])].slice(0, 10);
  showSubs.forEach((s) => {
    addNode(s, "subdomain", s);
    addLink(target, s, "subdomain");
  });

  // Takeover vulnerable
  (scanData?.subdomains?.takeover_vulnerable || []).forEach((s) => {
    addNode("takeover_" + s, "critical", `⚠️ TAKEOVER: ${s}`);
    addLink(target, "takeover_" + s, "VULNERABLE");
  });

  // GitHub
  const gh = scanData?.github_intel;
  if (gh?.repos?.length > 0) {
    const ghId = "github_" + target;
    addNode(ghId, "github", `GitHub: ${gh.org || target}`);
    addLink(target, ghId, "github org");
    gh.repos.filter(r => r.intel_value === "HIGH").slice(0, 5).forEach(r => {
      addNode("repo_" + r.name, "github", `📦 ${r.name}`);
      addLink(ghId, "repo_" + r.name, "risky repo");
    });
  }

  // Correlations (findings)
  (scanData?.correlations || []).forEach((c, i) => {
    const sev = (c.severity || "info").toLowerCase();
    const id = `corr_${i}`;
    addNode(id, sev, `${(c.rule || c.rule_name || "").replace(/_/g, " ")}`, {
      description: c.description,
      recommendation: c.recommendation,
    });
    addLink(target, id, c.severity);
  });

  // Breach / Paste
  const pasteCount = scanData?.paste_check?.psbdmp_results?.length || 0;
  if (pasteCount > 0) {
    addNode("paste_leak", "breach", `🔴 Paste Leaks (${pasteCount})`);
    addLink(target, "paste_leak", "paste found");
  }

  const ransomHits = scanData?.ransomwatch?.ransomware_hits?.length || 0;
  if (ransomHits > 0) {
    addNode("ransomware", "critical", `☠️ Ransomware Listed`);
    addLink(target, "ransomware", "CRITICAL");
  }

  // Mobile
  const iosCount = scanData?.mobile_intel?.ios_apps?.length || 0;
  const androidCount = scanData?.mobile_intel?.android_apps?.length || 0;
  if (iosCount + androidCount > 0) {
    addNode("mobile_" + target, "info", `📱 ${iosCount + androidCount} Apps`);
    addLink(target, "mobile_" + target, "mobile");
  }

  // Typosquat
  const typos = (scanData?.typosquat?.results || []).filter(
    t => t.risk === "CRITICAL" || t.risk === "HIGH"
  );
  if (typos.length > 0) {
    addNode("typosquat_" + target, "high", `🎭 ${typos.length} Typosquats`);
    addLink(target, "typosquat_" + target, "brand abuse");
  }

  // Email format
  const emailFormat = scanData?.email_format?.most_likely_format;
  if (emailFormat) {
    addNode("email_format_" + target, "email", `✉️ ${emailFormat}`);
    addLink(target, "email_format_" + target, "email pattern");
  }

  return { nodes, links };
}

function radialLayout(nodes, links, target, W, H) {
  const cx = W / 2;
  const cy = H / 2;

  const centerNode = nodes.find(n => n.isCenter);
  const level1 = nodes.filter(n =>
    !n.isCenter && links.some(l => l.source === target && l.target === n.id)
  );
  const level2 = nodes.filter(n =>
    !n.isCenter && !level1.find(l1 => l1.id === n.id) && n.id !== target
  );

  const positions = {};

  if (centerNode) positions[centerNode.id] = { x: cx, y: cy };

  level1.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(level1.length, 1) - Math.PI / 2;
    positions[node.id] = {
      x: cx + 200 * Math.cos(angle),
      y: cy + 160 * Math.sin(angle),
    };
  });

  level2.forEach((node, i) => {
    const parentLink = links.find(l => l.target === node.id && l.source !== target);
    const parentPos = parentLink ? positions[parentLink.source] : null;
    const siblings = level2.filter(n =>
      links.some(l => l.target === n.id && l.source === parentLink?.source)
    );
    const sibIdx = siblings.findIndex(n => n.id === node.id);
    const angle = (2 * Math.PI * sibIdx) / Math.max(siblings.length, 1);

    positions[node.id] = {
      x: (parentPos?.x || cx + 200) + 90 * Math.cos(angle),
      y: (parentPos?.y || cy) + 70 * Math.sin(angle),
    };
  });

  return nodes.map(n => ({
    ...n,
    x: positions[n.id]?.x || cx,
    y: positions[n.id]?.y || cy,
  }));
}

export default function IntelGraph({ scanData, target }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [show, setShow] = useState(true);
  const svgRef = useRef(null);

  const W = 780;
  const H = 520;

  const { nodes, links } = buildGraphData(scanData, target);
  const positioned = radialLayout(nodes, links, target, W, H);

  const getColor = (node) =>
    NODE_COLORS[node.type] || NODE_COLORS.default;

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          background: "#161b22", border: "1px solid #30363d",
          color: "#2383e2", padding: "8px 16px", borderRadius: 8,
          cursor: "pointer", fontSize: 13, marginBottom: 16,
        }}
      >
        🕸️ Show Intelligence Graph ({nodes.length} nodes)
      </button>
    );
  }

  return (
    <div style={{
      background: "#0d1117", borderRadius: 12, padding: 16,
      marginBottom: 24, border: "1px solid #30363d",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ color: "#2383e2", margin: 0, fontSize: 14 }}>
          🕸️ Intelligence Relationship Graph
          <span style={{ color: "#8b949e", fontWeight: "normal", marginLeft: 8, fontSize: 12 }}>
            {nodes.length} nodes · {links.length} connections
          </span>
        </h3>
        <button
          onClick={() => setShow(false)}
          style={{
            background: "none", border: "1px solid #30363d", color: "#8b949e",
            padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11,
          }}
        >
          Hide
        </button>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {/* SVG Graph */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <svg
            ref={svgRef}
            width={W}
            height={H}
            style={{ borderRadius: 8, background: "#161b22", display: "block" }}
          >
            {/* Links */}
            {links.map((link, i) => {
              const s = positioned.find(n => n.id === link.source);
              const t = positioned.find(n => n.id === link.target);
              if (!s || !t) return null;
              const isDanger = ["VULNERABLE", "CRITICAL", "ransomware"].some(
                kw => link.label?.includes(kw)
              );
              return (
                <g key={`link-${i}`}>
                  <line
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={isDanger ? "#e74c3c44" : "#30363d"}
                    strokeWidth={isDanger ? 2 : 1}
                    strokeDasharray={isDanger ? "6,3" : "none"}
                  />
                  {link.label && (
                    <text
                      x={(s.x + t.x) / 2}
                      y={(s.y + t.y) / 2 - 4}
                      fill="#484f58"
                      fontSize={8}
                      textAnchor="middle"
                    >
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {positioned.map((node) => {
              const r = node.isCenter ? 30 : 18;
              const isSelected = selectedNode?.id === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedNode(isSelected ? null : node)}
                >
                  {/* Glow for center */}
                  {node.isCenter && (
                    <circle r={38} fill={getColor(node)} opacity={0.08} />
                  )}
                  <circle
                    r={r}
                    fill={getColor(node)}
                    opacity={0.85}
                    stroke={isSelected ? "#ffffff" : getColor(node)}
                    strokeWidth={isSelected ? 2.5 : 0.5}
                  />
                  <text
                    y={r + 12}
                    textAnchor="middle"
                    fill="#c9d1d9"
                    fontSize={node.isCenter ? 11 : 9}
                    fontWeight={node.isCenter ? "bold" : "normal"}
                  >
                    {node.label.length > 22
                      ? node.label.slice(0, 20) + "…"
                      : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div style={{
            width: 230, background: "#161b22", borderRadius: 8, padding: 14,
            border: `1px solid ${getColor(selectedNode)}44`,
            color: "#c9d1d9", fontSize: 12, flexShrink: 0,
          }}>
            <div style={{
              color: getColor(selectedNode), fontWeight: "bold",
              marginBottom: 10, fontSize: 13, wordBreak: "break-all",
            }}>
              {selectedNode.label}
            </div>
            <div style={{ color: "#8b949e", marginBottom: 6 }}>
              Type: <span style={{ color: "#c9d1d9" }}>{selectedNode.type}</span>
            </div>
            {selectedNode.description && (
              <div style={{
                color: "#f0883e", fontSize: 11, marginTop: 10,
                padding: "8px", background: "#0d1117", borderRadius: 6,
                lineHeight: 1.5,
              }}>
                {selectedNode.description}
              </div>
            )}
            {selectedNode.recommendation && (
              <div style={{
                color: "#3fb950", fontSize: 11, marginTop: 8,
                padding: "8px", background: "#0d1117", borderRadius: 6,
                lineHeight: 1.5,
              }}>
                💡 {selectedNode.recommendation}
              </div>
            )}
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                marginTop: 14, padding: "4px 10px",
                background: "#21262d", border: "1px solid #30363d",
                color: "#8b949e", borderRadius: 4,
                cursor: "pointer", fontSize: 11, width: "100%",
              }}
            >
              Deselect
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", gap: 14, marginTop: 12,
        flexWrap: "wrap", borderTop: "1px solid #21262d", paddingTop: 10,
      }}>
        {[
          ["domain", "Target Domain"],
          ["ip", "IP Address"],
          ["subdomain", "Subdomain"],
          ["github", "GitHub"],
          ["breach", "Breach/Paste"],
          ["critical", "Critical Finding"],
          ["high", "High Risk"],
          ["info", "Info"],
        ].map(([type, label]) => (
          <div key={type} style={{
            display: "flex", alignItems: "center",
            gap: 5, fontSize: 10, color: "#8b949e",
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: NODE_COLORS[type],
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
