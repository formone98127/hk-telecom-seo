export interface Agent {
  /** URL ?ref= 代號，例如 ken */
  id: string;
  /** 顯示名稱（同事／推廣工具用） */
  name: string;
  /** WhatsApp 號碼，852 開頭、不含 + 號 */
  whatsapp: string;
  /** 自然流量分配權重（相對比例） */
  weight: number;
}

/**
 * 銷售員／推廣員設定
 * weight 會按比例分配沒有 ?ref= 的自然搜尋訪客
 * 例：主號 weight 80、其餘各 10 → 約 80% / 10% / 10%
 */
export const agents: Agent[] = [
  {
    id: 'main',
    name: '主線客服',
    whatsapp: '85263300911',
    weight: 100,
  },
  {
    id: 'ken',
    name: 'Ken',
    whatsapp: '85263300911',
    weight: 0,
  },
  {
    id: 'amy',
    name: 'Amy',
    whatsapp: '85263300911',
    weight: 0,
  },
];

export const DEFAULT_AGENT_ID = 'main';

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

/** 依 weight 加權隨機抽出一位銷售員 */
export function pickWeightedAgent(list: Agent[] = agents): Agent {
  const total = list.reduce((sum, a) => sum + a.weight, 0);
  let r = Math.random() * total;
  for (const agent of list) {
    r -= agent.weight;
    if (r <= 0) return agent;
  }
  return list[0];
}
