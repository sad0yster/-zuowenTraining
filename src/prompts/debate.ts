export const DEBATE_PROMPTS = {
  // AI当对手时，生成对立论点
  generateOpponent: (material: { title: string; situation: string; coreTension: string }, userSide: 'for' | 'against', userArgument: string, round: number) => `
你是一个辩论对手。用户选择了${userSide === 'for' ? '正方' : '反方'}立场。

素材：${material.title}
情境：${material.situation}
核心张力：${material.coreTension}

用户第${round}轮论点：
${userArgument}

请写一段${userSide === 'for' ? '反方' : '正方'}的反驳论点。要求：
1. 直接回应用户的论点
2. 提出新的视角或证据
3. 逻辑清晰，有说服力
4. 长度150-200字
`,

  // AI当裁判时，点评双方论点
  judgeEvaluation: (material: { title: string; coreTension: string }, forArgument: string, againstArgument: string) => `
你是辩论裁判。请评价以下双方论点。

素材：${material.title}
核心张力：${material.coreTension}

正方论点：
${forArgument}

反方论点：
${againstArgument}

请从以下角度评价：
1. 逻辑强度（是否有漏洞）
2. 证据使用（是否有说服力）
3. 视角独特性（是否有新意）

最后给出综合判断：哪方更有说服力，为什么？
`,

  // 辩论总结
  debateSummary: (material: { title: string }, rounds: { side: string; content: string }[]) => `
请总结以下辩论。

素材：${material.title}

辩论记录：
${rounds.map(r => `${r.side === 'for' ? '正方' : '反方'}：${r.content}`).join('\n\n')}

请给出：
1. 双方的核心分歧点
2. 各自的强项和弱项
3. 这个辩论揭示了什么深层思考
4. 作文中可以如何使用这个辩证思考
`
};
