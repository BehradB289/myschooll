import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, doc, setDoc, deleteDoc, getDocs, orderBy
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { 
  Activity, Users, Award, Plus, Trash2, 
  LogOut, CheckCircle, Smartphone, MessageSquare, 
  ChevronDown, ChevronUp, RefreshCw,
  Send, AlertCircle, Download, Check, Maximize,
  Search, Moon, Sun, Filter, Zap, X,
  ClipboardList, Palette, Heart, Leaf, Hourglass, 
  BookOpen, Trophy, Atom, FlaskConical, Cpu, 
  Music, Camera, Globe, HelpCircle
} from 'lucide-react';

/* --- تنظیمات فایربیس (اصلاح شده برای محیط اجرا) --- */
// استفاده از تنظیمات محیطی به جای مقادیر هاردکد شده برای رفع ارور 400
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'school-exhibit-default';

// --- لیست دسته‌بندی‌های رای‌گیری (۳ گزینه) ---
const VOTE_CATEGORIES = [
  { id: 'تکنولوژی', icon: <Smartphone size={24} />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500' },
  { id: 'فرهنگی', icon: <Hourglass size={24} />, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-500' },
  { id: 'سرگرمی آموزشی', icon: <Atom size={24} />, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-500' },
];

// --- کامپوننت‌های UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-md ${className}`}>{children}</div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, title="" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 text-sm active:scale-95";
  const variants = {
    primary: "bg-teal-700 text-white hover:bg-teal-800 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md",
    outline: "border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:border-teal-600 hover:text-teal-600 bg-white dark:bg-slate-800",
    ghost: "text-gray-500 hover:text-teal-600 hover:bg-gray-100 dark:hover:bg-slate-700"
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ placeholder, value, onChange, type = "text", className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-gray-50 dark:bg-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 ${className}`}
  />
);

const TextArea = ({ placeholder, value, onChange, className = "" }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={3}
    className={`w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-gray-50 dark:bg-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 resize-none ${className}`}
  />
);

// --- Modal Component ---
const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = "danger", confirmText = "بله، مطمئنم" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        <div className={`p-4 ${type === 'danger' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-teal-50 dark:bg-teal-900/30'} flex items-center gap-3 border-b border-gray-100 dark:border-slate-800`}>
           {type === 'danger' ? <AlertCircle className="text-red-600" /> : <CheckCircle className="text-teal-600" />}
           <h3 className={`font-bold text-lg ${type === 'danger' ? 'text-red-700 dark:text-red-400' : 'text-teal-700 dark:text-teal-400'}`}>{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-slate-300 text-base leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>انصراف</Button>
          <Button variant={type === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} className={type === 'danger' ? "!bg-red-600 !text-white hover:!bg-red-700" : ""}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Toast Notification ---
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white animate-in slide-in-from-bottom duration-300 ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
    {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

// --- Full Screen Projector ---
const ProjectorView = ({ projectResults, voteCounts, onClose, totalVotes }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white overflow-y-auto p-8 flex flex-col font-sans" dir="rtl">
            <div className="flex justify-between items-center mb-10 border-b border-slate-700 pb-4">
                <div>
                    <h1 className="text-4xl font-black text-teal-400 mb-2">تابلو نتایج زنده</h1>
                    <p className="text-slate-400 text-xl">مدرسه علوم پزشکی شیراز</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700">
                        <span className="block text-sm text-slate-400">تعداد کل آرا</span>
                        <span className="text-3xl font-bold text-yellow-400">{totalVotes}</span>
                    </div>
                    <button onClick={onClose} className="p-3 bg-red-600/20 hover:bg-red-600 rounded-full transition-all">
                        <X size={32} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                {/* Top 5 Podium */}
                <div className="lg:col-span-2 bg-slate-800/50 rounded-3xl p-8 border border-slate-700">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Award className="text-yellow-400" size={32}/>
                        برترین‌های نمایشگاه
                    </h2>
                    <div className="space-y-4">
                        {projectResults.slice(0, 5).map((p, idx) => (
                            <div key={p.id} className="flex items-center gap-6 p-4 bg-slate-800 rounded-2xl border border-slate-700 transform hover:scale-[1.01] transition-all">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-600 text-amber-100' : 'bg-slate-700 text-slate-300'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold mb-1">{p.name}</h3>
                                    <p className="text-slate-400 text-lg">{p.student}</p>
                                </div>
                                <div className="text-center px-4">
                                    <div className="text-sm text-slate-400">امتیاز</div>
                                    <div className="text-3xl font-bold text-teal-400">{p.totalScore}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Activity className="text-blue-400" size={32}/>
                        آمار بازدید (محبوب‌ترین‌ها)
                    </h2>
                    <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2">
                        {Object.entries(voteCounts)
                           .sort(([,a], [,b]) => b - a)
                           .slice(0, 8) // Show top 8 categories
                           .map(([catName, count]) => {
                             const catInfo = VOTE_CATEGORIES.find(c => c.id === catName) || { color: 'text-gray-400', bg: 'bg-gray-500', icon: <Activity size={24}/> };
                             
                            return (
                            <div key={catName}>
                                <div className="flex justify-between text-lg mb-2 font-medium">
                                    <span className="flex items-center gap-2">{catInfo.icon} {catName}</span>
                                    <span>{count}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                                    <div className={`h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-1000`} style={{ width: `${totalVotes ? (count / totalVotes) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function SchoolExhibitionApp() {
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState("login"); 
  const [projects, setProjects] = useState([]);
  const [votes, setVotes] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [projectorMode, setProjectorMode] = useState(false);
  
  // Modal State
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null });
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");

  // Local Draft State
  const [draftScores, setDraftScores] = useState({});

  // Admin inputs
  const [newProjectName, setNewProjectName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  const mounted = useRef(false);

  // --- Helper Functions ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleDarkMode = () => {
      setDarkMode(!darkMode);
      document.documentElement.classList.toggle('dark');
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const openConfirmModal = (title, message, onConfirm, type = 'danger', confirmText) => {
      setModal({ isOpen: true, title, message, onConfirm: () => { onConfirm(); closeModal(); }, type, confirmText });
  };

  // --- Firebase Init & Auth (Fixed) ---
  useEffect(() => {
    mounted.current = true;
    const initAuth = async () => {
      try {
        // اولویت اول: ورود با توکن اختصاصی (برای رفع مشکل 400)
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // اولویت دوم: ورود ناشناس
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        // تلاش مجدد در صورت خطا
        if (!auth.currentUser) {
            try {
                await signInAnonymously(auth);
            } catch (innerError) {
                console.error("Fallback Auth Failed:", innerError);
            }
        }
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!mounted.current) return;
      setUser(currentUser);
      if (currentUser) {
        setLoading(false);
        const storedName = localStorage.getItem(`user_name_${appId}`);
        const storedRole = localStorage.getItem(`user_role_${appId}`);
        if (storedName) {
          setUserName(storedName);
          if (storedRole === 'admin') {
            setIsAdmin(true);
            setView('admin');
          } else {
            setView('vote');
          }
        }
      }
    });
    return () => { 
        unsubscribe(); 
        mounted.current = false;
    };
  }, []);

  // --- Real-time Data Fetching ---
  useEffect(() => {
    if (!user) return;
    
    // استفاده از ساختار استاندارد کالکشن‌ها برای جلوگیری از ارورهای پرمیشن
    const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
    const votesRef = collection(db, 'artifacts', appId, 'public', 'data', 'path_votes');
    const scoresRef = collection(db, 'artifacts', appId, 'public', 'data', 'scores');

    try {
        const unsubProjects = onSnapshot(query(projectsRef, orderBy('createdAt', 'desc')), 
          (snap) => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
          (err) => console.error("Projects Error:", err)
        );

        const unsubVotes = onSnapshot(query(votesRef), 
          (snap) => setVotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
          (err) => console.error("Votes Error:", err)
        );

        const unsubScores = onSnapshot(query(scoresRef), 
          (snap) => setScores(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
          (err) => console.error("Scores Error:", err)
        );

        return () => { unsubProjects(); unsubVotes(); unsubScores(); };
    } catch (e) { console.error(e); }
  }, [user]);

  // --- Handlers ---
  const handleLogin = () => {
    if (!userName.trim()) {
        showToast("لطفا نام خود را وارد کنید", "error");
        return;
    }
    if (adminPassword === "admin123") {
      setIsAdmin(true);
      setView("admin");
      localStorage.setItem(`user_role_${appId}`, 'admin');
    } else {
      setIsAdmin(false);
      setView("vote");
      localStorage.setItem(`user_role_${appId}`, 'judge');
    }
    localStorage.setItem(`user_name_${appId}`, userName);
    showToast("خوش آمدید!");
  };

  const handleLogout = () => {
    localStorage.removeItem(`user_name_${appId}`);
    localStorage.removeItem(`user_role_${appId}`);
    setUserName("");
    setAdminPassword("");
    setIsAdmin(false);
    setView("login");
  };

  // --- Database Wipe ---
  const handleDatabaseReset = () => {
      openConfirmModal(
          "پاکسازی کامل سیستم",
          "آیا مطمئن هستید؟ \nاین کار تمام آرا و نمرات ثبت شده را برای همیشه پاک می‌کند و قابل بازگشت نیست!",
          async () => {
              setTimeout(() => {
                  openConfirmModal(
                    "تایید نهایی",
                    "برای اطمینان مجدد: آیا واقعا می‌خواهید همه چیز را صفر کنید؟",
                    async () => {
                        setLoading(true);
                        try {
                            // Fetch snapshots securely
                            const votesRef = collection(db, 'artifacts', appId, 'public', 'data', 'path_votes');
                            const scoresRef = collection(db, 'artifacts', appId, 'public', 'data', 'scores');
                            
                            const voteSnapshot = await getDocs(votesRef);
                            const scoreSnapshot = await getDocs(scoresRef);
                            
                            // Delete in parallel
                            const deletePromises = [
                                ...voteSnapshot.docs.map(d => deleteDoc(d.ref)),
                                ...scoreSnapshot.docs.map(d => deleteDoc(d.ref))
                            ];
                            
                            await Promise.all(deletePromises);
                            showToast("دیتابیس با موفقیت پاکسازی شد", "success");
                        } catch (error) {
                            console.error(error);
                            showToast("خطا در پاکسازی دیتابیس", "error");
                        }
                        setLoading(false);
                    }, 'danger', "بله، همه چیز را پاک کن"
                  )
              }, 200);
          },
          'danger',
          "بله، ادامه بده"
      );
  };

  const toggleProjectorMode = () => {
      if (!projectorMode) {
          setProjectorMode(true);
          document.documentElement.requestFullscreen().catch((e) => console.log("Fullscreen request failed:", e));
      } else {
          setProjectorMode(false);
          document.exitFullscreen().catch((e) => console.log("Fullscreen exit failed:", e));
      }
  };

  const submitPathVote = async (category) => {
    if (!user) return;
    const existingVote = votes.find(v => v.userId === user.uid);
    const data = { userId: user.uid, userName, category, timestamp: new Date() };
    const votesRef = collection(db, 'artifacts', appId, 'public', 'data', 'path_votes');
    
    try {
        if (existingVote) {
            await setDoc(doc(votesRef, existingVote.id), data, { merge: true });
        } else {
            await addDoc(votesRef, data);
        }
        setView("judge");
        showToast(`مسیر ${category} انتخاب شد`);
    } catch (e) {
        showToast("خطا در ثبت رای", "error");
    }
  };

  const handleDraftChange = (projectId, field, value) => {
      setDraftScores(prev => ({
          ...prev,
          [projectId]: {
              ...prev[projectId],
              [field]: field === 'comment' ? value : parseInt(value)
          }
      }));
  };

  const submitScoreToDB = async (projectId) => {
    if (!user) return;
    const draft = draftScores[projectId];
    const existingScore = scores.find(s => s.projectId === projectId && s.judgeId === user.uid) || {};
    
    const dataToSave = {
        behavior: draft?.behavior !== undefined ? draft.behavior : (existingScore.behavior || 0),
        work: draft?.work !== undefined ? draft.work : (existingScore.work || 0),
        comment: draft?.comment !== undefined ? draft.comment : (existingScore.comment || ""),
    };

    const scoreId = `${user.uid}_${projectId}`;
    const scoresRef = collection(db, 'artifacts', appId, 'public', 'data', 'scores');

    try {
        await setDoc(doc(scoresRef, scoreId), {
          projectId,
          judgeId: user.uid,
          judgeName: userName,
          updatedAt: new Date(),
          ...dataToSave
        }, { merge: true });

        const newDrafts = {...draftScores};
        delete newDrafts[projectId];
        setDraftScores(newDrafts);

        showToast("رای شما با موفقیت ثبت شد");
    } catch (e) {
        showToast("خطا در ثبت امتیاز", "error");
    }
  };

  const addProject = async () => {
    if (!newProjectName || !newStudentName) return;
    const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
    try {
        await addDoc(projectsRef, {
          name: newProjectName,
          student: newStudentName,
          createdAt: new Date()
        });
        setNewProjectName("");
        setNewStudentName("");
        showToast("پروژه جدید اضافه شد");
    } catch (e) {
        showToast("خطا در افزودن پروژه", "error");
    }
  };

  const deleteProject = (id) => {
    openConfirmModal(
        "حذف پروژه",
        "آیا از حذف این پروژه و تمام سوابق آن اطمینان دارید؟",
        async () => {
            const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
            try {
                await deleteDoc(doc(projectsRef, id));
                showToast("پروژه با موفقیت حذف شد");
            } catch (e) {
                showToast("خطا در حذف پروژه", "error");
            }
        },
        'danger',
        "بله، حذف شود"
    );
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Project Name,Student,Vote Count,Total Score,Avg Behavior,Avg Work\n";
    projectResults.forEach((p, index) => {
        csvContent += `${index + 1},${p.name},${p.student},${p.voteCount},${p.totalScore},${p.avgBehavior},${p.avgWork}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "exhibition_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Calculations ---
  const voteCounts = useMemo(() => {
    const counts = {};
    VOTE_CATEGORIES.forEach(cat => counts[cat.id] = 0);
    
    votes.forEach(v => {
      if (counts[v.category] !== undefined) {
          counts[v.category]++;
      } else {
          counts[v.category] = (counts[v.category] || 0) + 1;
      }
    });
    return counts;
  }, [votes]);

  const projectResults = useMemo(() => {
    let processed = projects.map(p => {
      const pScores = scores.filter(s => s.projectId === p.id);
      let totalBehavior = 0, totalWork = 0;
      pScores.forEach(s => { totalBehavior += (s.behavior || 0); totalWork += (s.work || 0); });
      const count = pScores.length;

      return {
        ...p,
        totalScore: totalBehavior + totalWork,
        avgBehavior: count ? (totalBehavior / count).toFixed(1) : 0,
        avgWork: count ? (totalWork / count).toFixed(1) : 0,
        voteCount: count,
        details: pScores
      };
    });

    if (searchQuery) {
        processed = processed.filter(p => 
            p.name.includes(searchQuery) || p.student.includes(searchQuery)
        );
    }

    processed.sort((a, b) => {
        if (sortBy === 'score') return b.totalScore - a.totalScore;
        if (sortBy === 'votes') return b.voteCount - a.voteCount;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
    });

    return processed;
  }, [projects, scores, searchQuery, sortBy]);

  const judgeProgress = useMemo(() => {
     if (!projects.length) return 0;
     const judgedCount = projects.filter(p => scores.some(s => s.projectId === p.id && s.judgeId === user?.uid)).length;
     return Math.round((judgedCount / projects.length) * 100);
  }, [projects, scores, user]);

  const latestActivities = useMemo(() => {
      const all = [...votes.map(v => ({...v, type: 'vote', time: v.timestamp})), 
                   ...scores.map(s => ({...s, type: 'score', time: s.updatedAt}))].filter(a => a.time);
      
      return all.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
  }, [votes, scores]);


  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 text-teal-700 font-bold animate-pulse">در حال پردازش داده‌ها...</div>;

  return (
    <div dir="rtl" className="font-sans">
        <Modal 
            isOpen={modal.isOpen} 
            title={modal.title} 
            message={modal.message} 
            onConfirm={modal.onConfirm}
            onCancel={closeModal}
            type={modal.type}
            confirmText={modal.confirmText}
        />

        {projectorMode && isAdmin ? (
            <ProjectorView projectResults={projectResults} voteCounts={voteCounts} totalVotes={votes.length} onClose={toggleProjectorMode} />
        ) : view === "login" ? (
            // --- LOGIN VIEW ---
            <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-teal-700 to-blue-900'}`}>
                <button onClick={toggleDarkMode} className="absolute top-4 left-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
                    {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                </button>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <Card className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300 !border-0 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500"></div>
                <div className="text-center space-y-2">
                    <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Award className="text-teal-700" size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">مدرسه علوم پزشکی شیراز</h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">سامانه هوشمند داوری و نظرسنجی</p>
                </div>
                
                <div className="space-y-5">
                    <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">نام داور / بازدیدکننده</label>
                    <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="مثلا: علی محمدی" />
                    </div>
                    
                    <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">رمز عبور (اختیاری)</label>
                    <Input 
                        type="password" 
                        value={adminPassword} 
                        onChange={(e) => setAdminPassword(e.target.value)} 
                        placeholder="فقط برای مدیران" 
                    />
                    </div>

                    <Button onClick={handleLogin} className="w-full py-3 text-lg !bg-teal-600 hover:!bg-teal-700 shadow-teal-200">
                    ورود به سامانه
                    </Button>
                </div>
                </Card>
            </div>
        ) : view === "admin" ? (
            // --- ADMIN VIEW ---
            <div className={`min-h-screen p-4 pb-20 font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-4 z-20 gap-4">
                    <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">پنل مدیریت</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">کنترل نمایشگاه و آمار</p>
                    </div>
                    {/* Live Ticker */}
                    <div className="hidden lg:flex flex-1 mx-8 overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-lg p-2 h-10 items-center">
                        <div className="flex gap-8 animate-marquee whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-teal-600">آخرین فعالیت‌ها:</span>
                            {latestActivities.map((act, i) => (
                                <span key={i} className="flex items-center gap-1">
                                    <Zap size={12} className="text-yellow-500"/>
                                    {act.userName || act.judgeName} 
                                    {act.type === 'vote' ? `به مسیر ${act.category} رای داد` : `به پروژه امتیاز داد`}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={toggleDarkMode}>
                            {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
                        </Button>
                        <Button variant="primary" onClick={toggleProjectorMode} title="حالت پروژکتور">
                            <Maximize size={18}/> پروژکتور
                        </Button>
                        <Button variant="outline" onClick={handleLogout} className="text-red-500 border-red-200 hover:bg-red-50">
                        <LogOut size={16} /> خروج
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Voting Stats */}
                    <Card className="lg:col-span-1 border-t-4 border-teal-500">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Activity className="text-teal-500" />
                        آمار بازدید (زنده)
                        </h2>
                        <div className="flex items-center gap-2">
                            <button onClick={handleDatabaseReset} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="پاکسازی کامل دیتابیس">
                                <RefreshCw size={14} />
                            </button>
                            <span className="text-xs bg-teal-100 text-teal-800 px-3 py-1 rounded-full font-bold animate-pulse">
                            {votes.length} نفر
                            </span>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(voteCounts).filter(([,count]) => count > 0).map(([catName, count]) => {
                           const catInfo = VOTE_CATEGORIES.find(c => c.id === catName);
                           if (!catInfo) return null; // Skip unknown categories if any
                           return (
                            <div key={catName}>
                                <div className="flex justify-between text-sm mb-1 font-medium text-slate-600 dark:text-slate-400">
                                <span>{catName}</span>
                                <span>{count} رای</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-full ${catInfo.bg.replace('bg-', 'bg-').replace('dark:bg-', '').split(' ')[0]} bg-current ${catInfo.color} transition-all duration-1000 ease-out`} 
                                    style={{ width: `${votes.length ? (count / votes.length) * 100 : 0}%` }}
                                ></div>
                                </div>
                            </div>
                        )})}
                         {Object.values(voteCounts).every(c => c === 0) && (
                             <p className="text-center text-gray-400 text-sm py-4">هنوز رایی ثبت نشده است.</p>
                         )}
                    </div>
                    </Card>

                    {/* Add Project */}
                    <Card className="lg:col-span-2 border-t-4 border-blue-500">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            <Plus className="text-blue-500" />
                            مدیریت پروژه‌ها
                        </h2>
                        <Button onClick={exportToCSV} variant="outline" className="text-xs">
                            <Download size={14}/> خروجی اکسل
                        </Button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Input 
                        placeholder="عنوان پروژه" 
                        value={newProjectName} 
                        onChange={(e) => setNewProjectName(e.target.value)} 
                        className="flex-1"
                        />
                        <Input 
                        placeholder="نام ارائه‌دهنده" 
                        value={newStudentName} 
                        onChange={(e) => setNewStudentName(e.target.value)} 
                        className="flex-1"
                        />
                        <Button onClick={addProject} variant="secondary" className="whitespace-nowrap">افزودن پروژه</Button>
                    </div>
                    </Card>
                </div>

                {/* Detailed Leaderboard */}
                <Card className="border-t-4 border-amber-500 overflow-hidden !p-0">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-amber-50/30 dark:bg-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <Award className="text-amber-500" />
                            رده‌بندی نهایی
                        </h2>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute right-3 top-3 text-gray-400" size={16}/>
                                <Input 
                                    placeholder="جستجو..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="!pr-10 !py-2 text-sm"
                                />
                            </div>
                            <div className="relative">
                                <select 
                                    value={sortBy} 
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-8 text-sm focus:ring-2 focus:ring-teal-500 dark:text-white"
                                >
                                    <option value="score">امتیاز</option>
                                    <option value="votes">تعداد رای</option>
                                    <option value="name">الفبا</option>
                                </select>
                                <Filter className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={14}/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">رتبه</th>
                            <th className="px-6 py-4">پروژه</th>
                            <th className="px-6 py-4">ارائه‌دهنده</th>
                            <th className="px-6 py-4 text-center">آرا</th>
                            <th className="px-6 py-4 text-center">امتیاز</th>
                            <th className="px-6 py-4">عملیات</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {projectResults.map((p, idx) => (
                            <React.Fragment key={p.id}>
                            <tr className={`hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${idx === 0 ? "bg-amber-50/10" : ""}`}>
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                                {idx === 0 ? <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-full shadow-sm">1</span> : idx + 1}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{p.student}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">{p.voteCount}</span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-teal-600 dark:text-teal-400 text-lg">{p.totalScore}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button 
                                        onClick={() => setExpandedProjectId(expandedProjectId === p.id ? null : p.id)}
                                        className="p-2 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 transition"
                                        title="مشاهده جزئیات"
                                    >
                                        {expandedProjectId === p.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                    </button>
                                    <button onClick={() => deleteProject(p.id)} className="p-2 bg-red-50 dark:bg-slate-700 text-red-500 rounded hover:bg-red-100 transition">
                                    <Trash2 size={16} />
                                </button>
                                </td>
                            </tr>
                            {expandedProjectId === p.id && (
                                <tr className="bg-slate-50 dark:bg-slate-900 animate-in slide-in-from-top-2">
                                    <td colSpan="7" className="px-6 py-4">
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-inner">
                                            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-500 dark:text-slate-300">
                                                نظرات ثبت شده
                                            </div>
                                            {p.details.length === 0 ? (
                                                <div className="p-4 text-center text-gray-400 text-sm">هنوز داوری نشده است.</div>
                                            ) : (
                                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                    {p.details.map((score, i) => (
                                                        <div key={i} className="p-3 flex flex-col md:flex-row gap-3 text-sm dark:text-slate-300">
                                                            <div className="font-bold w-32 truncate">{score.judgeName}</div>
                                                            <div className="flex gap-2">
                                                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 rounded text-xs">رفتار: {score.behavior}</span>
                                                                <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-2 rounded text-xs">کار: {score.work}</span>
                                                            </div>
                                                            <div className="text-gray-600 dark:text-gray-400 flex-1">{score.comment}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </Card>
                </div>
            </div>
        ) : (
            // --- JUDGE/USER VIEW ---
            <div className={`min-h-screen pb-20 font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                
                {/* Navbar */}
                <div className="bg-teal-800 text-white shadow-lg sticky top-0 z-10">
                    <div className="px-4 py-3 flex justify-between items-center">
                        <div>
                        <h1 className="font-bold text-lg flex items-center gap-2">
                            <ClipboardList size={20}/> 
                            پنل داوری
                        </h1>
                        <p className="text-xs text-teal-200 opacity-80">{userName}</p>
                        </div>
                        <div className="flex gap-2">
                        <button onClick={toggleDarkMode} className="p-2 text-teal-100 hover:bg-white/10 rounded-lg">
                            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                        </button>
                        <button onClick={() => setView("vote")} className={`p-2 rounded-lg transition-colors ${view === "vote" ? "bg-white/20 text-white" : "text-teal-100 hover:bg-white/10"}`}>
                            <Activity size={20} />
                        </button>
                        <button onClick={() => setView("judge")} className={`p-2 rounded-lg transition-colors ${view === "judge" ? "bg-white/20 text-white" : "text-teal-100 hover:bg-white/10"}`}>
                            <CheckCircle size={20} />
                        </button>
                        <button onClick={handleLogout} className="text-teal-200 p-2 hover:text-white" title="خروج">
                            <LogOut size={20} />
                        </button>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    {view === "judge" && (
                        <div className="w-full bg-teal-900 h-1.5">
                            <div 
                                className="bg-yellow-400 h-1.5 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(250,204,21,0.7)]" 
                                style={{ width: `${judgeProgress}%` }}
                            ></div>
                        </div>
                    )}
                </div>

                <div className="max-w-md mx-auto p-4 space-y-6 mt-4">
                    {/* Voting Categories Grid */}
                    {view === "vote" && (
                    <div className="animate-in slide-in-from-bottom duration-500">
                        <Card className="text-center mb-6 !bg-gradient-to-br !from-teal-600 !to-teal-800 !text-white !border-0 overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <h2 className="text-xl font-bold mb-2 relative z-10">خوش آمدید، {userName}</h2>
                        <p className="text-teal-100 text-sm relative z-10">علاقه‌مندی اصلی خود را انتخاب کنید:</p>
                        </Card>
                        
                        <div className="grid grid-cols-2 gap-3">
                        {VOTE_CATEGORIES.map(cat => (
                            <button
                            key={cat.id}
                            onClick={() => submitPathVote(cat.id)}
                            className={`relative flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border-b-4 hover:shadow-md hover:translate-y-[-2px] active:translate-y-[1px] transition-all ${cat.border}`}
                            >
                            <div className={`p-3 rounded-full ${cat.bg} ${cat.color}`}>
                                {cat.icon}
                            </div>
                            <span className="font-bold text-sm text-gray-800 dark:text-white text-center">{cat.id}</span>
                            </button>
                        ))}
                        </div>
                    </div>
                    )}

                    {/* Judging List */}
                    {view === "judge" && (
                    <div className="animate-in slide-in-from-bottom duration-500 space-y-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-teal-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <h2 className="font-bold text-teal-800 dark:text-teal-400 text-sm">وضعیت داوری شما</h2>
                            <span className="text-xs bg-teal-50 dark:bg-teal-900 text-teal-600 dark:text-teal-200 px-3 py-1 rounded-full font-bold">{judgeProgress}% تکمیل شده</span>
                        </div>

                        {projects.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                                <HelpCircle size={48} className="text-gray-300"/>
                                <p>لیست پروژه‌ها خالی است</p>
                            </div>
                        ) : (
                            projects.map(project => {
                            const dbScore = scores.find(s => s.projectId === project.id && s.judgeId === user?.uid) || {};
                            const localDraft = draftScores[project.id] || {};
                            
                            const currentBehavior = localDraft.behavior !== undefined ? localDraft.behavior : (dbScore.behavior || 0);
                            const currentWork = localDraft.work !== undefined ? localDraft.work : (dbScore.work || 0);
                            const currentComment = localDraft.comment !== undefined ? localDraft.comment : (dbScore.comment || "");

                            const isSaved = !localDraft.behavior && !localDraft.work && !localDraft.comment && (dbScore.behavior || dbScore.work);
                            const hasUnsavedChanges = localDraft.behavior !== undefined || localDraft.work !== undefined || localDraft.comment !== undefined;

                            return (
                                <Card key={project.id} className={`!p-5 border-t-4 transition-all duration-300 ${isSaved ? 'border-t-emerald-500' : 'border-t-gray-300 dark:border-t-slate-600'}`}>
                                <div className="mb-4 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{project.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{project.student}</span>
                                        </div>
                                    </div>
                                    {isSaved && !hasUnsavedChanges && (
                                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-1 rounded-md">
                                            <Check size={12}/> ثبت شده
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 text-center">نمره رفتار</label>
                                        <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">{currentBehavior}</span>
                                        <input 
                                            type="range" min="0" max="10" 
                                            value={currentBehavior}
                                            onChange={(e) => handleDraftChange(project.id, 'behavior', e.target.value)}
                                            className="w-full h-2 bg-blue-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 text-center">نمره کار</label>
                                        <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-1">{currentWork}</span>
                                        <input 
                                            type="range" min="0" max="10" 
                                            value={currentWork}
                                            onChange={(e) => handleDraftChange(project.id, 'work', e.target.value)}
                                            className="w-full h-2 bg-purple-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        </div>
                                    </div>
                                    </div>

                                    <div>
                                        <TextArea 
                                            placeholder="نقد و بررسی شما (اختیاری)..."
                                            value={currentComment}
                                            onChange={(e) => handleDraftChange(project.id, 'comment', e.target.value)}
                                            className="!text-sm !h-20 focus:ring-blue-500"
                                        />
                                    </div>

                                    <Button 
                                        onClick={() => submitScoreToDB(project.id)} 
                                        disabled={!hasUnsavedChanges}
                                        variant={hasUnsavedChanges ? "primary" : "outline"}
                                        className={`w-full py-3 ${hasUnsavedChanges ? "animate-pulse" : "opacity-50"}`}
                                    >
                                        {hasUnsavedChanges ? (
                                            <>
                                                <Send size={18} /> ثبت نهایی و ارسال
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} /> تغییرات ذخیره شده است
                                            </>
                                        )}
                                    </Button>
                                </div>
                                </Card>
                            );
                            })
                        )}
                    </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}
