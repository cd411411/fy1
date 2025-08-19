import type { AgentProfile } from '../interfaces/document.types';

const AGENT_PROFILES_KEY = 'agent_profiles_library';

// 获取所有已保存的代理人
export const getAgentProfiles = (): AgentProfile[] => {
  const data = localStorage.getItem(AGENT_PROFILES_KEY);
  return data ? JSON.parse(data) : [];
};

// 保存一个新的代理人信息
export const saveAgentProfile = (profile: Omit<AgentProfile, 'id'>): AgentProfile => {
  const profiles = getAgentProfiles();
  const newProfile: AgentProfile = {
    ...profile,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 创建一个唯一ID
  };
  profiles.push(newProfile);
  localStorage.setItem(AGENT_PROFILES_KEY, JSON.stringify(profiles));
  return newProfile;
};

// 删除一个代理人信息
export const deleteAgentProfile = (id: string): void => {
  let profiles = getAgentProfiles();
  profiles = profiles.filter(p => p.id !== id);
  localStorage.setItem(AGENT_PROFILES_KEY, JSON.stringify(profiles));
};