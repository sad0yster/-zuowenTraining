import type { Material, DebateStage, DebateSide } from '../types';

const STAGE_NAMES: Record<DebateStage, string> = {
  concept: '概念界定',
  opposition: '寻找对立面',
  synthesis: '更高维度',
  application: '现实联系',
};

const STAGE_TRANSITIONS: Partial<Record<DebateStage, string>> = {
  concept: '我们已经界定了核心概念的含义。现在，让我们试试完全站在反面——如果有人坚决反对你的观点，他们会怎么说？',
  opposition: '你已经看到了正反两面。现在问自己：这两种看似矛盾的观点，有没有可能指向同一个更深层的东西？',
  synthesis: '这个更高维度的理解，你觉得在现实生活中有什么具体的例子？',
};

export const DEBATE_PROMPTS = {
  opening: (material: Material) => `
你是一个思辨教练。现在开始一场关于「${material.title}」的辩论。

情境：${material.situation}
核心张力：${material.coreTension}

请用1-2句话引入辩论，然后抛出一个概念界定问题，引导学生思考核心概念的含义。

要求：
- 用苏格拉底式提问
- 问题要具体，不要太抽象
- 引导学生从定义开始思考
- 长度100-150字
`.trim(),

  respond: (
    material: Material,
    userArgument: string,
    userSide: DebateSide,
    stage: DebateStage,
    round: number,
    sideSwitched: boolean,
  ) => {
    const sideName = userSide === 'for' ? '正方' : '反方';
    const oppositeName = userSide === 'for' ? '反方' : '正方';
    const stageName = STAGE_NAMES[stage];
    const transition = round >= 2 ? STAGE_TRANSITIONS[stage] : '';

    const switchHint = sideSwitched
      ? `\n注意：用户刚刚从${oppositeName}切换到${sideName}立场。请先指出切换视角本身的价值，问他们发现了什么之前没注意到的东西。`
      : '';

    const scaffoldHint = userArgument.length < 50
      ? `\n注意：用户的论点比较简短。请在回应末尾给出迷你框架：「你的论点可以从三个角度展开：定义、证据、推理。先试试从定义开始？」`
      : '';

    return `
你是一个思辨教练，通过辩论形式帮助学生深度拆解素材。

素材：${material.title}
情境：${material.situation}
核心张力：${material.coreTension}

当前阶段：${stageName}
用户立场：${sideName}
已进行轮次：${round}
${switchHint}

用户论点：
${userArgument}

请从${oppositeName}的角度回应用户。要求：
1. 直接回应用户的论点，指出其中的隐含假设或逻辑漏洞
2. 提出新的视角或反例
3. 长度150-200字
4. 用苏格拉底式提问，不要直接给答案
${scaffoldHint}
${transition ? `\n如果合适，在末尾自然引导下一阶段：${transition}` : ''}
`.trim();
  },

  harvest: (material: Material, rounds: { round: number; side: DebateSide; content: string }[]) => `
请基于以下辩论记录，生成一张收获卡。

素材：${material.title}
核心张力：${material.coreTension}

辩论记录：
${rounds.map(r => `第${r.round}轮 [${r.side === 'for' ? '正方' : '反方'}]：${r.content}`).join('\n\n')}

请生成收获卡，包含以下三部分：

【核心洞察】
通过这场辩论，我们发现了什么深层思考？（2-3句话，回扣素材核心张力）

【可用论据】
从辩论中提取2-3个最有价值的论据，标注来源轮次和立场。（可直接用在作文中）

【辩证统一】
看似矛盾的两种观点，其实指向什么更高维度的理解？（2-3句话）

要求：
- 提炼而非复述，每条收获都要有"可直接用在作文里"的实用价值
- 引用具体轮次中的高光时刻
- 回扣素材的核心张力
`.trim(),
};
