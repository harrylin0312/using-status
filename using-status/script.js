// Firebase 已經用 CDN 引入了，這裡直接用全域 firebase 物件
const firebaseConfig = {
  apiKey: "AIzaSyCTy8ckbxkUUN9xBT-jw5uEt76KLWbZEtU",
  authDomain: "using-status.firebaseapp.com",
  projectId: "using-status",
  storageBucket: "using-status.firebasestorage.app",
  messagingSenderId: "5526856971",
  appId: "1:5526856971:web:362f2af77a4e8b57446e0e"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const statusDocRef = db.collection("shared").doc("status");

// DOM 元素
const statusText = document.getElementById("statusText");
const toggleBtn = document.getElementById("toggleBtn");

function isExpired(lastUpdated) {
  const lastTime = new Date(lastUpdated);
  const now = new Date();
  const diffMinutes = (now - lastTime) / 1000 / 60;
  return diffMinutes > 120;
}

async function updateStatus(newStatus) {
  await statusDocRef.set({
    status: newStatus,
    lastUpdated: new Date().toISOString()
  });
}

function renderStatus(data) {
  const expired = isExpired(data.lastUpdated);
  const currentStatus = expired ? false : data.status;
  statusText.textContent = currentStatus ? "✅ 使用中" : "❌ 未使用";
  toggleBtn.textContent = currentStatus ? "取消使用" : "開始使用";
}

statusDocRef.onSnapshot(doc => {
  if (doc.exists) {
    renderStatus(doc.data());
  } else {
    updateStatus(false);
  }
});

toggleBtn.addEventListener("click", async () => {
  const doc = await statusDocRef.get();
  if (!doc.exists) {
    await updateStatus(true);
    return;
  }
  const data = doc.data();
  const expired = isExpired(data.lastUpdated);
  const currentStatus = expired ? false : data.status;
  await updateStatus(!currentStatus);
});

setInterval(async () => {
  const doc = await statusDocRef.get();
  if (doc.exists) {
    const data = doc.data();
    if (data.status && isExpired(data.lastUpdated)) {
      await updateStatus(false);
    }
  }
}, 60000);