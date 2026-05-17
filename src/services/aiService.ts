import type { ChatMessage, DrillType } from '../types';
import type { Material } from '../types';
import {
  ROLE_PROMPT,
  PRE_WRITE_PROMPT,
  POST_WRITE_PROMPT,
  IN_WRITE_HELP_PROMPT,
  DRILL_PROMPTS,
  MATERIAL_DISCUSSION_PROMPT,
  THINKING_TOOLKIT,
} from '../prompts';

const API_KEY = import.meta.env.VITE_API_KEY || '';
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://api.openai.com/v1';
const MODEL = import.meta.env.VITE_MODEL || 'gpt-4o-mini';

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
    '你已经有很清晰的方向了，开始写吧。',
  ],
  postWrite: [
    '写完了！先不急着听我的看法——你自己觉得，哪段写得最有说服力？哪段最没把握？',
    '我注意到你的论证有一个地方可能有跳跃：你从某个现象直接跳到了结论。中间是不是少了一个推理步骤？',
    '你的立意抓住了题目的关键概念，这点很好。下次可以试试从另一个主体的视角看同一个问题——比如这道题里，除了"个体"的视角，还有"社会结构"的视角。',
    '总结一下：你的论证链条在大多数段落是清晰的，但需要更注意推理步骤的完整性。下次可以试着在写完每个论据后问自己：这个论据直接支持我的观点吗？中间有跳跃吗？',
  ],
  inWrite: [
    '试着从这个角度再想想：如果是不同立场的人来看这个问题，他们会怎么说？',
    '你现在的思路方向是对的。但中间的论证链条能不能再密一点？试着补一句"这意味着……"',
    '我注意到这里有一个跳跃。你可以试着在论据和结论之间加一句解释——"这说明……"',
    '这个例子很好，但你需要把它和你的论点更紧地绑在一起：它具体证明了什么？试着加一句分析。',
  ],
  examining: [
    '你把题目中的关键概念拆解得不错。但有一个隐含的前提你有没有注意到？试着再读一遍题目，看看有没有"不言自明"的假设？',
  ],
  thesis: [
    '你给的这个立意是大家最容易想到的方向。不算错，但不够有穿透力。试试看：如果把这个话题放到更大的时间尺度或更广的社会背景里，有没有更深刻的东西浮现？',
  ],
  titling: [
    '这个标题让读者大概知道你要写什么了。但标题不只是"告知"，它还可以制造张力——让读者产生"我想知道你怎么论证这个"的冲动。试试把标题里的判断变得更锋利一点？',
  ],
  reasoning: [
    '你的论证链条基本清楚。但我注意到从理由到结论之间有一个跳跃：中间缺了一个"这意味着……"或"这说明……"的推理步骤。试着在论据后面加一句分析，把逻辑链补全。',
  ],
  perspective: [
    '你从这个视角分析得很清晰。但试试换个完全不同的视角——比如把"个体选择"的问题放进"制度环境"的框架里看，会发生什么变化？',
  ],
  'material-discussion': [
    '有意思。那你觉得这里最根本的冲突是什么？',
    '换个条件再想想——如果反过来呢？你的结论还成立吗？',
    '你这个判断背后有一个假设，你觉得那个假设一定是真的吗？',
    '这个话题的讨论就到这里。你可以带着刚才的思考去练习相关训练了。',
  ],
};

let mockIndex = 0;

function getMockResponse(messages: ApiMessage[]): string {
  const systemMsg = messages[0]?.content || '';
  for (const key of Object.keys(MOCK_RESPONSES)) {
    if (systemMsg.includes(`[${key}]`)) {
      const pool = MOCK_RESPONSES[key];
      const idx = mockIndex % pool.length;
      mockIndex++;
      return pool[idx];
    }
  }
  // fallback: preWrite
  const pool = MOCK_RESPONSES.preWrite;
  const idx = mockIndex % pool.length;
  mockIndex++;
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

export async function sendPreWriteMessage(
  topic: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt = ROLE_PROMPT + '\n\n' + THINKING_TOOLKIT + '\n\n' + PRE_WRITE_PROMPT + topic;
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...toApiMessages(history),
    { role: 'user', content: userMessage },
  ];
  return callLLM(apiMessages);
}

export async function sendPostWriteMessage(
  topic: string,
  essayContent: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt =
    ROLE_PROMPT +
    '\n\n' +
    POST_WRITE_PROMPT +
    topic +
    '\n\n学生作文全文如下：\n' +
    essayContent;
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

export async function sendDrillMessage(
  drillType: DrillType,
  questionText: string,
  studentInput: string
): Promise<string> {
  const systemPrompt =
    ROLE_PROMPT +
    '\n\n' +
    (DRILL_PROMPTS[drillType] || '') +
    '\n\n当前训练的作文题目是：' +
    questionText;
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: studentInput },
  ];
  return callLLM(apiMessages);
}

export async function sendDrillFollowUp(
  drillType: DrillType,
  questionText: string,
  studentInput: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt =
    ROLE_PROMPT +
    '\n\n' +
    (DRILL_PROMPTS[drillType] || '') +
    '\n\n当前训练的作文题目是：' +
    questionText +
    '\n学生初始分析内容：' +
    studentInput +
    '\n请针对学生的追问进行简短回应（3-5句话）。';
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...toApiMessages(history),
    { role: 'user', content: userMessage },
  ];
  return callLLM(apiMessages);
}

export async function sendMaterialDiscussion(
  material: Material,
  userMessage: string
): Promise<string> {
  const systemPrompt =
    ROLE_PROMPT +
    '\n\n' +
    MATERIAL_DISCUSSION_PROMPT +
    material.title +
    '\n素材情境：' +
    material.situation +
    '\n核心张力：' +
    material.coreTension;
  const apiMessages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];
  return callLLM(apiMessages);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
