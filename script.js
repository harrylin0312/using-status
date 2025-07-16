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
    lastUpdated: new Date().toISOString()
  });
}

//查詢初始狀態
function renderStatus(data) {
  const expired = isExpired(data.lastUpdated);
  const currentStatus = expired ? false : data.status;
  testStatusText.textContent = currentStatus ? "使用中" : "未使用";

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
    ball.style.animation = "open-animation 0.6s forwards";
    box.style.animation = "open-Btn-color 0.7s forwards";
    document.body.style.animation = "open-background-color 0.7s forwards";
    ballState = "open";
  } else if (!currentStatus && ballState !== "closed") {
    ball.style.animation = "close-animation 0.6s forwards";
    box.style.animation = "close-Btn-color 0.7s forwards";
    document.body.style.animation = "close-background-color 0.7s forwards";
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