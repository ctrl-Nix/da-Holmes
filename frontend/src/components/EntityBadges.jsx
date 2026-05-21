import { MapPin, Building2, User2, Tag } from 'lucide-react';

function EntitySection({ icon: Icon, label, items = [], color }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color }} />
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:-translate-y-0.5"
            style={{
              color,
              borderColor: `${color}35`,
              backgroundColor: `${color}12`,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EntityBadges({ entities = {} }) {
  const { locations = [], organizations = [], persons = [], misc = [] } = entities;
  const hasAny = locations.length || organizations.length || persons.length || misc.length;

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-600 italic">No entities extracted — supply raw_text for NER analysis.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <EntitySection icon={MapPin}    label="Locations"      items={locations}      color="#f59e0b" />
      <EntitySection icon={Building2} label="Organizations"  items={organizations}  color="#6366f1" />
      <EntitySection icon={User2}     label="Persons"        items={persons}        color="#22c55e" />
      <EntitySection icon={Tag}       label="Miscellaneous"  items={misc}           color="#06b6d4" />
    </div>
  );
}
