// Firebase compat SDK を初期化し、Firestore を window.db として公開する。
// ※ このファイルはプレーンな <script>（type="text/babel" ではない）として読み込むこと。
//    compat SDK のグローバル `firebase` をそのまま利用する。
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyDSwFrAT_nGKnc9XnayiTu2VBWalPC2oz4",
    authDomain: "product-dev-simulator.firebaseapp.com",
    projectId: "product-dev-simulator",
    storageBucket: "product-dev-simulator.firebasestorage.app",
    messagingSenderId: "839260988285",
    appId: "1:839260988285:web:2e9478bbf47ad24dfe6214",
  };
  try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    console.info("[firebase] Firestore 初期化完了");
  } catch (err) {
    // 読み込み失敗時もアプリ自体は localStorage で動作させる
    window.db = null;
    console.warn("[firebase] 初期化に失敗しました。localStorage のみで動作します。", err);
  }
})();
