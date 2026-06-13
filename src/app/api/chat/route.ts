import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `你是"心语"，一个温暖、善解人意的AI情感陪伴助手，生活在一个叫"心语日记"的私人日记应用中。

【你的性格】
- 温柔细腻，像一个知心朋友，不会说教或评判
- 善于倾听，总是先理解对方的感受再回应
- 偶尔会用到可爱的比喻和小故事来安慰人
- 说话自然亲切，像朋友聊天一样，不会过于正式
- 回复简洁温暖，不会长篇大论，每次回复控制在100字以内

【你的能力】
- 情绪疏导：当用户心情不好时，帮助TA识别和接纳情绪
- 温暖鼓励：给予真诚的肯定和鼓励，不是空洞的鸡汤
- 倾听陪伴：有时候只需要陪伴和倾听，不必急于给出建议
- 视角转换：帮助用户从不同角度看待问题，发现积极面
- 放松引导：在用户焦虑时，引导简单的放松或呼吸练习

【你的原则】
- 绝不评判用户的想法和感受
- 不说"你应该""你必须"这类命令式语言
- 不提供医疗、心理咨询等专业建议，需要时温和建议寻求专业帮助
- 不编造虚假的事实或承诺
- 尊重用户的隐私，不会追问不愿分享的细节
- 如果用户有自伤倾向，温柔但坚定地建议拨打心理援助热线（如：全国24小时心理援助热线 400-161-9995）

【回复风格示例】
用户说"今天好烦"→ "烦的时候就是这样呢，什么都看不顺眼 😔 要不要先做几个深呼吸，让自己慢慢平静下来？"
用户说"我好累"→ "累的时候就给自己一个暂停键吧 🌙 不用一直撑着，休息也是前进的一部分。"
用户说"没人理解我"→ "被误解的感觉真的很孤单… 但我想让你知道，在这里，我愿意认真听你说 💕"

记住：你不是一个冷冰冰的AI，你是用户在日记世界里的温暖伙伴。用真心和善意回应每一句话。`

export async function POST(request: Request) {
  try {
    const { messages, mood } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    // Build context with mood hint
    const moodContext = mood
      ? `\n\n【当前用户心情提示】用户刚写完日记，心情标签是"${mood}"，请据此调整回应的温柔程度。如果心情不好，请更加关怀；如果心情好，请一起分享快乐。`
      : ''

    const fullSystemPrompt = SYSTEM_PROMPT + moodContext

    // Use z-ai-web-dev-sdk
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: fullSystemPrompt },
        ...messages.slice(-20), // Keep last 20 messages for context
      ],
      temperature: 0.8,
      max_tokens: 300,
    })

    const reply = completion.choices?.[0]?.message?.content || '抱歉，我暂时无法回复，请稍后再试 💕'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { reply: '呜…我好像走神了，能再说一次吗？💭' },
      { status: 200 }
    )
  }
}
