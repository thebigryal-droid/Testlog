
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
    import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

    // ==========================================
    // 1. CORE CONFIGURATION
    // ==========================================
    window.RYAL_USDA_KEY = "rB7nbYA6O8O2Pi6WPAfgFBEwgvIdjF0Vz2mrvLTI";
    
    // Pull the key from the browser's local memory
window.RYAL_AI_KEY = localStorage.getItem("ryal_ai_secret_key");

// If the key isn't saved yet, ask for it and save it
if (!window.RYAL_AI_KEY) {
    window.RYAL_AI_KEY = prompt("Enter your Gemini API Key for this device:");
    if (window.RYAL_AI_KEY) {
        localStorage.setItem("ryal_ai_secret_key", window.RYAL_AI_KEY);
    }
}

    window.onerror = function(msg, url, line) { 
        console.error("RyalFit Error: " + msg + " at line " + line); 
    };

    // Your brand new rfth-pro Firebase Engine
    const app = initializeApp({ 
        apiKey: "AIzaSyCCB71JtHMCWCG4kNs6XkcGYwvu-2k8JiQ",
        authDomain: "rfth-pro.firebaseapp.com",
        projectId: "rfth-pro",
        storageBucket: "rfth-pro.firebasestorage.app",
        messagingSenderId: "494901173654",
        appId: "1:494901173654:web:5ab8a4f4435eaf2d60d1b7"
    });
    
    const auth = getAuth(app); 
    const db = getFirestore(app);

    // GLOBAL STATE VARIABLES
    window.currentUser = null; 
    window.trainerProfile = null; 
    window.clients = []; 
    window.shifts = []; 
    window.leads = []; 
    window.expenses = []; 
    window.plans = []; 
    window.videoLibrary = []; 
    window.researchCenter = [];

    window.workoutDB = { 
        "Chest": ["Barbell Bench Press", "Incline Dumbbell Press", "Cable Crossovers", "Pec Deck Flyes"], 
        "Back": ["Pull-ups", "Lat Pulldown", "Seated Cable Row", "Barbell Bent-Over Row"], 
        "Shoulders": ["Overhead Barbell Press", "Lateral Raises", "Face Pulls"], 
        "Biceps": ["Barbell Curl", "Dumbbell Hammer Curl"], 
        "Triceps": ["Triceps Rope Pushdown", "Skullcrushers"], 
        "Quads": ["Barbell Back Squat", "Leg Press", "Leg Extensions"], 
        "Hamstrings": ["Romanian Deadlift (RDL)", "Seated Leg Curl"], 
        "Glutes": ["Barbell Hip Thrust"], 
        "Calves": ["Standing Calf Raise"], 
        "Core": ["Plank", "Cable Crunches"], 
        "Custom Exercises": [] 
    };

    window.today = new Date().toISOString().split('T')[0]; 
    window.curID = null; 
    window.curExName = ""; 
    window.tonnageChartInst = null; 
    window.galleryAutoScroller = null; 
    window.galleryScrollDirection = 1; 
    window.timerInt = null;

    // ==========================================
    // 2. GLOBAL UTILITIES & ICONS
    // ==========================================
    window.updateIcons = () => { 
        const faMap = { 
            'menu':'fa-bars', 'moon':'fa-moon', 'activity':'fa-chart-line', 'clock':'fa-clock', 
            'dollar-sign':'fa-indian-rupee-sign', 'pie-chart':'fa-chart-pie', 'chevron-down':'fa-chevron-down', 
            'printer':'fa-print', 'user-check':'fa-user-check', 'user-plus':'fa-user-plus', 
            'clipboard':'fa-clipboard-list', 'calendar':'fa-calendar-alt', 'plus':'fa-plus', 
            'check-square':'fa-check-square', 'x':'fa-times', 'users':'fa-users', 'credit-card':'fa-credit-card', 
            'minus-circle':'fa-minus-circle', 'layers':'fa-layer-group', 'video':'fa-video', 
            'book-open':'fa-book-open', 'life-buoy':'fa-life-ring', 'database':'fa-database', 
            'search':'fa-search', 'cloud':'fa-cloud', 'arrow-left':'fa-arrow-left', 'bell':'fa-bell', 
            'file-text':'fa-file-alt', 'message-circle':'fa-comment-dots', 'more-vertical':'fa-ellipsis-v', 
            'edit-2':'fa-pen', 'link':'fa-link', 'trash-2':'fa-trash', 'download-cloud':'fa-cloud-download-alt', 
            'plus-circle':'fa-plus-circle', 'cpu':'fa-microchip', 'zap':'fa-bolt', 
            'loader':'fa-spinner fa-spin', 'wind':'fa-wind', 'refresh-cw':'fa-sync-alt', 
            'heart':'fa-heart', 'image':'fa-image', 'camera':'fa-camera', 'save':'fa-save', 
            'send':'fa-paper-plane', 'x-circle':'fa-times-circle', 'unlock':'fa-unlock', 
            'settings':'fa-cog', 'download':'fa-download', 'upload':'fa-upload', 
            'log-out':'fa-sign-out-alt', 'log-in':'fa-sign-in-alt', 'check':'fa-check', 
            'phone':'fa-phone', 'check-circle':'fa-check-circle' 
        };
        
        document.querySelectorAll('[data-feather]').forEach(el => {
            const name = el.getAttribute('data-feather');
            el.className = `fas ${faMap[name] || 'fa-circle'}`;
            if(el.style.width) el.style.fontSize = el.style.width; 
            el.removeAttribute('data-feather');
        });
    };

    setTimeout(() => { 
        let loader = document.getElementById('cloudLoader'); 
        if (loader && loader.style.display !== 'none') { 
            loader.style.display = 'none'; 
            window.showAlert("Connection Timeout. Check your Internet."); 
        } 
    }, 15000);

    window.toggleMenu = () => { 
        const m = document.getElementById('sideMenu'); 
        const o = document.getElementById('menuOverlay'); 
        if(m.classList.contains('open')) { 
            m.classList.remove('open'); 
            o.classList.remove('open'); 
            document.body.style.overflow = ''; 
        } else { 
            o.style.display = 'block'; 
            document.body.style.overflow = 'hidden'; 
            m.classList.add('open'); 
            o.classList.add('open'); 
        } 
    };

    window.closeMenu = () => { 
        const m = document.getElementById('sideMenu');
        const o = document.getElementById('menuOverlay');
        if(m) m.classList.remove('open'); 
        if(o) {
            o.classList.remove('open'); 
            setTimeout(() => { o.style.display = 'none'; }, 300);
        }
        document.body.style.overflow = ''; 
    };

    window.showMenuSection = (id) => { 
        window.closeMenu(); 
        const sections = ['sec-leads', 'sec-exp', 'sec-master-routine', 'sec-library', 'sec-research', 'sec-endo', 'sec-support'];
        sections.forEach(x => { 
            let el = document.getElementById(x); 
            if(el) el.style.display = 'none'; 
        }); 
        let target = document.getElementById(id); 
        if(target) { 
            target.style.display = 'block'; 
            target.scrollIntoView({ behavior: 'smooth' }); 
        } 
    };

    window.showAlert = (msg) => { 
        return new Promise(resolve => { 
            document.getElementById('modalText').innerText = msg; 
            document.getElementById('modalBtns').innerHTML = `
                <button class="btn-main" onclick="document.getElementById('ryalModalOverlay').style.display='none';">OK</button>
            `; 
            document.getElementById('ryalModalOverlay').style.display = 'flex'; 
        }); 
    };

    window.showConfirm = (msg, callback) => { 
        document.getElementById('modalText').innerText = msg; 
        document.getElementById('modalBtns').innerHTML = `
            <button class="btn-sub" onclick="document.getElementById('ryalModalOverlay').style.display='none';">Cancel</button>
            <button class="btn-danger" onclick="document.getElementById('ryalModalOverlay').style.display='none';(${callback})();">Yes</button>
        `; 
        document.getElementById('ryalModalOverlay').style.display = 'flex'; 
    };

    window.toggleTheme = () => { 
        document.body.classList.toggle('dark-mode'); 
        localStorage.setItem('ryal_theme_v9', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); 
        if(window.curID && typeof window.renderTonnageChart === 'function') {
            window.renderTonnageChart(); 
        }
    };

    window.toggleSec = (id) => { 
        let el = document.getElementById(id);
        if(el) el.classList.toggle('active'); 
    };

    window.toggleGroup = (id) => { 
        const div = document.getElementById(id); 
        if(div) {
            div.style.display = (div.style.display === 'none' || div.style.display === '') ? 'block' : 'none'; 
        }
    };

    window.formatTime = (time24) => { 
        if(!time24) return ''; 
        const [h, m] = time24.split(':'); 
        let hours = parseInt(h);
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        return `${hours}:${m} ${ampm}`; 
    };

    
window.closeModalSafe = () => {
    const modal = document.getElementById('ryalModalOverlay');
    if(modal){
        modal.style.display = 'none';
    }
};

    // ==========================================
    // 3. MASTER RENDER ENGINE (Anti-Lag RequestAnimation Layer)
    // ==========================================
    window.initApp = () => { 
        document.getElementById('authView').style.display = 'none'; 
        document.getElementById('appContainer').style.display = 'block'; 
        
        if(window.trainerProfile) {
            document.getElementById('menuTrainerName').innerText = window.trainerProfile.name.split(' ')[0]; 
            
            if(!document.getElementById('attIn').value) {
                document.getElementById('attIn').value = window.trainerProfile.shiftIn; 
            }
            if(!document.getElementById('attOut').value) {
                document.getElementById('attOut').value = window.trainerProfile.shiftOut; 
            }
        }
        
        document.getElementById('attDate').value = window.today; 
        document.getElementById('logDate').value = window.today; 
        document.getElementById('reportMonthInput').value = window.today.slice(0,7); 
        
        setTimeout(() => window.updateIcons(), 100);
    };

    window.render = () => {
        requestAnimationFrame(() => {
            if(typeof window.renderPlanner === 'function') window.renderPlanner(); 
            if(typeof window.renderLeads === 'function') window.renderLeads(); 
            if(typeof window.renderAttendance === 'function') window.renderAttendance(); 
            if(typeof window.renderExpenses === 'function') window.renderExpenses(); 
            if(typeof window.renderRoster === 'function') window.renderRoster(); 
            if(typeof window.renderRevenue === 'function') window.renderRevenue(); 
            if(typeof window.renderLibrary === 'function') window.renderLibrary(); 
            if(typeof window.renderResearch === 'function') window.renderResearch(); 
            if(typeof window.renderSplitManager === 'function') window.renderSplitManager(); 
            window.updateIcons(); 
        });
    };

    // ==========================================
    // 4. AUTHENTICATION & SYNC
    // ==========================================
    window.saveTrainerProfile = async () => { 
        const n = document.getElementById('authName').value; 
        const sal = parseFloat(document.getElementById('authSalary').value); 
        
        if(!n || !sal) return window.showAlert("Name & Salary Required"); 
        
        window.trainerProfile = { 
            name: n, email: document.getElementById('authEmail').value, phone: document.getElementById('authPhone').value, 
            salary: sal, shiftIn: document.getElementById('authIn').value, shiftOut: document.getElementById('authOut').value 
        }; 
        
        await window.syncToCloud(); window.initApp(); window.render(); 
    };

    window.syncToCloud = async () => {
        if (!window.currentUser) return;
        try {
            await setDoc(doc(db, "trainers", window.currentUser.uid), { profile: window.trainerProfile, clients: window.clients, shifts: window.shifts, leads: window.leads, expenses: window.expenses, plans: window.plans, workoutDB: window.workoutDB, videoLibrary: window.videoLibrary, researchCenter: window.researchCenter });
            await Promise.all(window.clients.map(c => setDoc(doc(db, "vip_portals", c.id.toString()), { trainerName: window.trainerProfile.name, client: c, plans: window.plans.filter(p => p.clientId == c.id), videoLibrary: window.videoLibrary || [], researchCenter: window.researchCenter || [] })));
        } catch(e) { console.error("Sync Error", e); }
    };

    // ==========================================
    // 5. SESSION PLANNER & ATTENDANCE
    // ==========================================
    window.renderPlanner = () => { 
        let activeClients = window.clients.filter(c => Object.keys(c.logs || {}).length < c.sess); 
        let planClientEl = document.getElementById('planClient');
        if(planClientEl) planClientEl.innerHTML = `<option value="">-- Choose Client --</option>` + activeClients.map(c => `<option value="${c.id}">${c.name}</option>`).join(''); 
        
        let totalEarnings = 0; let html = ""; 
        window.plans.forEach(p => { 
            let c = window.clients.find(x => x.id == p.clientId); if(!c) return; 
            totalEarnings += ((c.pay || 0) / (1 + (c.gst || 0)) * (c.ret || 0)) / (c.sess || 1); 
            html += `
            <div class="history-row" style="background:var(--bg); padding:12px; border-radius:12px; border:1px solid var(--border); margin-bottom:8px; flex-direction:column; align-items:flex-start;">
                <b style="font-size:14px;color:var(--text);">${c.name}</b>
                <div style="font-size:12px; color:var(--text-muted); margin-top:4px;"><i data-feather="clock" style="width:12px;"></i> ${p.date} @ ${window.formatTime(p.time)} - ${p.workout}</div>
                <button class="btn-sub" style="margin-top:10px; width:100%; border-color:var(--info); color:var(--info);" onclick="completePlan(${p.id})"><i data-feather="check"></i> Mark Complete</button>
            </div>`; 
        }); 
        
        let planListEl = document.getElementById('planList'); if(planListEl) planListEl.innerHTML = html; 
        let planEarnEl = document.getElementById('planEarnings'); if(planEarnEl) planEarnEl.innerText = `₹${totalEarnings.toFixed(0)}`; 
    };

    window.addPlan = async () => { 
        const clientId = parseInt(document.getElementById('planClient').value); const date = document.getElementById('planDate').value; const time = document.getElementById('planTime').value; const workout = document.getElementById('planWorkout').value;
        if(!clientId || !date || !time) return window.showAlert("Please fill all required fields.");
        window.plans.push({ id: Date.now(), clientId: clientId, date: date, time: time, workout: workout }); 
        await window.syncToCloud(); window.render(); 
    };

    window.completePlan = async (id) => { 
        let p = window.plans.find(x => x.id === id);
        if (p) {
            let c = window.clients.find(x => x.id === p.clientId);
            if (c) {
                if (!c.logs[p.date]) c.logs[p.date] = [];
                c.logs[p.date].push({ id: Date.now(), workoutName: p.workout || "Planned Session", name: "Session Completed", sets: [{ set: 1, w: 0, r: 0 }] });
            }
        }
        window.plans = window.plans.filter(p => p.id !== id); 
        await window.syncToCloud(); window.render(); 
    };

    window.logAtt = async (status) => {
        const d = document.getElementById('attDate').value || window.today; 
        const inT = document.getElementById('attIn').value; 
        const outT = document.getElementById('attOut').value;
        
        if(status === 'Present' && (!inT || !outT)) return window.showAlert("Enter Shift Times");
        let isLate = false; let isHalfDay = false;

        if (status === 'Present') {
            const [inH, inM] = inT.split(':').map(Number); const [outH, outM] = outT.split(':').map(Number); 
            let totalMins = (outH * 60 + outM) - (inH * 60 + inM); if (totalMins < 0) totalMins += 24 * 60; 

            const [sInH, sInM] = (window.trainerProfile.shiftIn || "07:00").split(':').map(Number); const [sOutH, sOutM] = (window.trainerProfile.shiftOut || "13:00").split(':').map(Number);
            let shiftTotalMins = (sOutH * 60 + sOutM) - (sInH * 60 + sInM); if (shiftTotalMins <= 0) shiftTotalMins += 24 * 60;

            if (totalMins <= (shiftTotalMins / 2) + 10) { isHalfDay = true; } 
            else { 
                const actualInMins = inH * 60 + inM; const targetInMins = sInH * 60 + sInM; 
                if (actualInMins > (targetInMins + 10) && totalMins < (shiftTotalMins - 10)) { isLate = true; } 
            }
        }
        
        const daysInMonth = new Date(parseInt(d.split('-')[0]), parseInt(d.split('-')[1]), 0).getDate();
        const dailyRate = (window.trainerProfile.salary || 10000) / daysInMonth;
        
        window.shifts.push({ id: Date.now(), date: d, inTime: inT || "", outTime: outT || "", status: status, isLate: isLate, isHalfDay: isHalfDay, pay: (status === 'Present' || status === 'Week Off') ? dailyRate : 0, baseDaily: dailyRate });
        await window.syncToCloud(); window.render();
    };

    window.renderAttendance = () => { 
        let m = window.today.slice(0, 7); 
        let attListEl = document.getElementById('attList');
        if(attListEl) {
            attListEl.innerHTML = window.shifts.filter(s => s.date.startsWith(m)).sort((a,b) => new Date(b.date) - new Date(a.date)).map(s => `
                <div class="history-row" style="font-size:13px; background:var(--card); padding:12px; border-radius:12px; border:1px solid var(--border); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div><div style="color:var(--text-muted); font-size:10px; margin-bottom:4px;"><i data-feather="calendar" style="width:10px;"></i> ${s.date}</div><b style="color:var(--text);">${s.status}</b> ${s.isLate ? '<span class="badge danger" style="background:var(--danger); color:white;">LATE</span>' : ''}${s.isHalfDay ? '<span class="badge warning" style="background:var(--warning); color:white;">HALF</span>' : ''}</div>
                    <button class="btn-action danger" style="margin:0; padding:8px;" onclick="delShift(${s.id})"><i data-feather="trash-2" style="width:16px;"></i></button>
                </div>`).join(''); 
        }
    };

    window.delShift = (id) => { window.shifts = window.shifts.filter(s => s.id !== id); window.syncToCloud().then(() => window.render()); };

    // ==========================================
    // 6. BUSINESS EXPENSES
    // ==========================================
    window.addExpense = async () => { 
        const d = document.getElementById('expDate').value || window.today; const c = document.getElementById('expCat').value; const desc = document.getElementById('expDesc').value; const amt = parseFloat(document.getElementById('expAmt').value); 
        if(!amt) return window.showAlert("Enter Amount"); 
        window.expenses.push({ id: Date.now(), date: d, cat: c, desc: desc, amt: amt }); 
        await window.syncToCloud(); window.renderExpenses(); if (typeof window.renderRevenue === 'function') window.renderRevenue(); 
        document.getElementById('expDesc').value = ""; document.getElementById('expAmt').value = ""; 
    };

    window.delExpense = (id) => { window.expenses = window.expenses.filter(e => e.id !== id); window.syncToCloud().then(() => { window.renderExpenses(); if (typeof window.renderRevenue === 'function') window.renderRevenue(); }); };

    window.renderExpenses = () => { 
        let expListEl = document.getElementById('expList');
        if(expListEl) {
            expListEl.innerHTML = window.expenses.sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => `<div class="trial-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; margin-bottom:10px;"><div style="display:flex; flex-direction:column; gap:4px;"><span style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase;"><i data-feather="calendar" style="width:12px;"></i> ${e.date} &bull; ${e.cat}</span><span style="font-size:14px; font-weight:700; color:var(--text);">${e.desc || 'No description'}</span></div><div style="display:flex; align-items:center; gap:12px;"><span style="color:var(--danger); font-weight:800; font-size:16px;">₹${e.amt}</span><button class="btn-action danger" style="margin:0; padding:8px;" onclick="delExpense(${e.id})"><i data-feather="trash-2" style="width:16px;"></i></button></div></div>`).join(''); 
        }
    };

    // ==========================================
    // 7. TRIAL PIPELINE
    // ==========================================
    window.addLead = async () => { 
        const n = document.getElementById('leadName').value; const c = document.getElementById('leadContact').value; 
        if(!n) return window.showAlert("Name Required"); 
        window.leads.push({ id: Date.now(), name: n, contact: c, date: window.today, trials: [] }); 
        await window.syncToCloud(); window.renderLeads(); 
        document.getElementById('leadName').value = ""; document.getElementById('leadContact').value = ""; 
    };

    window.delLead = async (id) => { window.showConfirm("Delete this lead?", async () => { window.leads = window.leads.filter(l => l.id !== id); await window.syncToCloud(); window.renderLeads(); }); };

    window.saveTrial = async (leadId) => {
        const lead = window.leads.find(l => l.id === leadId); if(!lead) return;
        const date = document.getElementById(`trialDate-${leadId}`).value || window.today; const act = document.getElementById(`trialAct-${leadId}`).value; const rem = document.getElementById(`trialRem-${leadId}`).value;
        if(!lead.trials) lead.trials = []; lead.trials.push({ date: date, act: act, rem: rem });
        await window.syncToCloud(); window.renderLeads(); window.showAlert("Trial Saved");
    };

    window.convertLead = async (id) => { 
        const l = window.leads.find(x => x.id === id); window.leads = window.leads.filter(x => x.id !== id); 
        document.getElementById('regName').value = l.name || ""; document.getElementById('regPhone').value = l.contact || ""; 
        window.showMenuSection('sec-prof'); await window.syncToCloud(); window.render(); 
    };

    window.renderLeads = () => { 
        let leadsEl = document.getElementById('leadsList');
        if(leadsEl) {
            leadsEl.innerHTML = window.leads.map(l => `<div class="trial-card"><div onclick="toggleGroup('lead-detail-${l.id}')" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;"><div><div style="font-size:15px; font-weight:800; color:var(--text); display:flex; align-items:center;">${l.name} <span class="badge" style="background:var(--info); color:white; margin-left:8px;">NEW</span></div><div style="font-size:12px; color:var(--text-muted); margin-top:4px;"><i data-feather="phone" style="width:12px;"></i> ${l.contact || 'No Number'}</div></div><i data-feather="chevron-down" style="color:var(--text-muted);"></i></div><div id="lead-detail-${l.id}" style="display:none; margin-top:15px; border-top:1px dashed var(--border); padding-top:15px;"><input type="date" id="trialDate-${l.id}" value="${window.today}"><input type="text" id="trialAct-${l.id}" placeholder="Activity (e.g. Chest & Triceps)"><input type="text" id="trialRem-${l.id}" placeholder="Remark (e.g. Needs form correction)"><button class="btn-sub" style="width:100%; margin-bottom:12px; background:var(--card); color:var(--text); border:1px solid var(--border);" onclick="saveTrial(${l.id})">Save Trial</button><div style="display:flex; gap:10px;"><button class="btn-main" style="background:var(--primary); color:#fff; flex:1;" onclick="convertLead(${l.id})">Convert to Client</button><button class="btn-action danger" style="padding:0 15px;" onclick="delLead(${l.id})"><i data-feather="trash-2"></i></button></div></div></div>`).join(''); 
        }
    };

    // ==========================================
    // 8. ACTIVE ROSTER
    // ==========================================
    window.delLog = async (clientId, date, logId) => {
        window.showConfirm("Delete this exercise log?", async () => {
            let c = window.clients.find(x => x.id === clientId);
            if (c && c.logs && c.logs[date]) {
                c.logs[date] = c.logs[date].filter(l => l.id !== logId);
                if (c.logs[date].length === 0) delete c.logs[date];
                await window.syncToCloud(); window.renderRoster();
            }
        });
    };

    window.renderRoster = () => {
        let rosterEl = document.getElementById('rosterViewContainer');
        if (!rosterEl) return;

        let html = `<table style="margin-bottom:10px;"><thead><tr><th>Client</th><th>Slot</th><th>Prog</th><th>Action</th></tr></thead><tbody>`;
        window.clients.sort((a,b) => (a.slot || "23:59").localeCompare(b.slot || "23:59")).forEach(c => {
            html += `<tr><td><span class="client-link" onclick="openOv(${c.id})">${c.name}</span></td><td><b style="color:var(--text-muted); font-size:12px;">${window.formatTime(c.slot) || '-'}</b></td><td><b style="font-size:14px; color:var(--text);">${Object.keys(c.logs || {}).length + (c.prevSess || 0)}</b> / ${c.sess}</td><td><button class="btn-sub" style="border-color:var(--info); color:var(--info); padding:6px 12px; margin:0;" onclick="toggleGroup('roster-logs-${c.id}')">Logs</button></td></tr><tr id="roster-logs-${c.id}" style="display:none;"><td colspan="4" style="padding:10px 0; border:none;"><div style="background:var(--card); border:1px solid var(--border); border-radius:14px; padding:15px;">`;

            const dates = Object.keys(c.logs || {}).sort().reverse();
            if (dates.length === 0) { html += `<div style="text-align:center; font-size:12px; color:var(--text-muted);">No logs yet.</div>`; } 
            else {
                dates.forEach(d => {
                    let exercisesHtml = c.logs[d].map(ex => {
                        let setsHtml = ex.sets.map(s => `<div style="font-size:12px; color:var(--text-muted); margin-top:4px; border-bottom:1px dotted var(--border); padding-bottom:4px;"><b>S${s.set}:</b> ${s.w}kg &times; ${s.r}</div>`).join('');
                        return `<div style="background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:15px; margin-bottom:10px; position:relative;"><b style="font-size:13px; color:var(--text); display:block; margin-bottom:10px;">${ex.name}</b><button onclick="delLog(${c.id}, '${d}', ${ex.id})" style="position:absolute; right:15px; top:12px; background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.3); color:var(--danger); width:32px; height:32px; border-radius:8px; padding:0; display:flex; align-items:center; justify-content:center;"><i data-feather="trash-2" style="width:14px;"></i></button>${setsHtml}</div>`;
                    }).join('');
                    html += `<div style="margin-bottom:8px;"><div onclick="toggleGroup('rlog-${c.id}-${d}')" style="display:flex; justify-content:space-between; align-items:center; color:var(--primary); font-weight:800; font-size:13px; cursor:pointer; padding:10px 0; border-bottom:1px solid var(--border);"><span style="display:flex; align-items:center; gap:8px;"><i data-feather="calendar" style="width:14px;"></i> ${d}</span><i data-feather="chevron-down" style="width:16px;"></i></div><div id="rlog-${c.id}-${d}" style="display:none; padding-top:10px;">${exercisesHtml}</div></div>`;
                });
            }
            html += `</div></td></tr>`;
        });
        html += `</tbody></table>`;
        rosterEl.innerHTML = html;
    };

    // ==========================================
    // 9. REVENUE ENGINE (Splits PT/Sal)
    // ==========================================
    window.renderRevenue = () => {
        let mData = {}; let todaySal = 0; let todayPT = 0;
        
        [...window.shifts].sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(s => { 
            let m = s.date.slice(0,7); 
            if (!mData[m]) mData[m] = { sal: 0, pt: 0, pen: 0, exp: 0, daily: {}, lateCount: 0 }; 
            
            let dailyRate = s.baseDaily || ((window.trainerProfile.salary || 10000) / 30); 
            let actualPay = 0; let penaltyAmount = 0;

            if (s.status === 'Present' || s.status === 'Week Off') {
                actualPay = dailyRate;
                if (s.status === 'Present') {
                    if (s.isHalfDay) { actualPay = dailyRate * 0.5; penaltyAmount = dailyRate * 0.5; } 
                    else if (s.isLate) { 
                        mData[m].lateCount++; 
                        if (mData[m].lateCount % 3 === 0) { actualPay = dailyRate * 0.5; penaltyAmount = dailyRate * 0.5; } 
                    }
                }
            } else { penaltyAmount = dailyRate; }

            mData[m].sal += actualPay; mData[m].pen += penaltyAmount;
            if (!mData[m].daily[s.date]) mData[m].daily[s.date] = { sal: 0, pt: 0, pen: 0 }; 
            mData[m].daily[s.date].sal += actualPay; mData[m].daily[s.date].pen += penaltyAmount;
            if (s.date === window.today) todaySal += actualPay; 
        });
        
        window.clients.forEach(c => { 
            let pt = ((c.pay || 0) / (1 + (c.gst || 0)) * (c.ret || 0)) / (c.sess || 1); 
            Object.keys(c.logs || {}).forEach(d => { 
                if (c.logs[d].length > 0) { 
                    let m = d.slice(0,7); 
                    if (!mData[m]) mData[m] = { sal: 0, pt: 0, pen: 0, exp: 0, daily: {} }; 
                    mData[m].pt += pt; 
                    if (!mData[m].daily[d]) mData[m].daily[d] = { sal: 0, pt: 0, pen: 0 }; 
                    mData[m].daily[d].pt += pt; 
                    if (d === window.today) todayPT += pt; 
                } 
            }); 
        });
        
        window.expenses.forEach(e => { 
            let m = e.date.slice(0,7); 
            if (!mData[m]) mData[m] = { sal: 0, pt: 0, pen: 0, exp: 0, daily: {} }; 
            mData[m].exp += e.amt; 
        });
        
        let revHtml = "";
        Object.keys(mData).sort().reverse().forEach(m => { 
            let net = mData[m].sal + mData[m].pt - mData[m].exp; 
            let dailyHtml = ""; 
            
            Object.keys(mData[m].daily).sort().reverse().forEach(d => {
                let dayNet = mData[m].daily[d].sal + mData[m].daily[d].pt - mData[m].daily[d].pen;
                dailyHtml += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed var(--border); font-size:12px; font-weight:700;"><span style="color:var(--text-muted);"><i data-feather="calendar" style="width:12px;"></i> ${d}</span><span style="color:var(--text);">₹${dayNet.toFixed(0)}</span></div>`;
            });

            revHtml += `<div style="background:var(--bg); border:1px solid var(--border); border-radius:14px; margin-bottom:15px; overflow:hidden;"><div onclick="toggleGroup('rev-split-${m}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:15px;"><span style="display:flex; align-items:center; gap:10px; font-weight:800; color:var(--text);"><i data-feather="calendar" style="color:var(--text-muted); width:16px;"></i> ${m}</span><span style="color:${net < 0 ? 'var(--danger)' : 'var(--primary)'}; font-size:18px; font-weight:800; font-family:'Oswald';">₹${net.toFixed(0)} <i data-feather="chevron-down" style="width:16px; color:var(--text-muted); margin-left:5px;"></i></span></div><div id="rev-split-${m}" style="display:none; padding:15px; border-top:1px solid var(--border); background:var(--card);"><div style="background:var(--bg); padding:15px; border-radius:12px; display:flex; flex-wrap:wrap; gap:15px; font-size:11px; font-weight:800; color:var(--text-muted); margin-bottom:15px; border:1px solid var(--border);"><div style="display:flex; align-items:center; gap:5px; width:45%;"><i data-feather="dollar-sign" style="width:12px;"></i> GROSS SAL: <span style="color:var(--text);">₹${mData[m].sal.toFixed(0)}</span></div><div style="display:flex; align-items:center; gap:5px; width:45%;"><i data-feather="users" style="width:12px;"></i> PT: <span style="color:var(--text);">₹${mData[m].pt.toFixed(0)}</span></div><div style="display:flex; align-items:center; gap:5px; width:45%;"><i data-feather="alert-circle" style="width:12px; color:var(--danger);"></i> PEN: <span style="color:var(--danger);">-₹${mData[m].pen.toFixed(0)}</span></div><div style="display:flex; align-items:center; gap:5px; width:45%;"><i data-feather="credit-card" style="width:12px; color:var(--danger);"></i> EXP: <span style="color:var(--danger);">-₹${mData[m].exp.toFixed(0)}</span></div></div><div style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; border-bottom:1px dotted var(--border); padding-bottom:8px; margin-bottom:5px;">DAILY BREAKDOWN (EXCL. EXPENSES)</div>${dailyHtml}</div></div>`; 
        });

        let rv = document.getElementById('revView'); if(rv) rv.innerHTML = revHtml || `<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:20px 0;">No financial data logged.</div>`;
        let spt = document.getElementById('statPT'); if(spt) spt.innerText = `₹${todayPT.toFixed(0)}`;
        let ssal = document.getElementById('statSal'); if(ssal) ssal.innerText = `₹${todaySal.toFixed(0)}`;
        let sr = document.getElementById('statRevenue'); if(sr) sr.innerText = `₹${(todayPT + todaySal).toFixed(0)}`;
    };

    // ==========================================
    // 10. CLIENT PROFILE
    // ==========================================
    window.regClient = async () => { 
        const n = document.getElementById('regName').value; 
        if(!n) return window.showAlert("Name Required"); 
        
        window.clients.push({ 
            id: Date.now(), name: n, goal: document.getElementById('regGoal').value, phone: document.getElementById('regPhone').value, 
            gender: document.getElementById('regGender').value, age: document.getElementById('regAge').value, height: document.getElementById('regHeight').value, 
            receipt: document.getElementById('regReceipt').value, slot: document.getElementById('regSlot').value, med: document.getElementById('regMed').value, 
            prof: document.getElementById('regProf').value, pay: parseFloat(document.getElementById('regPay').value) || 0, 
            sess: parseInt(document.getElementById('regSess').value) || 1, prevSess: parseInt(document.getElementById('regPrevSess').value) || 0,
            ret: parseFloat(document.getElementById('regRet').value) || 0, gst: parseFloat(document.getElementById('regGst').value) || 0,
            logs: {}, bca: [], meals: [], gallery: [], cardio: [], mobility: [] 
        }); 
        
        await window.syncToCloud(); window.render(); 
        document.getElementById('regName').value = ""; window.showAlert("Client Saved Successfully!"); 
    };

    window.deleteCurrentClient = () => { 
        window.showConfirm("DANGER: Delete this client permanently?", async () => { window.clients = window.clients.filter(c => c.id !== window.curID); await window.syncToCloud(); document.getElementById('clientOverlay').style.display = 'none'; window.render(); }); 
    };

    window.showEditForm = () => { 
        const c = window.clients.find(x => x.id === window.curID); 
        document.getElementById('editName').value = c.name; document.getElementById('editGoal').value = c.goal || ""; document.getElementById('editPhone').value = c.phone || ""; document.getElementById('editSess').value = c.sess; document.getElementById('editPrevSess').value = c.prevSess || 0;
        document.getElementById('ovEditForm').style.display = 'block'; document.getElementById('clientMenu').style.display = 'none'; 
    };

    window.saveClientEdit = async () => { 
        const c = window.clients.find(x => x.id === window.curID); 
        c.name = document.getElementById('editName').value; c.goal = document.getElementById('editGoal').value; c.phone = document.getElementById('editPhone').value; c.sess = parseInt(document.getElementById('editSess').value) || c.sess; c.prevSess = parseInt(document.getElementById('editPrevSess').value) || 0;
        document.getElementById('ovEditForm').style.display = 'none'; 
        await window.syncToCloud(); window.openOv(window.curID); window.render(); 
    };

    window.sendWaReminder = () => { 
        const c = window.clients.find(x => x.id === window.curID); 
        const msg = `Hello ${c.name},\nReminder for your upcoming session at ${window.formatTime(c.slot || "")}.\nSee you soon! 💪\n-${window.trainerProfile.name.split(' ')[0]}`; 
        window.open(`https://wa.me/${(c.phone || "").replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`); 
    };

    window.generateVIPLink = () => { 
        navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?vip=' + window.curID); 
        window.showAlert("VIP Portal Link Copied to Clipboard!"); document.getElementById('clientMenu').style.display = 'none'; 
    };

    window.openOv = (id) => { 
        window.curID = id; const c = window.clients.find(x => x.id === id); 
        document.getElementById('clientOverlay').style.display = 'block'; 
        document.getElementById('ovName').innerText = c.name; 
        document.getElementById('ovTags').innerHTML = `${c.phone ? `<span style="color:var(--info);"><i data-feather="phone" style="width:12px;"></i> ${c.phone}</span> | ` : ''}${c.gender || 'N/A'} | ${c.age || '-'}yrs | ${c.height || '-'}cm`; 
        document.getElementById('ovGoalText').innerText = c.goal || "Not set";
        document.getElementById('bcaDate').value = window.today; 
        
        if(typeof window.renderBcaHistory === 'function') window.renderBcaHistory(); 
        if(typeof window.renderMealBuilder === 'function') window.renderMealBuilder(); 
        if(typeof window.renderTonnageChart === 'function') window.renderTonnageChart(); 
        if(typeof window.renderGallery === 'function') window.renderGallery(); 
        if(typeof window.renderCardio === 'function') window.renderCardio(); 
        if(typeof window.renderMobility === 'function') window.renderMobility(); 
        window.renderClientHistory(); window.updateIcons(); 
    };

    window.renderClientHistory = () => {
        const c = window.clients.find(x => x.id === window.curID); if(!c) return; 
        let html = ''; const dates = Object.keys(c.logs || {}).sort().reverse();
        
        if(dates.length === 0) { html = '<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:10px;">No workouts logged yet.</div>'; } 
        else { 
            dates.forEach(d => { 
                let logDetails = c.logs[d].map(ex => { 
                    let setsHtml = ex.sets.map(s => `<span class="badge" style="background:var(--card); border:1px solid var(--border); color:var(--text); padding:6px 10px; font-size:11px;">${s.w}kg x ${s.r} reps</span>`).join(' '); 
                    return `<div style="padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.05);"><div style="font-weight:800; font-size:13px; margin-bottom:8px; color:var(--text);">${ex.name}</div><div style="display:flex; flex-wrap:wrap; gap:6px;">${setsHtml}</div></div>`; 
                }).join(''); 
                html += `<div style="background:var(--bg); border:1px solid var(--border); border-radius:12px; margin-bottom:12px; padding:12px 15px;"><div onclick="toggleGroup('hist-detail-${d}')" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-weight:800; font-size:14px; color:var(--info);"><span style="display:flex; align-items:center; gap:8px;"><i data-feather="calendar" style="width:14px;"></i> ${d}</span><i data-feather="chevron-down" style="width:16px;"></i></div><div id="hist-detail-${d}" style="display:none; margin-top:10px; border-top:1px solid var(--border); padding-top:5px;">${logDetails}</div></div>`; 
            }); 
        }
        let histPane = document.getElementById('clientWorkoutHistoryPane'); if(histPane) histPane.innerHTML = html; 
    };

    // ==========================================
    // 11. BCA & NUTRITION
    // ==========================================
    window.saveBca = async () => { 
        const c = window.clients.find(x => x.id === window.curID); const d = document.getElementById('bcaDate').value; const w = parseFloat(document.getElementById('inWeight').value) || 0; 
        if (w === 0) return window.showAlert("Enter Weight"); 
        
        c.bca.push({ date: d, w: w, smm: parseFloat(document.getElementById('inSmm').value) || 0, pbf: parseFloat(document.getElementById('inPbf').value) || 0, bmi: parseFloat(document.getElementById('inBmi').value) || 0, score: parseFloat(document.getElementById('inScore').value) || 0, visFat: parseFloat(document.getElementById('inVisFat').value) || 0, bmr: parseFloat(document.getElementById('inBmr').value) || 0 }); 
        c.bca.sort((a,b) => new Date(b.date) - new Date(a.date)); 
        await window.syncToCloud(); window.renderBcaHistory(); 
    };

    window.renderBcaHistory = () => { 
        const c = window.clients.find(x => x.id === window.curID); let hEl = document.getElementById('bcaHistory'); 
        if (hEl) { 
            hEl.innerHTML = c.bca.map(b => `<div class="history-row" style="font-size:12px; border-bottom:1px dashed var(--border); padding:10px 0;"><span style="color:var(--text); font-weight:700;">${b.date} - <span style="color:var(--info);">W:${b.w}</span> | F:${b.pbf} | M:${b.smm}</span><button class="btn-action danger" style="padding:6px; margin:0;" onclick="delBca('${b.date}')"><i data-feather="trash-2" style="width:14px;"></i></button></div>`).join(''); 
            hEl.style.display = c.bca.length ? 'block' : 'none'; 
        } 
    };

    window.delBca = (d) => { window.showConfirm("Delete this record?", async () => { window.clients.find(x => x.id === window.curID).bca = window.clients.find(x => x.id === window.curID).bca.filter(b => b.date !== d); await window.syncToCloud(); window.renderBcaHistory(); }); };

    window.generateSmartPlan = async () => { 
        const c = window.clients.find(x => x.id === window.curID); const pbf = parseFloat(document.getElementById('inPbf').value) || 0; const w = parseFloat(document.getElementById('inWeight').value) || 0; const bmr = parseFloat(document.getElementById('inBmr').value) || 0; 
        if (bmr === 0) return window.showAlert("Enter BMR to calculate macros."); 
        
        let tdee = Math.round(bmr * 1.2); let targetCal = pbf > 22 ? tdee - 500 : tdee + 300; 
        c.tdee = targetCal; c.macros = { p: Math.round(w * 2), c: Math.round((targetCal - ((Math.round(w * 2) * 4) + Math.round((targetCal * 0.25) / 9) * 9)) / 4), f: Math.round((targetCal * 0.25) / 9) }; 
        await window.syncToCloud(); window.renderMealBuilder(); 
    };
    
    window.fetchMacros = async () => { 
        const food = document.getElementById('mbName').value; const amt = parseFloat(document.getElementById('mbQty').value) || 1; const unit = document.getElementById('mbUnit').value; 
        if (!food) return window.showAlert("Enter a food name first!"); 
        
        const btn = document.getElementById('btnFetchMacro'); const oldHtml = btn.innerHTML; 
        btn.innerHTML = `<i data-feather="loader" style="animation:spin 1s linear infinite; margin:0;"></i>`; 
        
        try { 
            const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${window.RYAL_USDA_KEY}&query=${encodeURIComponent(food)}&dataType=Foundation,SR%20Legacy&pageSize=3`); 
            if (res.status === 429) throw new Error("RATE_LIMIT"); 
            const data = await res.json(); 
            
            if (data.foods && data.foods.length > 0) { 
                const item = data.foods[0]; const nutrients = item.foodNutrients || []; 
                const getNut = (id) => { const nut = nutrients.find(x => x.nutrientId === id); return nut ? nut.value : 0; }; 
                let multiplier = unit === 'g' ? amt / 100 : (amt * (item.servingSize || 100)) / 100; 
                document.getElementById('mbP').value = Math.round(getNut(1003) * multiplier); document.getElementById('mbC').value = Math.round(getNut(1005) * multiplier); document.getElementById('mbF').value = Math.round(getNut(1004) * multiplier); 
            } else { window.showAlert(`No exact match for "${food}".`); } 
        } catch(e) { window.showAlert("USDA API Limit or Connection Error."); } finally { btn.innerHTML = oldHtml; window.updateIcons(); } 
    };

    window.addMeal = async () => { 
        const c = window.clients.find(x => x.id === window.curID); const n = document.getElementById('mbName').value; 
        if (!n) return window.showAlert("Food name is required."); 
        c.meals.push({ id: Date.now(), name: n, cat: document.getElementById('mbCat').value, p: parseFloat(document.getElementById('mbP').value) || 0, c: parseFloat(document.getElementById('mbC').value) || 0, f: parseFloat(document.getElementById('mbF').value) || 0 }); 
        await window.syncToCloud(); window.renderMealBuilder(); 
    };

    window.renderMealBuilder = () => { 
        const c = window.clients.find(x => x.id === window.curID); if (!c.tdee) return; 
        let tP = 0, tC = 0, tF = 0, tKcal = 0; c.meals.forEach(m => { tP += m.p; tC += m.c; tF += m.f; tKcal += (m.p * 4 + m.c * 4 + m.f * 9); }); 
        
        let statsArea = document.getElementById('mealStatsArea');
        if(statsArea) statsArea.innerHTML = `<div style="display:flex; justify-content:space-between; background:var(--card); padding:15px; border-radius:12px; border:1px solid var(--border); font-weight:800; font-size:13px;"><div style="color:var(--text);">TDEE: ${c.tdee} kcal</div><div style="color:${c.tdee - tKcal < 0 ? 'var(--danger)' : '#10b981'};">REM: ${c.tdee - tKcal} kcal</div></div>`; 
            
        let listArea = document.getElementById('mealListArea');
        if(listArea) listArea.innerHTML = c.meals.map(m => `<div class="history-row" style="font-size:12px; background:var(--bg); padding:10px 15px; border-radius:10px; margin-bottom:5px; border:1px solid var(--border);"><span style="font-weight:700;">${m.name} <span style="color:var(--text-muted); font-weight:600;">(P:${m.p} C:${m.c} F:${m.f})</span></span><button class="btn-action danger" style="padding:6px; margin:0;" onclick="delMeal(${m.id})"><i data-feather="trash-2" style="width:14px;"></i></button></div>`).join(''); 
    };

    window.delMeal = (id) => { window.clients.find(x => x.id === window.curID).meals = window.clients.find(x => x.id === window.curID).meals.filter(m => m.id !== id); window.syncToCloud().then(window.renderMealBuilder); };

    // ==========================================
    // 12. WORKOUT TRACKING 
    // ==========================================
    window.loadSplit = (s) => { 
        const el = document.getElementById('exTagsContainer'); document.getElementById('setForm').style.display = 'none'; 
        if (window.workoutDB[s]) { document.getElementById('logWorkoutName').value = document.getElementById('logWorkoutName').value || s; el.innerHTML = window.workoutDB[s].map(ex => `<div class="ex-tag" onclick="selSplitEx('${ex}', this)">${ex}</div>`).join(''); } 
        else { el.innerHTML = ""; } 
    };

    window.selSplitEx = (n, el) => { document.querySelectorAll('.ex-tag').forEach(e => e.classList.remove('active')); el.classList.add('active'); window.curExName = n; document.getElementById('curEx').innerText = n; window.generateSetInputs(); document.getElementById('setForm').style.display = 'block'; };

    window.searchEx = (v) => { 
        const r = document.getElementById('searchRes'); if (v.length < 2) return r.style.display = 'none'; 
        let m = []; Object.values(window.workoutDB).forEach(l => l.forEach(e => { if (e.toLowerCase().includes(v.toLowerCase()) && !m.includes(e)) m.push(e); })); 
        r.innerHTML = m.map(ex => `<div style="padding:12px; border-bottom:1px solid var(--border); cursor:pointer; font-weight:600;" onclick="selSplitEx('${ex}', this); document.getElementById('searchRes').style.display='none';">${ex}</div>`).join(''); 
        r.style.display = 'block'; 
    };

    window.generateSetInputs = () => { 
        let c = parseInt(document.getElementById('numSets').value) || 1; let h = ""; 
        for (let i = 1; i <= c; i++) { h += `<div style="display:flex; gap:10px; margin-bottom:8px; align-items:center;"><span style="font-size:11px; font-weight:800; color:var(--text-muted); width:30px;">S${i}</span><input type="number" id="inW_${i}" placeholder="Weight (kg)" style="margin:0; background:var(--card);"><input type="number" id="inR_${i}" placeholder="Reps" style="margin:0; background:var(--card);"></div>`; } 
        document.getElementById('setInputsContainer').innerHTML = h; 
    };

    window.saveExercise = async () => { 
        const d = document.getElementById('logDate').value; const wName = document.getElementById('logWorkoutName').value; 
        let sets = []; const c = parseInt(document.getElementById('numSets').value) || 1; 
        for (let i = 1; i <= c; i++) { let w = document.getElementById(`inW_${i}`).value; let r = document.getElementById(`inR_${i}`).value; if (w || r) sets.push({ set: i, w: w, r: r }); } 
        if (!sets.length) return window.showAlert("Enter at least one set!"); 
        const cl = window.clients.find(x => x.id === window.curID); if (!cl.logs[d]) cl.logs[d] = []; 
        cl.logs[d].push({ id: Date.now(), workoutName: wName, name: window.curExName, sets: sets }); 
        await window.syncToCloud(); 
        document.getElementById('setForm').style.display = 'none'; document.querySelectorAll('.ex-tag').forEach(e => e.classList.remove('active')); 
        if(typeof window.renderTonnageChart === 'function') window.renderTonnageChart(); 
        if(typeof window.renderClientHistory === 'function') window.renderClientHistory(); 
    };

    window.renderTonnageChart = () => { 
        const c = window.clients.find(x => x.id === window.curID); if (!c) return; 
        if (window.tonnageChartInst) window.tonnageChartInst.destroy(); 
        let map = {}; Object.keys(c.logs || {}).forEach(d => { let t = 0; c.logs[d].forEach(e => { if (e.sets) e.sets.forEach(s => t += (parseFloat(s.w) || 0) * (parseInt(s.r) || 0)); }); if (t > 0) map[d] = t; }); 
        const dates = Object.keys(map).sort((a,b) => new Date(a) - new Date(b)).slice(-10); 
        const canvas = document.getElementById('tonnageChart'); const noDataText = document.getElementById('tonnageNoData'); 
        if (dates.length === 0) { if (canvas) canvas.style.display = 'none'; if (noDataText) noDataText.style.display = 'block'; return; } 
        if (canvas) canvas.style.display = 'block'; if (noDataText) noDataText.style.display = 'none'; 
        window.tonnageChartInst = new Chart(canvas.getContext('2d'), { type: 'bar', data: { labels: dates, datasets: [{ label: 'Volume (kg)', data: dates.map(d => map[d]), backgroundColor: '#970747', borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(150,150,150,0.1)' } } } } }); 
    };

    // ==========================================
    // 13. REST TIMER
    // ==========================================
    window.startRestTimer = (seconds) => { 
        if (window.timerInt) clearInterval(window.timerInt); 
        document.getElementById('restTimerUI').style.display = 'flex'; let rem = seconds; 
        const update = () => { let m = Math.floor(rem / 60); let s = rem % 60; document.getElementById('timerText').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; if (rem <= 0) { clearInterval(window.timerInt); document.getElementById('timerText').innerText = "REST OVER!"; } rem--; }; 
        update(); window.timerInt = setInterval(update, 1000); 
    };
    window.stopRestTimer = () => { if (window.timerInt) clearInterval(window.timerInt); document.getElementById('restTimerUI').style.display = 'none'; };

    // ==========================================
    // 14. CARDIO & MOBILITY
    // ==========================================
    window.saveCardio = async () => { 
        const c = window.clients.find(x => x.id === window.curID); 
        c.cardio.push({ id: Date.now(), date: document.getElementById('cardioDate').value || window.today, type: document.getElementById('cardioType').value, dist: document.getElementById('cardioDist').value, time: document.getElementById('cardioTime').value }); 
        c.cardio.sort((a,b) => new Date(b.date) - new Date(a.date)); await window.syncToCloud(); window.renderCardio(); 
    };

    window.renderCardio = () => { 
        const c = window.clients.find(x => x.id === window.curID); let cl = document.getElementById('cardioList'); if (!cl) return; 
        cl.innerHTML = c.cardio.map(l => `<div class="history-row" style="font-size:12px; background:var(--card); padding:12px 15px; border-radius:12px; margin-bottom:8px; border:1px solid var(--border);"><span><b style="color:var(--danger);">${l.type}</b>: ${l.dist}km in ${l.time}m<br><span style="color:var(--text-muted);font-size:10px; font-weight:800;">${l.date}</span></span><button class="btn-action danger" style="padding:6px; margin:0;" onclick="delCardio(${l.id})"><i data-feather="trash-2" style="width:14px;"></i></button></div>`).join(''); 
        cl.style.display = c.cardio.length ? 'block' : 'none'; 
    };

    window.delCardio = (id) => { const c = window.clients.find(x => x.id === window.curID); c.cardio = c.cardio.filter(l => l.id !== id); window.syncToCloud().then(window.renderCardio); };

    window.saveMobility = async () => { 
        const c = window.clients.find(x => x.id === window.curID); 
        c.mobility.push({ id: Date.now(), date: document.getElementById('mobDate').value || window.today, muscle: document.getElementById('mobMuscle').value, exercise: document.getElementById('mobExercise').value, time: document.getElementById('mobTime').value, sets: document.getElementById('mobSets').value }); 
        c.mobility.sort((a,b) => new Date(b.date) - new Date(a.date)); await window.syncToCloud(); window.renderMobility(); 
    };

    window.renderMobility = () => { 
        const c = window.clients.find(x => x.id === window.curID); let ml = document.getElementById('mobList'); if (!ml) return; 
        ml.innerHTML = c.mobility.map(l => `<div class="history-row" style="font-size:12px; background:var(--card); padding:12px 15px; border-radius:12px; margin-bottom:8px; border:1px solid var(--border);"><span><b style="color:#10b981;">${l.muscle}</b>: ${l.exercise}<br><span style="color:var(--text-muted);font-size:10px; font-weight:800;">${l.time}s x ${l.sets} sets | ${l.date}</span></span><button class="btn-action danger" style="padding:6px; margin:0;" onclick="delMobility(${l.id})"><i data-feather="trash-2" style="width:14px;"></i></button></div>`).join(''); 
        ml.style.display = c.mobility.length ? 'block' : 'none'; 
    };

    window.delMobility = (id) => { const c = window.clients.find(x => x.id === window.curID); c.mobility = c.mobility.filter(l => l.id !== id); window.syncToCloud().then(window.renderMobility); };

    // ==========================================
    // 15. AUTO-GALLERY
    // ==========================================
    window.uploadToGallery = (e) => { 
        const f = e.target.files[0]; if (!f) return; const r = new FileReader(); 
        r.onload = function(ev) { 
            const i = new Image(); i.onload = async function() { 
                const cv = document.createElement('canvas'); cv.width = 300; cv.height = i.height * (300 / i.width); cv.getContext('2d').drawImage(i, 0, 0, cv.width, cv.height); 
                const c = window.clients.find(x => x.id === window.curID); if (!c.gallery) c.gallery = []; 
                c.gallery.push({ id: Date.now(), date: document.getElementById('gallerySearchDate').value || window.today, img: cv.toDataURL('image/jpeg', 0.6) }); 
                c.gallery.sort((a,b) => new Date(b.date) - new Date(a.date)); await window.syncToCloud(); window.renderGallery(); 
            }; i.src = ev.target.result; 
        }; r.readAsDataURL(f); 
    };

    window.renderGallery = () => { 
        const c = window.clients.find(x => x.id === window.curID); const grid = document.getElementById('galleryGrid'); if (!grid) return; 
        if (!c.gallery || c.gallery.length === 0) { grid.innerHTML = `<div style="font-size:12px; color:var(--text-muted); padding:10px; text-align:center; width:100%;">No photos uploaded yet.</div>`; if (window.galleryAutoScroller) clearInterval(window.galleryAutoScroller); return; } 
        grid.innerHTML = c.gallery.map(p => `<div class="gallery-item" style="animation: fadeIn 0.4s ease forwards;"><img src="${p.img}" class="gallery-img" style="pointer-events:none;"><div class="gallery-date">${p.date}</div><button class="gallery-del" onclick="delGalleryPhoto(${p.id})"><i data-feather="x" style="width:14px;color:white;"></i></button></div>`).join(''); 
        if (window.galleryAutoScroller) clearInterval(window.galleryAutoScroller); 
        window.galleryAutoScroller = setInterval(() => { if (grid.children.length < 2) return; const maxScroll = grid.scrollWidth - grid.clientWidth; if (grid.scrollLeft >= maxScroll - 5) window.galleryScrollDirection = -1; else if (grid.scrollLeft <= 0) window.galleryScrollDirection = 1; grid.scrollBy({ left: 150 * window.galleryScrollDirection, behavior: 'smooth' }); }, 2500); 
    };

    window.delGalleryPhoto = (id) => { window.showConfirm("Delete this photo?", async () => { const c = window.clients.find(x => x.id === window.curID); c.gallery = c.gallery.filter(p => p.id !== id); await window.syncToCloud(); window.renderGallery(); }); };

    window.searchGalleryByDate = (d) => { const c = window.clients.find(x => x.id === window.curID); const idx = c.gallery.findIndex(p => p.date === d); if (idx !== -1) document.getElementById('galleryGrid').scrollTo({ left: idx * 150, behavior: 'smooth' }); else window.showAlert("No photo found."); };

    // ==========================================
    // 16. CLINICAL TOOLS
    // ==========================================
    window.renderLibrary = () => { let libEl = document.getElementById('libraryList'); if (libEl) libEl.innerHTML = window.videoLibrary.map(v => `<div class="history-row" style="font-size:13px; border-bottom:1px dashed var(--border); padding:10px 0;"><span style="font-weight:700;">${v.name}</span><button class="btn-action danger" style="padding:6px; margin:0;" onclick="delLibraryVideo(${v.id})"><i data-feather="trash-2" style="width:14px;"></i></button></div>`).join(''); };
    window.renderResearch = () => { let resEl = document.getElementById('researchList'); if (resEl) resEl.innerHTML = window.researchCenter.map(r => `<div class="history-row" style="font-size:13px; border-bottom:1px dashed var(--border); padding:10px 0;"><span style="font-weight:700;">${r.title}</span><button class="btn-action danger" style="padding:6px; margin:0;" onclick="delResearchArticle(${r.id})"><i data-feather="trash-2" style="width:14px;"></i></button></div>`).join(''); };
    window.renderSplitManager = () => { 
        let h = ""; Object.keys(window.workoutDB).forEach(s => { h += `<div style="margin-bottom:10px; background:var(--card); padding:15px; border-radius:14px; border:1px solid var(--border);"><b style="font-size:14px; color:var(--text);">${s}</b><div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">${window.workoutDB[s].map((ex,i) => `<span class="badge" style="background:var(--bg); border:1px solid var(--border); color:var(--text); padding:6px 10px; font-size:11px;">${ex} <i data-feather="x" style="width:12px; cursor:pointer; color:var(--danger); margin-left:4px;" onclick="removeExFromSplit('${s}', ${i})"></i></span>`).join('')}</div></div>`; }); 
        let smEl = document.getElementById('splitManagerList'); if (smEl) smEl.innerHTML = h; let esEl = document.getElementById('existingSplits'); if (esEl) esEl.innerHTML = Object.keys(window.workoutDB).map(s => `<option value="${s}">`).join(''); let mdEl = document.getElementById('muscleDataList'); if (mdEl) mdEl.innerHTML = Object.keys(window.workoutDB).map(s => `<option value="${s}">`).join(''); 
    };

    window.addLibraryVideo = async () => { window.videoLibrary.push({ id: Date.now(), name: document.getElementById('libExName').value, muscle: document.getElementById('libExMuscle').value, url: document.getElementById('libExVideo').value }); await window.syncToCloud(); window.renderLibrary(); document.getElementById('libExName').value = ""; document.getElementById('libExVideo').value = ""; };
    window.delLibraryVideo = (id) => { window.videoLibrary = window.videoLibrary.filter(v => v.id !== id); window.syncToCloud().then(window.renderLibrary); };
    window.addResearchArticle = async () => { window.researchCenter.push({ id: Date.now(), title: document.getElementById('resTitle').value, cat: document.getElementById('resCat').value, content: document.getElementById('resContent').value, date: window.today }); await window.syncToCloud(); window.renderResearch(); document.getElementById('resTitle').value = ""; document.getElementById('resContent').value = ""; };
    window.delResearchArticle = (id) => { window.researchCenter = window.researchCenter.filter(r => r.id !== id); window.syncToCloud().then(window.renderResearch); };
    window.addExerciseToSplit = async () => { const s = document.getElementById('newSplitName').value; const e = document.getElementById('newSplitEx').value; if (!window.workoutDB[s]) window.workoutDB[s] = []; if (!window.workoutDB[s].includes(e)) window.workoutDB[s].push(e); await window.syncToCloud(); window.renderSplitManager(); document.getElementById('newSplitEx').value = ""; };
    window.removeExFromSplit = async (s, i) => { window.workoutDB[s].splice(i, 1); await window.syncToCloud(); window.renderSplitManager(); };
    window.sendSupportTicket = async () => { await addDoc(collection(db, "support_tickets"), { uid: window.currentUser.uid, trainer: window.trainerProfile.name, subject: document.getElementById('supportSubject').value, message: document.getElementById('supportMsg').value, date: window.today }); window.showAlert("Ticket Sent!"); document.getElementById('supportSubject').value = ""; document.getElementById('supportMsg').value = ""; };


    // ==========================================
    // 18. AI SUITE (RESTORED WITH TIMEOUTS/ABORTS)
    // ==========================================
    
    // Core AI Fetch wrapper to prevent hanging the web app
    const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    };

    window.openAIChat = () => { 
        document.getElementById('aiAssistantOverlay').style.display = 'flex'; 
        setTimeout(() => { document.getElementById('aiChatInput').focus(); }, 100);
    };
    window.closeAIChat = () => { document.getElementById('aiAssistantOverlay').style.display = 'none'; };

        window.sendAiChatMessage = async () => { 
        const inputEl = document.getElementById('aiChatInput'); 
        const msg = inputEl.value.trim(); 
        if (!msg) return; 
        
                if (!window.RYAL_AI_KEY) {
            return window.showAlert("Missing or Invalid API Key format."); 
        }
        
        const c = window.clients.find(x => x.id === window.curID); 
        const chatBox = document.getElementById('chatMessages'); 
        
        chatBox.innerHTML += `<div class="chat-msg user">${msg}</div>`; 
        inputEl.value = ""; 
        
        const loadId = 'loading-' + Date.now(); 
        chatBox.innerHTML += `<div class="chat-msg bot" id="${loadId}"><i class="fas fa-spinner fa-spin"></i> Communicating with Google...</div>`; 
        chatBox.scrollTop = chatBox.scrollHeight; 
        window.updateIcons(); 
        
        let w = c && c.bca && c.bca.length ? c.bca[0].w : "Unknown"; 
        let pbf = c && c.bca && c.bca.length ? c.bca[0].pbf : "Unknown"; 
        let macros = c && c.macros ? `${c.macros.p}g Pro, ${c.macros.c}g Carb, ${c.macros.f}g Fat` : "Not calculated"; 
        let recentWorkouts = c && c.logs ? Object.keys(c.logs).sort().reverse().slice(0, 3).map(d => `${d}: ${c.logs[d].map(l => l.name).join(', ')}`).join(' | ') : "No data"; 
        
        const prompt = `Act as an elite sports scientist. Review this client and answer based on this clinical data. Format with basic HTML (<b>, <br>) but NO markdown. Question: "${msg}"\n\nClient Data: ${c ? c.name : 'Unknown'}\nGoal: ${c ? c.goal : 'Not specified'}\nBody: ${w}kg, Fat ${pbf}%\nMacros: ${macros}\nRecent Logs:\n${recentWorkouts}`; 
        
        try { 
            const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${window.RYAL_AI_KEY}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) 
            }, 15000); 
            
            const data = await response.json(); 
            
            // If Google sends back an error code, throw it directly to the UI
            if (!response.ok) {
                 throw new Error(`HTTP ${response.status} - ${data.error ? data.error.message : 'Unknown Server Error'}`);
            }
            if (data.error) throw new Error(data.error.message); 
            
            document.getElementById(loadId).remove(); 
            chatBox.innerHTML += `<div class="chat-msg bot">${data.candidates[0].content.parts[0].text}</div>`; 
        } catch(e) { 
            document.getElementById(loadId).remove(); 
            
            // Print the exact system error to the chat UI
            chatBox.innerHTML += `<div class="chat-msg bot" style="color:var(--danger); border-color:var(--danger);"><b>System Failure:</b> ${e.message}</div>`; 
            console.error("Deep AI Error Logs:", e);
        } finally { 
            chatBox.scrollTop = chatBox.scrollHeight; 
            window.updateIcons(); 
        } 
    };


    window.runPlateauAI = async () => { 
        if (!window.RYAL_AI_KEY) return window.showAlert("Missing Gemini API Key"); 
        
        const c = window.clients.find(x => x.id === window.curID); if (!c) return; 
        
        document.getElementById('aiThinking').style.display = 'block'; 
        document.getElementById('aiResultText').style.display = 'none'; 
        window.updateIcons(); 
        
        let w = c.bca && c.bca.length ? c.bca[0].w : "Unknown"; let pbf = c.bca && c.bca.length ? c.bca[0].pbf : "Unknown"; let macros = c.macros ? `${c.macros.p}g Pro, ${c.macros.c}g Carb, ${c.macros.f}g Fat` : "Not calculated"; let recentWorkouts = Object.keys(c.logs || {}).slice(0, 3).map(d => `${d}: ${c.logs[d].map(l => l.name).join(', ')}`).join('\n') || "No data"; 
        
        const prompt = `Act as an elite sports scientist. Review this client and provide a concise, 3-step actionable protocol to break their plateau. Format with plain HTML tags (<b>, <br>). No markdown asterisks.\nClient: ${c.name}, ${c.gender}, ${c.age}yrs\nMain Goal: ${c.goal || 'Not specified'}\nBody: ${w}kg, Fat ${pbf}%\nMacros: ${macros}\nRecent Logs:\n${recentWorkouts}`; 
        
        try { 
            const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${window.RYAL_AI_KEY}`, { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) 
            }, 8000); 
            
            const data = await response.json(); 
            if(data.error) throw new Error();
            document.getElementById('aiResultText').innerHTML = data.candidates[0].content.parts[0].text; 
            document.getElementById('aiResultText').style.display = 'block'; 
        } catch(e) { 
            window.showAlert("AI Engine Timeout. The system remains stable."); 
        } finally { 
            document.getElementById('aiThinking').style.display = 'none'; 
        } 
    };

    window.generateAIExercises = async (isRefresh = false) => { 
        if (!window.RYAL_AI_KEY) return window.showAlert("Missing API Key!"); 
        
        const input = document.getElementById('aiWorkoutInput').value; if (!input) return; 
        
        const btn = isRefresh ? document.getElementById('aiRefreshBtn') : document.getElementById('aiGenerateBtn'); 
        const originalHtml = btn.innerHTML; 
        btn.innerHTML = `<i data-feather="loader" style="animation:spin 1s linear infinite;"></i>`; 
        window.updateIcons(); 
        
        let extra = isRefresh ? "Provide 6 COMPLETELY DIFFERENT exercises. " : ""; 
        const prompt = `Act as a fitness coach. ${extra}Provide exactly 6 exercises for: ${input}. STRICT RULE: Output ONLY a comma-separated list of names. NO intro text, NO outro text, NO bullet points, NO markdown. Just the comma-separated names.`; 
        
        try { 
            const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${window.RYAL_AI_KEY}`, { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) 
            }, 6000); 
            
            const data = await response.json(); 
            if (data.error) throw new Error(); 
            
            let exercises = data.candidates[0].content.parts[0].text.replace(/\*/g, '').split(/,|\n/).map(e => e.replace(/^[0-9.\-]+\s*/, '').trim()).filter(e => e.length > 2 && e.length < 35 && !e.toLowerCase().includes('thought')); 
            
            document.getElementById('splitSelect').value = ""; 
            document.getElementById('exTagsContainer').innerHTML = exercises.slice(0, 8).map(ex => `<div class="ex-tag" onclick="selSplitEx('${ex}', this)">${ex}</div>`).join(''); 
            document.getElementById('setForm').style.display = 'none'; 
        } catch(e) { 
            window.showAlert("AI API Timeout. Proceed manually."); 
        } finally { 
            btn.innerHTML = originalHtml; window.updateIcons(); 
        } 
    };

    window.generateAIMobility = async (isRefresh = false) => { 
        if (!window.RYAL_AI_KEY) return window.showAlert("Missing API Key!"); 
        
        const input = document.getElementById('aiMobilityInput').value; if (!input) return; 
        
        const btn = isRefresh ? document.getElementById('aiMobRefreshBtn') : document.getElementById('aiMobGenerateBtn'); 
        const originalHtml = btn.innerHTML; 
        btn.innerHTML = `<i data-feather="loader" style="animation:spin 1s linear infinite;"></i>`; 
        window.updateIcons(); 
        
        let extra = isRefresh ? "Provide 4 COMPLETELY DIFFERENT stretches. " : ""; 
        const prompt = `Act as a physical therapist. ${extra}Provide exactly 4 stretches for: ${input}. STRICT RULE: Output ONLY a comma-separated list of names. NO intro text, NO outro text, NO bullet points, NO markdown. Just the comma-separated names.`; 
        
        try { 
            const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${window.RYAL_AI_KEY}`, { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) 
            }, 6000); 
            
            const data = await response.json(); 
            if (data.error) throw new Error(); 
            
            let exercises = data.candidates[0].content.parts[0].text.replace(/\*/g, '').split(/,|\n/).map(e => e.replace(/^[0-9.\-]+\s*/, '').trim()).filter(e => e.length > 2 && e.length < 40 && !e.toLowerCase().includes('thought')); 
            
            document.getElementById('mobTagsContainer').innerHTML = exercises.slice(0, 6).map(ex => `<div class="ex-tag" onclick="document.getElementById('mobMuscle').value='${input}'; document.getElementById('mobExercise').value='${ex}';">${ex}</div>`).join(''); 
        } catch(e) { 
            window.showAlert("AI API Timeout. Proceed manually."); 
        } finally { 
            btn.innerHTML = originalHtml; window.updateIcons(); 
        } 
    };

    window.runEndoAI = async () => { 
        if (!window.RYAL_AI_KEY) return window.showAlert("Missing API Key"); 
        
        const compound = document.getElementById('endoCompoundSearch').value.trim(); if (!compound) return; 
        
        const btn = document.getElementById('endoAiBtn'); const resBox = document.getElementById('endoAiResult'); 
        const old = btn.innerHTML; 
        
        btn.innerHTML = `<i data-feather="loader" style="animation:spin 1s linear infinite;"></i> Fetching...`; 
        resBox.style.display = 'none'; window.updateIcons(); 
        
        try { 
            const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${window.RYAL_AI_KEY}`, { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `Act as a clinical sports pharmacologist. Provide a detailed, objective clinical profile for ${compound}. Discuss half-life, pros, risks, dosages. HTML tags (<b>, <br>, <ul>, <li>) only. No markdown.` }] }] }) 
            }, 10000); 
            
                    const data = await response.json(); 
        if (!response.ok) throw new Error(data.error ? data.error.message : "Server Error");
        if (data.error) throw new Error(data.error.message); 
        
        resBox.innerHTML = `<b style="color:var(--danger);font-size:16px;font-family:'Oswald'; letter-spacing:0.5px;">${compound.toUpperCase()}</b><br><br>` + data.candidates[0].content.parts[0].text; 
        resBox.style.display = 'block'; 
    } catch(e) { 
        window.showAlert("AI Error: " + e.message); 
    } 

    };

    // ==========================================
    // 17. BULLETPROOF PRINT ENGINE
    // ==========================================
    window.ryalPrint = (htmlContent) => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0; z-index:-1;';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Report</title>
                <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11px; }
                    h1 { font-family: 'Oswald', sans-serif; text-transform: uppercase; margin: 0; font-size: 24px; letter-spacing: 1px; }
                    h3 { font-size: 14px; text-transform: uppercase; color: #0f172a; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: left; }
                    th { padding: 10px 8px; font-size: 10px; text-transform: uppercase; font-weight: 800; border: 1px solid #e2e8f0; }
                    td { padding: 10px 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; }
                    .pt-table th { background: #970747; color: white; border-color: #970747; }
                    .sal-table th { background: #f8fafc; color: #64748b; }
                    .exp-table th { background: #f8fafc; color: #64748b; }
                    .footer-box { display: flex; justify-content: space-around; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-top: 30px; text-align: center; }
                    .footer-box .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
                    .footer-box .val { font-size: 18px; font-weight: 800; }
                    .profit-pill { color: #10b981; background: rgba(16,185,129,0.1); padding: 4px 15px; border-radius: 20px; font-family: 'Oswald', sans-serif; font-size: 22px; display: inline-block; }
                </style>
            </head>
            <body>${htmlContent}</body>
            </html>
        `);
        doc.close(); 
        iframe.contentWindow.focus();
        setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 500);
    };

    window.generateProgressPDF = () => { 
        const c = window.clients.find(x => x.id === window.curID); 
        if (!c) return; 
        
        let bcaHtml = c.bca && c.bca.length ? `${c.bca[0].w}kg (Fat: ${c.bca[0].pbf}%)` : "No data"; 
        let macroHtml = c.macros ? `${c.macros.p}g P | ${c.macros.c}g C | ${c.macros.f}g F` : "Not set"; 
        
        let recentLogs = Object.keys(c.logs || {}).sort().reverse().slice(0, 5).map(d => `
            <div style="background:#f8fafc; padding:12px; border-radius:10px; margin-bottom:10px; border:1px solid #e2e8f0;">
                <b style="color:#0f172a; font-size:13px;">${d}</b><br>
                <span style="font-size:12px; color:#64748b;">${c.logs[d].map(l => l.name).join(', ')}</span>
            </div>`).join(''); 
            
        const htmlContent = `
            <div style="max-width: 800px; margin: 0 auto; padding:20px;">
                <div style="text-align:center; margin-bottom:30px;">
                    <h1 style="font-family:'Oswald', sans-serif; font-size:36px; margin:0;">${c.name}</h1>
                    <div style="font-size:12px; color:#970747; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-top:5px;">Lead Trainer: ${window.trainerProfile.name}</div>
                </div>
                <div style="display:flex; gap:15px; margin-bottom:20px;">
                    <div style="flex:1; background:#f8fafc; padding:20px; border-radius:16px; border:1px solid #e2e8f0; text-align:center;">
                        <h3 style="font-size:11px; color:#64748b; text-transform:uppercase; margin:0 0 10px 0; letter-spacing:1px; border:none;">Latest InBody</h3>
                        <b style="font-size:20px; font-family:'Oswald', sans-serif;">${bcaHtml}</b>
                    </div>
                    <div style="flex:1; background:#f8fafc; padding:20px; border-radius:16px; border:1px solid #e2e8f0; text-align:center;">
                        <h3 style="font-size:11px; color:#64748b; text-transform:uppercase; margin:0 0 10px 0; letter-spacing:1px; border:none;">Prescribed Macros</h3>
                        <b style="font-size:20px; font-family:'Oswald', sans-serif; color:#10b981;">${macroHtml}</b>
                    </div>
                </div>
                <h3 style="font-size:14px; text-transform:uppercase; border-bottom:2px solid #e2e8f0; padding-bottom:8px; margin-top:30px; letter-spacing:1px;">Workout History</h3>
                ${recentLogs || "<p style='color:#64748b;'>No logs available.</p>"}
            </div>`; 
        window.ryalPrint(htmlContent); 
    };

    window.generateMonthlyReportPDF = () => { 
        const month = document.getElementById('reportMonthInput').value || window.today.slice(0, 7); 
        let ptRows = ''; let totalPtRev = 0; let sr = 1; 
        
        window.clients.forEach(c => { 
            const logs = c.logs || {}; const monthDates = Object.keys(logs).filter(d => d.startsWith(month) && logs[d].length > 0); 
            const doneMonth = monthDates.length; 
            if (doneMonth > 0) { 
                const totalSess = c.sess || 1; const remSess = totalSess - Object.keys(logs).length; 
                const cutSess = ((c.pay || 0) / (1 + parseFloat(c.gst || 0)) * parseFloat(c.ret || 0)) / totalSess; 
                const earned = doneMonth * cutSess; totalPtRev += earned; 
                ptRows += `<tr><td>${sr++}</td><td><b>${c.name}</b></td><td>${c.receipt || '-'}</td><td>₹${c.pay || 0}</td><td>${c.start || '-'}</td><td>${c.end || '-'}</td><td>${totalSess}</td><td style="background:#fdf2f6; color:#970747;"><b>${doneMonth}</b></td><td>${remSess}</td><td>₹${cutSess.toFixed(2)}</td><td style="background:#fdf2f6; color:#970747;"><b>₹${earned.toFixed(2)}</b></td></tr>`; 
            } 
        }); 
        
        let attRows = ''; let totalSal = 0; 
        const monthShifts = window.shifts.filter(s => s.date.startsWith(month)).sort((a,b) => new Date(a.date) - new Date(b.date)); 
        
        monthShifts.forEach(s => { 
            let statusText = s.status; let statusColor = "#0f172a"; 
            if (s.status === 'Absent') { statusColor = "#ef4444"; } else if (s.status === 'Week Off') { statusColor = "#3b82f6"; } 
            else if (s.status === 'Present') { if (s.isLate) { statusText = "Present (Late)"; statusColor = "#f59e0b"; } else if (s.isHalfDay) { statusText = "Present (Half Day)"; statusColor = "#f59e0b"; } else { statusColor = "#10b981"; } } 
            let hours = "-"; 
            if (s.inTime && s.outTime) { 
                const [inH, inM] = s.inTime.split(':').map(Number); const [outH, outM] = s.outTime.split(':').map(Number); 
                let diff = (outH + outM / 60) - (inH + inM / 60); if (diff < 0) diff += 24; hours = diff.toFixed(1) + " hrs"; 
            } 
            totalSal += (s.pay || 0); 
            attRows += `<tr><td>${s.date}</td><td style="color:${statusColor}; font-weight:700;">${statusText}</td><td>${window.formatTime(s.inTime) || '-'}</td><td>${window.formatTime(s.outTime) || '-'}</td><td>${hours}</td><td>₹${(s.pay || 0).toFixed(2)}</td></tr>`; 
        }); 
        
        let expRows = ''; let totalExp = 0; 
        window.expenses.filter(e => e.date.startsWith(month)).forEach(e => { 
            totalExp += e.amt; expRows += `<tr><td>${e.date}</td><td><b>${e.cat}</b></td><td>${e.desc}</td><td style="color:#ef4444; font-weight:800;">₹${e.amt.toFixed(2)}</td></tr>`; 
        }); 
        
        let netProfit = totalSal + totalPtRev - totalExp; 
        
        const htmlContent = `
            <div style="text-align:center; margin-bottom:20px;">
                <h1>RYAL FITHUB PRO REPORT</h1>
                <div style="font-size:10px; font-weight:800; color:#64748b; margin-top:5px; text-transform:uppercase;">Month: ${month} | Trainer: ${window.trainerProfile.name}</div>
            </div>
            
            <h3>1. Personal Training (PT) Revenue</h3>
            <table class="pt-table">
                <thead><tr><th>SR.</th><th>NAME</th><th>RECEIPT</th><th>PKG ₹</th><th>START</th><th>END</th><th>SESS.</th><th>DONE</th><th>REM</th><th>CUT/SESS</th><th>EARNED</th></tr></thead>
                <tbody>${ptRows || `<tr><td colspan="11" style="text-align:center; padding:20px;">No PT sessions logged this month.</td></tr>`}</tbody>
            </table>
            <div style="text-align:right; font-size:12px; font-weight:800; margin-bottom:20px;">Total PT Revenue: <span style="color:#970747;">₹${totalPtRev.toFixed(2)}</span></div>
            
            <h3>2. Salary & Attendance</h3>
            <table class="sal-table">
                <thead><tr><th>DATE</th><th>STATUS</th><th>IN</th><th>OUT</th><th>HOURS</th><th>AMOUNT</th></tr></thead>
                <tbody>${attRows || `<tr><td colspan="6" style="text-align:center; padding:20px;">No attendance logged this month.</td></tr>`}</tbody>
            </table>
            
            <h3>3. Expenses</h3>
            <table class="exp-table">
                <thead><tr><th>DATE</th><th>CATEGORY</th><th>DESCRIPTION</th><th>AMOUNT</th></tr></thead>
                <tbody>${expRows || `<tr><td colspan="4" style="text-align:center; padding:20px;">No expenses logged this month.</td></tr>`}</tbody>
            </table>
            
            <div class="footer-box">
                <div><div class="label">Salary</div><div class="val">₹${totalSal.toFixed(2)}</div></div>
                <div><div class="label">PT Revenue</div><div class="val">₹${totalPtRev.toFixed(2)}</div></div>
                <div><div class="label">Expenses</div><div class="val" style="color:#ef4444;">-₹${totalExp.toFixed(2)}</div></div>
                <div><div class="label">Net Profit</div><div class="profit-pill">₹${netProfit.toFixed(2)}</div></div>
            </div>`; 
            
        window.ryalPrint(htmlContent); 
    };

    // ==========================================
    // 19. VIP PORTAL
    // ==========================================
    window.vipBcaChartInst = null;
    window.vipVolChartInst = null;

    window.loginVIP = async () => { 
        const id = document.getElementById('vipIdInput').value.trim(); 
        
        if (!id) {
            return window.showAlert("Please enter a VIP ID.");
        }

        document.getElementById('cloudLoader').style.display = 'flex'; 
        
        try { 
            const snap = await getDoc(doc(db, "vip_portals", id)); 
            if (snap.exists()) { 
                window.vipDataStore = snap.data(); 
                document.getElementById('vipLoginBox').style.display = 'none'; 
                document.getElementById('vipDashboard').style.display = 'block'; 
                window.renderLiveVIP(); 
            } else { 
                window.showAlert("Invalid VIP ID. Please check your link."); 
            } 
        } catch(e) { 
            console.error("VIP Login Error:", e);
            window.showAlert("Portal Access Blocked: " + e.message); 
        } 
        
        document.getElementById('cloudLoader').style.display = 'none'; 
    };

    window.renderLiveVIP = () => { 
        const d = window.vipDataStore; 
        const c = d.client;
        
        document.getElementById('vipLiveName').innerText = c.name; 
        document.getElementById('vipLiveTrainer').innerText = `Lead Coach: ${d.trainerName}`; 
        
        const logsCount = Object.keys(c.logs || {}).length;
        document.getElementById('vipStatSess').innerText = `${logsCount} / ${c.sess || 0}`;
        document.getElementById('vipStatWt').innerText = (c.bca && c.bca.length) ? `${c.bca[0].w}kg` : "-";
        document.getElementById('vipStatFat').innerText = (c.bca && c.bca.length) ? `${c.bca[0].pbf}%` : "-";

        const upcomingHtml = (d.plans || []).map(p => `
            <div style="background:var(--card); padding:12px; border-radius:12px; border:1px solid var(--border); margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                <div style="background:rgba(245, 158, 11, 0.1); color:var(--warning); padding:10px; border-radius:10px;"><i data-feather="calendar" style="width:16px;"></i></div>
                <div><b style="font-size:13px;">${p.date} @ ${window.formatTime(p.time)}</b><br><span style="font-size:11px; color:var(--text-muted);">${p.workout}</span></div>
            </div>`).join('') || `<div style="font-size:12px; color:var(--text-muted); text-align:center;">No upcoming sessions scheduled.</div>`;
        document.getElementById('vipUpcomingList').innerHTML = upcomingHtml;

        if (c.bca && c.bca.length) {
            const bcaReversed = [...c.bca].reverse(); 
            if (window.vipBcaChartInst) window.vipBcaChartInst.destroy();
            window.vipBcaChartInst = new Chart(document.getElementById('vipBcaChart').getContext('2d'), {
                type: 'line',
                data: { labels: bcaReversed.map(b => b.date.slice(5)), datasets: [
                    { label: 'Weight (kg)', data: bcaReversed.map(b => b.w), borderColor: '#970747', backgroundColor: '#970747', tension: 0.3 },
                    { label: 'Body Fat %', data: bcaReversed.map(b => b.pbf), borderColor: '#ef4444', backgroundColor: '#ef4444', tension: 0.3 }
                ]},
                options: { responsive: true, scales: { x: { display: true }, y: { display: false } } }
            });
            document.getElementById('vipBcaList').innerHTML = c.bca.map(b => `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed var(--border); font-size:12px;"><span style="color:var(--text-muted); font-weight:800;">${b.date}</span><span><b style="color:var(--primary);">${b.w}kg</b> | ${b.pbf}% Fat | ${b.smm}kg SMM</span></div>`).join('');
        }

        let volMap = {};
        Object.keys(c.logs || {}).forEach(date => {
            let t = 0; c.logs[date].forEach(e => { if (e.sets) e.sets.forEach(s => t += (parseFloat(s.w) || 0) * (parseInt(s.r) || 0)); });
            if (t > 0) volMap[date] = t;
        });
        const volDates = Object.keys(volMap).sort((a,b) => new Date(a) - new Date(b)).slice(-10);
        
        if (window.vipVolChartInst) window.vipVolChartInst.destroy();
        if (volDates.length > 0) {
            window.vipVolChartInst = new Chart(document.getElementById('vipVolumeChart').getContext('2d'), {
                type: 'bar',
                data: { labels: volDates.map(d=>d.slice(5)), datasets: [{ label: 'Volume Lifted (kg)', data: volDates.map(d=>volMap[d]), backgroundColor: '#970747', borderRadius: 4 }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }
            });
        }

        const galleryGrid = document.getElementById('vipGalleryGrid');
        if (c.gallery && c.gallery.length) {
            galleryGrid.innerHTML = c.gallery.map(p => `<div class="gallery-item"><img src="${p.img}" class="gallery-img"><div class="gallery-date">${p.date}</div></div>`).join('');
        } else { galleryGrid.innerHTML = `<div style="font-size:12px; color:var(--text-muted); padding:10px; text-align:center; width:100%;">No physique photos available yet.</div>`; }

        document.getElementById('vipPrevious').innerHTML = Object.keys(c.logs || {}).sort().reverse().slice(0, 7).map(date => `<div style="background:var(--card); padding:15px; border-radius:12px; margin-bottom:10px; border:1px solid var(--border);"><b style="color:var(--danger); font-size:13px; display:flex; align-items:center; gap:6px;"><i data-feather="calendar" style="width:14px;"></i> ${date}</b><div style="font-size:12px; color:var(--text); margin-top:8px; line-height:1.6;">${c.logs[date].map(l => l.name).join(' &bull; ')}</div></div>`).join('') || `<div style="font-size:12px; color:var(--text-muted); text-align:center;">No completed workouts yet.</div>`;

        document.getElementById('vipResearchDocs').innerHTML = (window.vipDataStore.researchCenter || []).map(r => `<div style="background:var(--card); padding:15px; border-radius:12px; margin-bottom:10px; border:1px solid var(--border);"><b style="font-size:13px;">${r.title}</b><br><div style="font-size:12px; color:var(--text-muted); margin-top:6px; line-height:1.5;">${r.content}</div></div>`).join('') || `<div style="font-size:12px; color:var(--text-muted); text-align:center;">No research published yet.</div>`;

        window.searchVipLibrary('');
        window.updateIcons();
    };

    window.searchVipLibrary = (q) => { 
        const d = window.vipDataStore; 
        document.getElementById('vipLibResults').innerHTML = (d.videoLibrary || []).filter(v => v.name.toLowerCase().includes(q.toLowerCase())).map(v => `<a href="${v.url}" target="_blank" style="display:flex; align-items:center; justify-content:space-between; background:var(--card); padding:12px 15px; border-radius:12px; margin-bottom:8px; color:var(--text); text-decoration:none; border:1px solid var(--border);"><div><b style="font-size:13px;">${v.name}</b><br><span style="font-size:11px;color:var(--text-muted); text-transform:uppercase; font-weight:800;">${v.muscle}</span></div><i data-feather="external-link" style="width:14px; color:var(--info);"></i></a>`).join('') || `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No videos match your search.</div>`; 
        window.updateIcons();
    };


    // ==========================================
    // 20. THE BRAIN
    // ==========================================
    window.editTrainerProfile = () => { 
        document.getElementById('appContainer').style.display = 'none'; 
        document.getElementById('authView').style.display = 'flex'; 
        document.getElementById('loginBlock').style.display = 'none'; 
        document.getElementById('setupBlock').style.display = 'block'; 
        
        document.getElementById('authName').value = window.trainerProfile.name; 
        document.getElementById('authSalary').value = window.trainerProfile.salary; 
        document.getElementById('authIn').value = window.trainerProfile.shiftIn; 
        document.getElementById('authOut').value = window.trainerProfile.shiftOut; 
        document.getElementById('authPhone').value = window.trainerProfile.phone || ""; 
        
        window.closeMenu(); 
    };

    window.exportData = () => { 
        const blob = new Blob([JSON.stringify({ profile: window.trainerProfile, clients: window.clients, shifts: window.shifts, expenses: window.expenses, plans: window.plans, leads: window.leads })], { type: "application/json" }); 
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `RyalFit_Backup_${window.today}.json`; a.click(); 
    };
    
    window.importData = (event) => { 
        const file = event.target.files[0]; 
        if (!file) return; 
        
        const reader = new FileReader(); 
        reader.onload = async (e) => { 
            try { 
                let fileText = e.target.result.trim();
                const data = JSON.parse(fileText); 
                
                window.trainerProfile = data.trainerProfile || data.profile || window.trainerProfile; 
                window.clients = data.clients || []; 
                window.clients.forEach(c => {
                    if (!c.cardio) c.cardio = []; if (!c.mobility) c.mobility = []; if (!c.gallery) c.gallery = []; if (!c.meals) c.meals = []; if (!c.bca) c.bca = []; if (!c.logs) c.logs = {};
                    Object.keys(c.logs).forEach(date => { c.logs[date] = c.logs[date].map(ex => { if (!ex.sets) { ex.sets = [{ set: 1, w: ex.w || "", r: ex.r || "" }]; } return ex; }); });
                });

                window.shifts = data.shifts || []; window.expenses = data.expenses || []; window.plans = data.plans || []; window.leads = data.leads || []; 
                if(data.workoutDB) window.workoutDB = data.workoutDB; if(data.videoLibrary) window.videoLibrary = data.videoLibrary; if(data.researchCenter) window.researchCenter = data.researchCenter;
                
                await window.syncToCloud(); if(typeof window.render === 'function') window.render(); window.showAlert("Old Data Upgraded & Restored Successfully!"); 
            } catch(err) { window.showAlert("Restore Failed: Check console for details."); } 
        }; 
        reader.readAsText(file); event.target.value = ''; 
    };

    window.ryalSignIn = async () => { 
        try {
            document.getElementById('cloudLoader').style.display = 'flex';
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' }); 
            await signInWithPopup(auth, provider);
        } catch(error) {
            document.getElementById('cloudLoader').style.display = 'none';
            console.error("Login Error:", error);
            window.showAlert("Login Failed: " + error.message);
        } 
    };

    window.ryalSignOut = () => { signOut(auth).then(() => location.reload()); };

    const urlParams = new URLSearchParams(window.location.search);
    const vipId = urlParams.get('vip');

    if (vipId) {
        document.getElementById('cloudLoader').style.display = 'none';
        document.getElementById('authView').style.display = 'none';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('vipPortal').style.display = 'block';
        document.getElementById('vipIdInput').value = vipId;
        window.loginVIP();
    } else {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                window.currentUser = user;
                try {
                    const snap = await getDoc(doc(db, "trainers", user.uid));
                    if (snap.exists()) {
                        const data = snap.data(); 
                        window.trainerProfile = data.profile || null; window.clients = data.clients || []; window.shifts = data.shifts || []; window.leads = data.leads || []; window.expenses = data.expenses || []; window.plans = data.plans || []; 
                        if(data.workoutDB) window.workoutDB = data.workoutDB; window.videoLibrary = data.videoLibrary || []; window.researchCenter = data.researchCenter || [];
                        
                        document.getElementById('cloudLoader').style.display = 'none';
                        
                        if (window.trainerProfile) { window.initApp(); if(typeof window.render === 'function') window.render(); } 
                        else { document.getElementById('authView').style.display='flex'; document.getElementById('loginBlock').style.display='none'; document.getElementById('setupBlock').style.display='block'; document.getElementById('authName').value = user.displayName || ""; document.getElementById('authEmail').value = user.email || ""; }
                    } else { 
                        document.getElementById('cloudLoader').style.display = 'none'; document.getElementById('authView').style.display = 'flex'; document.getElementById('loginBlock').style.display = 'none'; document.getElementById('setupBlock').style.display = 'block'; document.getElementById('authName').value = user.displayName || ""; document.getElementById('authEmail').value = user.email || "";
                    }
                } catch (error) { document.getElementById('cloudLoader').style.display = 'none'; window.showAlert("Database Error: " + error.message); }
            } else {
                document.getElementById('cloudLoader').style.display = 'none'; document.getElementById('appContainer').style.display = 'none'; document.getElementById('authView').style.display = 'flex'; document.getElementById('loginBlock').style.display = 'block'; document.getElementById('setupBlock').style.display = 'none';
            }
        });
    }


// Performance optimization
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Prevent multiple rapid clicks
document.addEventListener('click', (e) => {
    if(e.target.disabled) e.preventDefault();
}, true);

// Better offline detection
window.addEventListener('offline', () => {
    console.log('Offline mode active');
});

window.addEventListener('online', () => {
    console.log('Connection restored');
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .catch(err => console.log('SW failed', err));
    });
}


// Lazy loading helper
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("img").forEach(img => {
        img.loading = "lazy";
    });
});

// Reduce animation lag
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if(prefersReducedMotion){
    document.documentElement.style.scrollBehavior = 'auto';
}

// Debounce resize
function debounce(func, wait=200){
    let timeout;
    return (...args)=>{
        clearTimeout(timeout);
        timeout = setTimeout(()=>func(...args), wait);
    }
}

window.addEventListener('resize', debounce(()=>{
    console.log('Resize optimized');
}));

// Auto cleanup hidden modals
document.querySelectorAll('.modal,.overlay').forEach(el=>{
    if(!el.classList.contains('active')){
        el.style.pointerEvents='none';
    }
});
