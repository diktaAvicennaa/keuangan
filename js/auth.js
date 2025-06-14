import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { DOM, showLoginState, updateUserInfo } from "./ui.js";
import { initAppForUser, cleanupListeners } from "./main.js";

export let currentUser = null;

export function initAuth() {
  DOM.googleBtn.onclick = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Google gagal: ", err);
      alert("Login Google gagal: " + err.message);
    }
  };

  DOM.logoutBtn.onclick = () => signOut(auth);

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    showLoginState(user);
    updateUserInfo(user);
    if (user) {
      initAppForUser(user.uid);
    } else {
      cleanupListeners();
    }
  });
}
