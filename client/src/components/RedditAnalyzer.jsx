import React from 'react';
import { MessageSquare, Star, Clock, Calendar as CalendarIcon, ShieldCheck, User } from 'lucide-react';

export default function RedditAnalyzer({ results }) {
  if (!results) return null;

  const { username, created_utc, link_karma, comment_karma, is_employee, is_mod, verified, icon_img, top_subreddits, most_active_hour_utc, analyzed_comments } = results;

  const createdDate = created_utc ? new Date(created_utc * 1000).toLocaleDateString() : 'Unknown';
  
  // Format hour (e.g. 14 -> 2:00 PM)
  const formatHour = (hour) => {
    if (hour === null || hour === undefined) return 'Unknown';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm} UTC`;
  };

  return (
    <div style={{ backgroundColor: 'var(--notion-bg)', border: '1px solid var(--notion-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--notion-border)', backgroundColor: 'var(--notion-sidebar)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <MessageSquare size={16} /> Reddit Profile Analyzer
        </span>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 700, 
          backgroundColor: 'rgba(255, 69, 0, 0.1)', 
          color: '#ff4500',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          u/{username}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {icon_img ? (
            <img src={icon_img} alt={username} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--notion-border)' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--notion-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={32} color="var(--notion-fg)" style={{ opacity: 0.5 }} />
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{username}</div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'rgba(55,53,47,0.6)', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarIcon size={12}/> Joined {createdDate}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12}/> {link_karma + comment_karma} Total Karma</span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {verified && <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(43, 122, 62, 0.1)', color: '#2b7a3e', display: 'flex', alignItems: 'center', gap: '2px' }}><ShieldCheck size={10}/> Verified</span>}
              {is_mod && <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(35, 131, 226, 0.1)', color: '#2383e2' }}>Moderator</span>}
              {is_employee && <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(202, 44, 44, 0.1)', color: '#ca2c2c' }}>Admin</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          {/* Active Hours */}
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Clock size={14} /> Estimated Timezone / Active Hour
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--notion-fg)' }}>
              {formatHour(most_active_hour_utc)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(55,53,47,0.5)', marginTop: '4px' }}>
              Based on the last {analyzed_comments} comments.
            </div>
          </div>

          {/* Subreddits */}
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <MessageSquare size={14} /> Most Active Subreddits
            </div>
            
            {top_subreddits && top_subreddits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {top_subreddits.map((sub, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 500 }}>
                    <a href={`https://reddit.com/r/${sub.name}`} target="_blank" rel="noreferrer" style={{ color: '#2383e2', textDecoration: 'none' }}>
                      r/{sub.name}
                    </a>
                    <span style={{ fontSize: '11px', color: 'rgba(55,53,47,0.5)', backgroundColor: 'var(--notion-sidebar)', padding: '2px 6px', borderRadius: '4px' }}>
                      {sub.count} posts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'rgba(55,53,47,0.5)', fontStyle: 'italic' }}>
                No recent public comments found.
              </div>
            )}
          </div>

        </div>

      </div>
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--notion-sidebar)', borderTop: '1px solid var(--notion-border)', fontSize: '11px', color: 'rgba(55,53,47,0.5)', textAlign: 'right' }}>
        Intelligence powered by Reddit Public JSON API
      </div>
    </div>
  );
}
