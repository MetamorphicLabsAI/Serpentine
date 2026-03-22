# 🔄 How to Reset Serpentine Game Data
> **FOR TESTING PURPOSES ONLY**

This document explains how to manually clear your persistent game data (Unlocks, High Scores, and Bank Points) so you can test the game's progression and shop systems from a fresh state.

---

### [METHOD 1] TOTAL RESET (Wipe Everything)
This clears ALL high scores, the point bank, and every unlocked character/mode for the browser domain.

1.  Open **Serpentine** in your browser.
2.  Open **Developer Tools** (`F12` or `Ctrl+Shift+I`).
3.  Navigate to the **Console** tab.
4.  Type the following command and press **Enter**:
    ```javascript
    localStorage.clear();
    ```
5.  **Refresh (F5)** the page to observe the reset.

---

### [METHOD 2] TACTICAL RESET (Keep High Scores)
Use this if you want to test the **System Shop** and **Unlocks** while keeping your leaderboard entries intact.

1.  Open the **Developer Console** (`F12`).
2.  Input the following specific commands:
    ```javascript
    localStorage.removeItem('serpentineBank');
    localStorage.removeItem('serpentineUnlockedSpectrum');
    localStorage.removeItem('serpentineUnlocked9193');
    localStorage.removeItem('bought9193Hint');
    localStorage.removeItem('boughtMasterHint');
    location.reload();
    ```

---

### [METHOD 3] THE DEVELOPER OVERRIDE (Add Points Fast)
If you are testing the **System Shop** and need points quickly without grinding, use this command in the console:
```javascript
localStorage.setItem('serpentineBank', '10000000');
location.reload();
```
*(This will set your bank to 10,000,000 PTS instantly.)*

---

### [NOTE] SECURITY ORIGIN ERRORS
If you encounter a **"CORS"** or **"Unsafe attempt to load URL"** error in your browser, it is because modern browsers treat `file://` URLs as unique, untrusted security origins. 

To resolve this, you **must** run a local dev server:
- **Using Node.js:** `npx serve`
- **Using Python:** `python -m http.server 8000`
- **Using VS Code:** Install the **Live Server** extension.
