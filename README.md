<p align="center">
  <img src="src/assets/ncfrmi-logo.png" alt="NCFRMI Crest Logo" width="150" />
</p>

# National Commission for Refugees, Migrants and Internally Displaced Persons (NCFRMI)

Welcome to the NCFRMI Unified Platform. This repository contains the complete suite of software built to help field agents capture information, and help administrators view reports and keep the public updated.

The ecosystem is made of three components:
1. **Web Portal**: The main public website and online application system.
2. **Mobile App**: A mobile tool for field agents to capture registrations offline and sync them later.
3. **Desktop App**: A Command Center for managers to view charts, edit news, and manage users.

---

## Quick Test Credentials
You can use these default details to log in instantly and test the apps without setting up any databases:

*   **Mobile App Login (Field Officer)**:
    *   *Email*: `officer@ncfrmi.gov.ng`
    *   *Password*: `officer123`
*   **Desktop App Login (Commissioner/Admin)**:
    *   *Email*: `commissioner@ncfrmi.gov.ng`
    *   *Password*: `commissioner123`

---

## How to Run the Applications

Here is the easiest step-by-step guide to get everything running. Just open your computer's terminal (or command prompt) and run these instructions.

### 1. Starting the Web Portal

This launches the public website on your browser.

1.  Open your terminal.
2.  Make sure you are in the project folder and type:
    ```bash
    npm run dev
    ```
3.  Press Enter.
4.  Open your web browser and go to: `http://localhost:8080`

---

### 2. Starting the Mobile App

This runs the mobile app in testing mode on your computer.

1.  Open a new terminal window.
2.  Move into the mobile app folder by typing:
    ```bash
    cd mobile_app
    ```
3.  Start the application by running:
    ```bash
    flutter run
    ```
4.  If prompted, select your target device (e.g., Linux, Android, or iOS) by typing its corresponding number.

---

### 3. Starting the Desktop Command Center

This launches the administrative dashboard on your computer.

1.  Open a new terminal window.
2.  Move into the desktop app folder by typing:
    ```bash
    cd desktop_app
    ```
3.  Start the application by running:
    ```bash
    flutter run
    ```
4.  Select your desktop platform to view the Command Center!

---

## Requirements for Developers
If you want to modify the code, make sure you have these installed:
- Node.js (for the website)
- Flutter SDK (for mobile and desktop apps)
