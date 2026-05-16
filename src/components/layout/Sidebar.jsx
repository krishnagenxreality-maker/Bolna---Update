import React from 'react';
import { 
  LayoutDashboard, 
  PhoneCall, 
  ListTodo, 
  BarChart, 
  Users, 
  ClipboardList,
  Megaphone,
  PhoneIncoming
} from 'lucide-react';

export const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'calendar', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'manager', label: 'Call Manager', icon: <PhoneCall size={20} /> },
    { id: 'details', label: 'Call Details', icon: <ListTodo size={20} /> },
    { id: 'responses', label: 'Responses', icon: <BarChart size={20} /> },
    { id: 'leads', label: 'Leads', icon: <Users size={20} /> },
    { id: 'campaign', label: 'Campaign', icon: <Megaphone size={20} /> },
    { id: 'report', label: 'Reports', icon: <ClipboardList size={20} /> }
  ];


  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-btn ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};
