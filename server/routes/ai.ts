import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { callAIProvider, getProviderKey, getProviderUrlKey } from '../services/ai.js';
import { getCachedOrchestratorConfig } from '../db/queries.js';
import { generateContextualFollowUpsFallback } from '../utils/helpers.js';

const router = express.Router();

router.post('/generate-followups', authenticateToken, async (req, res) => {
  const { lastMessage, userQuery } = req.body;
  if (!lastMessage) return res.status(400).json({ error: 'Last message is required' });

  try {
    const orchestrator = await getCachedOrchestratorConfig('chat_fast');
    const provider = orchestrator?.primary_provider;
    const model = orchestrator?.primary_model;

    if (!provider || !model) {
      return res.json(generateContextualFollowUpsFallback(userQuery || '', lastMessage, 'ar', 'chat_fast'));
    }

    let apiKey: string | null = await getProviderKey(provider);
    let urlKey: string | null = await getProviderUrlKey(provider);

    if (!apiKey) {
      return res.json(generateContextualFollowUpsFallback(userQuery || '', lastMessage, 'ar', 'chat_fast'));
    }

    const prompt = `Based on the user query and the assistant response, generate 3 context-aware, highly actionable follow-up question suggestions that the user would naturally ask next to dive deeper into the exact topic.
    Return the result strictly as a JSON list of strings: ["Suggestion 1", "Suggestion 2", "Suggestion 3"].
    
    User Query: ${userQuery || ''}
    Assistant Response: ${lastMessage}`;
    
    const messages = [{ role: 'user', content: prompt }];

    try {
      let text = await callAIProvider(provider, model, apiKey, prompt, '', undefined, messages, {}, urlKey || undefined);
      
      // Cleanup common markdown JSON blocks
      if (text.startsWith('```json')) text = text.replace(/```json\n?/, '');
      if (text.startsWith('```')) text = text.replace(/```\n?/, '');
      if (text.endsWith('```')) text = text.replace(/\n?```/, '');

      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json(parsed);
      }
    } catch (err: any) {
      // Ignore provider specific errors and fallback
    }

    // Fallback to local contextual generator
    return res.json(generateContextualFollowUpsFallback(userQuery || '', lastMessage, 'ar', 'chat_fast'));
  } catch (err: any) {
    console.warn('AI follow-up suggestion error handled gracefully:', err?.message || err);
    return res.json(generateContextualFollowUpsFallback(userQuery || '', lastMessage, 'ar', 'chat_fast'));
  }
});

router.post('/suggest-meta', authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const orchestrator = await getCachedOrchestratorConfig('perplexta_analysis');
    const provider = orchestrator?.primary_provider;
    const model = orchestrator?.primary_model;

    if (!model || !provider) {
      return res.status(503).json({ error: 'Orchestrator not configured' });
    }

    let apiKey: string | null = await getProviderKey(provider);
    let urlKey: string | null = await getProviderUrlKey(provider);

    if (!apiKey) {
      return res.status(503).json({ error: 'AI key not found in vault for provider: ' + provider });
    }

    const prompt = `Based on the following body content, suggest a high-performing meta-title (max 60 chars) and meta-description (max 160 chars). Return the result strictly in JSON format: {"metaTitle": "...", "metaDescription": "..."}. \n\nContent: ${content}`;
    const messages = [{ role: 'user', content: prompt }];

    let text = await callAIProvider(provider, model, apiKey, prompt, '', undefined, messages, {}, urlKey || undefined);
    
    // Cleanup JSON markdown
    if (text.startsWith('```json')) text = text.replace(/```json\n?/, '');
    if (text.startsWith('```')) text = text.replace(/```\n?/, '');
    if (text.endsWith('```')) text = text.replace(/\n?```/, '');

    res.json(JSON.parse(text));
  } catch (err: any) {
    console.error('AI suggest meta error:', err);
    res.status(500).json({ error: 'AI suggestion failed' });
  }
});

router.post('/live-assistant', async (req, res) => {
  const { query, language = 'ar', history = [] } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  const q = query.trim();
  const lower = q.toLowerCase();
  const isAr = language === 'ar';

  // 1. Detect Support Ticket Requests
  const supportKeywords = [
    'مشكلة', 'دعم', 'استفسار', 'طلب', 'إصلاح', 'تذكرة', 'تذكره', 'عطل', 'لا يعمل',
    'bug', 'error', 'issue', 'ticket', 'fix', 'broken', 'not working', 'support'
  ];
  const isBugOrSupportRequest = supportKeywords.some(kw => lower.includes(kw));

  if (isBugOrSupportRequest) {
    return res.json({
      reply: isAr
        ? 'لتقديم أي طلب دعم تقني أو استفسار فني، يرجى تعبئة نموذج "اتصل بنا" ليصل طلبك مباشرة لمهندسي النظام مع إمكانية إرفاق الوثائق والملفات لفتح تذكرة دعم فني مباشرة.'
        : 'To submit a technical support request or inquiry, please complete our "Contact Us" form to reach our engineering staff directly.',
      actionType: 'contact',
      actionLink: '#contact',
      actionLabel: isAr ? 'فتح تذكرة دعم فني رسمية' : 'Open Official Support Ticket'
    });
  }

  // 2. Connect to real Fast AI Engine ('chat_fast' tool orchestrator)
  try {
    const orchestrator = await getCachedOrchestratorConfig('chat_fast');
    const provider = orchestrator?.primary_provider || 'google';
    const model = orchestrator?.primary_model || 'gemini-1.5-flash';

    let apiKey: string | null = await getProviderKey(provider);
    let urlKey: string | null = await getProviderUrlKey(provider);

    const systemPrompt = `You are the official Perplexta Live AI Concierge Assistant (مساعد بيربليكستا المباشر).
Your MANDATORY instructions:
1. Your tone must be EXTREMELY FORMAL, AUTHORITATIVE, and PROFESSIONAL (رسمية، احترافية، وصارمة للغاية). Use academic and professional Arabic/English terminology.
2. Your ONLY purpose is to answer questions strictly related to Perplexta platform capabilities, architecture, features, studios (Live App Studio, Freeform Design & Motion Studio, Sovereign Audio Studio, ViralBook Creator Economy, Academic Research Vault, Ads Copilot), pricing plans, refund policy (100% 14-day guarantee), and creator royalties ($50 bonus + $0.70/use + 20% recurring).
3. If the user asks general trivia or off-topic questions, formally state that your operational scope is restricted to guiding users on Perplexta platform technicalities and services.
4. Keep answers extremely concise, clear, and limited to 2 short sentences.
5. Respond in the user's language (${isAr ? 'Arabic' : 'English'}).`;

    if (apiKey) {
      const messages = [
        ...history.slice(-4).map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content || h.text || ''
        })),
        { role: 'user', content: q }
      ];

      const text = await callAIProvider(provider, model, apiKey, q, systemPrompt, undefined, messages, {}, urlKey || undefined);
      if (text && text.trim()) {
        let actionLink: string | undefined = undefined;
        let actionLabel: string | undefined = undefined;

        if (lower.includes('سعر') || lower.includes('اسعار') || lower.includes('باقة') || lower.includes('plan') || lower.includes('price')) {
          actionLink = '#pricing';
          actionLabel = isAr ? 'عرض الخطط والأسعار' : 'View Pricing Plans';
        } else if (lower.includes('استرداد') || lower.includes('ضمان') || lower.includes('refund')) {
          actionLink = '#refund-policy';
          actionLabel = isAr ? 'سياسة الاسترداد الرسمية' : 'Refund Policy';
        } else if (lower.includes('دعوة') || lower.includes('صديق') || lower.includes('اصدقاء') || lower.includes('نقاط') || lower.includes('invite') || lower.includes('friend') || lower.includes('referral')) {
          actionLink = '#referral';
          actionLabel = isAr ? 'مشاركة رابط الدعوة وتجميع النقاط' : 'Share Referral Link & Earn Points';
        } else if (lower.includes('مبدع') || lower.includes('ارباح') || lower.includes('احالة') || lower.includes('creator') || lower.includes('earn')) {
          actionLink = '#economy';
          actionLabel = isAr ? 'حاسبة الأرباح والمحفظة' : 'Earnings Calculator';
        }

        return res.json({
          reply: text.trim(),
          actionLink,
          actionLabel
        });
      }
    }
  } catch (err) {
    console.warn('[Live Assistant] AI execution error, using contextual fallback:', err);
  }

  // 3. Fallback grounded response if AI key/provider is unconfigured
  let reply = '';
  let actionLink: string | undefined = undefined;
  let actionLabel: string | undefined = undefined;

  if (lower.includes('دعوة') || lower.includes('صديق') || lower.includes('اصدقاء') || lower.includes('نقاط') || lower.includes('invite') || lower.includes('friend') || lower.includes('referral')) {
    reply = isAr
      ? 'نعم بالتأكيد! يمكنك تجميع النقاط المجانية والربح عبر نظام الإحالة عند مشاركة رابط دعوتك مع أصدقائك؛ حيث تحصل فوراً على نقاط رصيد يمكن استبدالها باشتراكات أو استخدامها لتوليد المحتوى بالذكاء الاصطناعي.'
      : 'Yes, absolutely! You can earn reward points by sharing your referral link with friends. Points earned can be redeemed for subscription plans or used directly for AI content generation across the platform.';
    actionLink = '#referral';
    actionLabel = isAr ? 'مشاركة رابط الدعوة وتجميع النقاط' : 'Share Referral Link & Earn Points';
  } else if (lower.includes('سعر') || lower.includes('اسعار') || lower.includes('باقة') || lower.includes('plan') || lower.includes('price')) {
    reply = isAr
      ? 'نوفر خططاً مرنة تبدأ من خطط الاستخدام اليومي والشهري مع خصم 20% على الاشتراك السنوي، بالإضافة لخطط المطورين مع حصص API متقدمة.'
      : 'We offer flexible daily and monthly plans with a 20% discount on annual billing, plus dedicated developer tiers with custom API limits.';
    actionLink = '#pricing';
    actionLabel = isAr ? 'عرض الخطط والأسعار' : 'View Pricing Plans';
  } else if (lower.includes('استرداد') || lower.includes('ضمان') || lower.includes('refund')) {
    reply = isAr
      ? 'نضمن لك استرداداً نقدياً كاملاً بنسبة 100% خلال 14 يوماً عند عدم استهلاك حصص الاشتراك الرقمية، وموثق في دفتر الأستاذ المالي المشفر.'
      : 'We offer a 100% money-back guarantee within 14 days for unconsumed plan resources, immutably logged in our financial ledger.';
    actionLink = '#refund-policy';
    actionLabel = isAr ? 'سياسة الاسترداد الرسمية' : 'Refund Policy';
  } else if (lower.includes('مبدع') || lower.includes('ارباح') || lower.includes('احالة') || lower.includes('creator') || lower.includes('earn')) {
    reply = isAr
      ? 'برنامج المبدعين يمنحك بونص ترحيبي فوري $50، وعمولة متكررة 20% مدى الحياة على كل إحالة، بالإضافة إلى $0.70 عن كل استخدام لقوالبك في الاستوديو.'
      : 'Our creator program includes an instant $50 welcome bonus, 20% lifetime recurring commissions, and $0.70 per verified template use.';
    actionLink = '#economy';
    actionLabel = isAr ? 'حاسبة الأرباح والمحفظة' : 'Earnings Calculator';
  } else {
    reply = isAr
      ? 'نحن في خدمتكم عبر مساعد بيربليكستا الرسمي. تجمع المنصة بين استوديو تطوير البرمجيات، استوديو التصميم السيادي، المساعد الأكاديمي، ومحرك فيرال بوك ضمن بيئة مشفرة بالكامل. كيف يمكننا مساعدتكم اليوم؟'
      : 'Welcome to the official Perplexta assistant. The platform integrates software engineering studios, sovereign design tools, academic engines, and the ViralBook hub within a fully encrypted environment. How may we assist you today?';
    actionLink = '/chat';
    actionLabel = isAr ? 'استكشاف الحلول السيادية' : 'Explore Sovereign Solutions';
  }

  res.json({ reply, actionLink, actionLabel });
});

export default router;
