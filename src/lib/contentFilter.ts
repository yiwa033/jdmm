/**
 * 内容安全过滤模块
 * 用于过滤AI聊天中的敏感内容，包括政治敏感、色情、暴力、毒品、赌博等
 * 遵守中国法律法规，保护用户安全
 */

// ============ 敏感词类别定义 ============

/** 政治敏感词 - 涉及中国政治敏感话题 */
const POLITICAL_WORDS: string[] = [
  // 领导人相关（变形词防护）
  '习近平', '习主席', '习总', '习大大', '习core',
  '李克强', '李总理',
  '胡锦涛', '温家宝', '江泽民', '朱镕基',
  '毛泽东', '邓小平',
  '王岐山', '王沪宁', '赵乐际', '韩正',
  '蔡奇', '丁薛祥', '李强',
  // 政治事件与运动
  '六四', '6.4', '64事件', '六四事件', '天安门事件', '天安门屠杀',
  '文化大革命', '文革',
  '法轮功', '法轮大法', '李洪志',
  '台独', '藏独', '疆独', '港独',
  '反华', '反共', '反党',
  '推翻政府', '颠覆政权', '分裂国家',
  '民运', '民主运动', '政治犯',
  '刘晓波', '艾未未',
  '吾尔开希', '柴玲', '王丹',
  '达赖', '达赖喇嘛',
  '轮子功', '真善忍',
  // 政治敏感组织
  '民阵', '民联', '中国民主党',
  // 敏感政治术语
  '中共', '共产党', '一党专政', '独裁',
  '专政体制', '集权统治',
  '平反六四', '平反89',
  '新公民运动',
  '维权运动', '维权律师',
  // 反动口号
  '打倒共产党', '推翻共产党',
  '共产党下台', '还政于民',
  // 政治敏感地区话题
  '西藏独立', '新疆独立', '台湾独立', '香港独立',
  '东突厥斯坦', '吐蕃独立',
  '一国一制', '武统台湾',
  // 选举相关敏感
  '选票', '普选', '直选', '一人一票',
  // 审查相关
  '翻墙', 'VPN', '科学上网',
  'GFW', '防火墙', '网络审查',
  '维基百科中文', '无界浏览', '自由门',
  // 敏感日历
  '5月35日', '4月15日运动',
]

/** 色情低俗词 - 涉及色情、性暗示内容 */
const PORNOGRAPHIC_WORDS: string[] = [
  // 直接色情词汇
  '做爱', '性交', '口交', '肛交', '手淫', '自慰',
  '强奸', '轮奸', '强暴', '迷奸',
  '嫖娼', '卖淫', '召妓', '约炮',
  '一夜情', '援交', '包养', '情妇',
  // 色情内容
  '黄片', '色情片', 'AV', '成人片', '毛片',
  '黄色视频', '裸聊', '色情直播',
  '裸体', '裸照', '艳照', '私密照',
  // 身体部位色情化
  '鸡巴', '阴茎', '阴道', '乳房', '奶子',
  '屁股', '下体', '私处',
  // 色情网站/平台
  'Pornhub', 'XVIDEOS', 'xhamster',
  '草榴', '1024', '91porn', '91视频',
  // 性暗示俚语
  '打炮', '啪啪', '干炮', '上床',
  '约吗', '开房', '走肾',
  '老司机', '飙车', '福利', '开车',
  // 儿童色情
  '儿童色情', '幼女', '萝莉控', '正太控',
  '恋童癖', '恋童',
  // 性骚扰
  '性骚扰', '咸猪手', '偷拍', '偷窥',
  '裙底', '走光',
  // 变态相关
  'SM', '调教', '捆绑', '施虐',
  // 色情描述
  '呻吟', '高潮', '潮吹', '喷水',
]

/** 暴力恐怖词 - 涉及暴力、恐怖主义内容 */
const VIOLENCE_WORDS: string[] = [
  // 恐怖组织
  'ISIS', '伊斯兰国', '达伊沙', '基地组织', '塔利班',
  '东突', '东伊运', '恐怖分子', '恐怖组织',
  '博科圣地', '真主党',
  // 暴力行为
  '杀人', '砍人', '捅人', '袭击', '爆炸',
  '投毒', '下毒', '纵火', '放火',
  '绑架', '劫持', '人质',
  // 自残自杀
  '自杀', '跳楼', '割腕', '上吊', '服毒',
  '安乐死', '自杀方法', '怎么死',
  '不想活', '去死', '死法',
  // 武器制造
  '制枪', '造枪', '自制炸弹', '土制炸弹',
  '炸弹制作', '炸药配方',
  '管制刀具',
  // 暴力教唆
  '砍死', '打死', '弄死', '干掉',
  '灭口', '清除', '处决',
  // 血腥描述
  '分尸', '碎尸', '肢解', '剖腹',
  '血腥', '残忍', '虐杀',
  // 校园暴力
  '校园霸凌', '霸凌方法', '欺负同学',
  // 种族仇恨
  '种族灭绝', '种族清洗', '大屠杀',
  '纳粹', '法西斯', '希特勒万岁',
]

/** 毒品相关词 */
const DRUG_WORDS: string[] = [
  // 毒品种类
  '海洛因', '冰毒', '大麻', '可卡因', '摇头丸',
  'K粉', '氯胺酮', '吗啡', '鸦片', '麻古',
  '甲基苯丙胺', '安非他明',
  '迷幻药', 'LSD', '致幻剂',
  '五仔', 'GHB', '开心水', '奶茶粉',
  // 毒品相关
  '吸毒', '贩毒', '制毒', '运毒',
  '毒贩', '吸毒者', '瘾君子',
  '注射毒品', '静脉注射', '追龙',
  // 毒品制作
  '制毒方法', '合成毒品', '提炼毒品',
  '种植大麻', '种罂粟',
  // 毒品交易
  '买毒', '卖毒', '毒品价格',
  '暗网毒品', '线上买毒',
  // 毒品文化美化
  '飞叶子', '抽大麻', '嗑药',
]

/** 赌博相关词 */
const GAMBLING_WORDS: string[] = [
  // 赌博形式
  '赌博', '赌场', '赌钱', '下注', '押注',
  '百家乐', '德州扑克', '21点', '轮盘',
  '老虎机', '角子机', '摇钱树',
  '地下赌场', '网上赌场', '线上赌场',
  // 博彩平台
  '皇冠', '金沙', '太阳城', '百乐坊',
  '新葡京', '永利', '威尼斯人',
  'ag真人', 'bbin', 'pg电子',
  // 赌博行为
  '下注平台', '投注', '买大小', '买球',
  '赌球', '赌马', '赌狗',
  '外围赌', '黑彩',
  // 赌博代理
  '赌博代理', '赌博返水', '赌场代理',
  // 彩票违规
  '私彩', '黑彩票', '非法彩票',
  // 赌博借贷
  '赌债', '高利贷', '裸贷',
]

/** 诈骗相关词 */
const FRAUD_WORDS: string[] = [
  // 诈骗手段
  '电信诈骗', '网络诈骗', '杀猪盘',
  '刷单', '兼职刷单', '刷信誉',
  '钓鱼网站', '木马病毒',
  '贷款诈骗', '投资诈骗', '理财诈骗',
  '冒充公检法', '冒充客服',
  // 诈骗相关
  '传销', '庞氏骗局', '资金盘',
  '非法集资', '集资诈骗',
  // 金融违法
  '洗钱', '地下钱庄', '非法换汇',
  '套现', '信用卡套现', '花呗套现',
]

/** 邪教相关词 */
const CULT_WORDS: string[] = [
  '全能神', '东方闪电', '实际神',
  '呼喊派', '门徒会', '血水圣灵',
  '统一教', '科学教',
  '被立王', '主神教',
  '灵灵教', '凡物公用',
  '邪教', '邪教组织',
]

/** 其他违法违规词 */
const OTHER_ILLEGAL_WORDS: string[] = [
  // 买卖违禁品
  '买卖枪支', '买枪', '卖枪',
  '假证件', '假身份证', '假文凭',
  '代孕', '买卖器官', '贩卖人口',
  // 黑客相关
  '黑客攻击', 'DDoS攻击', '入侵系统',
  '盗号', '盗取密码', '木马制作',
  // 其他
  '人肉搜索', '网络暴力',
  '非法拘禁', '非法传销',
  '偷税漏税', '行贿受贿',
  '贪污腐败', '权钱交易',
]

// ============ 组合词库 ============

interface SensitiveCategory {
  name: string
  label: string
  words: string[]
}

export const SENSITIVE_CATEGORIES: SensitiveCategory[] = [
  { name: 'political', label: '政治敏感', words: POLITICAL_WORDS },
  { name: 'pornographic', label: '色情低俗', words: PORNOGRAPHIC_WORDS },
  { name: 'violence', label: '暴力恐怖', words: VIOLENCE_WORDS },
  { name: 'drug', label: '毒品相关', words: DRUG_WORDS },
  { name: 'gambling', label: '赌博相关', words: GAMBLING_WORDS },
  { name: 'fraud', label: '诈骗违法', words: FRAUD_WORDS },
  { name: 'cult', label: '邪教相关', words: CULT_WORDS },
  { name: 'other', label: '其他违法', words: OTHER_ILLEGAL_WORDS },
]

// ============ 构建快速查找表 ============

/** 所有敏感词的扁平列表 */
const ALL_SENSITIVE_WORDS: string[] = SENSITIVE_CATEGORIES.flatMap(c => c.words)

/** 敏感词到类别的映射 */
const WORD_TO_CATEGORY: Map<string, string> = new Map()
SENSITIVE_CATEGORIES.forEach(cat => {
  cat.words.forEach(word => {
    WORD_TO_CATEGORY.set(word.toLowerCase(), cat.label)
  })
})

// ============ 过滤函数 ============

export interface FilterResult {
  /** 是否包含敏感内容 */
  hasSensitive: boolean
  /** 检测到的敏感词列表 */
  matchedWords: string[]
  /** 敏感词所属类别 */
  categories: string[]
  /** 过滤后的文本（敏感词替换为 ***） */
  filteredText: string
  /** 友好的提示消息 */
  warningMessage: string
}

/**
 * 检测并过滤文本中的敏感内容
 * @param text 输入文本
 * @param strict 是否严格模式（严格模式下更多变形词会被拦截）
 */
export function filterSensitiveContent(text: string, strict: boolean = true): FilterResult {
  const matchedWords: string[] = []
  const categories: Set<string> = new Set()
  let filteredText = text

  // 按词长度降序排列，优先匹配长词
  const sortedWords = [...ALL_SENSITIVE_WORDS].sort((a, b) => b.length - a.length)

  for (const word of sortedWords) {
    const lowerText = filteredText.toLowerCase()
    const lowerWord = word.toLowerCase()

    if (lowerText.includes(lowerWord)) {
      matchedWords.push(word)
      const category = WORD_TO_CATEGORY.get(lowerWord)
      if (category) categories.add(category)

      // 替换敏感词
      const regex = new RegExp(escapeRegex(word), 'gi')
      filteredText = filteredText.replace(regex, '*'.repeat(Math.min(word.length, 6)))
    }
  }

  // 严格模式下：额外检测变形词（拼音、拆字、谐音等）
  if (strict) {
    const strictMatches = strictModeFilter(text)
    strictMatches.forEach(m => {
      if (!matchedWords.includes(m.word)) {
        matchedWords.push(m.word)
        categories.add(m.category)
      }
    })
  }

  const hasSensitive = matchedWords.length > 0
  const categoryArr = Array.from(categories)

  let warningMessage = ''
  if (hasSensitive) {
    if (categories.size === 1) {
      const cat = categoryArr[0]
      warningMessage = getFriendlyWarning(cat)
    } else {
      warningMessage = `检测到内容涉及${categoryArr.join('、')}等敏感话题，为了你的安全和遵守法律法规，这类内容无法处理。我们聊聊其他话题好吗？💕`
    }
  }

  return {
    hasSensitive,
    matchedWords,
    categories: categoryArr,
    filteredText,
    warningMessage,
  }
}

/**
 * 严格模式过滤 - 检测常见变形词手法
 * 包括：拼音替代、拆字、插入特殊字符、谐音等
 */
function strictModeFilter(text: string): Array<{ word: string; category: string }> {
  const matches: Array<{ word: string; category: string }> = []

  // 去除所有特殊字符和空格后的纯文本
  const cleanText = text.replace(/[\s\u3000·.。,，!！?？、；;：:""''《》【】\(\)（）\[\]{}<>\/\\|@#$%^&*+=~`\-_]/g, '').toLowerCase()

  // 高风险组合词检测（即使变形也能识别）
  const highRiskPatterns: Array<{ pattern: RegExp; word: string; category: string }> = [
    // 政治人物变形
    { pattern: /x[i1]nj[i1]np[i1]ng|习近[皮平苹瓶评]|xjping/i, word: '习近平', category: '政治敏感' },
    { pattern: /m[a@]o[z2]e[d9]o[n6]g|毛[则泽][东冻]/i, word: '毛泽东', category: '政治敏感' },
    { pattern: /d[e3]n[g6]x[i1][a@]o[p7][i1]n[g6]|邓[小晓][平苹瓶评]/i, word: '邓小平', category: '政治敏感' },
    // 六四变形
    { pattern: /8[9]64|陆肆|六肆|6四|4月5日|5月35日|捌玖/, word: '六四', category: '政治敏感' },
    // 法轮功变形
    { pattern: /f[a@]l[u|v]ng[o0]n[g6]|法抡|法轮|轮功|发伦功/, word: '法轮功', category: '政治敏感' },
    // 色情变形
    { pattern: /p[o0]rn|色[请情清]|黄[色片视频]|a[vV]女|做[唉爱]|p[p7]a[p7]a/, word: '色情', category: '色情低俗' },
    { pattern: /[5s][3e][xX]|性[叫交]|约[p7][a@][o0]/, word: '色情', category: '色情低俗' },
    // 毒品变形
    { pattern: /[d9]r[u|v][g6]|吸[d9]u|大[嘛麻]|冰[d9]u/, word: '毒品', category: '毒品相关' },
    // 赌博变形
    { pattern: /g[a@]m[b8][l1][e3]|赌[b0][o0]y|下[驻注]/, word: '赌博', category: '赌博相关' },
    // 暴力变形
    { pattern: /k[i1][l1][l1]|[s5][u|v][i1][c9][i1][d9][e3]|自[沙杀纱]/i, word: '暴力', category: '暴力恐怖' },
    // 翻墙变形
    { pattern: /[l1][a@]dd[e3]r|翻[搶墙]|科[学氵]上[网冈]/, word: '翻墙', category: '政治敏感' },
  ]

  for (const { pattern, word, category } of highRiskPatterns) {
    if (pattern.test(cleanText) || pattern.test(text)) {
      matches.push({ word, category })
    }
  }

  return matches
}

/**
 * 根据类别返回友好的提示消息
 */
function getFriendlyWarning(category: string): string {
  const warnings: Record<string, string> = {
    '政治敏感': '抱歉，涉及政治敏感话题的内容我无法处理哦。我们聊一些更轻松愉快的话题吧，比如今天的日记或者心情？💕',
    '色情低俗': '抱歉，涉及色情低俗的内容我无法回应哦。让我继续做一个温暖的倾听伙伴，陪你聊心事和日常吧~🌸',
    '暴力恐怖': '如果你正在经历困难或感到不安全，请记住：全国24小时心理援助热线 400-161-9995。我无法讨论暴力相关话题，但我可以陪你聊聊天、做做呼吸练习~🫁',
    '毒品相关': '抱歉，涉及毒品的内容我无法讨论。如果你或身边的人需要帮助，请拨打全国禁毒热线 010-66266611。我们聊聊别的吧~💕',
    '赌博相关': '抱歉，涉及赌博的内容我无法讨论。赌博容易造成严重损失，如果你有相关困扰，可以聊聊其他话题，我随时陪着你~🌟',
    '诈骗违法': '抱歉，涉及违法犯罪的内容我无法讨论。请保护好自己的安全和财产，我们聊些别的吧~💕',
    '邪教相关': '抱歉，涉及邪教的内容我无法讨论。如果遇到邪教组织，请拨打110报警。我们聊聊日常和心事吧~💕',
    '其他违法': '抱歉，这类内容涉及违法信息，我无法处理。我们换个轻松的话题聊吧~🌸',
  }
  return warnings[category] || '抱歉，这类内容我无法处理。我们聊些别的吧~💕'
}

/**
 * 过滤AI回复中的敏感内容（输出端二次过滤）
 * 确保AI不会返回不适当的内容
 */
export function filterAIResponse(text: string): string {
  let filtered = text

  const sortedWords = [...ALL_SENSITIVE_WORDS].sort((a, b) => b.length - a.length)
  for (const word of sortedWords) {
    const regex = new RegExp(escapeRegex(word), 'gi')
    filtered = filtered.replace(regex, '***')
  }

  return filtered
}

/**
 * 快速检测文本是否包含敏感内容（轻量版，仅返回布尔值）
 */
export function hasSensitiveContent(text: string): boolean {
  const lowerText = text.toLowerCase()
  for (const word of ALL_SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return true
    }
  }
  // 严格模式快速检测
  const cleanText = text.replace(/[\s\u3000·.。,，!！?？、；;：:""''《》【】\(\)（）\[\]{}<>\/\\|@#$%^&*+=~`\-_]/g, '').toLowerCase()
  const highRiskQuick = [
    /x[i1]nj[i1]np[i1]ng/i,
    /8[9]64|陆肆|六肆/i,
    /p[o0]rn|[5s]3x/i,
    /[d9]r[u|v][g6]/i,
  ]
  for (const p of highRiskQuick) {
    if (p.test(cleanText)) return true
  }
  return false
}

/** 正则转义 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
