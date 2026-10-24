/**
 * APEX ATHLETICS // SUPABASE INTEGRATION CLIENT
 * Handles real-time cloud data storage on Supabase with zero-downtime local fallback.
 */

(function () {
  'use strict';

  // Default configuration (can be updated via Admin UI modal)
  const STORAGE_KEY = 'apex_supabase_config';
  
  // Stored Supabase configuration
  function getStoredConfig() {
    try {
      const cfg = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        url: cfg.url || '',
        anonKey: cfg.anonKey || '',
        isConfigured: Boolean(cfg.url && cfg.anonKey)
      };
    } catch (e) {
      return { url: '', anonKey: '', isConfigured: false };
    }
  }

  let supabaseClient = null;

  function initClient() {
    const cfg = getStoredConfig();
    if (cfg.isConfigured && typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      try {
        supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
        console.log('⚡ Apex Supabase Cloud Client Initialized');
      } catch (err) {
        console.warn('Supabase initialization warning:', err);
        supabaseClient = null;
      }
    } else {
      supabaseClient = null;
    }
    return supabaseClient;
  }

  // Database Access Layer
  const ApexDB = {
    getConfig: getStoredConfig,

    setConfig: function (url, anonKey) {
      const cleanUrl = (url || '').trim().replace(/\/+$/, '');
      const cleanKey = (anonKey || '').trim();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
      initClient();
      return this.testConnection();
    },

    clearConfig: function () {
      localStorage.removeItem(STORAGE_KEY);
      supabaseClient = null;
    },

    testConnection: async function () {
      const client = initClient();
      if (!client) {
        return { success: false, mode: 'local', message: 'No Supabase credentials configured. Running in Local Storage cache mode.' };
      }
      try {
        const { data, error } = await client.from('members').select('id').limit(1);
        if (error) {
          return { success: false, mode: 'error', message: error.message };
        }
        return { success: true, mode: 'cloud', message: 'Connected to Supabase successfully!' };
      } catch (e) {
        return { success: false, mode: 'network_error', message: e.message || 'Network connection failed' };
      }
    },

    // --- BOOKINGS (VIP PASSES & CLASS RESERVATIONS) ---
    saveBooking: async function (booking) {
      const client = initClient();
      // Always store locally first for instant UI response
      try {
        const local = JSON.parse(localStorage.getItem('apex_bookings') || '[]');
        local.unshift(booking);
        localStorage.setItem('apex_bookings', JSON.stringify(local));
      } catch (e) {}

      // Cloud sync to Supabase if configured
      if (client) {
        try {
          const { error } = await client.from('bookings').insert([{
            id: booking.id,
            name: booking.name,
            email: booking.email,
            phone: booking.phone || '',
            type: booking.type || 'VIP Pass',
            target: booking.target || '',
            status: booking.status || 'Pending',
            code: booking.code
          }]);
          if (error) console.warn('Supabase bookings insert error:', error.message);
        } catch (err) {
          console.warn('Supabase sync error:', err);
        }
      }
      return booking;
    },

    fetchBookings: async function () {
      const client = initClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            // Update local cache
            localStorage.setItem('apex_bookings', JSON.stringify(data));
            return data;
          }
        } catch (err) {
          console.warn('Supabase fetch bookings error:', err);
        }
      }
      return JSON.parse(localStorage.getItem('apex_bookings') || '[]');
    },

    updateBookingStatus: async function (id, status) {
      // Local update
      try {
        const local = JSON.parse(localStorage.getItem('apex_bookings') || '[]');
        const target = local.find(b => b.id === id);
        if (target) target.status = status;
        localStorage.setItem('apex_bookings', JSON.stringify(local));
      } catch (e) {}

      // Supabase update
      const client = initClient();
      if (client) {
        try {
          await client.from('bookings').update({ status }).eq('id', id);
        } catch (err) {
          console.warn('Supabase update booking error:', err);
        }
      }
    },

    // --- MEMBERS MANAGEMENT ---
    saveMember: async function (member) {
      try {
        const local = JSON.parse(localStorage.getItem('apex_members') || '[]');
        local.unshift(member);
        localStorage.setItem('apex_members', JSON.stringify(local));
      } catch (e) {}

      const client = initClient();
      if (client) {
        try {
          const { error } = await client.from('members').insert([{
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone || '',
            plan: member.plan || 'Apex Pro',
            status: member.status || 'Active',
            joined_date: member.joinedDate || new Date().toISOString().split('T')[0],
            check_in: member.checkIn || 'Never'
          }]);
          if (error) console.warn('Supabase member insert error:', error.message);
        } catch (err) {
          console.warn('Supabase member sync error:', err);
        }
      }
      return member;
    },

    fetchMembers: async function () {
      const client = initClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped = data.map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              phone: m.phone,
              plan: m.plan,
              status: m.status,
              joinedDate: m.joined_date,
              checkIn: m.check_in
            }));
            localStorage.setItem('apex_members', JSON.stringify(mapped));
            return mapped;
          }
        } catch (err) {
          console.warn('Supabase fetch members error:', err);
        }
      }
      return JSON.parse(localStorage.getItem('apex_members') || '[]');
    },

    updateMemberStatus: async function (id, status) {
      try {
        const local = JSON.parse(localStorage.getItem('apex_members') || '[]');
        const target = local.find(m => m.id === id);
        if (target) target.status = status;
        localStorage.setItem('apex_members', JSON.stringify(local));
      } catch (e) {}

      const client = initClient();
      if (client) {
        try {
          await client.from('members').update({ status }).eq('id', id);
        } catch (err) {
          console.warn('Supabase update member error:', err);
        }
      }
    },

    deleteMember: async function (id) {
      try {
        let local = JSON.parse(localStorage.getItem('apex_members') || '[]');
        local = local.filter(m => m.id !== id);
        localStorage.setItem('apex_members', JSON.stringify(local));
      } catch (e) {}

      const client = initClient();
      if (client) {
        try {
          await client.from('members').delete().eq('id', id);
        } catch (err) {
          console.warn('Supabase delete member error:', err);
        }
      }
    },

    // --- NEWSLETTER SIGNUPS ---
    saveNewsletter: async function (email) {
      try {
        const local = JSON.parse(localStorage.getItem('apex_newsletter') || '[]');
        if (!local.includes(email)) local.push(email);
        localStorage.setItem('apex_newsletter', JSON.stringify(local));
      } catch (e) {}

      const client = initClient();
      if (client) {
        try {
          await client.from('newsletter').insert([{ email }]);
        } catch (err) {
          console.warn('Supabase newsletter error:', err);
        }
      }
    },

    fetchNewsletter: async function () {
      const client = initClient();
      if (client) {
        try {
          const { data, error } = await client.from('newsletter').select('*').order('subscribed_at', { ascending: false });
          if (!error && data) return data.map(d => d.email);
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem('apex_newsletter') || '[]');
    },

    // --- AUDIT LOGS ---
    logSecurity: async function (event, status = 'SUCCESS') {
      const logItem = {
        id: 'LOG-' + Math.floor(100 + Math.random() * 900),
        event: event,
        ip: '127.0.0.1 (Local Session)',
        status: status,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      try {
        const logs = JSON.parse(localStorage.getItem('apex_security_logs') || '[]');
        logs.unshift(logItem);
        if (logs.length > 50) logs.pop();
        localStorage.setItem('apex_security_logs', JSON.stringify(logs));
      } catch (e) {}

      const client = initClient();
      if (client) {
        try {
          await client.from('audit_logs').insert([{
            id: logItem.id,
            event: logItem.event,
            ip: logItem.ip,
            status: logItem.status
          }]);
        } catch (e) {}
      }
    },

    fetchSecurityLogs: async function () {
      const client = initClient();
      if (client) {
        try {
          const { data, error } = await client.from('audit_logs').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            return data.map(d => ({
              id: d.id,
              event: d.event,
              ip: d.ip,
              status: d.status,
              timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem('apex_security_logs') || '[]');
    }
  };

  // Expose global ApexDB
  window.ApexDB = ApexDB;

  // Auto initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    initClient();
  });
})();
