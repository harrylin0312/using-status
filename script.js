const firebaseConfig = {
  apiKey: "AIzaSyCTy8ckbxkUUN9xBT-jw5uEt76KLWbZEtU",
  authDomain: "using-status.firebaseapp.com",
  projectId: "using-status",
  storageBucket: "using-status.firebasestorage.app",
  messagingSenderId: "5526856971",
  appId: "1:5526856971:web:362f2af77a4e8b57446e0e"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const statusDocRef = db.collection("shared").doc("status");
const testStatusText = document.getElementById("testStatusText");
const textSpan = document.getElementById("textSpan");

let countdownInterval;
let lastRemainingMin = null;

//判斷狀態是否已過期
function isExpired(lastUpdated) {
  const lastTime = new Date(lastUpdated);
  const now = new Date();
  const diffMinutes = (now - lastTime) / 1000 / 60;
  return diffMinutes > 120;
}

//將狀態與當前時間寫入 Firebase
async function updateStatus(newStatus) {
  await statusDocRef.set({
    status: newStatus,
    lastUpdated: new Date().toISOString(),
    userID: localStorage.getItem("userID") || ""
  });
}

// 新增淡入淡出文字更新函式
function updateTextWithFade(_, newText, noFadeIn = false) {
  textSpan.classList.remove("fade-in", "fade-out");
  void textSpan.offsetWidth;
  textSpan.classList.add("fade-out");
  setTimeout(() => {
    textSpan.innerHTML = newText;
    textSpan.classList.remove("fade-out");
    if (!noFadeIn) {
      void textSpan.offsetWidth;
      textSpan.classList.add("fade-in");
    }
  }, 250);
}

// 新增 getUserPrefix 函式
function getUserPrefix(id) {
  if (id === "tester") return "你";
  if (id === "abc123") return "鋼";
  if (id === "def456") return "聿";
  return "你誰????????????";
}

//倒數計時功能
function startCountdown(expiryTime, userID) {
  clearInterval(countdownInterval);
  lastRemainingMin = null;
  countdownInterval = setInterval(() => {
    const now = new Date();
    const remainingMs = expiryTime - now;

    if (remainingMs <= 0) {
      clearInterval(countdownInterval);
      updateTextWithFade(testStatusText, "未使用");
      return;
    }

    const remainingMin = Math.ceil(remainingMs / 60000);
    if (remainingMin !== lastRemainingMin) {
      lastRemainingMin = remainingMin;
      const prefix = getUserPrefix(userID);
      if (prefix === "你誰????????????") {
        updateTextWithFade(testStatusText, `<span class="prefix">${prefix}</span>`);
      } else {
        updateTextWithFade(testStatusText, `<span class="prefix">${prefix}</span>使用中, 剩 ${remainingMin} min`);
      }
      testStatusText.style.animation = "open-expand 0.8s forwards";
    }
  }, 1000);
}

//查詢初始狀態
function renderStatus(data) {
  const expired = isExpired(data.lastUpdated);
  const currentStatus = expired ? false : data.status;

  if (!currentStatus) {
    updateTextWithFade(testStatusText, "未使用");
    clearInterval(countdownInterval);
  } else {
    const expiryTime = new Date(new Date(data.lastUpdated).getTime() + 120 * 60000);
    startCountdown(expiryTime, data.userID);
  }

  // 初始化：設定狀態但不執行動畫
  if (!ballState) {
    ballState = currentStatus ? "open" : "closed";
    if (currentStatus) {
      ball.style.transform = "translateY(-50%) translateX(90px)";
      box.style.backgroundColor = "#30D158";
      document.body.style.backgroundColor = "#c7ffcb";
    }
    return;
  }

  // 執行動畫切換
  if (currentStatus && ballState !== "open") {
    ball.style.animation = "open-animation 0.8s forwards";
    box.style.animation = "open-Btn-color 0.8s forwards";
    document.body.style.animation = "open-background-color 0.8s forwards";
    ballState = "open";
  } else if (!currentStatus && ballState !== "closed") {
    ball.style.animation = "close-animation 0.8s forwards";
    box.style.animation = "close-Btn-color 0.8s forwards";
    document.body.style.animation = "close-background-color 0.8s forwards";
    testStatusText.style.animation = "close-expand 0.8s forwards";
    ballState = "closed";
  }
}

statusDocRef.onSnapshot(doc => {
  if (doc.exists) {
    renderStatus(doc.data());
    const expired = isExpired(doc.data().lastUpdated);
    const currentStatus = expired ? false : doc.data().status;
    ballState = currentStatus ? "open" : "closed";
  } else {
    updateStatus(false);
  }
});

//每分鐘檢查一次狀態是否過期，若過期則自動設為未使用
setInterval(async () => {
  const doc = await statusDocRef.get();
  if (doc.exists) {
    const data = doc.data();
    if (data.status && isExpired(data.lastUpdated)) {
      await updateStatus(false);
    }
  }
}, 60000);

//取得視窗高度
function setVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}


//ball點擊事件以切換動畫狀態
const ball = document.getElementById("ball");
const box = document.getElementById("box");
let ballState = null;

ball.addEventListener("click", async () => {
  updateTextWithFade(testStatusText, "啟動中", true);
  const doc = await statusDocRef.get();
  let currentStatus = false;

  if (doc.exists) {
    const data = doc.data();
    const expired = isExpired(data.lastUpdated);
    currentStatus = expired ? false : data.status;
  }

  const newStatus = !currentStatus;
  await updateStatus(newStatus);
});