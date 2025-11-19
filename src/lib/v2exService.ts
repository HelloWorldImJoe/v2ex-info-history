// Mock data service for V2EX dashboard

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  changeDirection: 'up' | 'down';
  volume24h: string;
}

export interface HodlerRank {
  rank: number;
  username: string;
  balance: string;
  percentage: string;
  valueUSD: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface CheckinRank {
  rank: number;
  username: string;
  streak: number;
  totalDays: number;
  reward: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface HotTopic {
  id: string;
  title: string;
  author: string;
  node: string;
  replies: number;
  views: number;
  lastReplyTime: string;
}

export interface CommunityStats {
  onlineUsers: number;
  totalHolders: number;
  hodlers10k: number;
  marketCap: string;
  onlineTrend: number;
  holdersTrend: number;
  hodlers10kTrend: number;
  marketCapTrend: number;
}

export interface BlindBoxReward {
  id: string;
  type: 'coins' | 'badge' | 'avatar' | 'title';
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value?: string;
  icon: string;
}

export interface CheckinStatus {
  hasCheckedToday: boolean;
  streakDays: number;
  totalCheckins: number;
  lastCheckinDate?: string;
  todayReward?: BlindBoxReward;
}

export interface VerificationStatus {
  isVerified: boolean;
  v2exUsername?: string;
  verifiedAt?: string;
  verificationCode?: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PriceTrendData {
  symbol: string;
  name: string;
  history: TrendDataPoint[];
  currentPrice: number;
}

export interface StatsTrendData {
  label: string;
  history: TrendDataPoint[];
  currentValue: number;
}

export interface MultiCryptoTrendPoint {
  date: string;
  V2EX: number;
  PUMP: number;
  SOL: number;
  BTC: number;
}

export interface MultiCryptoTrendData {
  history: MultiCryptoTrendPoint[];
  cryptos: Array<{
    symbol: string;
    name: string;
    color: string;
    currentPrice: number;
  }>;
}

// Base values for crypto prices
const baseCryptoPrices = [
  { symbol: '$V2EX', name: 'V2EX Token', basePrice: 0.0968, baseChange: 18.5, baseVolume: 485000 },
  { symbol: 'PUMP', name: 'Pump.fun', basePrice: 0.3421, baseChange: -3.2, baseVolume: 12400000 },
  { symbol: 'SOL', name: 'Solana', basePrice: 143.67, baseChange: 5.8, baseVolume: 2800000000 },
  { symbol: 'BTC', name: 'Bitcoin', basePrice: 67842, baseChange: 2.4, baseVolume: 28500000000 },
];

// Mock data generators with real-time fluctuation
export const getCryptoPrices = (): CryptoPrice[] => {
  return baseCryptoPrices.map(crypto => {
    // Add small random fluctuation (-0.5% to +0.5%)
    const priceFluctuation = 1 + (Math.random() - 0.5) * 0.01;
    const newPrice = crypto.basePrice * priceFluctuation;
    
    // Update change24h slightly
    const changeFluctuation = (Math.random() - 0.5) * 0.2;
    const newChange = crypto.baseChange + changeFluctuation;
    
    // Format price based on symbol
    let formattedPrice: string;
    if (crypto.symbol === 'BTC') {
      formattedPrice = `$${Math.floor(newPrice).toLocaleString()}`;
    } else if (crypto.symbol === 'SOL') {
      formattedPrice = `$${newPrice.toFixed(2)}`;
    } else {
      formattedPrice = `$${newPrice.toFixed(4)}`;
    }
    
    // Format volume
    let formattedVolume: string;
    if (crypto.baseVolume >= 1000000000) {
      formattedVolume = `$${(crypto.baseVolume / 1000000000).toFixed(1)}B`;
    } else if (crypto.baseVolume >= 1000000) {
      formattedVolume = `$${(crypto.baseVolume / 1000000).toFixed(1)}M`;
    } else {
      formattedVolume = `$${(crypto.baseVolume / 1000).toFixed(0)}K`;
    }
    
    return {
      symbol: crypto.symbol,
      name: crypto.name,
      price: formattedPrice,
      change24h: parseFloat(newChange.toFixed(1)),
      changeDirection: newChange >= 0 ? 'up' : 'down',
      volume24h: formattedVolume,
    };
  });
};

export const getHodlersRanking = (): HodlerRank[] => {
  const names = [
    'Livid', 'imn1', 'fanhaipeng0403', 'xiaozuo', 'JamesR',
    'qiayue', 'yegle', 'chenyuzao', 'fang5566', 'Tink',
    'wisunny', 'msg7086', 'jakes', 'sparanoid', 'chenset',
    'visionm', 'loading', 'ryd994', 'carlclone', 'learnshare',
    'crypto_whale', 'early_investor', 'diamond_hands', 'hodl_master', 'token_lord',
    'whale_watcher', 'moon_chaser', 'bull_rider', 'dip_buyer', 'stake_king'
  ];
  
  // Simulate some verified users (randomly)
  const verifiedUsers = ['Livid', 'imn1', 'yegle', 'sparanoid', 'msg7086', 'Tink'];
  
  return names.map((name, index) => {
    const balance = Math.floor(150000 * Math.pow(0.75, index));
    const percentage = (balance / 2893400 * 100).toFixed(2);
    const valueUSD = (balance * 0.0968).toFixed(2);
    
    return {
      rank: index + 1,
      username: name,
      balance: balance.toLocaleString(),
      percentage: `${percentage}%`,
      valueUSD: `$${Number(valueUSD).toLocaleString()}`,
      isVerified: verifiedUsers.includes(name),
    };
  });
};

// Get current user's hodler rank (mock)
// Set rank to 8 to test in-list behavior, or 156 to test out-of-list behavior
export const getMyHodlerRank = (): HodlerRank => {
  const balance = 8234;
  const percentage = (balance / 2893400 * 100).toFixed(2);
  const valueUSD = (balance * 0.0968).toFixed(2);
  
  return {
    rank: 156, // Change to a number <= 30 to test in-list behavior
    username: '我的账户',
    balance: balance.toLocaleString(),
    percentage: `${percentage}%`,
    valueUSD: `$${Number(valueUSD).toLocaleString()}`,
    isVerified: true,
  };
};

export const getCheckinRanking = (): CheckinRank[] => {
  const names = [
    'dailyuser01', 'checkin_king', 'morning_person', 'consistent_dev', 'never_miss',
    'early_bird', 'dedicated_one', 'streak_master', 'loyal_member', 'v2ex_fan',
    'daily_routine', 'commitment_pro', 'habit_keeper', 'clockwork', 'persistent_user',
    'dailywarrior', 'streak_lover', 'morning_glory', 'punctual_dev', 'checkin_master',
    'routine_champ', 'daily_hero', 'streak_ninja', 'consistent_pro', 'never_stop',
    'morning_star', 'dedication_max', 'checkin_legend', 'daily_beast', 'streak_god'
  ];
  
  // Simulate some verified users
  const verifiedUsers = ['checkin_king', 'morning_person', 'streak_master', 'loyal_member', 'early_bird'];
  
  return names.map((name, index) => {
    const streak = 365 - index * 10;
    const totalDays = Math.floor(streak * 1.2);
    const reward = Math.floor((streak / 10) * 50);
    
    return {
      rank: index + 1,
      username: name,
      streak,
      totalDays,
      reward: `${reward} V`,
      isVerified: verifiedUsers.includes(name),
    };
  });
};

// Get current user's checkin rank (mock)
// Set rank to 8 to test in-list behavior, or 87 to test out-of-list behavior
export const getMyCheckinRank = (): CheckinRank => {
  const streak = 45;
  const totalDays = 89;
  const reward = Math.floor((streak / 10) * 50);
  
  return {
    rank: 87, // Change to a number <= 30 to test in-list behavior
    username: '我的账户',
    streak,
    totalDays,
    reward: `${reward} V`,
    isVerified: true,
  };
};

export const getHotTopics = (): HotTopic[] => {
  const topics = [
    { title: '如何看待最近 $V2EX 代币的暴涨？', node: '加密货币', author: 'crypto_fan' },
    { title: '分享一个提高开发效率的 VSCode 插件', node: '程序员', author: 'dev_master' },
    { title: 'Mac mini M4 值得购买吗？', node: '硬件', author: 'apple_lover' },
    { title: 'V2EX 十周年了，大家还记得什么时候注册的吗？', node: 'V2EX', author: 'old_timer' },
    { title: '推荐几个 AI 编程助手的使用体验', node: 'AI', author: 'ai_researcher' },
    { title: '深圳有哪些适合程序员的公司？', node: '职场', author: 'job_seeker' },
    { title: 'Rust 真的比 Go 难学吗？', node: '编程', author: 'lang_learner' },
    { title: '家里宽带升级到 1000M 是否有必要？', node: '宽带', author: 'net_user' },
    { title: 'NAS 搭建指南 - 从入门到精通', node: '技术', author: 'nas_expert' },
    { title: '2025 年前端技术栈应该怎么选？', node: '前端', author: 'frontend_dev' },
    { title: 'Docker 容器化部署最佳实践', node: 'DevOps', author: 'ops_engineer' },
    { title: 'Solana 链上交易手续费暴涨怎么办？', node: 'Blockchain', author: 'sol_trader' },
    { title: '远程工作三年的一些心得体会', node: '远程工作', author: 'remote_worker' },
    { title: 'TypeScript 5.0 新特性解析', node: 'TypeScript', author: 'ts_guru' },
    { title: '如何优雅地拒绝产品经理的需求？', node: '程序员', author: 'stressed_dev' },
    { title: 'Next.js 14 App Router 实战经验分享', node: '前端', author: 'nextjs_dev' },
    { title: '如何在国内搭建稳定的科学上网方案？', node: '技术', author: 'vpn_expert' },
    { title: 'ChatGPT Plus 订阅是否值得？', node: 'AI', author: 'ai_enthusiast' },
    { title: 'M4 MacBook Pro 使用一个月体验报告', node: '硬件', author: 'mac_user' },
    { title: 'Supabase vs Firebase：该如何选择？', node: '后端', author: 'backend_dev' },
    { title: '如何选择适合自己的编程语言？', node: '编程', author: 'beginner_dev' },
    { title: 'Web3 开发入门指南', node: 'Blockchain', author: 'web3_dev' },
    { title: '如何提高代码质量？', node: '程序员', author: 'senior_dev' },
    { title: '微服务架构最佳实践', node: '后端', author: 'architect' },
    { title: 'GitHub Copilot vs Cursor：哪个更好用？', node: 'AI', author: 'ai_coder' },
    { title: 'Linux 服务器安全加固指南', node: '运维', author: 'sysadmin' },
    { title: '前端性能优化实战', node: '前端', author: 'performance_expert' },
    { title: 'Redis 缓存设计模式', node: '后端', author: 'cache_master' },
    { title: '如何成为一名全栈工程师？', node: '程序员', author: 'fullstack_dev' },
    { title: 'GraphQL vs REST API 对比分析', node: '后端', author: 'api_designer' },
  ];
  
  return topics.map((topic, index) => ({
    id: `topic-${index}`,
    title: topic.title,
    author: topic.author,
    node: topic.node,
    replies: Math.floor(Math.random() * 200) + 20,
    views: Math.floor(Math.random() * 5000) + 500,
    lastReplyTime: `${Math.floor(Math.random() * 8) + 1} 小时前`,
  }));
};

// Get current user's hot topic (mock)
// Set a specific id or unique identifier to test in-list behavior
export const getMyHotTopic = (): HotTopic => {
  return {
    id: 'my-topic',
    title: '我的帖子：V2EX数据中心使用体验分享',
    author: '我',
    node: 'V2EX',
    replies: 42,
    views: 1234,
    lastReplyTime: '2 小时前',
  };
};

// Base values for community stats
const baseCommunityStats = {
  onlineUsers: 3847,
  totalHolders: 28934,
  hodlers10k: 2156,
  baseMarketCap: 2.8,
  onlineTrend: 12.5,
  holdersTrend: 8.3,
  hodlers10kTrend: 15.7,
  marketCapTrend: 24.6,
};

export const getCommunityStats = (): CommunityStats => {
  // Add small random fluctuations
  const onlineFluctuation = Math.floor((Math.random() - 0.5) * 100); // ±50 users
  const holdersFluctuation = Math.floor((Math.random() - 0.5) * 20); // ±10 holders
  const hodlers10kFluctuation = Math.floor((Math.random() - 0.5) * 10); // ±5 hodlers
  const marketCapFluctuation = (Math.random() - 0.5) * 0.1; // ±0.05M
  
  const newMarketCap = baseCommunityStats.baseMarketCap + marketCapFluctuation;
  
  return {
    onlineUsers: baseCommunityStats.onlineUsers + onlineFluctuation,
    totalHolders: baseCommunityStats.totalHolders + holdersFluctuation,
    hodlers10k: baseCommunityStats.hodlers10k + hodlers10kFluctuation,
    marketCap: `$${newMarketCap.toFixed(1)}M`,
    onlineTrend: baseCommunityStats.onlineTrend,
    holdersTrend: baseCommunityStats.holdersTrend,
    hodlers10kTrend: baseCommunityStats.hodlers10kTrend,
    marketCapTrend: baseCommunityStats.marketCapTrend,
  };
};

// Blind box reward pool
export const getBlindBoxRewards = (): BlindBoxReward[] => [
  { id: 'coins-50', type: 'coins', name: '50 V币', description: '基础奖励', rarity: 'common', value: '50', icon: '🪙' },
  { id: 'coins-100', type: 'coins', name: '100 V币', description: '不错的收获', rarity: 'common', value: '100', icon: '🪙' },
  { id: 'coins-200', type: 'coins', name: '200 V币', description: '丰厚奖励', rarity: 'rare', value: '200', icon: '💰' },
  { id: 'coins-500', type: 'coins', name: '500 V币', description: '超级大奖', rarity: 'epic', value: '500', icon: '💎' },
  { id: 'badge-early', type: 'badge', name: '早起之星', description: '连续签到7天', rarity: 'rare', icon: '⭐' },
  { id: 'badge-loyal', type: 'badge', name: '忠实用户', description: '连续签到30天', rarity: 'epic', icon: '🏆' },
  { id: 'badge-legend', type: 'badge', name: '传奇会员', description: '连续签到365天', rarity: 'legendary', icon: '👑' },
  { id: 'avatar-gold', type: 'avatar', name: '金色头像框', description: '尊贵身份象征', rarity: 'epic', icon: '🖼️' },
  { id: 'avatar-rainbow', type: 'avatar', name: '彩虹头像框', description: '稀有收藏品', rarity: 'legendary', icon: '🌈' },
  { id: 'title-tech', type: 'title', name: '技术大神', description: '专属称号', rarity: 'rare', icon: '💻' },
  { id: 'title-crypto', type: 'title', name: '加密先锋', description: '专属称号', rarity: 'epic', icon: '🚀' },
];

// Random blind box draw
export const drawBlindBox = (): BlindBoxReward => {
  const rewards = getBlindBoxRewards();
  const weights = {
    common: 50,
    rare: 30,
    epic: 15,
    legendary: 5,
  };
  
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  let selectedRarity: BlindBoxReward['rarity'] = 'common';
  for (const [rarity, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = rarity as BlindBoxReward['rarity'];
      break;
    }
  }
  
  const rarityRewards = rewards.filter(r => r.rarity === selectedRarity);
  return rarityRewards[Math.floor(Math.random() * rarityRewards.length)];
};

// Get checkin status (mock)
export const getCheckinStatus = (): CheckinStatus => {
  const lastCheckin = localStorage.getItem('lastCheckin');
  const today = new Date().toDateString();
  const hasCheckedToday = lastCheckin === today;
  
  return {
    hasCheckedToday,
    streakDays: 7,
    totalCheckins: 89,
    lastCheckinDate: lastCheckin || undefined,
  };
};

// Perform checkin
export const performCheckin = (): { success: boolean; reward: BlindBoxReward } => {
  const today = new Date().toDateString();
  localStorage.setItem('lastCheckin', today);
  const reward = drawBlindBox();
  return { success: true, reward };
};

// Get verification status (mock)
export const getVerificationStatus = (): VerificationStatus => {
  const verified = localStorage.getItem('v2exVerified');
  const username = localStorage.getItem('v2exUsername');
  const verifiedAt = localStorage.getItem('v2exVerifiedAt');
  
  return {
    isVerified: verified === 'true',
    v2exUsername: username || undefined,
    verifiedAt: verifiedAt || undefined,
  };
};

// Start verification process
export const startVerification = (username: string): { code: string } => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem('v2exVerificationCode', code);
  localStorage.setItem('v2exUsername', username);
  return { code };
};

// Verify code
export const verifyCode = (inputCode: string): { success: boolean } => {
  const storedCode = localStorage.getItem('v2exVerificationCode');
  const success = inputCode.toUpperCase() === storedCode;
  
  if (success) {
    localStorage.setItem('v2exVerified', 'true');
    localStorage.setItem('v2exVerifiedAt', new Date().toISOString());
    localStorage.removeItem('v2exVerificationCode');
  }
  
  return { success };
};

// Generate trend data for crypto prices (last 30 days)
export const getCryptoTrendData = (symbol: string): PriceTrendData | null => {
  const cryptos = getCryptoPrices();
  const crypto = cryptos.find(c => c.symbol === symbol);
  
  if (!crypto) return null;
  
  const currentPrice = parseFloat(crypto.price.replace(/[^0-9.]/g, ''));
  const change24h = crypto.change24h;
  
  // Generate 30 days of historical data
  const history: TrendDataPoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate price fluctuation
    const dayOffset = (29 - i) / 29;
    const randomFactor = 1 + (Math.random() - 0.5) * 0.15;
    const trendFactor = 1 + (change24h / 100) * dayOffset;
    const price = currentPrice / trendFactor * randomFactor;
    
    history.push({
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      value: parseFloat(price.toFixed(4)),
      label: date.toLocaleDateString('zh-CN'),
    });
  }
  
  return {
    symbol: crypto.symbol,
    name: crypto.name,
    history,
    currentPrice,
  };
};

// Generate multi-crypto aggregated trend data (configurable days)
export const getMultiCryptoTrendData = (days: 7 | 30 | 90 = 30): MultiCryptoTrendData => {
  const cryptos = baseCryptoPrices;
  const history: MultiCryptoTrendPoint[] = [];
  const now = new Date();

  // Generate historical data for specified number of days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const point: MultiCryptoTrendPoint = {
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      V2EX: 0,
      PUMP: 0,
      SOL: 0,
      BTC: 0,
    };

    // Calculate price for each crypto
    cryptos.forEach(crypto => {
      const dayOffset = (days - 1 - i) / (days - 1);
      const randomFactor = 1 + (Math.random() - 0.5) * 0.15;
      const trendFactor = 1 + (crypto.baseChange / 100) * dayOffset;
      const price = crypto.basePrice / trendFactor * randomFactor;
      
      const key = crypto.symbol.replace('$', '') as keyof Omit<MultiCryptoTrendPoint, 'date'>;
      point[key] = parseFloat(price.toFixed(crypto.symbol === 'BTC' ? 0 : crypto.symbol === 'SOL' ? 2 : 4));
    });

    history.push(point);
  }

  return {
    history,
    cryptos: [
      { symbol: '$V2EX', name: 'V2EX Token', color: '#8b5cf6', currentPrice: baseCryptoPrices[0].basePrice },
      { symbol: 'PUMP', name: 'Pump.fun', color: '#ec4899', currentPrice: baseCryptoPrices[1].basePrice },
      { symbol: 'SOL', name: 'Solana', color: '#06b6d4', currentPrice: baseCryptoPrices[2].basePrice },
      { symbol: 'BTC', name: 'Bitcoin', color: '#f59e0b', currentPrice: baseCryptoPrices[3].basePrice },
    ],
  };
};

// Generate trend data for community stats (last 30 days)
export const getStatsTrendData = (type: 'onlineUsers' | 'totalHolders' | 'hodlers10k' | 'marketCap'): StatsTrendData => {
  const stats = getCommunityStats();
  
  const labels: Record<typeof type, string> = {
    onlineUsers: '在线人数',
    totalHolders: '持有人数',
    hodlers10k: '10k+ HODL',
    marketCap: '市值',
  };
  
  const currentValues: Record<typeof type, number> = {
    onlineUsers: stats.onlineUsers,
    totalHolders: stats.totalHolders,
    hodlers10k: stats.hodlers10k,
    marketCap: parseFloat(stats.marketCap.replace(/[^0-9.]/g, '')),
  };
  
  const trends: Record<typeof type, number> = {
    onlineUsers: stats.onlineTrend,
    totalHolders: stats.holdersTrend,
    hodlers10k: stats.hodlers10kTrend,
    marketCap: stats.marketCapTrend,
  };
  
  const currentValue = currentValues[type];
  const trend = trends[type];
  
  // Generate 30 days of historical data
  const history: TrendDataPoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate value fluctuation with trend
    const dayOffset = (29 - i) / 29;
    const randomFactor = 1 + (Math.random() - 0.5) * 0.08;
    const trendFactor = 1 + (trend / 100) * dayOffset;
    const value = currentValue / trendFactor * randomFactor;
    
    history.push({
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      value: Math.round(value),
      label: date.toLocaleDateString('zh-CN'),
    });
  }
  
  return {
    label: labels[type],
    history,
    currentValue,
  };
};
