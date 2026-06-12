/**
 * 训练题生成 Prompt
 *
 * 用法：将任意作文题 + 材料来源传入，生成五个训练方向的结构化练习数据。
 * 输出格式为 JSON，可直接写入对应的 drill 数据文件。
 *
 * 示例调用：
 *   generateDrillData("有人说，竞争让人进步；也有人说，合作让人类走得更远。", "经典命题")
 */

export const DRILL_GENERATOR_PROMPT = `你是一名高考作文训练题设计师。给你一道作文题，你需要为五个训练方向各生成一道结构化练习题。

## 输入格式
- topic: 作文题原文
- source: 来源（真题年份/模考名/原创）

## 输出格式（严格 JSON，不要多余文字）

\`\`\`json
{
  "examining": {
    "id": "ex_序号",
    "topic": "题目原文",
    "source": "来源",
    "hiddenPremises": ["隐含前提1", "隐含前提2", "隐含前提3"],
    "coreConcepts": ["核心概念1", "核心概念2", "核心概念3"],
    "angleHints": ["可探索角度1", "可探索角度2", "可探索角度3"]
  },
  "thesis": {
    "id": "th_序号",
    "topic": "题目原文",
    "source": "来源",
    "mediocreThesis": "平庸立意（大多数人第一反应）",
    "betterThesis": "较好立意（有辩证思考但不够深）",
    "advancedThesis": "高级立意（引入更高维度框架或质疑题目前提）",
    "whyAdvanced": "高级立意为什么更好（一句话解释）"
  },
  "titling": {
    "id": "ti_序号",
    "thesis": "一条明确的立意（可从 thesis.advancedThesis 取）",
    "topic": "题目原文",
    "notifyTitle": "告知型标题（告诉读者我要写什么）",
    "assertiveTitle": "表态型标题（亮出核心观点）",
    "tensionTitle": "张力型标题（制造认知冲突）",
    "whyTension": "张力型标题为什么更有力（一句话解释）"
  },
  "reasoning": {
    "id": "re_序号",
    "topic": "题目原文",
    "source": "来源",
    "claim": "一个待检验的论点",
    "draftArgument": "一段有具体漏洞的论证草稿（100-150字）",
    "weakPoints": ["薄弱环节1", "薄弱环节2", "薄弱环节3"],
    "repairSuggestion": "修复方向（具体指出怎么补全推理链）"
  },
  "perspective": {
    "id": "pe_序号",
    "topic": "题目原文",
    "source": "来源",
    "defaultAngle": "大多数人会用的视角",
    "alternateAngles": ["可切换视角1", "可切换视角2", "可切换视角3"],
    "angleInsight": ["视角1带来的洞察", "视角2带来的洞察", "视角3带来的洞察"]
  }
}
\`\`\`

## 生成原则

### examining（审题拆解）
- hiddenPremises：题目中"不言自明"但其实可以质疑的假设。比如"得与失是对立的"、"竞争总是好的"
- coreConcepts：题目中的关键词，需要被界定和拆解的
- angleHints：大多数人想不到的立意方向，至少有一个是质疑题目前提的

### thesis（立意突破）
- mediocreThesis：大多数人第一时间会想到的，停留在表面的判断
- betterThesis：有辩证思考，加了条件或看到了两面，但还在题目给定的框架内
- advancedThesis：跳出了题目的框架——要么引入了更高维度的概念，要么质疑了题目的前提，要么把问题重新定义了
- whyAdvanced：用一句话说清楚"为什么这个立意比前两个更有穿透力"

### titling（命题训练）
- notifyTitle：读者看完标题知道你要写什么，但没有阅读欲望
- assertiveTitle：读者看完标题知道你的立场，可能会想"哦？说说看"
- tensionTitle：读者看完标题产生认知冲突或好奇心，一定要往下看
- whyTension：说清楚张力来自哪里——是反转了常识？是制造了悬念？是挑衅了共识？

### reasoning（论证链）
- claim：一个听起来合理但需要被检验的论点
- draftArgument：一段"看起来像论证但实际上有漏洞"的文字。漏洞类型要多样：以例代证、循环论证、偷换概念、因果跳跃、以偏概全等
- weakPoints：每个漏洞具体指出"从X到Y缺了什么推理步骤"
- repairSuggestion：不是"要更深刻"这种废话，而是具体说"在X和Y之间补一句Z"

### perspective（视角切换）
- defaultAngle：大多数学生会用的视角（通常是个人视角或道德视角）
- alternateAngles：至少有一个是结构性视角（制度/经济/历史），一个是反直觉视角
- angleInsight：每个视角带来的不只是"不同的看法"，而是"从这个视角看，你会看到从默认视角完全看不到的东西"

## 重要约束
- 所有内容必须用中文
- 不要出现学术术语（不用说"这是现象学视角"，直接用日常语言描述）
- advancedThesis 必须真的比 mediocreThesis 更深，不能只是换了个说法
- draftArgument 必须有真实的逻辑漏洞，不能是"故意写烂"的明显错误
- tensionTitle 必须真的有张力，不能只是加了感叹号或疑问号`;
