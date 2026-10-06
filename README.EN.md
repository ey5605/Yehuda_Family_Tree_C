# Yehuda Family Tree — English Setup Guide

This guide is entirely in English to avoid mixed text directions. The application itself remains in Hebrew.

**What you need to do now:** create your Cloudflare account, prepare the database and file storage, choose two family passwords, and publish the application using the steps below.

The code is already in GitHub. A successful GitHub build is not the same as a running application.

## 1. Understand the platforms

| Platform | What it does |
| --- | --- |
| GitHub | Stores the application code and runs automated checks. |
| Cloudflare | Runs the application online and stores its data and photos in your account. |
| Windows PowerShell | Runs the one-time setup commands from your computer. |
| Your web browser | Opens the finished application, both for you and for relatives. |

Cloudflare is a company providing online hosting and storage services. Your Cloudflare account is your **administrator account** with that provider.

This application uses three services within that account:

- **Workers:** runs the website and the server that checks passwords.
- **D1:** stores the active tree revision, its storage reference, photo metadata and login attempt limits.
- **R2:** privately stores photos and versioned JSON files containing the people and relationships.

The application runs on **Cloudflare Workers**. GitHub Pages cannot run this application's database-backed server. A GitHub Pages address showing the README is documentation, not the running family tree.

After deployment, family members only need a browser, the application link and the appropriate family password. They do not need Cloudflare, GitHub, Node.js or ChatGPT accounts. Your computer does not need to stay on.

## 2. Create your Cloudflare account

Do this in your browser:

1. Open [Cloudflare Sign Up](https://dash.cloudflare.com/sign-up).
2. Enter your email address and choose a password for your Cloudflare administrator account.
3. Complete registration and verify your email using the message Cloudflare sends you.
4. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
5. Find **Workers & Pages**. The exact sidebar grouping may change. We will upload the existing application with the commands below, so you do not need to create a sample application.

You do not need to buy or transfer a domain, or change DNS settings. The application can use a Cloudflare address ending in `workers.dev`. If onboarding asks for a domain, return to the dashboard and locate Workers & Pages. See [account registration](https://developers.cloudflare.com/fundamentals/account/create-account/) and [Workers addresses](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

Next, activate file storage:

1. Open **Storage & databases > R2 > Overview** in the Cloudflare dashboard.
2. Complete the R2 activation/checkout process.
3. Review any billing details before confirming. R2 includes a monthly free allowance but is usage-billed; this guide does not promise zero charges.
4. We will create a private storage bucket in step 5. Do not enable public bucket access.

See the official [R2 activation instructions](https://developers.cloudflare.com/r2/get-started/) and [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

**Checkpoint:** you can sign in to Cloudflare and open R2. Keep your Cloudflare administrator login for yourself; it is separate from the two family passwords.

## 3. Prepare your Windows computer

### Install Node.js

Install **Node.js 24.x** using the Windows installer from the [official Node.js download page](https://nodejs.org/en/download). Choose version 24 if multiple versions are offered. npm is included.

After installation, close old PowerShell windows and open a new one.

### Download the application

1. Sign in to GitHub and open [your repository](https://github.com/ey5605/Yehuda_Family_Tree_C).
2. Select **Code > Download ZIP**.
3. Extract the ZIP in File Explorer. Do not run commands inside the ZIP.
4. Open the extracted folder containing `package.json`, `README.md` and the `scripts` folder. There may be an additional inner folder after extraction.
5. Click File Explorer's address bar, type `powershell`, and press Enter. PowerShell opens in that folder.

Run these commands one line at a time:

```powershell
node --version
npm.cmd --version
```

The first command should display `v24...`. If a command is not recognized, finish installing Node.js and open a new PowerShell window.

Install the project dependencies:

```powershell
npm.cmd ci
```

Wait until it finishes. The `.cmd` suffix is intentional on Windows and avoids the common PowerShell script execution-policy problem.

**If any command below reports an error, stop at that step rather than continuing through the remaining commands.**

## 4. Connect PowerShell to Cloudflare

Keep using the same PowerShell window in the project folder:

```powershell
npx.cmd wrangler login
```

A browser window opens. Sign in to your Cloudflare account and approve the Wrangler login. Wrangler is Cloudflare's command-line deployment tool, included in this project.

Then run:

```powershell
npx.cmd wrangler whoami
```

Copy the **Account ID** of the account you intend to use. Replace the placeholder in this command with that actual ID, keeping the quotation marks:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "PASTE_YOUR_ACCOUNT_ID_HERE"
```

**Checkpoint:** Wrangler identifies your account. This initial setup route uses browser login; you do not need to create a GitHub deployment API token.

## 5. Create the database and private storage

Create the database once:

```powershell
npx.cmd wrangler d1 create yehuda-family-db
```

The output includes an identifier, usually labeled `database_id` or `databaseId`. Copy it and replace the placeholder below:

```powershell
$env:D1_DATABASE_ID = "PASTE_YOUR_DATABASE_ID_HERE"
$env:D1_DATABASE_NAME = "yehuda-family-db"
$env:R2_BUCKET_NAME = "yehuda-family-files"
```

Create the storage bucket:

```powershell
npx.cmd wrangler r2 bucket create yehuda-family-files
```

If R2 is unavailable, return to step 2 and activate it. Keep the bucket private; photos are served through the password-protected application.

If these resources already exist because you previously completed this step, reuse them and obtain the existing database ID from the D1 dashboard. Do not delete existing family storage to repeat setup.

**Checkpoint:** your account contains `yehuda-family-db` and `yehuda-family-files`.

## 6. Choose the family passwords

Run:

```powershell
node scripts/setup-passwords.mjs
```

Enter:

1. A viewing password, then enter it again.
2. A different editing password, then enter it again.

Use at least 12 characters for each password. Typed characters are hidden; press Enter after each entry.

The script creates:

- `.dev.vars` for local use.
- `.secrets.generated.json` containing password hashes and a session signing secret for deployment.

These files are excluded from Git. Do not upload them to the repository or send them to relatives. Save the actual passwords in your own password manager.

A viewing user can read and export the tree. An editing user can also change people, relationships and photos. The application uses shared passwords, so it does not identify the individual person who made each edit.

## 7. Build and publish the application

In the same PowerShell window, run each command separately and wait for it to finish:

```powershell
npm.cmd run build
```

```powershell
node scripts/prepare-deploy.mjs
```

```powershell
npx.cmd wrangler d1 migrations apply DB --remote --config dist/server/wrangler.json
```

If Wrangler requests confirmation, check the target account/database and confirm. This creates the application's tables in your database.

Publish the application:

```powershell
npx.cmd wrangler deploy --config dist/server/wrangler.json
```

If prompted to choose a `workers.dev` subdomain, choose one and complete that step.

Record the HTTPS address printed by deployment. It will resemble this example:

```text
https://yehuda-family-tree.YOUR-SUBDOMAIN.workers.dev
```

Use your actual printed address, not the example above.

Finally, upload the authentication configuration:

```powershell
npx.cmd wrangler secret bulk .secrets.generated.json --config dist/server/wrangler.json
```

Until this last command succeeds, the website may open but login remains unavailable. That is expected during first-time setup.

**Checkpoint:** deployment and secret upload both succeeded, and you have the actual HTTPS address.

## 8. Open the application and invite your family

1. Open your application's HTTPS address in Chrome or Edge.
2. On the Hebrew login screen, choose the second permission option, meaning **view and edit**.
3. Enter the editing password from step 6.
4. The initial tree is empty. Add the first person, or use the import button to select your family JSON file.
5. For import: select the file, run the file check, read the summary and review items, resolve any conflicts, then confirm the import.
6. Wait for the saved-status indicator. Refresh and verify that people and photos are still present.
7. On another device or in a private browser window, open the same HTTPS address. Choose the first permission option, meaning **view only**, and enter the viewing password. Verify that reading works and editing is unavailable.
8. Share the HTTPS link and viewing password with relatives. Give the editing password only to authorized editors.

Do not send relatives a `localhost` or `127.0.0.1` address. Those addresses refer to the device opening the link, not your online application.

Your administrator Cloudflare password is not a family application password and should not be shared.

## 9. Backups and everyday use

The application supports adding and editing people, connecting existing people, multiple partnerships, partial dates, photos, three tree views, search, zoom, collapse/expand, and undo/redo.

In the export/print dialog:

- **Full JSON backup** includes the tree and actual photo contents. Keep copies somewhere you control.
- **Data-only JSON** includes photo references, not the image files themselves.
- **PNG** includes the complete tree, including collapsed branches.
- **Single-page PDF** fits the complete tree onto one A4 page. Large trees may have very small text.
- **Multipage PDF** stays one A4 page wide and continues downward, with person references and a relationship index.

If an automatic download does not start, click the explicit file-ready download link. Verify that the file reached your Downloads folder.

Restore a backup through the JSON import and confirmation process. Review items remain uncertain after import; acknowledging a review notice does not mark them confirmed.

PDF pages contain high-resolution images, so Hebrew does not depend on the reader's installed fonts. The PDF text is not searchable. Large PNGs are subject to an explicit size/memory limit, with an explanatory error instead of a partial export.

Changes waiting for an Internet connection are retained locally for synchronization. If another device updated the tree, the application reports a conflict instead of silently overwriting it.

## 10. Change passwords or update the application

### Change family passwords

On the administrator computer, run:

```powershell
node scripts/setup-passwords.mjs
npx.cmd wrangler secret bulk .secrets.generated.json --config dist/server/wrangler.json
```

This ends previous login sessions. Share the new passwords with the intended recipients. Because passwords are shared, removing one person's access requires changing the relevant shared password.

### Update application code

Keep the existing database and storage bucket.

After downloading updated code and installing its dependencies, set the account/database/bucket variables from steps 4 and 5, then repeat the build, prepare-deploy, migrations and deploy commands from step 7. Keep the existing authentication secrets unless intentionally changing passwords.

PowerShell `$env:` assignments last only for that window. Set them again after opening a new window. Run `prepare-deploy.mjs` after each build because building regenerates the deployment configuration.

## 11. Optional: deploy from GitHub Actions later

This is an alternative for later deployments. You do not need it for your first launch using steps 1–8.

In the repository, open **Settings > Secrets and variables > Actions** and configure:

| Type | Name | Value |
| --- | --- | --- |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Your account ID. |
| Variable | `D1_DATABASE_ID` | The existing database ID. |
| Variable | `R2_BUCKET_NAME` | `yehuda-family-files` |
| Secret | `CLOUDFLARE_API_TOKEN` | A deployment token scoped to your account with Workers Scripts, D1 and Workers R2 Storage write/edit permissions. |
| Secret | `VIEW_PASSWORD_HASH` | The matching value in your generated secrets file. |
| Secret | `EDIT_PASSWORD_HASH` | The matching value in your generated secrets file. |
| Secret | `SESSION_SECRET` | The matching value in your generated secrets file. |

Copy each JSON value without its surrounding quotation marks. Follow [Cloudflare's API token instructions](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) when creating the deployment token. A Cloudflare login password is not an API token.

Open **Actions > Deploy family tree > Run workflow**, select `main`, and start it. If the GitHub environment named `production` requires approval, approve that deployment in GitHub.

The separate **Build and test** workflow checks the code; it does not publish the application. A successful **pages build and deployment** workflow also does not launch this application's server.

## 12. Optional: run only on your own computer

This is a separate local trial, not online family hosting. A Cloudflare account is not needed for the local database emulator.

After installing Node.js and downloading the code:

```powershell
npm.cmd ci
node scripts/setup-passwords.mjs
npm.cmd run build
node scripts/prepare-local.mjs
npx.cmd wrangler d1 migrations apply DB --local --config dist/server/wrangler.json --persist-to .wrangler/state
npm.cmd start
```

Open the address printed by Wrangler, usually `http://127.0.0.1:8787`. Keep PowerShell running during local use. Press Ctrl+C to stop it.

Local data is separate from Cloudflare data. To move it online, export a full JSON backup and import that file into the deployed application.

## 13. Troubleshooting

| Problem | Next action |
| --- | --- |
| GitHub displays a README instead of the application | Open the deployed HTTPS address printed by Wrangler. |
| Node.js or npm is not recognized | Install Node.js 24 and open a new PowerShell window. |
| `package.json` is missing | Open PowerShell in the extracted project folder containing that file. |
| Missing/invalid database ID | Set the actual D1 database ID and rerun `prepare-deploy.mjs`. |
| R2 is unavailable | Activate R2 in the Cloudflare dashboard. |
| Website says setup is incomplete | Check that the final secrets-upload command succeeded for this Worker. |
| Password is rejected | Select the matching permission level and enter the actual password, not its hash. |
| Too many login attempts | Wait for the retry period before trying again. |
| A relative cannot use your localhost link | Share the deployed HTTPS URL. |
| Import fails | Read the validation message and select a corrected JSON file. |
| Concurrent-edit conflict | Back up pending edits, load the current version, then merge deliberately. |

The detailed validation record is in `ACCEPTANCE.md`. Local and GitHub tests have run. You still need to verify the real deployment, downloads and persistence in your Cloudflare account. Creating the account alone does not publish the application.
