class ProposalTracker {
  constructor(proposalId, visitorToken) {
    this.proposalId = proposalId;
    this.visitorToken = visitorToken;
    this.startTime = Date.now();
    this.lastScrollPosition = 0;
    this.sectionsViewed = new Set();
    this.isActive = true;
    this.heartbeatInterval = null;
    
    this.init();
  }

  init() {
    // Log initial page view
    this.logInteraction('page_view', { 
      page: 'proposal_main',
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString()
    });

    // Setup event listeners
    this.setupScrollTracking();
    this.setupSectionTracking();
    this.setupClickTracking();
    this.setupTimeTracking();
    this.setupVisibilityTracking();
    this.setupHeartbeat();

    // Track when user leaves the page
    window.addEventListener('beforeunload', () => {
      this.logTimeSpent();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false;
        this.logTimeSpent();
      } else {
        this.isActive = true;
        this.startTime = Date.now();
      }
    });
  }

  setupScrollTracking() {
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercentage = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollPercentage > this.lastScrollPosition + 10) {
          this.lastScrollPosition = scrollPercentage;
          this.logInteraction('scroll', { scroll_percentage: scrollPercentage });
        }
      }, 250);
    });
  }

  setupSectionTracking() {
    const sections = document.querySelectorAll('[data-section-id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const sectionId = entry.target.dataset.sectionId;
          if (!this.sectionsViewed.has(sectionId)) {
            this.sectionsViewed.add(sectionId);
            this.logInteraction('section_view', { section_id: sectionId }, sectionId);
          }
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(section => observer.observe(section));
  }

  setupClickTracking() {
    document.addEventListener('click', (e) => {
      const element = e.target;
      const tagName = element.tagName.toLowerCase();
      const className = element.className;
      const id = element.id;
      const text = element.textContent?.substring(0, 100);

      // Track specific elements
      if (['a', 'button'].includes(tagName) || className.includes('btn')) {
        this.logInteraction('click', {
          element: tagName,
          class: className,
          id: id,
          text: text,
          href: element.href || null
        });
      }
    });
  }

  setupTimeTracking() {
    // Track time spent every 30 seconds
    setInterval(() => {
      if (this.isActive) {
        this.logTimeSpent();
      }
    }, 30000);
  }

  setupVisibilityTracking() {
    // Track when user becomes active/inactive
    let inactiveTimeout;
    const resetInactiveTimeout = () => {
      clearTimeout(inactiveTimeout);
      if (!this.isActive) {
        this.isActive = true;
        this.startTime = Date.now();
      }
      
      inactiveTimeout = setTimeout(() => {
        this.isActive = false;
        this.logTimeSpent();
      }, 60000); // 1 minute of inactivity
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactiveTimeout, true);
    });
  }

  setupHeartbeat() {
    // Send heartbeat every 60 seconds to keep session alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isActive) {
        this.logInteraction('heartbeat', { timestamp: new Date().toISOString() });
      }
    }, 60000);
  }

  logTimeSpent() {
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    if (timeSpent > 5) { // Only log if spent more than 5 seconds
      this.logInteraction('time_spent', { duration: timeSpent }, null, timeSpent);
      this.startTime = Date.now();
    }
  }

  async logInteraction(eventType, eventData, sectionId = null, timeSpent = null, scrollPercentage = null) {
    try {
      const data = {
        visitorToken: this.visitorToken,
        eventType,
        eventData,
        sectionId,
        timeSpent,
        scrollPercentage
      };

      // Use sendBeacon for better reliability on page unload
      if (eventType === 'time_spent' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/tracking/log-interaction', JSON.stringify(data));
      } else {
        await fetch('/api/tracking/log-interaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
      }

      // Debug logging (remove in production)
      if (window.location.hostname === 'localhost') {
        console.log(`Tracked: ${eventType}`, eventData);
      }

    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  // Public methods for manual tracking
  trackDownload(fileName) {
    this.logInteraction('download', { file_name: fileName });
  }

  trackFormSubmit(formName, formData) {
    this.logInteraction('form_submit', { form_name: formName, data: formData });
  }

  trackCustomEvent(eventName, eventData) {
    this.logInteraction('custom_event', { event_name: eventName, ...eventData });
  }

  // Cleanup
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.logTimeSpent();
  }
}

// Auto-initialize if visitor token is available
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const visitorToken = urlParams.get('visitor') || localStorage.getItem('visitorToken');
  
  if (visitorToken) {
    // Extract proposal ID from URL
    const pathParts = window.location.pathname.split('/');
    const proposalId = pathParts[pathParts.length - 1];
    
    if (proposalId && proposalId !== 'proposta') {
      window.proposalTracker = new ProposalTracker(proposalId, visitorToken);
    }
  }
});

// Make it globally available
window.ProposalTracker = ProposalTracker;