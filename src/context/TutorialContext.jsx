import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TutorialContext = createContext(null);

export const TutorialProvider = ({ children, activeView, user }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFullWalkthrough, setIsFullWalkthrough] = useState(false);

  // Define steps for each page
  const tutorialSteps = {
    global: [
      {
        target: '.sidebar-nav',
        title: 'Navigation Sidebar',
        content: 'Easily switch between Dashboard, Call Manager, Logs, and Reports using this sidebar.',
        position: 'right'
      },
      {
        target: '.hdr-plan-info',
        title: 'Plan & Credits',
        content: 'Keep an eye on your remaining credits and current plan here. Credits are used for outbound AI calls.',
        position: 'bottom'
      },
      {
        target: '.hdr-tutorial-btn',
        title: 'Help Center',
        content: 'Stuck? Click here anytime to restart the guided tour for the page you are currently viewing.',
        position: 'bottom'
      },
      {
        target: '.logout-btn',
        title: 'Safe Exit',
        content: 'Use this to securely log out of your portal when you are finished.',
        position: 'bottom'
      }
    ],
    calendar: [
      {
        target: '.metrics-grid-compact',
        title: 'Performance Overview',
        content: 'Monitor your total outreach, connection rates, and success metrics at a glance.',
        position: 'bottom'
      },
      {
        target: '.cdv-container',
        title: 'Activity Calendar',
        content: 'Track calls made on specific dates. Click any date to view historical logs for that day.',
        position: 'bottom'
      },
      {
        target: '.quick-nav-container',
        title: 'Quick Access',
        content: 'Jump directly to Leads, Responses, or Call Details without navigating the sidebar.',
        position: 'left'
      },
      {
        target: '.cta-start-calling-compact',
        title: 'Ready to Start?',
        content: 'Click here to head straight to the Call Manager and launch your first campaign!',
        position: 'top'
      }
    ],
    manager: [
      {
        target: '.campaign-title-input',
        title: 'Campaign Naming',
        content: 'Give your campaign a clear name to track it easily in your reports and analytics.',
        position: 'bottom'
      },
      {
        target: '.agent-selector-wrapper',
        title: 'AI Agent Selection',
        content: 'Choose which AI personality and voice will handle your calls. You can also create custom agents.',
        position: 'bottom'
      },
      {
        target: '.schedule-datetime-row',
        title: 'Scheduling',
        content: 'Set a specific date and time for your calls to start, or leave it as is to start immediately.',
        position: 'bottom'
      },
      {
        target: '.file-upload-section',
        title: 'Lead Upload',
        content: 'Drag and drop your contact sheet (CSV/Excel) here to load your target audience.',
        position: 'top'
      },
      {
        target: '.agent-script-panel',
        title: 'Agent Script',
        content: 'Review the script your AI agent will follow. This ensures your outreach stays on brand.',
        position: 'top'
      },
      {
        target: '.schedule-section',
        title: 'Launch Campaign',
        content: 'All set? Click "Start Calling" or "Schedule" to begin your outreach process.',
        position: 'top'
      }
    ],
    details: [
      {
        target: '.details-filters',
        title: 'Data Filtering',
        content: 'Filter your logs by date or call status (Connected/Failed) to find exactly what you need.',
        position: 'bottom'
      },
      {
        target: '.details-table-section',
        title: 'Live Logs',
        content: 'See real-time status updates for every call, including duration and cost per call.',
        position: 'top'
      },
      {
        target: '.retry-calls-btn',
        title: 'Smart Retry',
        content: 'One-click retry for busy or unanswered calls to maximize your connection rates.',
        position: 'top'
      }
    ],
    responses: [
      {
        target: '.responses-graphs-section',
        title: 'Visual Insights',
        content: 'Analyze customer sentiment and response patterns using interactive pie and bar charts.',
        position: 'bottom'
      },
      {
        target: '.response-tab-switcher',
        title: 'Response Categories',
        content: 'Drill down into specific response types like "Interested", "Not Interested", or "Reschedule".',
        position: 'top'
      }
    ],
    leads: [
      {
        target: '.leads-table-section',
        title: 'Qualified Leads',
        content: 'This section automatically extracts and displays only the most promising prospects.',
        position: 'top'
      },
      {
        target: '.lead-category-badge',
        title: 'AI Classification',
        content: 'See exactly how the AI classified the lead based on the conversation context.',
        position: 'left'
      }
    ],

    campaign: [
      {
        target: '.campaign-table-section',
        title: 'Campaign Tracking',
        content: 'View a history of all your past and scheduled campaigns in one clean table.',
        position: 'top'
      },
      {
        target: '.campaign-status-badge',
        title: 'Real-time Status',
        content: 'Track if a campaign is "Running", "Completed", or "Scheduled" at a glance.',
        position: 'left'
      }
    ],
    report: [
      {
        target: '.report-metrics-grid',
        title: 'Campaign Totals',
        content: 'Summary of all key performance indicators for the selected reporting period.',
        position: 'right'
      },
      {
        target: '.generate-report-btn',
        title: 'AI PDF Generation',
        content: 'Generate a deep-dive 10-section PDF analysis of your campaigns using GPT-4o.',
        position: 'top'
      }
    ]
  };

  const getSteps = useCallback(() => {
    const pageSteps = tutorialSteps[activeView] || [];
    if (isFullWalkthrough && currentStep < tutorialSteps.global.length) {
      return tutorialSteps.global;
    }
    return pageSteps;
  }, [activeView, isFullWalkthrough, currentStep]);

  const startTutorial = (full = false) => {
    setIsFullWalkthrough(full);
    setCurrentStep(0);
    setIsActive(true);
  };

  const stopTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    setIsFullWalkthrough(false);
  };

  const nextStep = () => {
    const steps = getSteps();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      stopTutorial();
    }
  };

  // Auto-start on first login
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('bolna_tutorial_seen');
    if (user?.isFirstLogin && !hasSeenTutorial) {
      startTutorial(true);
      localStorage.setItem('bolna_tutorial_seen', 'true');
    }
  }, [user]);

  return (
    <TutorialContext.Provider value={{
      isActive,
      currentStep,
      steps: getSteps(),
      startTutorial,
      stopTutorial,
      nextStep,
      activeView
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => useContext(TutorialContext);
