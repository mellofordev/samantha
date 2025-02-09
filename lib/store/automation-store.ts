type AutomationState = {
  currentUrl?: string;
  domElements?: any;
  screenshot?: string;
  tabID?: string;
  agent_progress: string;
};

class AutomationStore {
  private static instance: AutomationStore;
  private state: AutomationState = {
    agent_progress: '',
  };

  private constructor() {}

  static getInstance(): AutomationStore {
    if (!AutomationStore.instance) {
      AutomationStore.instance = new AutomationStore();
    }
    return AutomationStore.instance;
  }

  setState(newState: Partial<AutomationState>) {
    this.state = {
      ...this.state,
      ...newState
    };
  }

  getState(): AutomationState {
    return this.state;
  }

  clear() {
    this.state = {
      agent_progress: '',
    };
  }
}

export const automationStore = AutomationStore.getInstance(); 