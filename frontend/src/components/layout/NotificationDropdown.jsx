import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Clock, Info, CheckCircle, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { api } from "../../api/client";

const NotificationDropdown = ({ isOpen, onClose, onUnreadUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.get("/api/notifications/");
      setNotifications(data);
      const unreadCount = data.filter(n => !n.is_read).length;
      onUnreadUpdate(unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      const newUnreadCount = notifications.filter(n => n.id !== id && !n.is_read).length;
      onUnreadUpdate(newUnreadCount);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      onUnreadUpdate(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle size={18} className="text-success" />;
      case "warning": return <AlertTriangle size={18} className="text-warning" />;
      case "error": return <XCircle size={18} className="text-error" />;
      default: return <Info size={18} className="text-primary" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-4 w-96 bg-surface-bright/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden z-50 animate-in slide-in-from-top-4 duration-300"
    >
      <div className="px-6 py-5 bg-surface-container-low/50 flex justify-between items-center border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="font-headline font-bold text-on-surface">Notifications</h3>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-4 opacity-50">
            <Bell size={48} className="mx-auto" />
            <p className="text-sm font-medium">All caught up! No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-5 group transition-all relative ${notification.is_read ? "opacity-60" : "bg-primary/5"}`}
              >
                {!notification.is_read && (
                  <div className="absolute top-6 left-2 w-1.5 h-1.5 bg-primary rounded-full"></div>
                )}
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-grow space-y-1">
                    <h4 className={`text-sm font-bold leading-tight ${notification.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>
                      {notification.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                       <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70 font-medium">
                         <Clock size={10} />
                         <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                       </div>
                       {!notification.is_read && (
                         <button 
                           onClick={() => markAsRead(notification.id)}
                           className="text-[10px] font-bold text-primary hover:underline"
                         >
                           Mark as read
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/10 text-center">
        <button className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
          View all notifications
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
