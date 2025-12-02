import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, doc, setDoc, deleteDoc, getDocs, where, getDoc
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { 
  Users, Award, 
  LogOut, CheckCircle, 
  RefreshCw,
  Send, AlertCircle, Check, Maximize,
  Moon, Sun, Filter, Zap,
  ClipboardList, Hourglass, 
  BookOpen, Trophy, Cpu
} from 'lucide-react';

// ====================================================================
// تعریف کامپوننت‌های کوچک برای خوانایی بیشتر
// ====================================================================

const Button = ({ onClick, children, className = '', variant = 'primary', disabled = false }) => {
    let baseStyle = 'rounded-lg font-medium transition duration-200 shadow-md flex items-center justify-center space-x-2 rtl:space-x-reverse';
    
    if (variant === 'primary') {
        baseStyle += ' bg-teal-600 hover:bg-teal-700 text-white';
    } else if (variant === 'secondary') {
        baseStyle += ' bg-slate-700 hover:bg-slate-600 text-white';
    } else if (variant === 'danger') {
        baseStyle += ' bg-red-600 hover:bg-red-700 text-white';
    } else if (variant === 'outline') {
        baseStyle += ' border border-teal-600 text-teal-600 hover:bg-teal-50';
    }

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, className = '', disabled = false }) => (
    <div className="flex flex-col space-y-1 w-full">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:ring-teal-500 focus:border-teal-500 transition duration-150 ${className}`}
        />
    </div>
);

const TextArea = ({ label, value, onChange, placeholder, className = '', disabled = false }) => (
    <div className="flex flex-col space-y-1 w-full">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <textarea
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:ring-teal-500 focus:border-teal-500 transition duration-150 resize-none ${className}`}
        />
    </div>
);

const Card = ({ children, className = '' }) => (
    <div className={`bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700 ${className}`}>
        {children}
    </div>
);

// ====================================================================
// تنظیمات و متغیرهای سراسری فایربیس
// ====================================================================

// استفاده از متغیرهای سراسری Canvas
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// اگر تنظیمات فایربیس موجود نباشد، از یک کانفیگ ساختگی استفاده کنید تا برنامه کرش نکند
if (Object.keys(firebaseConfig).length === 0) {
    console.warn("Firebase configuration is missing. Using dummy config. Data will not be saved.");
    firebaseConfig.projectId = 'dummy-project'; 
}


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// مسیر ذخیره‌سازی اطلاعات
const getCollectionPath = (collectionName) => {
    // از مسیر عمومی برای ذخیره اطلاعات پروژه‌ها و داوری استفاده می‌کنیم
    return `artifacts/${appId}/public/data/${collectionName}`;
};

// ====================================================================
// کامپوننت اصلی برنامه
// ====================================================================

function App() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [scores, setScores] = useState({}); // {projectId: {criteriaId: score, criteriaId: score, review: '...'}, ...}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'scored', 'unscored'
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const [message, setMessage] = useState(''); // پیام‌های موفقیت یا هشدار

  // تعریف معیارهای داوری
  const criteriaList = useMemo(() => ([
    { id: 'innovation', label: 'نوآوری و خلاقیت', maxScore: 20, icon: <Zap size={16} /> },
    { id: 'technical', label: 'پیاده‌سازی فنی', maxScore: 30, icon: <Cpu size={16} /> },
    { id: 'presentation', label: 'ارائه و دفاع', maxScore: 25, icon: <BookOpen size={16} /> },
    { id: 'usability', label: 'کاربردی بودن', maxScore: 25, icon: <CheckCircle size={16} /> },
  ]), []);

  const totalMaxScore = useMemo(() => criteriaList.reduce((sum, c) => sum + c.maxScore, 0), [criteriaList]);

  // ====================================================================
  // توابع احراز هویت و مدیریت وضعیت
  // ====================================================================

  useEffect(() => {
    const initializeAuth = async () => {
        try {
            // استفاده از توکن اولیه برای ورود
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                // اگر توکن نبود، به صورت ناشناس وارد شو
                await signInAnonymously(auth);
            }
        } catch (err) {
            console.error("Firebase auth initialization failed, falling back to anonymous sign in:", err);
            await signInAnonymously(auth); 
        }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            setUserId(currentUser.uid);
            setLoading(false);
        } else {
            // اگر هنوز احراز هویت کامل نشده، صبر کن یا وارد شو
            if (!userId) { // جلوگیری از حلقه‌ی تکراری
                 initializeAuth();
            }
        }
    });

    return () => unsubscribeAuth();
  }, [userId]); // اضافه کردن userId به وابستگی برای جلوگیری از تکرار initializeAuth

  // ====================================================================
  // توابع دریافت و مدیریت داده‌ها از Firestore
  // ====================================================================

  // ۱. دریافت لیست پروژه‌ها و امتیازات داور جاری
  useEffect(() => {
    if (!userId || loading) return;

    // --- دریافت پروژه‌ها ---
    const projectsCol = collection(db, getCollectionPath('projects'));
    const unsubscribeProjects = onSnapshot(projectsCol, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scores: doc.data().scores || [], // اطمینان از وجود فیلد
      }));
      setProjects(projectsData);
    }, (err) => {
      console.error("Error fetching projects:", err);
      setError("خطا در دریافت لیست پروژه‌ها.");
    });

    // --- دریافت امتیازات داور جاری ---
    const userScoresCol = collection(db, getCollectionPath('judge_scores'));
    const userScoresQuery = query(userScoresCol, where('judgeId', '==', userId)); 

    const unsubscribeScores = onSnapshot(userScoresQuery, (snapshot) => {
      const userScores = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        userScores[data.projectId] = { 
            ...data, 
            scoreId: doc.id,
            criteriaScores: data.criteriaScores || {},
            review: data.review || '',
        };
      });
      setScores(userScores);
    }, (err) => {
      console.error("Error fetching user scores:", err);
      setError("خطا در دریافت امتیازات شما.");
    });

    return () => {
        unsubscribeProjects();
        unsubscribeScores();
    };
  }, [userId, loading]);

  // ====================================================================
  // منطق داوری و ذخیره‌سازی
  // ====================================================================

  // محاسبه مجموع امتیازات یک پروژه توسط داور جاری
  const calculateTotalScore = (projectId) => {
    const currentScore = scores[projectId]?.criteriaScores || {};
    return Object.values(currentScore).reduce((sum, score) => sum + (Number(score) || 0), 0);
  };

  // محاسبه وضعیت داوری
  const getProjectStatus = (projectId) => {
    const scoreData = scores[projectId];
    if (!scoreData) {
        return 'unscored'; // داوری نشده
    }
    const criteriaCount = Object.keys(scoreData.criteriaScores).length;
    // بررسی می‌کند که آیا امتیاز برای تمام معیارها ثبت شده است
    if (criteriaList.every(criteria => scoreData.criteriaScores[criteria.id] !== undefined)) {
        return 'scored'; // کامل داوری شده
    }
    return 'incomplete'; // ناقص
  };

  // هندلر تغییر امتیاز یک معیار
  const handleScoreChange = useCallback((projectId, criteriaId, value) => {
    const numericValue = Number(value);

    setScores(prevScores => {
      const newScores = { ...prevScores };
      const currentData = newScores[projectId] || { 
          judgeId: userId, 
          projectId, 
          criteriaScores: {}, 
          review: '', 
          timestamp: new Date().getTime() 
      };

      currentData.criteriaScores = {
        ...currentData.criteriaScores,
        [criteriaId]: numericValue,
      };

      newScores[projectId] = currentData;
      return newScores;
    });
  }, [userId]);

  // هندلر تغییر متن بازخورد
  const handleReviewChange = useCallback((projectId, reviewText) => {
    setScores(prevScores => {
      const newScores = { ...prevScores };
      const currentData = newScores[projectId] || { 
          judgeId: userId, 
          projectId, 
          criteriaScores: {}, 
          review: '', 
          timestamp: new Date().getTime() 
      };

      currentData.review = reviewText;
      newScores[projectId] = currentData;
      return newScores;
    });
  }, [userId]);

  // ارسال امتیاز نهایی به دیتابیس
  const submitScoreToDB = async (projectId) => {
    const scoreData = scores[projectId];
    if (!scoreData || getProjectStatus(projectId) !== 'scored') {
        setMessage({ type: 'error', text: 'لطفاً امتیاز تمام معیارها را وارد کنید.' });
        return;
    }

    const dataToSave = {
        judgeId: userId,
        projectId: projectId,
        criteriaScores: scoreData.criteriaScores,
        review: scoreData.review,
        totalScore: calculateTotalScore(projectId),
        timestamp: new Date().getTime(),
    };

    try {
        const colRef = collection(db, getCollectionPath('judge_scores'));
        
        // جستجوی سند موجود (بر اساس judgeId و projectId)
        const existingScoreQuery = query(
            colRef,
            where('judgeId', '==', userId),
            where('projectId', '==', projectId)
        );
        
        const existingDocs = await getDocs(existingScoreQuery);

        if (existingDocs.docs.length > 0) {
            // به‌روزرسانی سند موجود
            const docRef = doc(db, getCollectionPath('judge_scores'), existingDocs.docs[0].id);
            await setDoc(docRef, dataToSave, { merge: true });
        } else {
            // ایجاد سند جدید
            await addDoc(colRef, dataToSave);
        }

        setMessage({ type: 'success', text: 'امتیاز و بازخورد با موفقیت ثبت شد!' });
        setTimeout(() => setMessage(''), 3000); // پیام را بعد از ۳ ثانیه پاک کن
    } catch (err) {
        console.error("Error saving score:", err);
        setMessage({ type: 'error', text: 'خطا در ثبت امتیاز. اتصال اینترنت خود را بررسی کنید.' });
    }
  };

  // ====================================================================
  // مدیریت فیلتر و UI
  // ====================================================================

  const filteredProjects = useMemo(() => {
    return projects
        .map(project => ({
            ...project,
            status: getProjectStatus(project.id)
        }))
        .filter(project => {
            if (filterType === 'scored') return project.status === 'scored';
            if (filterType === 'unscored') return project.status !== 'scored';
            return true; // 'all'
        })
        .sort((a, b) => {
            // مرتب‌سازی پروژه‌های داوری نشده در بالا
            if (a.status !== 'scored' && b.status === 'scored') return -1;
            if (a.status === 'scored' && b.status !== 'scored') return 1;
            return 0;
        });
  }, [projects, scores, filterType, criteriaList]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const projectCounts = useMemo(() => {
    const all = projects.length;
    const scored = projects.filter(p => getProjectStatus(p.id) === 'scored').length;
    const unscored = all - scored;
    return { all, scored, unscored };
  }, [projects, scores, criteriaList]);
  
  // بررسی وجود تغییرات محلی
  const hasUnsavedChanges = useCallback((projectId) => {
    const status = getProjectStatus(projectId);
    // اگر کاملاً امتیازدهی نشده، یعنی تغییری وجود ندارد
    if (!scores[projectId]) return false; 
    
    // اگر وضعیت کامل است، چک می‌کنیم که آیا این تغییرات قبلا ذخیره شده‌اند یا نه (این یک چک ساده است)
    // برای سادگی، اگر وضعیت "complete" نیست، یعنی تغییرات باید ذخیره شوند.
    return status !== 'scored';

  }, [scores, criteriaList]);


  // ====================================================================
  // رندر UI
  // ====================================================================

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
            <span className="mr-3">در حال بارگذاری...</span>
        </div>
    );
  }

  // کلاس‌های اصلی تم
  const appClassName = theme === 'dark' 
    ? "bg-slate-950 text-white min-h-screen transition-colors duration-300" 
    : "bg-gray-100 text-slate-900 min-h-screen transition-colors duration-300";

  const cardBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimary = theme === 'dark' ? 'text-teal-500' : 'text-teal-600';
  const textSecondary = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className={appClassName}>
      <div className={`p-4 sm:p-6 shadow-lg sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-900 border-b border-slate-700' : 'bg-white border-b border-gray-200'}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center space-x-2 rtl:space-x-reverse">
            <Award className={textPrimary} size={28} />
            <span className={textPrimary}>سیستم داوری و نظرسنجی</span>
          </h1>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <button onClick={toggleTheme} className={`p-2 rounded-full ${theme === 'dark' ? 'text-yellow-400 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-200'}`}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={`text-xs sm:text-sm font-mono p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-700'}`}>
                <Users size={16} className="inline mr-1" /> داور: {userId ? userId.substring(0, 8) : 'ناشناس'}...
            </div>
            <Button onClick={() => signOut(auth)} variant="secondary" className="px-3 py-2 text-sm hidden sm:flex">
                <LogOut size={18} /> خروج
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* پیام‌ها */}
        {message && (
            <Card className={`mb-6 ${message.type === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'} text-white`}>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium">{message.text}</span>
                </div>
            </Card>
        )}

        {/* بخش آمار و فیلتر */}
        <Card className={`mb-8 ${cardBg}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex space-x-4 rtl:space-x-reverse font-semibold">
                    <span className={`flex items-center ${textSecondary}`}><Maximize size={16} className="ml-1" /> کل پروژه‌ها: {projectCounts.all}</span>
                    <span className="flex items-center text-green-500"><CheckCircle size={16} className="ml-1" /> داوری شده توسط شما: {projectCounts.scored}</span>
                    <span className="flex items-center text-red-500"><Hourglass size={16} className="ml-1" /> باقی مانده: {projectCounts.unscored}</span>
                </div>
                
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <Button 
                        onClick={() => setFilterType('all')} 
                        variant={filterType === 'all' ? 'primary' : 'outline'}
                        className="text-xs sm:text-sm px-3 py-1"
                    >
                        <Filter size={14} /> همه
                    </Button>
                    <Button 
                        onClick={() => setFilterType('scored')} 
                        variant={filterType === 'scored' ? 'primary' : 'outline'}
                        className="text-xs sm:text-sm px-3 py-1"
                    >
                        <Check size={14} /> داوری شده
                    </Button>
                    <Button 
                        onClick={() => setFilterType('unscored')} 
                        variant={filterType === 'unscored' ? 'primary' : 'outline'}
                        className="text-xs sm:text-sm px-3 py-1"
                    >
                        <Hourglass size={14} /> داوری نشده
                    </Button>
                </div>
            </div>
        </Card>

        {/* لیست پروژه‌ها */}
        
        {filteredProjects.length === 0 && (
            <div className="text-center p-12 rounded-xl border border-dashed border-slate-600">
                <AlertCircle size={32} className="mx-auto mb-4 text-teal-500" />
                <p className="text-lg font-medium text-slate-400">
                    {filterType === 'scored' ? 'شما تمام پروژه‌ها را داوری کرده‌اید. کارتان عالی بود!' : 'هیچ پروژه‌ای برای نمایش وجود ندارد.'}
                </p>
            </div>
        )}

        <div className="space-y-6">
            {filteredProjects.map(project => {
                const isScored = project.status === 'scored';
                const currentScoreData = scores[project.id] || {};
                const currentCriteriaScores = currentScoreData.criteriaScores || {};
                const currentReview = currentScoreData.review || '';

                const canSubmit = getProjectStatus(project.id) === 'scored';
                const buttonText = canSubmit ? 'ثبت نهایی و ارسال' : 'لطفاً تمام معیارها را تکمیل کنید';

                return (
                    <Card key={project.id} className={`${cardBg} ${isScored ? 'border-green-500' : 'border-slate-700'}`}>
                        <div className="flex justify-between items-start mb-4 border-b pb-4 border-slate-700">
                            <div>
                                <h2 className="text-xl font-bold mb-1 flex items-center space-x-2 rtl:space-x-reverse">
                                    <Trophy size={24} className={textPrimary} />
                                    <span>{project.name || `پروژه شماره ${project.id.substring(0, 6)}`}</span>
                                </h2>
                                <p className={`text-sm ${textSecondary}`}>{project.team || 'تیم ناشناس'}</p>
                                <p className={`text-xs mt-1 font-mono p-1 rounded-md ${theme === 'dark' ? 'bg-slate-700 text-teal-400' : 'bg-gray-200 text-teal-700'}`}>
                                    <ClipboardList size={14} className="inline ml-1" />
                                    {project.category || 'بدون دسته‌بندی'}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`text-3xl font-extrabold ${textPrimary}`}>
                                    {calculateTotalScore(project.id)}
                                </span>
                                <span className={`block text-xs ${textSecondary}`}>
                                    از {totalMaxScore} امتیاز
                                </span>
                                <span className={`block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${isScored ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {isScored ? 'داوری کامل' : 'نیاز به داوری'}
                                </span>
                            </div>
                        </div>

                        {/* بخش معیارهای داوری */}
                        <div className="space-y-4 mb-6">
                            <h3 className={`text-lg font-semibold border-b pb-2 ${textSecondary} border-slate-700`}>امتیازدهی بر اساس معیارها:</h3>
                            {criteriaList.map(criteria => {
                                const scoreValue = currentCriteriaScores[criteria.id] === undefined ? '' : currentCriteriaScores[criteria.id];
                                return (
                                    <div key={criteria.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-lg">
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            {criteria.icon}
                                            <label className="text-sm font-medium text-slate-200">{criteria.label}</label>
                                        </div>
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            <Input
                                                type="number"
                                                value={scoreValue}
                                                onChange={(e) => {
                                                    let val = e.target.value === '' ? undefined : parseInt(e.target.value);
                                                    if (val !== undefined) {
                                                        if (isNaN(val)) val = 0;
                                                        if (val < 0) val = 0;
                                                        if (val > criteria.maxScore) val = criteria.maxScore;
                                                    }
                                                    handleScoreChange(project.id, criteria.id, val);
                                                }}
                                                className="w-20 text-center"
                                                placeholder={`از ${criteria.maxScore}`}
                                            />
                                            <span className={`text-sm ${textSecondary}`}>/{criteria.maxScore}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* بخش بازخورد */}
                        <div className="space-y-4 mb-6">
                            <h3 className={`text-lg font-semibold border-b pb-2 ${textSecondary} border-slate-700`}>بازخورد و نکات کلیدی:</h3>
                            <TextArea
                                label="نظر شما"
                                value={currentReview}
                                onChange={(e) => handleReviewChange(project.id, e.target.value)}
                                placeholder="نظرات سازنده و نکات کلیدی خود را برای تیم بنویسید..."
                                className="!text-sm !h-20 focus:ring-blue-500"
                            />
                        </div>

                        <Button 
                            onClick={() => submitScoreToDB(project.id)} 
                            disabled={!canSubmit}
                            variant={canSubmit ? "primary" : "outline"}
                            className={`w-full py-3 ${canSubmit ? "" : "opacity-70"}`}
                        >
                            <span className='flex items-center justify-center space-x-2 rtl:space-x-reverse'>
                                <Send size={18} /> {buttonText}
                            </span>
                        </Button>
                    </Card>
                );
            })}
        </div>
      </div>
    </div>
  );
}

export default App;
