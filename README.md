# 🎅 Secret Santa Wishes

A free, mobile-friendly website where everyone writes a "Dear Santa, I wish for…" letter and can read everyone else's.
You never edit the website: letters live in a Google Sheet, and the site refreshes every 30 seconds.

## Folder structure

```
santa-wishes/
├── index.html
├── style.css
├── app.js
├── config.js
└── google-apps-script/
    └── Code.gs
```

## 1. Create the Google Sheet
Create a new Google Sheet called `Secret Santa 2026`. (The `Wishes` tab is created automatically.)

## 2. Add the backend
In the sheet: `Extensions -> Apps Script`. Paste in `google-apps-script/Code.gs`, change `SECRET` to your own long random text, and save.

## 3. Deploy it
`Deploy -> New deployment -> Web app`
- Execute as: **Me**
- Who has access: **Anyone**

Authorize when Google asks, then copy the Web App URL (ends in `/exec`).

## 4. Create the Microsoft Form (so nobody can write as someone else)
In forms.office.com create a form with these questions, in this order:
1. About me (long answer, required)
2. Dear Santa, I wish for… (long answer, required)
3. Favourite things (short answer)
4. Please avoid (short answer)

Form `...` menu -> **Settings**:
- Who can fill out this form: **Only people in my organization can respond**
- Turn **on** "Record name" (or keep it on by default), and **Allow one response per person** if offered.

Copy the form's share link.

## 5. Connect the Form to the sheet with Power Automate
Create an **Automated cloud flow**:
1. Trigger: **Microsoft Forms - When a new response is submitted** (pick your form)
2. Action: **Microsoft Forms - Get response details**
3. Action: **HTTP** (POST) to your Apps Script Web App URL, header `Content-Type: application/json`, body:
```
{
  "secret": "YOUR-SECRET-FROM-Code.gs",
  "email": <Responders' Email>,
  "about": <About me answer>,
  "wish": <wish answer>,
  "likes": <Favourite things answer>,
  "avoid": <Please avoid answer>
}
```
Pick the `<...>` values from the dynamic content list. The name shown on the site comes from the person's account email (alex.kumar@... shows as "Alex Kumar"), never from something they typed.

Note: the HTTP action is a Premium connector in Power Automate. If your account doesn't include it, use the Google Sheets "Insert row" connector instead (check its licence tier in the flow editor).

## 6. Connect the website
Open `config.js` and fill in both:

```js
API_URL: "https://script.google.com/macros/s/XXXX/exec",
FORM_URL: "https://forms.office.com/r/XXXX",
```

## 7. Host on GitHub Pages
Upload `index.html`, `style.css`, `app.js`, `config.js` to a public repository, then
`Settings -> Pages -> Deploy from a branch -> main -> / (root)`.
Share the link: `https://YOUR-USERNAME.github.io/REPO-NAME/`

## Managing letters
- To hide a letter, type `YES` in its **hidden** column in the sheet.
- To delete one, delete its row.
- After changing `Code.gs`, redeploy via `Deploy -> Manage deployments -> Edit -> New version`.

## Important
Anyone with the link can read the letters, so share it only with your group. Don't ask people for phone numbers or addresses.
