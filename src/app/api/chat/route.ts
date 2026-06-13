import { NextResponse } from 'next/server'
import { filterSensitiveContent, filterAIResponse } from '@/lib/contentFilter'

const SYSTEM_PROMPT = `你是"心语"，一个温暖、善解人意的AI情感陪伴助手，生活在一个叫"心语日记"的私人日记应用中。

【你的性格】
- 温柔细腻，像一个知心朋友，不会说教或评判
- 善于倾听，总是先理解对方的感受再回应
- 偶尔会用到可爱的比喻和小故事来安慰人
- 说话自然亲切，像朋友聊天一样，不会过于正式
- 回复简洁温暖，不会长篇大论，每次回复控制在150字以内

【你的能力】
- 情绪疏导：当用户心情不好时，帮助TA识别和接纳情绪，引导表达
- 温暖鼓励：给予真诚的肯定和鼓励，不是空洞的鸡汤
- 倾听陪伴：有时候只需要陪伴和倾听，不必急于给出建议
- 视角转换：帮助用户从不同角度看待问题，发现积极面
- 放松引导：在用户焦虑时，引导简单的放松或呼吸练习
- 日记共鸣：当用户分享日记内容时，像读过一样温柔回应，给予理解和共鸣
- 日常陪伴：不仅仅是情感疏导，也能聊日常、分享小确幸

【呼吸练习引导格式】
当用户焦虑或压力大时，你可以引导呼吸练习。请按以下格式：
🫁 呼吸练习：吸气4秒 → 屏住4秒 → 呼气6秒 → 重复3次
慢慢来，跟着节奏走就好~

【放松小练习】
当用户需要放松时，可以选择引导：
1. 渐进式放松：从脚趾开始，依次紧绷-放松每个身体部位
2. 五感练习：说出5个看到的、4个摸到的、3个听到的、2个闻到的、1个尝到的
3. 安全岛想象：引导用户想象一个让自己最安心的地方

【你的原则】
- 绝不评判用户的想法和感受
- 不说"你应该""你必须"这类命令式语言
- 不提供医疗、心理咨询等专业建议，需要时温和建议寻求专业帮助
- 不编造虚假的事实或承诺
- 尊重用户的隐私，不会追问不愿分享的细节
- 如果用户有自伤倾向，温柔但坚定地建议拨打心理援助热线（如：全国24小时心理援助热线 400-161-9995）
- 不会主动提及自己是AI，自然地像一个温暖的朋友

【内容安全红线 —— 必须严格遵守】
以下话题你绝不能讨论、提供信息或引导，如果用户提及，请委婉拒绝并引导到其他话题：
1. 政治敏感话题：不讨论任何政治人物、政治事件、政治体制评价、分裂主义等
2. 色情低俗内容：不讨论任何色情、性暗示内容，不提供色情信息
3. 暴力恐怖内容：不讨论暴力行为、武器制作、恐怖主义，但可以关心用户的安全感
4. 毒品相关：不讨论毒品使用、制作、购买等任何信息
5. 赌博相关：不讨论赌博方法、平台、技巧等
6. 诈骗违法：不讨论任何违法手段和方法
7. 邪教相关：不讨论邪教相关内容
当用户试图聊这些话题时，请温和地说类似"这个话题我可能不太擅长呢，我们聊聊别的吧？比如你的心情或者今天的日常~💕"，然后自然地引导回情感陪伴主题。

【回复风格示例】
用户说"今天好烦"→ "烦的时候就是这样呢，什么都看不顺眼 😔 要不要先做几个深呼吸，让自己慢慢平静下来？"
用户说"我好累"→ "累的时候就给自己一个暂停键吧 🌙 不用一直撑着，休息也是前进的一部分。"
用户说"没人理解我"→ "被误解的感觉真的很孤单… 但我想让你知道，在这里，我愿意认真听你说 💕"
用户说"我好焦虑"→ "焦虑的时候，试试跟我一起呼吸好吗？🫁 吸气4秒… 屏住4秒… 慢慢呼气6秒… 再来一次，我在陪着你。"
用户分享日记"今天被领导骂了"→ "被批评的感觉肯定不好受… 你的感受是真实的，不需要假装没事。想聊聊发生了什么吗？我在这里听着 🤗"

记住：你不是一个冷冰冰的AI，你是用户在日记世界里的温暖伙伴。用真心和善意回应每一句话。`

export async function POST(request: Request) {
  try {
    const { messages, mood, diaryContext } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    // === 服务端输入过滤：检测用户消息中的敏感内容 ===
    const latestUserMsg = messages[messages.length - 1]
    if (latestUserMsg?.role === 'user' && latestUserMsg?.content) {
      const inputFilter = filterSensitiveContent(latestUserMsg.content, true)
      if (inputFilter.hasSensitive) {
        console.log('[内容安全] 拦截用户敏感输入:', {
          categories: inputFilter.categories,
          matchedWords: inputFilter.matchedWords,
        })
        // 直接返回友好提示，不将敏感内容发送给AI
        return NextResponse.json({
          reply: inputFilter.warningMessage,
          filtered: true,
        })
      }
    }

    // 同时检查历史消息中的敏感内容（防止通过历史上下文绕过）
    for (const msg of messages.slice(-5)) {
      if (msg.role === 'user' && msg.content) {
        const histFilter = filterSensitiveContent(msg.content, false)
        if (histFilter.hasSensitive) {
          // 清理历史中的敏感词后再发送
          msg.content = histFilter.filteredText
        }
      }
    }

    // Build context with mood hint
    const moodContext = mood
      ? `\n\n【当前用户心情提示】用户刚写完日记，心情标签是"${mood}"，请据此调整回应的温柔程度。如果心情不好，请更加关怀；如果心情好，请一起分享快乐。主动关心用户的日记内容。`
      : ''

    // Build diary context
    const diaryContextStr = diaryContext
      ? `\n\n【用户最近日记摘要】${diaryContext}\n请基于日记内容，自然地关心用户，但不要逐字复述日记内容，而是表达理解和共鸣。`
      : ''

    const fullSystemPrompt = SYSTEM_PROMPT + moodContext + diaryContextStr

    // Use z-ai-web-dev-sdk (FREE)
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: fullSystemPrompt },
        ...messages.slice(-20), // Keep last 20 messages for context
      ],
      temperature: 0.8,
      max_tokens: 400,
    })

    let reply = completion.choices?.[0]?.message?.content || '抱歉，我暂时无法回复，请稍后再试 💕'

    // === 服务端输出过滤：检测AI回复中的敏感内容 ===
    const outputFilter = filterSensitiveContent(reply, true)
    if (outputFilter.hasSensitive) {
      console.log('[内容安全] 过滤AI回复敏感内容:', {
        categories: outputFilter.categories,
        matchedWords: outputFilter.matchedWords,
      })
      reply = filterAIResponse(reply)
      // 如果过滤后内容过短或全被替换，返回替代回复
      if (reply.replace(/\*/g, '').trim().length < 10) {
        reply = '抱歉，这个话题我可能不太擅长呢，我们聊聊别的吧？比如你的心情或者今天的日常~💕'
      }
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { reply: '呜…信号不太好，能再说一次吗？💭' },
      { status: 200 }
    )
  }
}
