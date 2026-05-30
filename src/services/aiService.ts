import type { ChatMessage, DrillType, DrillItemV2, ThinkingDimension, KnowledgeConcept, ThinkingSnapshot } from '../types';
import type { Material } from '../types';
import conceptsData from '../data/knowledge/concepts.json';
import {
  ROLE_PROMPT,
  PRE_WRITE_PROMPT,
  POST_WRITE_PROMPT,
  IN_WRITE_HELP_PROMPT,
  MATERIAL_DISCUSSION_PROMPT,
  THINKING_TOOLKIT,
  PRE_WRITE_SUMMARY_PROMPT,
  COACHING_PROMPT,
  SYNTHESIS_PROMPT,
  REVIEW_PROMPT,
} from '../prompts';

const concepts: KnowledgeConcept[] = conceptsData as KnowledgeConcept[];

function findRelevantConcepts(material: Material): KnowledgeConcept[] {
  const tags = material.tags.map(t => t.toLowerCase());
  const title = material.title.toLowerCase();
  const tension = material.coreTension.toLowerCase();
  const searchText = [...tags, title, tension].join(' ');

  return concepts.filter(c => {
    const matchers = [
      ...c.applicableTo.map(a => a.toLowerCase()),
      c.concept.toLowerCase(),
      c.hook.toLowerCase(),
    ];
    return matchers.some(m => searchText.includes(m));
  }).slice(0, 3);
}

const API_KEY = import.meta.env.VITE_API_KEY || '';
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://api.deepseek.com/v1';
const MODEL = import.meta.env.VITE_MODEL || 'deepseek-v4-flash';

interface ApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MOCK_RESPONSES: Record<string, string[]> = {
  preWrite: [
    '读完这道题，你的第一感觉是什么？先别急着下笔，我们聊聊。',
    '有意思。你觉得这道题的核心矛盾是什么？',
    '那换个角度想想——如果你不同意自己刚才说的，你会怎么反驳？',
    '这个思路不错。但还有更深一层的可能吗？',
    '你已经有很清晰的方向了，开始写吧。[READY]',
  ],
  postWrite: [
    '写完了！先不急着听我的看法——你自己觉得，哪段写得最有说服力？哪段最没把握？',
    '我注意到你的论证有一个地方可能有跳跃：你从某个现象直接跳到了结论。中间是不是少了一个推理步骤？',
    '你的立意抓住了题目的关键概念，这点很好。下次可以试试从另一个主体的视角看同一个问题——比如这道题里，除了"个体"的视角，还有"社会结构"的视角。',
    '总结一下：你的论证链条在大多数段落是清晰的，但需要更注意推理步骤的完整性。下次可以试着在写完每个论据后问自己：这个论据直接支持我的观点吗？中间有跳跃吗？\n[SCORES:originality=4,reasoning=3,perspective=4,structure=3,language=3]',
  ],
  inWrite: [
    '试着从这个角度再想想：如果是不同立场的人来看这个问题，他们会怎么说？',
    '你现在的思路方向是对的。但中间的论证链条能不能再密一点？试着补一句"这意味着……"',
    '我注意到这里有一个跳跃。你可以试着在论据和结论之间加一句解释——"这说明……"',
    '这个例子很好，但你需要把它和你的论点更紧地绑在一起：它具体证明了什么？试着加一句分析。',
  ],
  'deep-analysis': [
    '有意思。你提到了一个关键概念——我们先把这个词界定清楚：你说的"X"，核心属性是什么？它不包括什么？[DIM: concept-definition]',
    '很好，概念边界清楚了。现在想想：这道题有没有什么"不言自明"的假设？命题者默认了什么？[DIM: hidden-premise]',
    '你发现了一个有意思的矛盾。如果把这个矛盾推到更根本的层面——大家最容易想到的角度是什么？有没有更有穿透力的可能？[DIM: thesis-elevation]',
  ],
  argument: [
    '先把你的论证拆开看：你的主张是什么？理由是什么？从理由到主张，中间的推理步骤完整吗？[DIM: claim-clarity]',
    '这个论据选得不错。但从论据到结论之间，有没有跳跃？试着补一句"这意味着……"。[DIM: reasoning-chain]',
    '如果我给你一个反例：有没有一种情况，你的结论被推翻了？这说明了什么？[DIM: counterexample]',
  ],
  perspective: [
    '你从这个角度切入很自然。先说说：你最习惯用什么框架分析这类问题？[DIM: default-angle]',
    '现在试试换个视角——把"个体选择"放进"制度环境"的框架里看，会发生什么变化？[DIM: framework-switch]',
    '对比一下两个视角：它们各自看到了什么？又各自看不到什么？[DIM: meta-awareness]',
  ],
  'material-discussion': [
    '有意思。那你觉得这里最根本的冲突是什么？',
    '换个条件再想想——如果反过来呢？你的结论还成立吗？',
    '你这个判断背后有一个假设，你觉得那个假设一定是真的吗？',
    '这个话题的讨论就到这里。你可以带着刚才的思考去练习相关训练了。',
  ],
  'pre-write-summary': [
    '【核心矛盾】\n这道题在讨论的是：面对一个两难选择时，我们该如何权衡。\n\n【我的立意】\n我打算从"选择的背后是价值观的排序"这个角度写——不是选哪个对，而是看清楚自己更看重什么。\n\n【论证思路】\n1. 用一个生活中的选择场景引入\n2. 分析选择背后的价值排序机制\n3. 推进到"认清自己的价值排序本身就是一种成长"\n\n【值得警惕的】\n容易滑向"两个都重要"的和稀泥，要有明确立场。',
  ],
};

let mockIndex = 0;

function getMockResponse(messages: ApiMessage[]): string {
  const systemMsg = messages[0]?.content || '';
  const userMsgCount = messages.filter((m) => m.role === 'user').length;

  // Map coaching prompt tags to drill type mock keys
  const coachingDrillMap: Record<string, string> = {
    '深度审题': 'deep-analysis',
    '论证打磨': 'argument',
    '视角突破': 'perspective',
  };

  for (const key of Object.keys(MOCK_RESPONSES)) {
    if (systemMsg.includes(`[${key}]`)) {
      const pool = MOCK_RESPONSES[key];
      let idx: number;
      if (key === 'preWrite') {
        idx = Math.min(userMsgCount - 1, pool.length - 1);
      } else {
        idx = mockIndex % pool.length;
        mockIndex++;
      }
      return pool[idx];
    }
  }

  // Check if it's a coaching prompt by looking for drill type name
  for (const [name, poolKey] of Object.entries(coachingDrillMap)) {
    if (systemMsg.includes(name) && systemMsg.includes('[coaching]')) {
      const pool = MOCK_RESPONSES[poolKey];
      if (pool) {
        const idx = (userMsgCount - 1) % pool.length;
        return pool[idx];
      }
    }
  }

  const pool = MOCK_RESPONSES.preWrite;
  const idx = Math.min(userMsgCount - 1, pool.length - 1);
  return pool[idx];
}

async function callLLM(messages: ApiMessage[]): Promise<string> {
  if (!API_KEY) {
    return getMockResponse(messages);
  }

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API 调用失败: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function toApiMessages(messages: ChatMessage[]): ApiMessage[] {
  return messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));
}

function buildCoachingSystemPrompt(
  drillType: DrillType,
  topic: string,
  _drillData: DrillItemV2,
  currentDimension: ThinkingDimension,
  exploredDimensions: string[],
  turnCount: number
): string {
  const DRILL_TYPE_NAMES: Record<DrillType, string> = {
    'deep-analysis': '深度审题',
    'argument': '论证打磨',
    'perspective': '视角突破',
  };

  let prompt =
    ROLE_PROMPT +
    '\n\n' +
    THINKING_TOOLKIT +
    '\n\n' +
    COACHING_PROMPT +
    '\n\n当前训练的作文题目是：' + topic;

  prompt = prompt.replace('{drillTypeName}', DRILL_TYPE_NAMES[drillType]);
  prompt = prompt.replace('{dimensionName}', currentDimension.name);
  prompt = prompt.replace('{dimensionDescription}', currentDimension.description);
  prompt = prompt.replace('{dimensionId}', currentDimension.id);
  prompt = prompt.replace('{referenceAnalysis}', currentDimension.referenceAnalysis);
  prompt = prompt.replace(
    '{exploredDimensions}',
    exploredDimensions.length > 0 ? exploredDimensions.join('、') : '（尚未探索任何维度）'
  );
  prompt = prompt.replace('{turnCount}', String(turnCount));

  return prompt;
}

function buildReviewSystemPrompt(
  _drillType: DrillType,
  topic: string,
  drillData: DrillItemV2,
  _coachingHistory: ChatMessage[],
  synthesisOutput: string
): string {
  const referenceBlock = drillData.dimensions
    .map((d) => `## ${d.name}\n${d.referenceAnalysis}`)
    .join('\n\n');

  let prompt =
    ROLE_PROMPT +
    '\n\n' +
    THINKING_TOOLKIT +
    '\n\n' +
    REVIEW_PROMPT +
    '\n\n当前训练的作文题目是：' + topic +
    '\n\n学生的综合输出：\n' + synthesisOutput +
    '\n\n参考思路数据（用 [REF_START]...[REF_END] 格式展示）：\n' +
    '[REF_START]\n' + referenceBlock + '\n[REF_END]';

  return prompt;
}

export async function sendPreWriteMessage(
  topic: string,
  history: ChatMessage[],
  userMessage: string
): Promise<{ message: string; ready: boolean }> {
  const systemPrompt = ROLE_PROMPT + '\n\n' + THINKING_TOOLKIT + '\n\n' + PRE_WRITE_PROMPT + topic;
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...toApiMessages(history),
    { role: 'user', content: userMessage },
  ];
  const raw = await callLLM(apiMessages);
  const ready = raw.includes('[READY]');
  const message = raw.replace(/\s*\[READY\]\s*$/, '').trim();
  return { message, ready };
}

export async function sendPreWriteSummary(
  topic: string,
  history: ChatMessage[]
): Promise<string> {
  const systemPrompt = PRE_WRITE_SUMMARY_PROMPT + '\n\n题目：' + topic;
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...toApiMessages(history),
    { role: 'user', content: '请根据我们刚才的对话，生成一份思考地图。' },
  ];
  return callLLM(apiMessages);
}

export async function sendPostWriteMessage(
  topic: string,
  essayContent: string,
  history: ChatMessage[],
  userMessage: string,
  originalContent?: string | null
): Promise<string> {
  let systemPrompt =
    ROLE_PROMPT +
    '\n\n' +
    THINKING_TOOLKIT +
    '\n\n' +
    POST_WRITE_PROMPT +
    topic +
    '\n\n学生作文全文如下：\n' +
    essayContent;

  if (originalContent) {
    systemPrompt +=
      '\n\n=== 这是学生的修改稿。以下是第一稿原文，请对比两稿的差异，分析修改的进步和仍需改进之处 ===\n' +
      originalContent;
  }

  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...toApiMessages(history),
    { role: 'user', content: userMessage },
  ];
  return callLLM(apiMessages);
}

export async function sendInWriteHelp(
  topic: string,
  draftContent: string,
  question: string
): Promise<string> {
  const systemPrompt =
    ROLE_PROMPT +
    '\n\n' +
    THINKING_TOOLKIT +
    '\n\n' +
    IN_WRITE_HELP_PROMPT +
    topic +
    '\n\n学生当前的草稿内容：\n' +
    (draftContent || '(尚未开始写)') +
    '\n\n学生的问题：' +
    question;
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
  ];
  return callLLM(apiMessages);
}

export async function sendCoachingMessage(
  drillType: DrillType,
  topic: string,
  drillData: DrillItemV2,
  currentDimension: ThinkingDimension,
  exploredDimensions: string[],
  turnCount: number,
  history: ChatMessage[],
  userMessage: string
): Promise<{ message: string; currentDim: string; ready: boolean }> {
  const systemPrompt = buildCoachingSystemPrompt(
    drillType, topic, drillData, currentDimension, exploredDimensions, turnCount
  );
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...toApiMessages(history),
    { role: 'user', content: userMessage },
  ];
  const raw = await callLLM(apiMessages);

  // Parse markers
  const synthMatch = raw.match(/\[SYNTHESIS\]\s*$/);
  const dimMatch = raw.match(/\[DIM:\s*(\S+)\]\s*$/);
  const ready = !!synthMatch;
  const currentDim = dimMatch ? dimMatch[1] : currentDimension.id;

  // Strip markers from displayed message
  const message = raw
    .replace(/\s*\[SYNTHESIS\]\s*$/, '')
    .replace(/\s*\[DIM:\s*\S+\]\s*$/, '')
    .trim();

  return { message, currentDim, ready };
}

export async function sendSynthesisPrompt(
  drillType: DrillType,
  topic: string,
  _drillData: DrillItemV2,
  coachingHistory: ChatMessage[]
): Promise<string> {
  const DRILL_TYPE_NAMES: Record<DrillType, string> = {
    'deep-analysis': '深度审题',
    'argument': '论证打磨',
    'perspective': '视角突破',
  };

  const systemPrompt =
    ROLE_PROMPT + '\n\n' +
    THINKING_TOOLKIT + '\n\n' +
    SYNTHESIS_PROMPT +
    '\n\n训练类型：' + DRILL_TYPE_NAMES[drillType] +
    '\n训练题目：' + topic;

  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...toApiMessages(coachingHistory),
    { role: 'user', content: '请引导我进行综合输出。' },
  ];
  return callLLM(apiMessages);
}

export async function sendReviewEvaluation(
  drillType: DrillType,
  topic: string,
  drillData: DrillItemV2,
  coachingHistory: ChatMessage[],
  synthesisOutput: string
): Promise<{ evaluation: string; referenceText: string }> {
  const systemPrompt = buildReviewSystemPrompt(
    drillType, topic, drillData, coachingHistory, synthesisOutput
  );
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...toApiMessages(coachingHistory),
    { role: 'user', content: '请评估我的综合输出并展示参考思路。' },
  ];
  const raw = await callLLM(apiMessages);

  // Parse reference block
  const refMatch = raw.match(/\[REF_START\]\s*([\s\S]*?)\s*\[REF_END\]/);
  const referenceText = refMatch ? refMatch[1].trim() : '';
  const evaluation = raw
    .replace(/\s*\[REF_START\][\s\S]*?\[REF_END\]\s*/, '')
    .trim();

  return { evaluation, referenceText };
}

export async function sendMaterialDiscussion(
  material: Material,
  userMessage: string
): Promise<string> {
  const relevant = findRelevantConcepts(material);
  const knowledgeContext = relevant.length > 0
    ? '\n\n# 相关哲学概念（仅供你引导讨论时参考，不要直接告诉学生）\n' +
      relevant.map(c =>
        `【${c.concept}】${c.hook}\n分析句式：${c.analysisTpl}\n日常事例：${c.examples.find(e => e.type === 'daily')?.text || ''}\n论据事例：${c.examples.find(e => e.type === 'essay')?.text || ''}`
      ).join('\n\n')
    : '';

  const systemPrompt =
    ROLE_PROMPT +
    '\n\n' +
    THINKING_TOOLKIT +
    '\n\n' +
    MATERIAL_DISCUSSION_PROMPT +
    material.title +
    '\n素材情境：' +
    material.situation +
    '\n核心张力：' +
    material.coreTension +
    '\n相关概念线索：' +
    material.tags.join('、') +
    knowledgeContext;
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];
  return callLLM(apiMessages);
}

export async function sendDebateMessage(prompt: string): Promise<string> {
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: '你是一个善于辩论的AI。请用中文回应。' },
    { role: 'user', content: prompt },
  ];
  return callLLM(apiMessages);
}

export function parseScores(raw: string): ThinkingSnapshot | null {
  const match = raw.match(/\[SCORES:originality=(\d),reasoning=(\d),perspective=(\d),structure=(\d),language=(\d)\]/);
  if (!match) return null;
  return {
    originality: Math.min(5, Math.max(1, parseInt(match[1]))),
    reasoning: Math.min(5, Math.max(1, parseInt(match[2]))),
    perspective: Math.min(5, Math.max(1, parseInt(match[3]))),
    structure: Math.min(5, Math.max(1, parseInt(match[4]))),
    language: Math.min(5, Math.max(1, parseInt(match[5]))),
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
