import { safeStorageGet } from "@/utils/safeStorage";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { toast, SelectDropdown } from '@/design-system';
import { 
  Wallet, 
  Gift, 
  Copy, 
  Check, 
  History, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  XCircle, 
  Landmark, 
  CreditCard, 
  Send, 
  ShieldCheck, 
  Camera, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  Users, 
  Mail 
} from 'lucide-react';

import { useSwipeToClose } from '../utils/swipe';
import { triggerRewardConfetti } from '../utils/confetti';

const getTxTypeBadgeClass = (type: string, points: number, amount: number) => {
  const isPositive = points > 0 || (points === 0 && amount > 0);
  if (type === 'welcome_bonus' || type === 'referral_bonus') {
    return 'bg-[var(--surface-inset)] text-[var(--fg-accent)] border border-[var(--border-default)]';
  }
  if (type === 'deposit') {
    return 'bg-[var(--surface-inset)] text-[var(--fg-accent)] border border-[var(--border-default)]';
  }
  if (type === 'withdrawal') {
    return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
  }
  if (type === 'tool_usage_hold') {
    return 'bg-[var(--bg-attention-muted)] text-[var(--fg-attention)] border border-[var(--border-default)]';
  }
  if (type === 'tool_usage_reconcile') {
    return isPositive 
      ? 'bg-[var(--surface-inset)] text-[var(--fg-accent)] border border-[var(--border-default)]'
      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
  }
  if (type === 'admin_adjustment') {
    return isPositive
      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
  }
  return isPositive 
    ? 'bg-[var(--surface-inset)] text-[var(--fg-accent)] border border-[var(--border-default)]' 
    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
};

const getTxLabel = (type: string, isAr: boolean) => {
  const mapping: Record<string, { en: string; ar: string }> = {
    welcome_bonus: { en: 'Welcome Bonus', ar: 'مكافأة التسجيل الترحيبية' },
    referral_bonus: { en: 'Referral Reward', ar: 'مكافأة إحالة' },
    deposit: { en: 'Top-up Deposit', ar: 'شحن رصيد' },
    withdrawal: { en: 'Withdrawal', ar: 'سحب رصيد' },
    tool_usage_hold: { en: 'Quota Reserved Hold', ar: 'حجز رصيد للعملية' },
    tool_usage_reconcile: { en: 'Usage Adjustment', ar: 'تسوية الاستخدام' },
    admin_adjustment: { en: 'Admin Adjustment', ar: 'تعديل إداري' },
    conversion: { en: 'Points Conversion', ar: 'تحويل نقاط' }
  };
  return mapping[type] ? (isAr ? mapping[type].ar : mapping[type].en) : type;
};

const getToolLabel = (toolId: string, isAr: boolean) => {
  const tools: Record<string, { en: string; ar: string }> = {
    chat: { en: 'Chat', ar: 'المحادثة والدردشة' },
    image: { en: 'Image', ar: 'صورة' },
    image_generation: { en: 'Image', ar: 'صورة' },
    code: { en: 'Code', ar: 'كود' },
    code_analysis: { en: 'Code', ar: 'كود' },
    smart_search: { en: 'Smart Search', ar: 'البحث الذكي' },
    custom_tool: { en: 'Custom Tool', ar: 'أداة مخصصة' },
    document_summarizer: { en: 'Document Summarizer', ar: 'ملخص المستندات' },
    academic_search: { en: 'Academic Search', ar: 'البحث الأكاديمي' },
    translator: { en: 'Translator', ar: 'المترجم الاحترافي' },
  };
  const normalized = toolId.toLowerCase().replace(/[\-_]/g, '_');
  return tools[normalized] ? (isAr ? tools[normalized].ar : tools[normalized].en) : toolId;
};

const getTranslatedDescription = (description: string, isAr: boolean) => {
  if (!description) return '';

  // 1. Welcome Bonus Registration description
  if (description.toLowerCase().includes('welcome registration bonus') || description.toLowerCase().includes('welcome_bonus') || description.includes('مكافأة التسجيل الترحيبية')) {
    return isAr ? 'مكافأة التسجيل الترحيبية' : 'Welcome registration bonus';
  }

  // 2. Upfront hold description
  const holdRegex = /(?:\.)?Upfront hold of (\d+) pts for tool ([\w_\-]+)/i;
  const holdMatch = description.match(holdRegex);
  if (holdMatch) {
    const pts = parseInt(holdMatch[1], 10);
    const toolId = holdMatch[2];
    const toolName = getToolLabel(toolId, isAr);
    return isAr 
      ? `حجز مؤقت لـ ${pts} نقطة لاستخدام أداة ${toolName}`
      : `Temporary reservation of ${pts} points for tool ${toolName}`;
  }

  // 3. Reconciled surcharge / refund
  // Pattern 1: ".Reconciled chat. Surcharge: 5 pts. Actual: 106 pts"
  const surchargeRegex = /(?:\.)?Reconciled ([\w_\-]+)\. Surcharge: (\d+) pts\. Actual: (\d+) pts/i;
  const surchargeMatch = description.match(surchargeRegex);
  if (surchargeMatch) {
    const toolId = surchargeMatch[1];
    const surcharge = parseInt(surchargeMatch[2], 10);
    const actual = parseInt(surchargeMatch[3], 10);
    const toolName = getToolLabel(toolId, isAr);
    return isAr
      ? `تسوية أداة ${toolName}: خصم إضافي ${surcharge} نقطة (الاستهلاك الفعلي: ${actual} نقطة)`
      : `Reconciliation for ${toolName}: Surcharge of ${surcharge} points (Actual use: ${actual} points)`;
  }

  // Pattern 2: ".Reconciled chat. Refunded 5 pts. Actual: 106 pts"
  const refundRegex = /(?:\.)?Reconciled ([\w_\-]+)\. Refunded (\d+) pts\. Actual: (\d+) pts/i;
  const refundMatch = description.match(refundRegex);
  if (refundMatch) {
    const toolId = refundMatch[1];
    const refund = parseInt(refundMatch[2], 10);
    const actual = parseInt(refundMatch[3], 10);
    const toolName = getToolLabel(toolId, isAr);
    return isAr
      ? `تسوية أداة ${toolName}: استرجاع ${refund} نقطة (الاستهلاك الفعلي: ${actual} نقطة)`
      : `Reconciliation for ${toolName}: Refunded ${refund} points (Actual use: ${actual} points)`;
  }

  // 4. Admin adjustment
  const adminRegex = /^\[(POINTS|BALANCE)\]\s*(.*)$/i;
  const adminMatch = description.match(adminRegex);
  if (adminMatch) {
    const target = adminMatch[1].toLowerCase();
    const reasonValue = adminMatch[2].trim();
    const isPoints = target === 'points';
    
    let translatedReason = reasonValue;
    if (reasonValue.toLowerCase().includes('welcome bonus') || reasonValue.includes('مكافأة التسجيل الترحيبية')) {
      translatedReason = isAr ? 'مكافأة التسجيل الترحيبية الصالحة' : 'Welcome Registration Bonus';
    } else if (reasonValue.toLowerCase() === 'referral registration bonus' || reasonValue.includes('مكافأة إحالة ترحيبية')) {
      translatedReason = isAr ? 'مكافأة رصيد الإحالة عند التسجيل' : 'Referral Registration Bonus';
    } else if (reasonValue.toLowerCase() === 'kyc verification points' || reasonValue.includes('نقاط تفعيل الهوية')) {
      translatedReason = isAr ? 'نقاط مكافأة تفعيل الحساب وتوثيق الهوية' : 'Identity Verification Bonus';
    }

    if (isAr) {
      return `تعديل إداري (${isPoints ? 'نقاط' : 'رصيد'}): ${translatedReason}`;
    } else {
      return `Admin adjustment (${isPoints ? 'Points' : 'Balance'}): ${translatedReason}`;
    }
  }

  // 5. Points conversion
  if (description.toLowerCase().includes('points conversion') || description.toLowerCase().includes('convert') || description.includes('تحويل النقاط')) {
    return isAr ? 'تحويل النقاط إلى رصيد المحفظة' : 'Conversion of points to wallet balance';
  }

  // 6. Referral Commission / signup reward
  if (description.toLowerCase().includes('referral signup reward') || description.includes('مكافأة إحالة')) {
    return isAr ? 'مكافأة تسجيل صديق جديد عبر رمز الإحالة الخاص بك' : 'Reward for a friend signing up via your referral link';
  }

  if (description.includes('/') && (description.toLowerCase().includes('welcome') || description.includes('مكافأة'))) {
    const parts = description.split('/');
    if (parts.length === 2) {
      return isAr ? parts[1].trim() : parts[0].trim();
    }
  }

  return description;
};

export const RewardsPage: React.FC = () => {
  const { t, dir, token, user: contextUser, setUser, refreshUser, economySettings, isMobile } = useAppContext();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);
  const [convertAmount, setConvertAmount] = useState('10000');
  
  const swipeHandlers = useSwipeToClose({
    onSwipeClose: () => setIsConvertModalOpen(false),
    direction: 'both',
    dir: dir as 'rtl' | 'ltr',
    isMobile: !!isMobile
  });
  

  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activationFileInputRef = useRef<HTMLInputElement>(null);
  const [kycFullName, setKycFullName] = useState('');
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallet, setWallet] = useState<any>({ points: 0, balance: 0, referral_activated: false });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [referredFriends, setReferredFriends] = useState<any[]>([]);
  const [isLoadingReferredFriends, setIsLoadingReferredFriends] = useState(false);
  const [friendsFilter, setFriendsFilter] = useState<'all' | 'verified' | 'pending' | 'nodeposityet'>('all');
  const [friendsSort, setFriendsSort] = useState<'joined_at' | 'deposit_amount'>('joined_at');
  const [txOffset, setTxOffset] = useState(0);
  const [hasMoreTx, setHasMoreTx] = useState(true);
  const TX_LIMIT = 20;

  // Activation Deposit Form States
  const [showActivationForm, setShowActivationForm] = useState(false);
  const [activationMethod, setActivationMethod] = useState<'balance' | 'crypto' | 'bank' | 'paypal' | 'stripe'>('balance');
  const [activationRefId, setActivationRefId] = useState('');
  const [activationProofFile, setActivationProofFile] = useState<File | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationStep, setActivationStep] = useState(0); // 0: idle, 1: uploading, 2: processing
  
  // Email Invitation States
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);
  const [isFetchingInvitations, setIsFetchingInvitations] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [remindingEmails, setRemindingEmails] = useState<Record<string, boolean>>({});
  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error(dir === 'rtl' ? 'لم يتم العثور على كاميرا في جهازك. يرجى استخدام جهاز يحتوي على كاميرا لإتمام عملية التحقق.' : 'No camera found on your device. Please use a device with a camera for verification.');
      } else {
        toast.error(dir === 'rtl' ? 'تعذر الوصول إلى الكاميرا. يرجى التأكد من منح الإذن.' : 'Could not access camera. Please ensure permissions are granted.');
      }
      setIsCapturing(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const data = canvasRef.current.toDataURL('image/png');
        setSelfieData(data);
        setSelfieCaptured(true);
        setIsCapturing(false);
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSubmitKYC = async () => {
    if (!kycFullName.trim() || !selfieCaptured || !token) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName: kycFullName, selfie: selfieData })
      });
      
      if (res.ok) {
        const userRes = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }
      } else {
        const data = await res.json();
        console.error('KYC submission failed:', data.error);
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertPoints = async () => {
    if (!convertAmount || isNaN(Number(convertAmount)) || Number(convertAmount) <= 0 || !token) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/convert-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amountPoints: Number(convertAmount) })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        triggerRewardConfetti();
        toast.success(dir === 'rtl' ? `تم تحويل النقاط بنجاح! الرصيد الجديد: $${Number(data.usdAmount).toFixed(2)}` : `Points converted successfully! New Balance: $${Number(data.usdAmount).toFixed(2)}`);
        setIsConvertModalOpen(false);
        setConvertAmount('1000');
        
        refreshUser();
        const walletRes = await fetch('/api/wallet', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (walletRes.ok) {
          const wData = await walletRes.json();
          setWallet(wData);
        }
      } else {
        toast.error(data.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Error converting points:', error);
      toast.error(dir === 'rtl' ? 'حدث خطأ غير متوقع' : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearHistory = () => {
    if (!token) return;
    setIsClearHistoryConfirmOpen(true);
  };

  const handleClearHistoryConfirm = async () => {
    setIsClearHistoryConfirmOpen(false);
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/clear', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions([]);
        setHasMoreTx(false);
        setTxOffset(0);
        toast.success(dir === 'rtl' ? 'تم مسح السجل بنجاح لضمان نظافة البيانات وعدم التضخم!' : 'History cleared successfully to ensure clean data and no bloat!');
      } else {
        toast.error(data.error || 'Failed to clear history');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      toast.error(dir === 'rtl' ? 'حدث خطأ أثناء مسح سجل المعاملات' : 'An error occurred while clearing history');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateWithBalance = async () => {
    setIsActivating(true);
    setActivationStep(2);
    try {
      const res = await fetch('/api/wallet/activate-referral-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          dir === 'rtl'
            ? '🚀 تهانينا! لقد تم تفعيل نظام الأرباح الخاص بك بنجاح خصماً من رصيدك المتاح.'
            : '🚀 Congratulations! Your referral and earnings program has been successfully activated from your wallet balance.'
        );
        setWallet((prev: any) => ({ ...prev, referral_activated: true, balance: data.newBalance }));
        if (setUser && contextUser) {
          setUser({ ...contextUser, referral_activated: true, balance: data.newBalance } as any);
        }
        setShowActivationForm(false);
      } else {
        toast.error(data.error_ar && dir === 'rtl' ? data.error_ar : data.error || 'Activation failed');
      }
    } catch (err) {
      toast.error(dir === 'rtl' ? 'فشل الاتصال لتفعيل نظام الأرباح' : 'Failed to connect for activation');
    } finally {
      setIsActivating(false);
      setActivationStep(0);
    }
  };

  const handleActivateWithDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    const minAmount = Number(economySettings?.referral_activation_min_deposit || 10);
    
    if (activationMethod === 'stripe') {
      setIsActivating(true);
      setActivationStep(2);
      try {
        const stripeRes = await fetch('/api/payments/stripe-deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: minAmount })
        });
        if (stripeRes.ok) {
          const stripeData = await stripeRes.json();
          if (stripeData.url) {
            toast.success(dir === 'rtl' ? 'جاري تحويلك إلى نافذة دفع Stripe الآمنة...' : 'Redirecting to secure Stripe checkout...');
            setTimeout(() => {
              window.location.href = stripeData.url;
            }, 800);
            return;
          }
        }
        toast.error(dir === 'rtl' ? 'فشل توليد رابط الدفع آلياً' : 'Failed to create payment session');
      } catch (err) {
        toast.error(dir === 'rtl' ? 'حدث خطأ في التهيئة' : 'An error occurred during initialization');
      } finally {
        setIsActivating(false);
        setActivationStep(0);
      }
      return;
    }

    // Manual deposits
    if (!activationRefId.trim()) {
      toast.error(dir === 'rtl' ? 'يرجى إدخال الرقم المرجعي أو إثبات الشحن' : 'Please enter transaction reference / ID');
      return;
    }

    setIsActivating(true);
    setActivationStep(1); // Uploading files

    let uploadedFileUrl = '';
    if (activationProofFile) {
      try {
        const formData = new FormData();
        formData.append('file', activationProofFile);
        const authToken = token || safeStorageGet('app_token') || '';
        const uploadRes = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData
        });
        if (!uploadRes.ok) {
          throw new Error('Screenshot upload failed');
        }
        const data = await uploadRes.json();
        uploadedFileUrl = data.file?.file_url || data.fileUrl || data.url || '';
      } catch (uploadErr) {
        toast.error(dir === 'rtl' ? 'فشل تحميل صورة إثبات المعاملة' : 'Failed to upload transaction proof image.');
        setIsActivating(false);
        setActivationStep(0);
        return;
      }
    }

    setActivationStep(2); // Recording and sync

    try {
      const res = await fetch('/api/wallet/deposit-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: minAmount,
          method: 
            activationMethod === 'crypto'
              ? 'USDT (TRC-20)'
              : activationMethod === 'paypal'
              ? 'PAYPAL'
              : 'BANK TRANSFER',
          reference_id: activationRefId,
          proof_url: uploadedFileUrl
        })
      });

      if (res.ok) {
        triggerRewardConfetti();
        toast.success(
          dir === 'rtl'
            ? 'تم إرسال طلب تفعيل نظام الأرباح الخاص بك بنجاح! سيقوم المشرف بالتحقق من الإيداع وقبوله فوراً.'
            : 'Referral activation deposit requested successfully! Administrator will verify and unlock your link.'
        );
        setActivationRefId('');
        setActivationProofFile(null);
        setShowActivationForm(false);
      } else {
        const errData = await res.json();
        toast.error(errData.error || (dir === 'rtl' ? 'فشل إرسال طلب الشحن للتفعيل' : 'Failed to request activation deposit.'));
      }
    } catch (err) {
      toast.error(dir === 'rtl' ? 'عطل في الاتصال بخادم المحفظة المالية' : 'Database connection error.');
    } finally {
      setIsActivating(false);
      setActivationStep(0);
    }
  };

  const fetchSentInvitations = async () => {
    if (!token) return;
    setIsFetchingInvitations(true);
    try {
      const res = await fetch('/api/wallet/referral-invitations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSentInvitations(data);
      }
    } catch (err) {
      console.error('Error fetching referral invitations:', err);
    } finally {
      setIsFetchingInvitations(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error(
        dir === 'rtl'
          ? 'تنسيق البريد الإلكتروني غير صالح.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch('/api/wallet/invite-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(dir === 'rtl' ? data.message_ar || 'تم إرسال الدعوة بنجاح!' : data.message || 'Invitation sent successfully!');
        setInviteEmail('');
        fetchSentInvitations();
      } else {
        toast.error(dir === 'rtl' ? data.error_ar || data.error || 'فشل إرسال الدعوة.' : data.error || 'Failed to send invitation.');
      }
    } catch (err) {
      console.error('Error sending referral invitation:', err);
      toast.error(
        dir === 'rtl'
          ? 'عملية الاتصال بالخادم فشلت.'
          : 'Server communication failed.'
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemindInvitation = async (email: string) => {
    if (!token || !email) return;

    setRemindingEmails((prev) => ({ ...prev, [email]: true }));
    try {
      const res = await fetch('/api/wallet/remind-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          dir === 'rtl'
            ? data.message_ar || 'تم إرسال تذكير بضغطة زر بنجاح!'
            : data.message || 'One-click reminder dispatched successfully!'
        );
        fetchSentInvitations();
      } else {
        toast.error(
          dir === 'rtl'
            ? data.error_ar || data.error || 'فشل إرسال التذكير.'
            : data.error || 'Failed to dispatch invitation reminder.'
        );
      }
    } catch (err) {
      console.error('Error sending invitation reminder:', err);
      toast.error(
        dir === 'rtl'
          ? 'عملية الاتصال بالخادم فشلت.'
          : 'Server communication failed.'
      );
    } finally {
      setRemindingEmails((prev) => ({ ...prev, [email]: false }));
    }
  };

  useEffect(() => {
    if (token) {
      fetchSentInvitations();
    }
  }, [token]);

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token) {
          const userRes = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
          }

          const walletRes = await fetch('/api/wallet', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (walletRes.ok) {
            const data = await walletRes.json();
            setWallet(data);
          }

          const transRes = await fetch(`/api/wallet/history?limit=${TX_LIMIT}&offset=${txOffset}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (transRes.ok) {
            const data = await transRes.json();
            const newTransactions = Array.isArray(data) ? data : (data.transactions || []);
            if (txOffset === 0) {
              setTransactions(newTransactions);
              if (newTransactions.length >= 20) {
                toast.info(dir === 'rtl' 
                  ? 'تم الوصول إلى الحد الأقصى (20 من السجلات). سيتم حذف السجلات القديمة تلقائيًا لمنع تضخم البيانات.' 
                  : 'Transaction limit of 20 records reached. Oldest transactions are automatically pruned to prevent data bloat.'
                );
              }
            } else {
              setTransactions(prev => {
                const updated = [...prev, ...newTransactions];
                if (updated.length >= 20) {
                  toast.info(dir === 'rtl' 
                    ? 'تم الوصول إلى الحد الأقصى (20 من السجلات). سيتم حذف السجلات القديمة تلقائيًا لمنع تضخم البيانات.' 
                    : 'Transaction limit of 20 records reached. Oldest transactions are automatically pruned to prevent data bloat.'
                  );
                }
                return updated;
              });
            }
            if (newTransactions.length < TX_LIMIT || (data.hasMore === false)) setHasMoreTx(false);
          }

          const refRes = await fetch('/api/wallet/referral-count', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (refRes.ok) {
            const data = await refRes.json();
            setReferralCount(data.count);
          }

          setIsLoadingReferredFriends(true);
          try {
            const detailedRefRes = await fetch('/api/wallet/referred-friends-detailed', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (detailedRefRes.ok) {
              const detailedData = await detailedRefRes.json();
              setReferredFriends(detailedData);
            }
          } catch (detailedErr) {
            console.error('Error fetching detailed referred friends:', detailedErr);
          } finally {
            setIsLoadingReferredFriends(false);
          }
        }
      } catch (error) {
        console.error('Error fetching rewards data:', error);
      }
    };
    fetchData();
  }, [token, txOffset]);

  const formatTranslation = (key: string) => {
    let text = t(key);
    text = text.replace('{welcomeBonus}', economySettings.welcome_bonus_points.toLocaleString());
    text = text.replace('{referralBonus}', economySettings.referral_bonus_points.toLocaleString());
    return text;
  };

  const referralLink = contextUser ? `${window.location.origin}/?ref=${contextUser.referral_code || contextUser.id}` : "...";

  const handleCopy = () => {
    if (!contextUser) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(
      dir === 'rtl' 
        ? 'تم نسخ رابط الإحالة الخاص بك بنجاح!' 
        : 'Referral link copied to clipboard successfully!'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const withdrawableUSD = Number(wallet.balance || 0).toFixed(2);
  const estimatedPointsWorth = (Number(wallet.points || 0) * Number(economySettings.conversion_rate || 0)).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto w-[92%] md:w-[85%] pt-4 sm:pt-6 pb-24 lg:pb-16 space-y-6 md:space-y-10">
      
      {/* Sticky Header with Back Button */}
      <div className={`sticky -top-0.5 z-[40] -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-6 transition-theme bg-[var(--surface-page)]/95 backdrop-blur-md border-b border-[var(--border-default)]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-shape-sm btn-square-primary flex items-center justify-center transition-all bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--fg-accent)] hover:border-[var(--border-accent)] active:scale-95 cursor-pointer relative touch-target-44-expanded"
              title={dir === 'rtl' ? 'رجوع' : 'Back'}
            >
              {dir === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--text-primary)]">{t('rewards')}</h1>
              {contextUser?.kyc_status === 'verified' && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-shape-xs bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-primary)]">
                  <CheckCircle2 size={12} className="text-[var(--fg-accent)]" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">{t('verified')}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/settings/wallet')}
              className="h-8 px-3 rounded-shape-sm btn-long-standard border border-[var(--border-default)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs text-xs font-bold flex items-center"
            >
              <span className="h-[23px] leading-[23px] flex items-center gap-1.5">
                <Landmark size={14} className="text-[var(--fg-accent)]" />
                <span className="text-[11px] font-bold">
                  {dir === 'rtl' ? 'إيداع أموال' : 'Deposit Funds'}
                </span>
              </span>
            </button>
            <div className="hidden sm:flex items-center h-8 px-3 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-default)]">
              <span className="h-[23px] leading-[23px] flex items-center gap-1.5">
                <Landmark size={14} className="text-[var(--fg-accent)]" />
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-tight">{dir === 'rtl' ? 'المحفظة والسجلات' : 'LEDGER'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Cards: Balance and Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Withdrawable Balance Card */}
        <div className="relative overflow-hidden rounded-shape-md p-5 md:p-8 border bg-[var(--surface-subtle)] border-[var(--border-default)] flex flex-col items-center justify-center text-center min-h-[180px] md:min-h-[220px] shadow-2xs">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] md:text-[180px] font-bold text-[var(--text-muted)] opacity-5 select-none pointer-events-none">
            $
          </div>
          <div className="relative z-10 space-y-2 md:space-y-4">
            <h3 className="text-xs md:text-sm text-[var(--text-secondary)] font-bold uppercase tracking-wider">{t('withdrawableBalance')}</h3>
            <div className="flex items-baseline justify-center gap-1.5 md:gap-2">
              <span className="text-xs md:text-sm font-bold text-[var(--text-secondary)]">USD</span>
              <span className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">${withdrawableUSD}</span>
            </div>
            <button 
              onClick={() => navigate('/settings/wallet')}
              className="mt-2 md:mt-4 h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] border border-[var(--border-default)] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center mx-auto"
            >
              <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                <Wallet size={14} className="text-[var(--fg-accent)]" />
                <span>{t('requestWithdrawal')}</span>
              </span>
            </button>
          </div>
        </div>

        {/* Points Balance Card */}
        <div className="relative overflow-hidden rounded-shape-md p-5 md:p-8 border bg-[var(--surface-subtle)] border-[var(--border-default)] flex flex-col items-center justify-center text-center min-h-[180px] md:min-h-[220px] shadow-2xs">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-5">
            <Gift className="text-[var(--text-muted)] w-[120px] h-[120px] md:w-[160px] md:h-[160px]" />
          </div>
          <div className="relative z-10 space-y-2 md:space-y-4">
            <h3 className="text-xs md:text-sm text-[var(--text-secondary)] font-bold uppercase tracking-wider">{t('pointsBalance')}</h3>
            <div className="flex flex-col items-center justify-center gap-0.5 md:gap-1">
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-xs md:text-sm font-bold text-[var(--text-secondary)]">PTS</span>
                <span className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">{Math.floor(Number(wallet.points || 0)).toLocaleString()}</span>
              </div>
              <span className="text-[11px] md:text-xs text-[var(--text-secondary)] font-semibold">≈ ${estimatedPointsWorth} USD</span>
            </div>
            <button 
              onClick={() => setIsConvertModalOpen(true)}
              className="mt-2 md:mt-4 h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] border border-[var(--border-default)] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center mx-auto"
            >
              <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                <Zap size={14} className="text-[var(--fg-accent)]" />
                <span>{t('convertPointsToBalance')}</span>
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Middle Cards: How it works and Invite */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* How it works */}
        <div className="rounded-[var(--radius-md)] p-5 md:p-8 border bg-[var(--surface-subtle)] border-[var(--border-default)] transition-theme hover:border-[var(--border-default)]">
          <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-6 md:mb-8 text-center flex items-center justify-center gap-2">
            <Zap size={20} className="text-[var(--fg-accent)]" />
            <span>{t('howSystemWorks')}</span>
          </h3>
          
          <div className="space-y-6 md:space-y-8">
            {/* Step 1 */}
            <div className="flex items-start gap-3 md:gap-4 group">
              <div className="flex-shrink-0 w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)] text-sm font-bold group-hover:bg-[var(--surface-page)] transition-all">
                1
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-sm md:text-base tracking-tight">{t('shareYourLink')}</h4>
                <p className="text-[11px] md:text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-relaxed">{t('shareYourLinkDesc')}</p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex items-start gap-3 md:gap-4 group">
              <div className="flex-shrink-0 w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)] text-sm font-bold group-hover:bg-[var(--surface-page)] transition-all">
                2
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-sm md:text-base tracking-tight">{t('registration')}</h4>
                <p className="text-[11px] md:text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-relaxed">{formatTranslation('registrationDesc')}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 md:gap-4 group">
              <div className="flex-shrink-0 w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)] text-sm font-bold group-hover:bg-[var(--surface-page)] transition-all">
                3
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-sm md:text-base tracking-tight">{t('activationAndProfit')}</h4>
                <p className="text-[11px] md:text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-relaxed">{formatTranslation('activationAndProfitDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Friends */}
        <div className="rounded-shape-md p-5 md:p-8 border bg-[var(--surface-subtle)] border-[var(--border-default)] flex flex-col transition-theme shadow-2xs">
          <div className="text-center mb-6 md:mb-8">
            <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
              <Zap size={16} className="text-[var(--fg-accent)]" />
              <span>{t('inviteFriendsAndEarn')}</span>
            </h3>
            <p className="text-[11px] md:text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
              {formatTranslation('inviteFriendsDesc')}
            </p>
          </div>

          <div className="mt-auto space-y-4 md:space-y-6">
            {!wallet?.referral_activated ? (
              <div className="p-4 md:p-6 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-page)] flex flex-col gap-4 text-center">
                {!showActivationForm ? (
                  <>
                    <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] flex items-center justify-center text-[var(--text-primary)] mx-auto border border-[var(--border-default)]">
                      <Zap size={16} className="text-[var(--fg-accent)]" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        {dir === 'rtl' ? 'تفعيل نظام الأرباح' : 'Earnings Activation Required'}
                      </h4>
                      <p className="text-[10px] md:text-xs text-[var(--text-secondary)] font-medium leading-relaxed max-w-sm mx-auto">
                        {dir === 'rtl'
                          ? `سعر تفعيل خدمة الأرباح والحصول على رابط إحالة خاص بك هو إيداع حد أدنى بقيمة $${economySettings?.referral_activation_min_deposit || 10}. يمكنك شحن رصيدك أو التنشيط الفوري للاشتراك وجني المكافآت.`
                          : `To activate your referral link and start receiving rewards, you must first deposit or pay a minimum of $${economySettings?.referral_activation_min_deposit || 10}.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowActivationForm(true);
                        const cost = Number(economySettings?.referral_activation_min_deposit || 10);
                        if (Number(wallet?.balance || 0) >= cost) {
                          setActivationMethod('balance');
                        } else {
                          setActivationMethod('stripe');
                        }
                      }}
                      className="w-full h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] font-bold text-xs uppercase tracking-wider transition-all border border-[var(--border-default)] cursor-pointer shadow-2xs flex items-center justify-center"
                    >
                      <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                        <Zap size={14} className="text-[var(--fg-accent)]" />
                        <span>{dir === 'rtl' ? 'تفعيل نظام الأرباح الآن' : 'Activate Earnings Now'}</span>
                      </span>
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleActivateWithDeposit} className="text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2 mb-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                        <Zap size={14} className="text-[var(--fg-accent)]" />
                        {dir === 'rtl' ? 'تفعيل حساب الإحالات والعمولات' : 'Referral Activation Hub'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowActivationForm(false)}
                        className="text-[10px] uppercase font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>

                    {/* Method Selector Tabs (Standard 32px height container) */}
                    <div className="h-8 p-0.5 rounded-shape-sm bg-[var(--surface-page)] border border-[var(--border-default)] flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActivationMethod('balance')}
                        className={`h-7 flex-1 rounded-shape-xs text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          activationMethod === 'balance'
                            ? 'bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] font-extrabold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                        }`}
                        title={dir === 'rtl' ? 'رصيد المحفظة' : 'Wallet Balance'}
                      >
                        <span className="h-[23px] leading-[23px]">
                          {dir === 'rtl' ? 'الرصيد' : 'Balance'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivationMethod('stripe')}
                        className={`h-7 flex-1 rounded-shape-xs text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          activationMethod === 'stripe'
                            ? 'bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] font-extrabold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                        }`}
                        title={dir === 'rtl' ? 'بطاقة الائتمان' : 'Credit Card'}
                      >
                        <span className="h-[23px] leading-[23px]">
                          {dir === 'rtl' ? 'البطاقة' : 'Card'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivationMethod('crypto')}
                        className={`h-7 flex-1 rounded-shape-xs text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          activationMethod === 'crypto'
                            ? 'bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] font-extrabold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                        }`}
                        title={dir === 'rtl' ? 'عملة USDT' : 'USDT Crypto'}
                      >
                        <span className="h-[23px] leading-[23px]">
                          USDT
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivationMethod('paypal')}
                        className={`h-7 flex-1 rounded-shape-xs text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          activationMethod === 'paypal'
                            ? 'bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] font-extrabold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                        }`}
                        title="PayPal"
                      >
                        <span className="h-[23px] leading-[23px]">
                          PayPal
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivationMethod('bank')}
                        className={`h-7 flex-1 rounded-shape-xs text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          activationMethod === 'bank'
                            ? 'bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] font-extrabold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                        }`}
                        title={dir === 'rtl' ? 'تحويل بنكي' : 'Bank Transfer'}
                      >
                        <span className="h-[23px] leading-[23px]">
                          {dir === 'rtl' ? 'البنك' : 'Bank'}
                        </span>
                      </button>
                    </div>

                    {/* Method Content */}
                    <div className="bg-[var(--surface-page)] p-3 rounded-shape-sm border border-[var(--border-default)] text-xs space-y-3">
                      {activationMethod === 'balance' && (
                        <div className="space-y-3 text-left">
                          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-semibold">
                            {dir === 'rtl'
                              ? `يمكنك تفعيل حساب الأرباح فوراً باستخدام رصيدك المتوفر حالياً في المحفظة التقنية.`
                              : `Directly activate your referrals and earnings using your available tech wallet balance.`}
                          </p>
                          <div className="flex items-center justify-between bg-[var(--surface-inset)] border border-[var(--border-default)] p-2 rounded-shape-xs text-[11px] font-bold">
                            <span className="text-[var(--text-secondary)]">{dir === 'rtl' ? 'الرصيد المتاح:' : 'Available Balance:'}</span>
                            <span className="text-[var(--text-primary)] font-mono">${wallet?.balance || 0}</span>
                          </div>
                          <div className="flex items-center justify-between bg-[var(--surface-inset)] border border-[var(--border-default)] p-2 rounded-shape-xs text-[11px] font-bold">
                            <span className="text-[var(--text-secondary)]">{dir === 'rtl' ? 'رسوم التفعيل:' : 'Activation Fee:'}</span>
                            <span className="text-[var(--text-primary)] font-mono">${economySettings?.referral_activation_min_deposit || 10}</span>
                          </div>
                          {Number(wallet?.balance || 0) >= Number(economySettings?.referral_activation_min_deposit || 10) ? (
                            <button
                              type="button"
                              disabled={isActivating}
                              onClick={handleActivateWithBalance}
                              className="w-full h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            >
                              <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                                {isActivating ? (
                                  <RefreshCw size={12} className="animate-spin text-[var(--fg-accent)]" />
                                ) : (
                                  <ShieldCheck size={12} className="text-[var(--fg-accent)]" />
                                )}
                                <span>{dir === 'rtl' ? 'تفعيل فوري وخصم من الرصيد' : 'Deduct Balance & Activate Now'}</span>
                              </span>
                            </button>
                          ) : (
                            <div className="p-2 border border-rose-500/10 bg-rose-500/[0.02] rounded-shape-xs text-[9px] text-rose-500 font-bold leading-relaxed flex items-center gap-2">
                              <AlertTriangle size={12} className="flex-shrink-0" />
                              <span>
                                {dir === 'rtl'
                                  ? 'رصيدك الحالي غير كافٍ للتفعيل الفوري. يرجى اختيار وسيلة دفع أخرى لشحن رصيد وتفعيله.'
                                  : 'Your wallet balance is insufficient. Please use another deposit channel.'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {activationMethod === 'stripe' && (
                        <div className="space-y-3 text-left">
                          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-semibold">
                            {dir === 'rtl'
                              ? `سوف تصدر معاملة إيداع فوري بمبلغ التفعيل ($${economySettings?.referral_activation_min_deposit || 10})، وسيتم تحويلك لبوابة Stripe الآمنة لتأكيد الدفع بالبطاقة.`
                              : `Initiate a secure card checkout session for exactly the activation fee ($${economySettings?.referral_activation_min_deposit || 10}) via Stripe.`}
                          </p>
                          <button
                            type="submit"
                            disabled={isActivating}
                            className="w-full h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                              {isActivating ? (
                                <RefreshCw size={12} className="animate-spin text-[var(--fg-accent)]" />
                              ) : (
                                <CreditCard size={12} className="text-[var(--fg-accent)]" />
                              )}
                              <span>{dir === 'rtl' ? 'الدفع الآمن بالبطاقة والتفعيل الفوري' : 'Pay Safely & Activate Instantly'}</span>
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Manual USDT Deposit Channel */}
                      {activationMethod === 'crypto' && (
                        <div className="space-y-3.5 text-left">
                          <div className="p-2 border border-[var(--border-default)] bg-[var(--surface-inset)] rounded-[var(--radius-xs)] space-y-1.5">
                            <span className="text-[9px] uppercase font-black text-[var(--text-primary)] tracking-wider block">USDT TRC-20 Address</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] text-[var(--text-primary)] select-all truncate block flex-1 bg-[var(--surface-subtle)] p-1 border border-[var(--border-default)] py-1 shadow-inner rounded-[var(--radius-xs)]">
                                {economySettings?.crypto_address || 'No Address available'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (economySettings?.crypto_address) {
                                    navigator.clipboard.writeText(economySettings.crypto_address);
                                    toast.success(dir === 'rtl' ? 'تم نسخ العنوان بنجاح!' : 'USDT TRC-20 Address Copied!');
                                  }
                                }}
                                className="px-2 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--surface-page)] text-[var(--text-primary)] rounded-[var(--radius-xs)] text-[9px] font-black cursor-pointer transition-all duration-300 border border-[var(--border-default)]"
                              >
                                {dir === 'rtl' ? 'نسخ' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight block">
                              {dir === 'rtl' ? 'الرقم المرجعي أو هاش العملية *' : 'Transaction Hash / TxID *'}
                            </label>
                            <input
                              type="text"
                              required
                              value={activationRefId}
                              onChange={(e) => setActivationRefId(e.target.value)}
                              placeholder="e.g. 0x82c1f301ae9f..."
                              className="w-full px-2.5 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xs)] text-[10px] font-bold font-mono focus:outline-none focus:border-[var(--border-accent)] transition-all duration-300 text-[var(--text-primary)]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight block">
                              {dir === 'rtl' ? 'صورة إثبات التحويل (اختياري)' : 'Proof Screenshot / Image (Optional)'}
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              ref={activationFileInputRef}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setActivationProofFile(file);
                              }}
                              className="hidden"
                            />
                            <div
                              onClick={() => activationFileInputRef.current?.click()}
                              className="border border-dashed border-[var(--border-default)] hover:border-[var(--border-accent)] p-2 py-3 rounded-[var(--radius-xs)] flex flex-col items-center justify-center gap-1 bg-[var(--surface-subtle)] cursor-pointer text-center text-[9px] text-[var(--text-secondary)] group hover:text-[var(--text-primary)] transition-all duration-300"
                            >
                              <Camera size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-all duration-300" />
                              <span className="font-semibold select-none">
                                {activationProofFile ? activationProofFile.name : (dir === 'rtl' ? 'انقر لاختيار لقطة شاشة إثبات الدفع' : 'Click to select transaction screenshot')}
                              </span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isActivating}
                            className="w-full h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                              {isActivating ? (
                                <span className="flex items-center gap-1.5 text-[10px]">
                                  <RefreshCw size={11} className="animate-spin text-[var(--fg-accent)]" />
                                  {activationStep === 1 ? (dir === 'rtl' ? 'جاري رفع الملف...' : 'Uploading proof...') : (dir === 'rtl' ? 'جاري التقييد والمزامنة...' : 'Validating request...')}
                                </span>
                              ) : (
                                <>
                                  <Send size={11} className="text-[var(--fg-accent)]" />
                                  <span>{dir === 'rtl' ? 'إرسال الإثبات وتفعيل الحساب' : 'Submit Proof & Request Activation'}</span>
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Manual PayPal Channel */}
                      {activationMethod === 'paypal' && (
                        <div className="space-y-3.5 text-left">
                          <div className="p-2 border border-[var(--border-default)] bg-[var(--surface-inset)] rounded-shape-xs space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-[var(--text-primary)] tracking-wider block">PayPal Recipient Email</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] text-[var(--text-primary)] select-all truncate block flex-1 bg-[var(--surface-subtle)] p-1 border border-[var(--border-default)] py-1 shadow-inner rounded-shape-xs">
                                {economySettings?.paypal_email || 'No email configured'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (economySettings?.paypal_email) {
                                    navigator.clipboard.writeText(economySettings.paypal_email);
                                    toast.success(dir === 'rtl' ? 'تم نسخ ايميل بايبال!' : 'PayPal Email Copied!');
                                  }
                                }}
                                className="h-7 px-2.5 bg-[var(--surface-subtle)] hover:bg-[var(--surface-page)] text-[var(--text-primary)] rounded-shape-xs text-xs font-bold cursor-pointer transition-all border border-[var(--border-default)] flex items-center justify-center"
                              >
                                <span className="h-[23px] leading-[23px]">
                                  {dir === 'rtl' ? 'نسخ' : 'Copy'}
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight block">
                              {dir === 'rtl' ? 'الرقم المرجعي أو بريد الدافع *' : 'Transaction Reference / Email *'}
                            </label>
                            <input
                              type="text"
                              required
                              value={activationRefId}
                              onChange={(e) => setActivationRefId(e.target.value)}
                              placeholder="e.g. PP-581023 or sender@example.com"
                              className="w-full px-2.5 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-xs text-[10px] font-bold font-mono focus:outline-none focus:border-[var(--border-accent)] transition-all text-[var(--text-primary)]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight block">
                              {dir === 'rtl' ? 'لقطة شاشة تثبت الدفع والخصم (اختياري)' : 'Proof Screenshot / Image (Optional)'}
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              ref={activationFileInputRef}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setActivationProofFile(file);
                              }}
                              className="hidden"
                            />
                            <div
                              onClick={() => activationFileInputRef.current?.click()}
                              className="border border-dashed border-[var(--border-default)] hover:border-[var(--border-accent)] p-2 py-3 rounded-shape-xs flex flex-col items-center justify-center gap-1 bg-[var(--surface-subtle)] cursor-pointer text-center text-[9px] text-[var(--text-secondary)] group hover:text-[var(--text-primary)] transition-all"
                            >
                              <Camera size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-all" />
                              <span className="font-semibold select-none">
                                {activationProofFile ? activationProofFile.name : (dir === 'rtl' ? 'انقر لاختيار صورة إثبات بايبال' : 'Click to select PayPal screenshot')}
                              </span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isActivating}
                            className="w-full h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                              {isActivating ? (
                                <span className="flex items-center gap-1.5 text-[10px]">
                                  <RefreshCw size={11} className="animate-spin text-[var(--fg-accent)]" />
                                  {activationStep === 1 ? (dir === 'rtl' ? 'جاري رفع الملف...' : 'Uploading proof...') : (dir === 'rtl' ? 'جاري التقييد والمزامنة...' : 'Validating request...')}
                                </span>
                              ) : (
                                <>
                                  <Send size={11} className="text-[var(--fg-accent)]" />
                                  <span>{dir === 'rtl' ? 'إرسال الإثبات وتفعيل الحساب' : 'Submit Proof & Request Activation'}</span>
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Manual Bank Transfer Channel */}
                      {activationMethod === 'bank' && (
                        <div className="space-y-3 text-left">
                          <div className="p-2 border border-[var(--border-default)] bg-[var(--surface-inset)] rounded-shape-xs space-y-2 text-[9px] font-bold">
                            <span className="text-[9px] uppercase font-bold text-[var(--text-primary)] tracking-wider block">Official Bank Details</span>
                            <div className="grid grid-cols-2 gap-2 text-[9px]">
                              <div>
                                <span className="text-[var(--text-secondary)] block">Bank Name:</span>
                                <span className="text-[var(--text-primary)] block font-bold truncate">{economySettings?.bank_name || 'Bank'}</span>
                              </div>
                              <div>
                                <span className="text-[var(--text-secondary)] block">Recipient / Name:</span>
                                <span className="text-[var(--text-primary)] block font-bold truncate">{economySettings?.bank_recipient || 'Platform Operations'}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[var(--text-secondary)] block">IBAN Number:</span>
                                <span className="text-[var(--text-primary)] font-mono block font-bold select-all whitespace-normal bg-[var(--surface-subtle)] p-1 border border-[var(--border-default)] mb-1 rounded-shape-xs">{economySettings?.bank_iban || 'SA0380000000000'}</span>
                              </div>
                              {economySettings?.bank_swift && (
                                <div className="col-span-2">
                                  <span className="text-[var(--text-secondary)] block">Bank SWIFT / BIC:</span>
                                  <span className="text-[var(--text-primary)] font-mono block font-bold select-all bg-[var(--surface-subtle)] p-1 border border-[var(--border-default)] rounded-shape-xs">{economySettings.bank_swift}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight block">
                              {dir === 'rtl' ? 'اسم المحول أو الرقم المرجعي *' : 'Sender Name / Transaction ID *'}
                            </label>
                            <input
                              type="text"
                              required
                              value={activationRefId}
                              onChange={(e) => setActivationRefId(e.target.value)}
                              placeholder={dir === 'rtl' ? 'مثل: محمد أحمد / كود 58210' : 'e.g. John Doe / Ref ID 9821a'}
                              className="w-full px-2.5 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-xs text-[10px] font-bold focus:outline-none focus:border-[var(--border-accent)] transition-all text-[var(--text-primary)]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight block">
                              {dir === 'rtl' ? 'صورة إيصال التحويل البنكي (اختياري)' : 'Bank Receipt Image / Copy (Optional)'}
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              ref={activationFileInputRef}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setActivationProofFile(file);
                              }}
                              className="hidden"
                            />
                            <div
                              onClick={() => activationFileInputRef.current?.click()}
                              className="border border-dashed border-[var(--border-default)] hover:border-[var(--border-accent)] p-2 py-3 rounded-shape-xs flex flex-col items-center justify-center gap-1 bg-[var(--surface-subtle)] cursor-pointer text-center text-[9px] text-[var(--text-secondary)] group hover:text-[var(--text-primary)] transition-all"
                            >
                              <Camera size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-all" />
                              <span className="font-semibold select-none">
                                {activationProofFile ? activationProofFile.name : (dir === 'rtl' ? 'انقر لاختيار صورة إيصال البنك' : 'Click to select transaction statement receipt')}
                              </span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isActivating}
                            className="w-full h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                              {isActivating ? (
                                <span className="flex items-center gap-1.5 text-[10px]">
                                  <RefreshCw size={11} className="animate-spin text-[var(--fg-accent)]" />
                                  {activationStep === 1 ? (dir === 'rtl' ? 'جاري رفع الملف...' : 'Uploading proof...') : (dir === 'rtl' ? 'جاري التقييد والمزامنة...' : 'Validating request...')}
                                </span>
                              ) : (
                                <>
                                  <Send size={11} className="text-[var(--fg-accent)]" />
                                  <span>{dir === 'rtl' ? 'إرسال الإثبات وتفعيل الحساب' : 'Submit Proof & Request Activation'}</span>
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm text-[var(--text-secondary)] font-bold uppercase tracking-wider">{t('yourReferralLink')}</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-8 px-3 rounded-shape-sm border bg-[var(--surface-page)] border-[var(--border-default)] text-[var(--text-primary)] font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap shadow-inner flex items-center">
                    {referralLink}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`h-8 px-3 rounded-shape-sm btn-long-standard border transition-all cursor-pointer flex items-center shrink-0 ${
                      copied 
                        ? 'bg-[var(--control-active-bg)] border-[var(--border-default)] text-[var(--control-active-fg)] font-bold' 
                        : 'bg-[var(--surface-inset)] hover:bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] font-bold'
                    }`}
                  >
                    <span className="h-[23px] leading-[23px] flex items-center gap-1.5">
                      {copied ? <Check size={14} className="text-[var(--fg-accent)]" /> : <Copy size={14} className="text-[var(--fg-accent)]" />}
                      <span className="hidden sm:inline text-xs font-bold">{copied ? t('copied') : t('copy')}</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Email Invitation Form - Integrated with Status Check */}
            {wallet?.referral_activated && (
              <div className="pt-6 border-t border-[var(--border-default)] space-y-4">
                <div className="space-y-1.5" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                  <label className={`text-xs md:text-sm text-[var(--text-secondary)] font-bold uppercase tracking-wider flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <Mail size={14} className="text-[var(--fg-accent)]" />
                    <span>{dir === 'rtl' ? 'دعوة صديق عبر البريد الإلكتروني' : 'Invite Friend via Email'}</span>
                  </label>
                  <p className="text-[10px] md:text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {dir === 'rtl'
                      ? 'أدخل البريد الإلكتروني لصديقك لإرسال دعوة انضمام مهنية موثقة برمز الإحالة الخاص بك تلقائياً.'
                      : "Send an invitation directly to your peer's inbox with your referral credentials."}
                  </p>
                </div>

                <form onSubmit={handleSendInvitation} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={dir === 'rtl' ? 'البريد الإلكتروني للزميل (مثال: peer@example.com)' : 'Peer email address (e.g., peer@example.com)'}
                    className="flex-1 h-8 px-3 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-shape-sm text-xs focus:outline-none focus:border-[var(--border-accent)] font-sans text-[var(--text-primary)] transition-all"
                    disabled={isInviting}
                  />
                  <button
                    type="submit"
                    disabled={isInviting}
                    className={`h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--control-active-bg)] hover:opacity-90 text-[var(--control-active-fg)] font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      isInviting ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="h-[23px] leading-[23px] flex items-center gap-1.5">
                      {isInviting ? (
                        <RefreshCw size={13} className="animate-spin text-[var(--fg-accent)]" />
                      ) : (
                        <Send size={13} className="text-[var(--fg-accent)]" />
                      )}
                      <span>{isInviting ? (dir === 'rtl' ? 'جاري الإرسال...' : 'Sending...') : (dir === 'rtl' ? 'إرسال الدعوة' : 'Send Invite')}</span>
                    </span>
                  </button>
                </form>

                {/* Sent Invitations Ledger Log */}
                {sentInvitations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                      {dir === 'rtl' ? 'سجل الدعوات المرسلة' : 'Sent Invitations Ledger'}
                    </span>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin border border-[var(--border-default)] rounded-shape-xs bg-[var(--surface-page)]/40 p-2 md:p-3">
                      {sentInvitations.map((inv: any, invIdx: number) => (
                        <div key={`reward-inv-${inv.id || invIdx}-${invIdx}`} className="flex items-center justify-between text-[11px] py-1 border-b border-[var(--border-default)]/40 last:border-0" style={{ direction: dir === 'rtl' ? 'rtl' : 'ltr' }}>
                          <span className="font-mono text-[var(--text-secondary)] font-bold">{inv.email}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[var(--text-muted)] font-medium">
                              {new Date(inv.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-shape-xs text-[9px] font-bold uppercase bg-[var(--surface-inset)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                              {inv.status === 'reminded' ? (dir === 'rtl' ? 'تم التذكير' : 'Reminded') : (dir === 'rtl' ? 'تم الإرسال' : 'Sent')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemindInvitation(inv.email)}
                              disabled={remindingEmails[inv.email]}
                              className="h-7 px-2.5 bg-[var(--surface-inset)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] text-[10px] font-bold rounded-shape-xs transition-theme cursor-pointer flex items-center justify-center"
                            >
                              <span className="h-[23px] leading-[23px] flex items-center gap-1">
                                {remindingEmails[inv.email] ? (
                                  <RefreshCw size={10} className="animate-spin text-[var(--fg-accent)]" />
                                ) : (
                                  <Zap size={10} className="text-[var(--fg-accent)]" />
                                )}
                                <span>{dir === 'rtl' ? 'تذكير' : 'Remind'}</span>
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="group flex items-center justify-between p-4 md:p-6 rounded-shape-md border bg-[var(--surface-page)] border-[var(--border-default)] hover:border-[var(--border-accent)] transition-all shadow-2xs">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)] shrink-0">
                  <Gift size={16} className="text-[var(--fg-accent)]" />
                </div>
                <span className="font-bold text-xs md:text-sm text-[var(--text-primary)] uppercase tracking-wider">
                  {t('totalSuccessfulReferralsUser')}
                </span>
              </div>
              <span className="text-xl md:text-2xl font-bold text-[var(--text-primary)] font-mono">
                {referralCount}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Referred Friends & Deposit Verification History List */}
      <div className="rounded-shape-md p-5 md:p-8 border bg-[var(--surface-subtle)] border-[var(--border-default)] flex flex-col transition-theme shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-[var(--border-default)] pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] shrink-0">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>{dir === 'rtl' ? 'سجل الأصدقاء والعمولات' : 'Invited Friends & Verification Status'}</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium select-none">
                {dir === 'rtl' 
                  ? 'تتبع الأصدقاء المسجلين، وثائق الإثبات وعمليات المراجعة الخاصة بمدفوعاتهم.' 
                  : 'Track your invited friends, their manual deposit receipts, and verification cycles.'}
              </p>
            </div>
          </div>
          
          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
            {/* Filters (Standard 32px height container) */}
            <div className="h-8 p-0.5 rounded-shape-sm bg-[var(--surface-page)] border border-[var(--border-default)] flex items-center gap-1">
              {(['all', 'verified', 'pending', 'nodeposityet'] as const).map((filterOpt) => {
                const label = {
                  all: dir === 'rtl' ? 'الكل' : 'All',
                  verified: dir === 'rtl' ? 'مكتمل ومفعل' : 'Verified',
                  pending: dir === 'rtl' ? 'قيد المراجعة' : 'Reviewing',
                  nodeposityet: dir === 'rtl' ? 'بانتظار الإيداع' : 'Awaiting Dep.'
                }[filterOpt];
                
                return (
                  <button
                    key={`reward-filter-${filterOpt}`}
                    type="button"
                    onClick={() => setFriendsFilter(filterOpt)}
                    className={`h-7 px-2.5 rounded-shape-xs text-xs font-bold uppercase text-center transition-all cursor-pointer flex items-center justify-center ${
                      friendsFilter === filterOpt
                        ? 'bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] font-extrabold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    <span className="h-[23px] leading-[23px]">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sorting Dropdown */}
            <div className="w-36">
              <SelectDropdown
                size="sm"
                value={friendsSort}
                onChange={(val) => setFriendsSort(val as 'joined_at' | 'deposit_amount')}
                dir={dir === 'rtl' ? 'rtl' : 'ltr'}
                options={[
                  { value: 'joined_at', label: dir === 'rtl' ? 'التاريخ' : 'Date' },
                  { value: 'deposit_amount', label: dir === 'rtl' ? 'مبلغ الإيداع' : 'Deposit Amount' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingReferredFriends ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
            <RefreshCw className="animate-spin text-[var(--fg-accent)]" size={24} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {dir === 'rtl' ? 'جاري تحميل سجل الأرباح...' : 'Loading referral ledger...'}
            </span>
          </div>
        ) : (() => {
          // Filter calculation
          const filtered = referredFriends.filter((f) => {
            if (friendsFilter === 'verified') return f.referral_status === 'active';
            if (friendsFilter === 'pending') return f.referral_status === 'pending' && f.deposit_status === 'pending';
            if (friendsFilter === 'nodeposityet') return f.referral_status === 'pending' && (f.deposit_status === null || f.deposit_status === 'rejected');
            return true;
          });

          if (filtered.length === 0) {
            return (
              <div className="py-12 text-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-page)]/40">
                <Users className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" size={32} />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  {dir === 'rtl' ? 'لا توجد نتائج مطابقة لتصفيتك' : 'No Friends Fit This Filter'}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
                  {dir === 'rtl' 
                    ? 'الأصدقاء المسجلين برابط إحالتك سيظهرون هنا لتتبع الإيداع وتأكيد نقاط العمليات.' 
                    : 'Invitees will represent dynamic ledger lines here to monitor deposit checks and verified reward claims.'}
                </p>
              </div>
            );
          }

          const sortedAndFiltered = [...filtered].sort((a, b) => {
            if (friendsSort === 'joined_at') {
              const dateA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
              const dateB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
              return dateB - dateA;
            } else if (friendsSort === 'deposit_amount') {
              const amountA = Number(a.deposit_amount || 0);
              const amountB = Number(b.deposit_amount || 0);
              return amountB - amountA;
            }
            return 0;
          });

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-extrabold select-none">
                    <th className={`pb-3 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {dir === 'rtl' ? 'المستخدم' : 'User'}
                    </th>
                    <th className={`pb-3 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {dir === 'rtl' ? 'تاريخ التسجيل' : 'Registration Date'}
                    </th>
                    <th className={`pb-3 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {dir === 'rtl' ? 'التحقق من الإيداع' : 'Deposit Verification'}
                    </th>
                    <th className={`pb-3 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {dir === 'rtl' ? 'حالة العمولة' : 'Commissions / Balance'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]/50">
                  {sortedAndFiltered.map((friend, fIdx) => {
                    // Decide deposit badge styling
                    let depBadgeProps = {
                      bg: 'bg-[var(--surface-inset)] border-[var(--border-default)] text-[var(--text-secondary)]',
                      label: dir === 'rtl' ? 'بانتظار الإيداع' : 'Pending First Deposit'
                    };
                    if (friend.referral_status === 'active') {
                      depBadgeProps = {
                        bg: 'bg-[var(--surface-inset)] border-[var(--border-default)] text-[var(--text-primary)]',
                        label: dir === 'rtl' ? 'مقبول وتم التأكيد' : 'Approved & Verified'
                      };
                    } else if (friend.deposit_status === 'pending') {
                      depBadgeProps = {
                        bg: 'bg-[var(--bg-attention-muted)] border-[var(--border-default)] text-[var(--fg-attention)]',
                        label: dir === 'rtl' ? 'قيد المراجعة اليدوية' : 'Under Review'
                      };
                    } else if (friend.deposit_status === 'rejected') {
                      depBadgeProps = {
                        bg: 'bg-red-500/10 border-red-500/20 text-red-500',
                        label: dir === 'rtl' ? 'مرفوض إدارياً' : 'Rejected Proof'
                      };
                    }

                    // Decide referral reward / status props
                    let refStatusProps = {
                      bg: 'bg-[var(--bg-attention-muted)] text-[var(--fg-attention)] border border-[var(--border-default)]',
                      label: dir === 'rtl' ? 'قيد الانتظار' : 'Pending Activation'
                    };
                    if (friend.referral_status === 'active') {
                      refStatusProps = {
                        bg: 'bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)]',
                        label: dir === 'rtl' ? 'مكافأة مكتسبة' : 'Earned & Counted'
                      };
                    } else {
                      refStatusProps = {
                        bg: 'bg-[var(--surface-inset)] text-[var(--text-muted)] border border-[var(--border-default)]',
                        label: dir === 'rtl' ? 'غير مسدد' : 'Inactive Account'
                      };
                    }

                    return (
                      <tr key={`friend-row-${friend.referral_id || friend.id || fIdx}-${fIdx}`} className="hover:bg-[var(--surface-page)]/40 transition-theme">
                        <td className="py-4 pr-3">
                          <div className={`flex items-center gap-3 ${dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                            <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xs uppercase border border-[var(--border-default)] select-none shrink-0">
                              {friend.name ? friend.name.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-[var(--text-primary)] text-sm">{friend.name}</div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">{friend.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          <span className="block font-semibold text-[var(--text-primary)]">
                            {new Date(friend.joined_at).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono block mt-0.5">
                            {new Date(friend.joined_at).toLocaleTimeString(dir === 'rtl' ? 'ar-EG' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className={`py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          <div className="inline-flex flex-col">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-shape-xs text-[9px] font-bold border uppercase tracking-wider ${depBadgeProps.bg}`}>
                              {depBadgeProps.label}
                            </span>
                            {friend.deposit_rejection_reason && friend.deposit_status === 'rejected' && (
                              <span className="text-[8px] text-red-400 mt-1 max-w-[150px] break-words">
                                {dir === 'rtl' ? 'السبب: ' : 'Reason: '}{friend.deposit_rejection_reason}
                              </span>
                            )}
                            {friend.deposit_status === 'pending' && friend.deposit_method && (
                              <span className="text-[8px] text-[var(--text-muted)] mt-1 uppercase font-mono">
                                {friend.deposit_method} • ${Number(friend.deposit_amount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`py-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-shape-xs text-[9px] font-bold uppercase tracking-wider ${refStatusProps.bg}`}>
                                {refStatusProps.label}
                              </span>
                              {friend.referral_status === 'pending' && (
                                <button
                                  onClick={() => handleRemindInvitation(friend.email)}
                                  disabled={remindingEmails[friend.email]}
                                  className="h-7 px-2.5 rounded-shape-xs text-[10px] font-bold uppercase bg-[var(--surface-inset)] text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] transition-theme cursor-pointer flex items-center justify-center"
                                >
                                  <span className="h-[23px] leading-[23px] flex items-center gap-1">
                                    {remindingEmails[friend.email] ? (
                                      <RefreshCw size={10} className="animate-spin text-[var(--fg-accent)]" />
                                    ) : (
                                      <Zap size={10} className="text-[var(--fg-accent)]" />
                                    )}
                                    <span>{dir === 'rtl' ? 'تذكير' : 'Remind'}</span>
                                  </span>
                                </button>
                              )}
                            </div>
                            {friend.referral_status === 'active' && (
                              <span className="block text-[10px] text-[var(--fg-accent)] font-extrabold tracking-tight">
                                +{Number(friend.bonus_points || 0).toLocaleString()} PTS
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* KYC Verification Card */}
      {contextUser?.kyc_required && contextUser?.kyc_status !== 'verified' && (
        <div className={`rounded-shape-md p-5 md:p-6 border transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] col-span-1 md:col-span-2 shadow-2xs ${
          contextUser?.kyc_status === 'pending' ? 'bg-[var(--surface-inset)] border-[var(--border-default)]' : 
          contextUser?.kyc_status === 'rejected' ? 'bg-red-500/5 border-red-500/20 shadow-red-500/5' : ''
        }`}>
          
          {contextUser?.kyc_status === 'pending' ? (
            <div className="flex flex-col items-center text-center py-6 md:py-8 space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-shape-md bg-[var(--surface-inset)] flex items-center justify-center border border-[var(--border-default)]">
                  <ShieldCheck size={28} className="text-[var(--fg-accent)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-shape-xs bg-[var(--surface-card)] border-2 border-[var(--surface-page)] flex items-center justify-center">
                  <Clock size={12} className="text-amber-500" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-2xl px-2">
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                  {dir === 'rtl' ? 'تم إرسال طلب التحقق بنجاح' : 'Verification Request Submitted'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {dir === 'rtl' 
                    ? 'يتم فحص الوثائق لمطابقة المعايير التنظيمية. يتم تحديث حالة الحساب تلقائياً فور اكتمال المراجعة.' 
                    : 'Documents are being reviewed against compliance standards. Account status will update automatically upon completion.'}
                </p>
              </div>

              <div className="mt-4 p-4 rounded-shape-sm border flex flex-col md:flex-row items-center gap-3.5 max-w-3xl bg-[var(--surface-page)]/50 border-[var(--border-default)]">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] flex items-center justify-center text-[var(--text-primary)] flex-shrink-0">
                  <Lock size={15} />
                </div>
                <div className={`text-xs leading-relaxed ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  <p className="font-bold text-[var(--text-primary)] mb-1 text-xs">
                    {dir === 'rtl' ? 'معايير حماية وخصوصية البيانات' : 'Data Privacy & Security Standards'}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[11px] opacity-85">
                    {dir === 'rtl'
                      ? 'تُعالج البيانات وفقاً لبروتوكولات التشفير المعتمدة، ولا يتم استخدامها إلا لأغراض التحقق النظامي من الهوية.'
                      : 'Data is processed following strict encryption standards and is utilized solely for regulatory identity verification.'}
                  </p>
                </div>
              </div>
            </div>
          ) : contextUser?.kyc_status === 'rejected' ? (
            <div className="flex flex-col items-center text-center py-6 md:py-8 space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-shape-md bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <XCircle size={28} className="text-red-500" />
                </div>
              </div>

              <div className="space-y-2 max-w-2xl px-2">
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                  {dir === 'rtl' ? 'تعذر قبول طلب التحقق' : 'Verification Request Not Accepted'}
                </h3>
                {contextUser?.kyc_rejection_reason && (
                  <div className="p-3 rounded-shape-sm border bg-red-500/5 border-red-500/20 text-red-500 text-xs font-medium">
                    <p className="text-[10px] uppercase tracking-wider text-red-400 mb-0.5 font-bold">
                      {t('kycRejectionReason')}
                    </p>
                    {contextUser.kyc_rejection_reason}
                  </div>
                )}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {dir === 'rtl' 
                    ? 'يرجى مراجعة سبب الرفض وإعادة المحاولة ببيانات مطابقة وواضحة.' 
                    : 'Please review the reason above and retry with clear and accurate documentation.'}
                </p>
                <button 
                  onClick={() => {
                    setUser({ ...contextUser, kyc_status: 'none' });
                    setSelfieCaptured(false);
                    setSelfieData(null);
                    setKycFullName('');
                  }}
                  className="mt-3 h-8 px-4 rounded-shape-sm btn-long-standard bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] font-bold text-xs transition-theme shadow-2xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <span className="h-[23px] leading-[23px] flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-[var(--fg-accent)]" />
                    <span>{dir === 'rtl' ? 'إعادة المحاولة' : 'Try Again'}</span>
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Side: Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-default)] flex-shrink-0">
                    <ShieldCheck size={16} className="text-[var(--fg-accent)]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)]">
                        {t('kycVerification')}
                      </h3>
                      <span className="px-2 py-0.5 rounded-shape-xs text-[10px] font-bold border bg-[var(--surface-page)]/50 border-[var(--border-default)] text-[var(--text-secondary)]">
                        {t('kycThresholdNote')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {t('kycDescription')}
                </p>

                <div className="p-3 rounded-shape-sm border flex items-start gap-2.5 bg-[var(--surface-page)] border-[var(--border-default)]">
                  <Lock className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" size={14} />
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                    {t('selfieSecurityNote')}
                  </p>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="flex-1 space-y-3">
                {/* Full Name Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    {t('fullNameAsPerIdUser')}
                  </label>
                  <div className="h-8 relative flex items-center rounded-shape-sm border transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] focus-within:border-[var(--border-accent)]">
                    <input 
                      type="text"
                      value={kycFullName || ''}
                      onChange={(e) => setKycFullName(e.target.value)}
                      className={`w-full h-full bg-transparent px-3 text-xs font-medium text-[var(--text-primary)] focus:outline-none ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                      dir="auto"
                    />
                  </div>
                </div>

                {/* Selfie Button */}
                <div className="space-y-2">
                  {isCapturing && !selfieCaptured ? (
                    <div className="space-y-2">
                      <video ref={videoRef} className="w-full rounded-shape-sm bg-[var(--surface-inset)]" autoPlay playsInline />
                      <button 
                        onClick={captureImage}
                        className="w-full h-8 rounded-shape-sm btn-long-standard bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] font-bold text-xs cursor-pointer transition-theme flex items-center justify-center"
                      >
                        <span className="h-[23px] leading-[23px] flex items-center justify-center">
                          {t('capture')}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={startCamera}
                      disabled={selfieCaptured}
                      className={`w-full h-8 flex items-center justify-center gap-2 rounded-shape-sm border border-dashed transition-theme ${
                        selfieCaptured 
                          ? 'border-[var(--border-default)] bg-[var(--surface-inset)] text-[var(--text-primary)] cursor-default'
                          : 'border-[var(--border-default)] hover:border-[var(--border-accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="h-[23px] leading-[23px] flex items-center justify-center gap-2 text-xs">
                        {selfieCaptured ? (
                          <>
                            <CheckCircle2 size={14} className="text-[var(--fg-accent)]" />
                            <span className="font-bold">{t('selfieCaptured')}</span>
                          </>
                        ) : (
                          <>
                            <Camera size={14} className="text-[var(--text-muted)]" />
                            <span className="font-bold">{t('takeSelfieWithId')}</span>
                          </>
                        )}
                      </span>
                    </button>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Submit Button */}
                <button 
                  onClick={handleSubmitKYC}
                  disabled={!kycFullName.trim() || !selfieCaptured || isSubmitting}
                  className={`w-full h-8 rounded-shape-sm btn-long-standard font-bold text-xs transition-theme cursor-pointer flex items-center justify-center gap-1.5 ${
                    !kycFullName.trim() || !selfieCaptured || isSubmitting
                      ? 'opacity-50 cursor-not-allowed bg-[var(--surface-inset)] text-[var(--text-muted)] border border-[var(--border-default)]'
                      : 'bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] shadow-2xs'
                  }`}
                >
                  <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                    {isSubmitting ? (
                      <RefreshCw className="animate-spin text-[var(--fg-accent)]" size={14} />
                    ) : (
                      <ShieldCheck size={14} className="text-[var(--fg-accent)]" />
                    )}
                    <span>
                      {isSubmitting 
                        ? (dir === 'rtl' ? 'جاري الإرسال...' : 'Sending...') 
                        : t('submitKyc')}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction History Footer */}
      <div className="pt-4 md:pt-6 space-y-4">
        
        {/* Transaction History */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] flex items-center justify-center text-[var(--fg-accent)] border border-[var(--border-default)]">
                <History size={16} />
              </div>
              <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)]">{t('transactionHistory')}</h3>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={handleClearHistory}
                disabled={isSubmitting}
                className="h-8 px-3 rounded-shape-sm btn-long-standard border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-theme disabled:opacity-50 cursor-pointer flex items-center justify-center"
              >
                <span className="h-[23px] leading-[23px] flex items-center gap-1.5">
                  <RefreshCw size={12} className={isSubmitting ? "animate-spin" : ""} />
                  <span>{dir === 'rtl' ? 'مسح السجل' : 'Clear History'}</span>
                </span>
              </button>
            )}
          </div>
          
          <div className="overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)] shadow-2xs">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="text-[10px] uppercase bg-[var(--surface-page)]/40 text-[var(--text-muted)] border-b border-[var(--border-default)]">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-bold whitespace-nowrap">{t('type')}</th>
                    <th scope="col" className="px-4 py-2.5 font-bold whitespace-nowrap">{t('amount')}</th>
                    <th scope="col" className="px-4 py-2.5 font-bold whitespace-nowrap">{t('description')}</th>
                    <th scope="col" className="px-4 py-2.5 font-bold whitespace-nowrap">{t('date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-xs text-[var(--text-muted)]">
                        {t('noTransactionsYet')}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {transactions.map((tx, txIdx) => {
                        const pts = Number(tx.points || 0);
                        const amt = Number(tx.amount || 0);
                        const hasPoints = pts !== 0;
                        const hasAmount = amt !== 0;

                        const badgeClass = getTxTypeBadgeClass(tx.transaction_type, pts, amt);
                        const label = getTxLabel(tx.transaction_type, dir === 'rtl');

                        return (
                          <tr key={`rewards-tx-${tx.id || txIdx}-${txIdx}`} className="hover:bg-[var(--surface-page)]/20 transition-colors">
                            <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-shape-xs text-[10px] font-semibold ${badgeClass}`}>
                                {label}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-[var(--text-primary)] whitespace-nowrap">
                              {hasPoints ? (
                                <span className={pts > 0 ? 'text-[var(--text-primary)] font-bold' : 'text-rose-500 font-bold'}>
                                  {pts > 0 ? '+' : ''}{pts.toLocaleString()} PTS
                                </span>
                              ) : hasAmount ? (
                                <span className={amt > 0 ? 'text-[var(--text-primary)] font-bold' : 'text-rose-500 font-bold'}>
                                  {amt > 0 ? '+' : '-'}${Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)] font-medium">0 PTS</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap text-xs">{getTranslatedDescription(tx.description, dir === 'rtl')}</td>
                             <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap text-xs">
                              <span className="block font-semibold">
                                {new Date(tx.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="text-[9px] text-[var(--text-muted)] font-mono block mt-0.5">
                                {new Date(tx.created_at).toLocaleTimeString(dir === 'rtl' ? 'ar-EG' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {hasMoreTx && (
                        <tr>
                          <td colSpan={4} className="px-6 py-3 text-center">
                            <button 
                              onClick={() => setTxOffset(prev => prev + TX_LIMIT)}
                              className="h-8 px-4 rounded-shape-sm btn-long-standard border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs mx-auto transition-theme cursor-pointer flex items-center justify-center"
                            >
                              <span className="h-[23px] leading-[23px] flex items-center gap-2">
                                <RefreshCw size={13} className={`text-[var(--fg-accent)] ${isSubmitting ? "animate-spin" : ""}`} />
                                <span>{t('loadMore')}</span>
                              </span>
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Convert Points Modal */}
      {isConvertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-sm"
              onClick={() => setIsConvertModalOpen(false)}
            />
            
            {/* Modal Content */}
            <div 
              onTouchStart={swipeHandlers.onTouchStart}
              onTouchMove={swipeHandlers.onTouchMove}
              onTouchEnd={swipeHandlers.onTouchEnd}
              className="relative w-full max-w-md rounded-shape-md p-5 md:p-6 shadow-2xl bg-[var(--surface-card)] border border-[var(--border-default)] z-10"
            >
              
              {/* Header */}
              <div className="flex items-center justify-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-inset)] flex items-center justify-center text-[var(--fg-accent)] border border-[var(--border-default)]">
                  <Zap size={16} />
                </div>
                <h2 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                  {t('convertPoints')}
                </h2>
              </div>

              {/* Input Area */}
              <div className="space-y-1.5 mb-5">
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  {t('numberOfPoints')}
                </label>
                <div className="h-8 relative flex items-center rounded-shape-sm border transition-theme bg-[var(--surface-subtle)] border-[var(--border-default)] focus-within:border-[var(--border-accent)]">
                  <input 
                    type="text"
                    value={convertAmount || ''}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className={`w-full h-full bg-transparent px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                    dir="ltr"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {t('currentBalancePoints').replace('{points}', Math.floor(wallet.points || 0).toLocaleString())}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 mt-5">
                <button 
                  onClick={() => setIsConvertModalOpen(false)}
                  className="flex-1 h-8 rounded-shape-sm btn-long-standard font-bold text-xs transition-theme text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] cursor-pointer flex items-center justify-center"
                >
                  <span className="h-[23px] leading-[23px]">
                    {t('cancel')}
                  </span>
                </button>
                <button 
                  onClick={handleConvertPoints}
                  disabled={isSubmitting}
                  className="flex-[2] h-8 rounded-shape-sm btn-long-standard font-bold text-xs transition-theme bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] cursor-pointer disabled:opacity-50 shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <span className="h-[23px] leading-[23px] flex items-center justify-center gap-1.5">
                    {isSubmitting ? <RefreshCw className="animate-spin text-[var(--fg-accent)]" size={13} /> : null}
                    <span>{t('confirmConversion')}</span>
                  </span>
                </button>
              </div>

            </div>
          </div>
      )}

      {/* Premium custom confirmation modal for clearing transaction history */}
      {isClearHistoryConfirmOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
              onClick={() => setIsClearHistoryConfirmOpen(false)}
              className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-sm"
            />
            
            <div
              className="relative max-w-sm w-full p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xl transition-theme z-10"
            >
              <div className="flex items-center gap-2 text-[var(--fg-danger)]">
                <div className="w-8 h-8 rounded-shape-sm bg-red-500/10 flex items-center justify-center text-[var(--fg-danger)] border border-red-500/20 flex-shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <h3 className="text-sm font-bold font-sans">
                  {dir === 'rtl' ? 'مسح سجل المعاملات؟' : 'Clear Transaction History?'}
                </h3>
              </div>
              
              <p className="text-xs mt-2.5 font-sans leading-relaxed text-[var(--text-secondary)]">
                {dir === 'rtl' 
                  ? 'هل أنت متأكد من رغبتك في مسح سجل المعاملات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.' 
                  : 'Are you sure you want to clear your entire transaction history? This action is irreversible.'}
              </p>
              
              <div className={`flex justify-end gap-2 mt-5 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => setIsClearHistoryConfirmOpen(false)}
                  className="h-8 px-3 rounded-shape-sm btn-long-standard text-xs font-bold font-sans transition-theme text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center"
                >
                  <span className="h-[23px] leading-[23px]">
                    {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={handleClearHistoryConfirm}
                  className="h-8 px-3 rounded-shape-sm btn-long-standard text-xs font-bold bg-[var(--status-danger)] hover:opacity-90 text-white rounded-shape-sm font-sans transition-theme shadow-2xs flex items-center justify-center"
                >
                  <span className="h-[23px] leading-[23px]">
                    {dir === 'rtl' ? 'تأكيد المسح' : 'Confirm Clear'}
                  </span>
                </button>
              </div>
            </div>
          </div>
      )}

    </div>
  );
};
