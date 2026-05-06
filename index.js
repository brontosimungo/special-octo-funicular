const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const puppeteer = require("puppeteer-extra");
const axios = require("axios");
const Imap = require("node-imap");
const { simpleParser } = require("mailparser");
const { JSDOM } = require("jsdom");

const SYMBLE = "@";
const NAME = "server";

const RELOAD = false;

const RECOVERY_EMAILS = {
    "alekpoden82@gmail.com": {
        email: "alekpoden82@gmail.com",
        pass: "eqil yqrn mhol rhou",
    },
    "acihnahe@gmail.com": {
        email: "acihnahe@gmail.com",
        pass: "cwlr ptfe pzkg lxbt",
    },
    "nisaluah@gmail.com": {
        email: "nisaluah@gmail.com",
        pass: "ckhg zhlx wvwd bmok",
    },
};
let mLoginFailed = false;
let browser = null;
let SERVER = "";
let mData = 0;
let PAGES = [];
let mUpdate = 0;

let COLAB = ["1iNOh9FfCLCtk4-MqDZ-Ha0l4BsTqNo3e"];

let BASE_URL = Buffer.from(
    "aHR0cHM6Ly9jb2xlYi04MTE0OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20v",
    "base64"
).toString("ascii");

let loginUrl =
    "https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fcolab.research.google.com%2Ftun%2Fm%2Fassignments%3Fauthuser%3D0&ec=GAZAqQM&ifkv=ASKXGp2VjIgsjrAwBFLiCjhx-F5QfSM4e9q_N7QDa_b3wN-IPMZNHK_ZiTRaBByb_7kyjZ7DePjB&passive=true&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S687877650%3A1703041094123974&theme=glif";

puppeteer.use(StealthPlugin());

process.argv.slice(2).forEach(function (data, index) {
    try {
        if (index == 0) {
            mData = parseInt(data);
            SERVER = "gmail_" + data;
            readCookies();
        }
    } catch (error) { }
});

async function readCookies() {
    let response = await getAxios(BASE_URL + NAME + "/" + SERVER + ".json");

    try {
        let start = true;

        try {
            if (response.data["data"]["block"] != null) {
                start = false;
            }
        } catch (error) { }

        if (start) {
            if (response.data) {
                startBrowser(response.data);
            } else {
                console.log(SYMBLE + SYMBLE + "---NULL----" + getID(mData));
                process.exit(0);
            }
        } else {
            console.log(SYMBLE + SYMBLE + "---BLOCK---" + getID(mData));
            let send = await changeGmail();
            startBrowser({ data: send });
        }
    } catch (error) {
        console.log(SYMBLE + SYMBLE + "---EXIT----" + getID(mData));
        process.exit(0);
    }
}

async function startBrowser(data) {
    try {
        browser = await puppeteer.launch({
            headless: false,
            //headless: "new",
            //executablePath: "/usr/bin/google-chrome-stable",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--ignore-certificate-errors",
                "--ignore-certificate-errors-skip-list",
                "--disable-dev-shm-usage",
            ],
        });

        let page = (await browser.pages())[0];
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
        );

        console.log(SYMBLE + SYMBLE + "---START---" + getID(mData));
        await updateServer();

        let details = await getPageDetails(page);
        await setUserAgent(page, details);

        if (data["cookies"]) {
            await page.setCookie(...data["cookies"]);
            await colabCheckConnected(page, false);
        } else {
            mLoginFailed = true;
        }

        if (mLoginFailed) {
            console.log(SYMBLE + SYMBLE + "---LOGIN---" + getID(mData));
            await logInGmail(page, data["data"], details);
            await colabCheckConnected(page, true);
        }

        page.on(
            "dialog",
            async (dialog) => dialog.type() == "beforeunload" && dialog.accept()
        );

        await page.goto("https://idx.google.com/import", {
            waitUntil: "load",
            timeout: 0,
        });
        await delay(5000);
        // Menunggu selector muncul di DOM
        try {
            const utosSelector = '#utos-checkbox';
            const submitBtnSelector = '#submit-button';

            // Cek keberadaan checkbox terlebih dahulu dengan timeout pendek
            // agar skrip tidak menunggu terlalu lama jika memang tidak ada
            const isTosShowing = await page.waitForSelector(utosSelector, { timeout: 5000 }).catch(() => null);

            if (isTosShowing) {
                console.log(SYMBLE + SYMBLE + "---TOS DETECTED, PROCEEDING---" + getID(mData));

                // Klik Checkbox tanpa mengenai link
                await page.evaluate((selector) => {
                    const checkbox = document.querySelector(selector);
                    if (checkbox) checkbox.click();
                }, utosSelector);

                await delay(2000); // Tunggu sebentar agar tombol submit aktif

                // Klik tombol Confirm/Submit
                await page.waitForSelector(submitBtnSelector, { timeout: 5000 });
                await page.click(submitBtnSelector);

                console.log(SYMBLE + SYMBLE + "---TOS ACCEPTED---" + getID(mData));
                await delay(3000); // Jeda setelah konfirmasi
            } else {
                console.log(SYMBLE + SYMBLE + "---TOS NOT SHOWING, SKIPPING---" + getID(mData));
            }
        } catch (error) {
            // Jika gagal klik, hanya log error dan lanjutkan skrip utama
            console.log(SYMBLE + SYMBLE + "---TOS INTERACTION FAILED/SKIPPED---" + getID(mData));
        }
        await delay(5000)
        const inputRepoSelector = 'input[name="repo-url"]';
        await page.waitForSelector(inputRepoSelector, { timeout: 30000 });
        await page.click(inputRepoSelector);
        await page.type(inputRepoSelector, "https://github.com/brontosimungo/SULOa", { delay: 50 });
        console.log("--- REPO URL FILLED ---");
        await delay(5000)
        const flutterCheckboxSelector = '#flutter-checkbox';
        await page.waitForSelector(flutterCheckboxSelector, { timeout: 10000 });
        await page.click(flutterCheckboxSelector);
        console.log("--- FLUTTER CHECKBOX CLICKED ---");
        await delay(5000)
        const createBtnSelector = '#create-button';
        await page.waitForSelector(createBtnSelector, { timeout: 10000 });
        await page.click(createBtnSelector);
        await delay(5000000)
        await setUserId(page);
        await updateServer();
        let ID = (mData - 1) * 3 + 1;
        console.log(SYMBLE + SYMBLE + "---PAGE----" + getID(ID));

        PAGES.push(page);

        console.log(SYMBLE + SYMBLE + "---LOAD----" + getID(mData));

        let mBlock = false;

        while (true) {
            // Karena hanya ada 1 page, loop hanya 1 kali
            await PAGES[0].bringToFront();
            await delay(1000);
            let ID = (mData - 1) * 3 + 1;
            await removeCaptha(PAGES[0]);

            let block = await PAGES[0].evaluate(() => {
                let root = document.querySelector(
                    '[class="blocked-dialog confirm-dialog"]'
                );
                if (root) {
                    return true;
                }
                return false;
            });

            if (block) {
                mBlock = true;
            } else {
                let input = await PAGES[0].evaluate(() => {
                    let root = document.querySelector('div[class="output-content"]');
                    if (root) {
                        let text = root.innerText;
                        if (text && text == "Enter ID:") {
                            return true;
                        }
                    }
                    return false;
                });

                if (input) {
                    await PAGES[0].keyboard.type(parseInt(ID).toString());
                    await delay(200);
                    await PAGES[0].keyboard.press("Enter");
                } else {
                    let log = await getStatusLog(PAGES[0]);
                    if (log == "START") {
                        console.log(SYMBLE + SYMBLE + "---ACTIVE--" + getID(ID));
                    } else if (log == "COMPLETED") {
                        console.log(SYMBLE + SYMBLE + "-COMPLETED-" + getID(ID));
                        await PAGES[0].goto(
                            "https://colab.research.google.com/drive/" + COLAB[0],
                            { waitUntil: "load", timeout: 0 }
                        );
                        await waitForSelector(PAGES[0], "colab-connect-button");
                        await setUserId(PAGES[0]);
                        console.log(SYMBLE + SYMBLE + "---PAGE----" + getID(ID));
                    }
                }
            }
            await delay(1000);

            if (mBlock) {
                console.log(SYMBLE + SYMBLE + "---BLOCK---" + getID(mData));
                await saveBlockGmail(data["data"], "block");

                await putAxios(
                    BASE_URL + NAME + "/" + SERVER + "/data.json",
                    JSON.stringify({ block: true }),
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                    }
                );

                process.exit(0);
            }

            await updateServer();
        }
    } catch (error) {
        console.log(error);
        console.log(SYMBLE + SYMBLE + "---EXIT----" + getID(mData));
        process.exit(0);
    }
}

// Helper pilih recovery email berdasarkan masking
const readline = require("readline");

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}

// Helper pilih recovery email berdasarkan masking
function getRecoveryEmail(mask) {
    if (mask.startsWith("ale")) return "alekpoden82@gmail.com";
    if (mask.startsWith("ac")) return "acihnahe@gmail.com";
    if (mask.startsWith("ni")) return "nisaluah@gmail.com";
    return ""; // fallback
}

// Helper logging URL dan status
async function logUrl(page, status) {
    let url = await page.url();
    console.log(`[LOGIN] ${status}: ${url}`);
}

async function logInGmail(page, data) {
    try {
        await page.goto(loginUrl, { waitUntil: "load", timeout: 0 });
        //await logUrl(page, "LOGIN PAGE");
        console.log(SYMBLE + SYMBLE + "---LOGIN PAGE---" + getID(mData));
        await delay(500);

        await page.waitForSelector("#identifierId");
        await page.type("#identifierId", data["user"], { delay: 100 });
        //await logUrl(page, "IDENTIFIER INPUT");
        console.log(SYMBLE + SYMBLE + "---IDENTIFIER INPUT---" + getID(mData));

        await page.waitForSelector("#identifierNext");
        await page.click("#identifierNext");
        //await logUrl(page, "IDENTIFIER NEXT");
        console.log(SYMBLE + SYMBLE + "---IDENTIFIER NEXT---" + getID(mData));

        let status = await waitForLoginStatus(page);

        if (status === 1) {
            await delay(2000);
            await waitForPasswordType(page, data["pass"]);
            //await logUrl(page, "PASSWORD INPUT");
            console.log(SYMBLE + SYMBLE + "---PASSWORD INPUT---" + getID(mData));

            await delay(500);
            await page.click("#passwordNext");
            //await logUrl(page, "PASSWORD NEXT");
            console.log(SYMBLE + SYMBLE + "---PASSWORD NEXT---" + getID(mData));

            status = await waitForLoginSuccess(page, false);

            if (status === 4) {
                await delay(2000);
                await page.click('div[data-challengetype="12"]');
                //await logUrl(page, "RECOVERY CHALLENGE");
                console.log(
                    SYMBLE + SYMBLE + "---RECOVERY CHALLENGE---" + getID(mData)
                );
                status = await waitForLoginSuccess(page, true);

                if (status === 5) {
                    let maskingEmail = "";
                    try {
                        await page.waitForSelector("div.dMNVAe strong", { timeout: 5000 });
                        maskingEmail = await page.evaluate(() => {
                            let el = document.querySelector("div.dMNVAe strong");
                            return el ? el.innerText : "";
                        });
                    } catch (e) {
                        if (data["recovery"].startsWith("ale")) maskingEmail = "ale";
                        else if (data["recovery"].startsWith("ac")) maskingEmail = "ac";
                        else if (data["recovery"].startsWith("ni")) maskingEmail = "ni";
                        else maskingEmail = "";
                        console.log(
                            `[LOGIN] WARNING: Masking email not found, fallback to '${maskingEmail}'`
                        );
                    }

                    let recovery = getRecoveryEmail(maskingEmail);
                    if (!recovery.endsWith(".com")) recovery += "@gmail.com";

                    try {
                        await page.waitForSelector(
                            "#knowledge-preregistered-email-response",
                            { timeout: 7000 }
                        );
                        await page.type(
                            "#knowledge-preregistered-email-response",
                            recovery
                        );
                        //await logUrl(page, "RECOVERY INPUT");
                        console.log(
                            SYMBLE + SYMBLE + "---RECOVERY INPUT---" + getID(mData)
                        );
                        await delay(500);

                        try {
                            await page.waitForSelector('button[jsname="LgbsSe"]', {
                                timeout: 7000,
                            });
                            await page.click('button[jsname="LgbsSe"]');
                            //await logUrl(page, "RECOVERY SUBMIT");
                            console.log(
                                SYMBLE + SYMBLE + "---RECOVERY SUBMIT---" + getID(mData)
                            );
                        } catch (clickErr) {
                            let buttons = await page.$x(
                                "//button[contains(text(), 'Selanjutnya') or contains(text(), 'Next')]"
                            );
                            if (buttons.length > 0) {
                                await buttons[0].click();
                                //await logUrl(page, "RECOVERY SUBMIT");
                                console.log(
                                    SYMBLE + SYMBLE + "---RECOVERY SUBMIT---" + getID(mData)
                                );
                            } else {
                                throw clickErr;
                            }
                        }

                        await delay(3000);
                        status = await waitForLoginStatus(page, false);

                        // Jika redirect ke signin rejected setelah recovery submit, jalankan recovery ulang
                        if (status === 2) {
                            console.log(SYMBLE + SYMBLE + "---Rejected---" + getID(mData));

                            await page.waitForSelector('a[aria-label="Recover account"]', {
                                timeout: 5000,
                            });
                            await page.click('a[aria-label="Recover account"]');
                            //await page.waitForNavigation({
                            //  waitUntil: "load",
                            //  timeout: 10000,
                            //});
                            await delay(5000);
                            await page.waitForSelector("#identifierId");
                            //await page.type("#identifierId", data["user"]);
                            //await logUrl(page, "IDENTIFIER INPUT");
                            console.log(SYMBLE + SYMBLE + "---Input Email---" + getID(mData));
                            await page.waitForSelector("#identifierNext");
                            await page.click("#identifierNext");

                            await delay(2000);
                            await waitForPasswordType(page, data["pass"]);
                            //await logUrl(page, "PASSWORD INPUT");
                            console.log(
                                SYMBLE + SYMBLE + "---PASSWORD INPUT---" + getID(mData)
                            );

                            await delay(500);
                            await page.click("#passwordNext");
                            //await logUrl(page, "PASSWORD NEXT");
                            console.log(
                                SYMBLE + SYMBLE + "---PASSWORD NEXT---" + getID(mData)
                            );

                            //let passwordSelector = (await page.$("#password"))
                            //  ? "#password"
                            //  : (await page.$("input[type='password']"))
                            //  ? "input[type='password']"
                            //  : null;

                            //if (!passwordSelector) {
                            //  throw new Error("Password input not found on recovery page");
                            //}

                            //await page.waitForSelector(passwordSelector, { timeout: 10000 });
                            //await page.type(passwordSelector, "Mantap123@Mm");
                            //await logUrl(page, "Password Input");
                            // Langsung submit dengan ENTER
                            //await page.keyboard.press("Enter");
                            //await page.waitForSelector("#passwordNext");
                            //await page.click("#passwordNext");
                            await logUrl(page);
                            // Tunggu OTP input, ambil masking email
                            await page.waitForSelector("div.dMNVAe span.rZrrBf", {
                                timeout: 30000,
                            });
                            let maskingEmail = await page.evaluate(() => {
                                let el = document.querySelector("div.dMNVAe span.rZrrBf");
                                return el ? el.innerText : "";
                            });
                            console.log(
                                `[LOGIN] Recovery masking email detected: ${maskingEmail}`
                            );
                            let recovery = getRecoveryEmail(maskingEmail);
                            if (!recovery.endsWith(".com")) recovery += "@gmail.com";

                            // Input email recovery

                            await page.waitForSelector("#knowledgePreregisteredEmailInput", {
                                timeout: 30000,
                            });
                            await delay(3000);
                            await page.type("#knowledgePreregisteredEmailInput", recovery);
                            //await logUrl(page, "RECOVERY INPUT");
                            console.log(
                                SYMBLE + SYMBLE + "---RECOVERY INPUT---" + getID(mData)
                            );
                            //await page.keyboard.type(recovery);
                            //await logUrl(page, "RECOVERY INPUT");
                            await delay(2000);

                            //await logUrl(page, "RECOVERY Submit");
                            await page.waitForSelector("#idvpreregisteredemailNext");
                            await page.click("#idvpreregisteredemailNext");
                            console.log(
                                SYMBLE + SYMBLE + "---RECOVERY Submit---" + getID(mData)
                            );

                            await delay(10000);
                            let otpCode = "";
                            let maxTry = 10;
                            for (let i = 0; i < maxTry; i++) {
                                try {
                                    otpCode = await getOtpFromGmail(recovery);
                                    console.log(`[LOGIN] OTP dari ${recovery}: ${otpCode}`); // fungsi ambil OTP
                                    if (otpCode) break;
                                } catch (err) {
                                    await delay(5000); // Tunggu 3 detik sebelum cek lagi
                                }
                            }
                            if (!otpCode) {
                                console.log("[LOGIN] ERROR: OTP tidak ditemukan!");
                                process.exit(0);
                            }

                            await page.waitForSelector('input[type="tel"]', {
                                timeout: 30000,
                            });
                            await page.type('input[type="tel"]', otpCode);
                            await page.waitForSelector('button[jsname="LgbsSe"]');
                            await page.click('button[jsname="LgbsSe"]');
                            //await logUrl(page, "OTP INPUT SUBMIT");
                            console.log(SYMBLE + SYMBLE + "---Input OTP---" + getID(mData));
                            // Tunggu tombol Continue muncul (kelas dan teks sesuai contoh)
                            await page.waitForSelector('div[jsname="LgbsSe"]', {
                                timeout: 10000,
                            });

                            await page.waitForSelector('a[aria-label="Continue"]', {
                                timeout: 5000,
                            });
                            await page.click('a[aria-label="Continue"]');
                            await delay(3000);
                            status = await waitForLoginSuccess(page, false);
                        }
                    } catch (err) {
                        console.log(
                            `[LOGIN] ERROR: Failed to input recovery email - ${err.message}`
                        );
                        await logUrl(page, "FAILED RECOVERY INPUT");
                        process.exit(0);
                    }
                }
            }

            if (status === 1) {
                console.log(SYMBLE + SYMBLE + "--LOGIN-OK-" + getID(mData));
                await logUrl(page, "LOGIN SUCCESS");
                await delay(1000);
                await saveCookies(page);
            } else if (status === 2) {
                console.log(SYMBLE + SYMBLE + "---WRONG---" + getID(mData));
                await logUrl(page, "LOGIN WRONG");
                await saveBlockGmail(data, "wrong");
                let send = await changeGmail();
                await logInGmail(page, send);
            } else {
                console.log(SYMBLE + SYMBLE + "---EXIT----" + getID(mData));
                await logUrl(page, "LOGIN EXIT");
                process.exit(0);
            }
        } else {
            console.log(SYMBLE + SYMBLE + "---EXIT----" + getID(mData));
            await logUrl(page, "LOGIN EXIT");
            process.exit(0);
        }
    } catch (error) {
        console.log(SYMBLE + SYMBLE + "---EXIT----" + getID(mData));
        console.log(`[LOGIN] ERROR: ${error.message}`);
        await logUrl(page, "LOGIN ERROR");
        process.exit(0);
    }
}

async function getOtpFromGmail(email) {
    return new Promise((resolve, reject) => {
        const credentials = RECOVERY_EMAILS[email];
        if (!credentials) return reject("Recovery email tidak ditemukan!");

        const imap = new Imap({
            user: credentials.email,
            password: credentials.pass,
            host: "imap.gmail.com",
            port: 993,
            tls: true,
        });

        imap.once("ready", function () {
            imap.openBox("INBOX", true, function (err, box) {
                if (err) return reject(err);

                const searchCriteria = [["SUBJECT", "Google verification code"]];
                imap.search(searchCriteria, function (err, results) {
                    if (err || results.length === 0) {
                        imap.end();
                        return reject("Email OTP tidak ditemukan!");
                    }

                    const f = imap.fetch(results.slice(-1), { bodies: "" });
                    f.on("message", function (msg, seqno) {
                        msg.on("body", async function (stream, info) {
                            const parsed = await simpleParser(stream);
                            let otp = "";

                            // Cek di HTML dulu
                            if (parsed.html) {
                                try {
                                    const dom = new JSDOM(parsed.html);
                                    // Cari angka tebal di tengah
                                    // Biasanya di <b> atau <strong>
                                    const bold = dom.window.document.querySelector("b, strong");
                                    if (bold && /^\d{6}$/.test(bold.textContent.trim())) {
                                        otp = bold.textContent.trim();
                                    } else {
                                        // fallback: cari angka 6 digit di HTML
                                        const match =
                                            dom.window.document.body.innerHTML.match(
                                                /<b>(\d{6})<\/b>/
                                            ) ||
                                            dom.window.document.body.innerHTML.match(
                                                /<strong>(\d{6})<\/strong>/
                                            );
                                        if (match) otp = match[1];
                                    }
                                } catch (e) { }
                            }

                            // Kalau belum ketemu di HTML, cek di text
                            if (!otp && parsed.text) {
                                // Cari baris berisi 6 digit yang terpisah sendiri
                                const lines = parsed.text.split("\n");
                                for (let line of lines) {
                                    if (/^\d{6}$/.test(line.trim())) {
                                        otp = line.trim();
                                        break;
                                    }
                                }
                            }

                            if (otp) resolve(otp);
                            else reject("Kode OTP tidak ditemukan di email!");
                        });
                    });
                    f.once("error", function (err) {
                        reject(err);
                    });
                    f.once("end", function () {
                        imap.end();
                    });
                });
            });
        });

        imap.once("error", function (err) {
            reject(err);
        });

        imap.connect();
    });
}

async function colabCheckConnected(page, login) {
    if ((login && RELOAD) || login == false) {
        await page.goto(
            "https://colab.research.google.com/tun/m/assignments?authuser=0",
            { waitUntil: "load", timeout: 0 }
        );
        let list = await connectedList(page);
        if (list == null) {
            mLoginFailed = true;
        } else {
            if (RELOAD && list.length > 0) {
                console.log(SYMBLE + SYMBLE + "---USED----" + getID(mData));
                for (let i = 0; i < list.length; i++) {
                    let id = await getFatchID(
                        page,
                        "https://colab.research.google.com/tun/m/" +
                        list[i]["endpoint"] +
                        "/api/sessions?authuser=0"
                    );
                    if (id) {
                        await deleteFatchID(
                            page,
                            "https://colab.research.google.com/tun/m/" +
                            list[i]["endpoint"] +
                            "/api/sessions/" +
                            id +
                            "?authuser=0"
                        );
                    }
                    await unassingFatch(
                        page,
                        "https://colab.research.google.com/tun/m/unassign/" +
                        list[i]["endpoint"] +
                        "?authuser=0"
                    );
                }
                console.log(SYMBLE + SYMBLE + "--DISMISS--" + getID(mData));
            }
        }
    }
}

async function setUserId(page) {
    await page.keyboard.down("Control");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Control");
    await waitForSelector(page, 'mwc-dialog[class="wide"]', 10);
    await delay(500);
    while (true) {
        try {
            let data = await exists(page, 'md-text-button[dialogaction="ok"]');
            if (data) {
                await page.click('md-text-button[dialogaction="ok"]');
                await delay(500);
                await page.screenshot({ path: "screenshot2.png" });
            } else {
                break;
            }
        } catch (error) {
            break;
        }
        await delay(200);
    }
}

async function getPageDetails(page) {
    return await page.evaluate(() => {
        let user = navigator.userAgent;
        let width = 1200;
        let height = 600;
        try {
            width = Math.max(
                document.documentElement.clientWidth || 0,
                window.innerWidth || 0
            );
            height = Math.max(
                document.documentElement.clientHeight || 0,
                window.innerHeight || 0
            );
        } catch (error) { }

        return { user: user, width: width, height: height };
    });
}

async function setUserAgent(page, details) {
    let userAgent =
        "Mozilla/5.0 (Linux; Android 10; Mi 9T Pro Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.43 Mobile Safari/537.36";

    await page.evaluateOnNewDocument((userAgent) => {
        let open = window.open;

        window.open = (...args) => {
            let newPage = open(...args);
            Object.defineProperty(newPage.navigator, "userAgent", {
                get: () => userAgent,
            });
            return newPage;
        };

        window.open.toString = () => "function open() { [native code] }";
    }, userAgent);

    await page.setUserAgent(userAgent);

    await page.emulate({
        name: "Mi 9T Pro",
        userAgent: userAgent,
        viewport: {
            width: details["width"],
            height: details["height"],
            deviceScaleFactor: 1,
            isMobile: true,
            hasTouch: true,
            isLandscape: false,
        },
    });

    await page.setViewport({
        width: details["width"],
        height: details["height"],
        deviceScaleFactor: 1,
    });
}

async function waitForLoginStatus(page) {
    let status = 0;
    let timeout = 0;
    while (true) {
        timeout++;
        if (timeout >= 50) {
            status = 0;
            break;
        }
        await delay(500);

        try {
            let pageUrl = await page.evaluate(() => window.location.href);

            if (pageUrl) {
                if (
                    pageUrl.startsWith("https://accounts.google.com/v3/signin/identifier")
                ) {
                    let captcha = await page.waitForRequest((req) => req.url());
                    if (captcha.url().startsWith("https://accounts.google.com/Captcha")) {
                        status = 9;
                        break;
                    }
                } else if (
                    pageUrl.startsWith(
                        "https://accounts.google.com/v3/signin/challenge/pwd"
                    ) ||
                    pageUrl.startsWith(
                        "https://accounts.google.com/signin/v2/challenge/pwd"
                    )
                ) {
                    status = 1;
                    break;
                } else if (
                    pageUrl.startsWith("https://accounts.google.com/v3/signin/rejected")
                ) {
                    status = 2;
                    break;
                } else if (
                    pageUrl.startsWith(
                        "https://accounts.google.com/v3/signin/challenge/dp"
                    )
                ) {
                    status = 3;
                    break;
                } else if (
                    pageUrl.startsWith(
                        "https://accounts.google.com/signin/v2/challenge/selection"
                    )
                ) {
                    status = 4;
                    break;
                } else if (
                    pageUrl.startsWith(
                        "https://accounts.google.com/signin/v2/challenge/pk/presend"
                    )
                ) {
                    status = 5;
                    break;
                }
            }
        } catch (error) { }
    }
    return status;
}

async function waitForLoginSuccess(page, selection) {
    let status = 0;
    let timeout = 0;

    while (true) {
        timeout++;
        if (timeout >= 50) {
            status = 0;
            break;
        }
        await delay(2000);

        try {
            let pageUrl = await page.evaluate(() => window.location.href);

            if (pageUrl.startsWith("https://colab.research.google.com/")) {
                status = 1;
                break;
            } else if (pageUrl.startsWith("https://gds.google.com/web/chip")) {
                await page.goto(
                    "https://colab.research.google.com/tun/m/assignments?authuser=0",
                    { waitUntil: "load", timeout: 0 }
                );
                status = 1;
                break;
            } else if (
                pageUrl.startsWith("https://accounts.google.com/") &&
                pageUrl.includes("challenge") &&
                pageUrl.includes("pwd")
            ) {
                let wrong = await page.evaluate(() => {
                    let root = document.querySelector('div[class="OyEIQ uSvLId"] > div');
                    if (root) {
                        return true;
                    }
                    return false;
                });

                if (wrong) {
                    status = 2;
                    break;
                }
            } else if (
                pageUrl.startsWith("https://accounts.google.com/") &&
                pageUrl.includes("challenge") &&
                pageUrl.includes("ipp") &&
                pageUrl.includes("collec")
            ) {
                status = 3;
                break;
            } else if (
                pageUrl.startsWith("https://accounts.google.com/") &&
                pageUrl.includes("challenge") &&
                pageUrl.includes("selection")
            ) {
                status = 4;
                break;
            } else if (selection) {
                if (
                    pageUrl.startsWith("https://accounts.google.com/") &&
                    pageUrl.includes("challenge") &&
                    pageUrl.includes("kpe")
                ) {
                    let data = await page.evaluate(() => {
                        let root = document.querySelector(
                            "#knowledge-preregistered-email-response"
                        );
                        if (root) {
                            return true;
                        }
                        return false;
                    });

                    if (data) {
                        status = 5;
                        break;
                    }
                }
            }
        } catch (error) { }
    }

    return status;
}

async function waitForPasswordType(page, password) {
    while (true) {
        await delay(1000);

        try {
            let data = await exists(page, 'input[type="password"]');
            if (data) {
                await page.type('input[type="password"]', password, { delay: 100 });

                let success = await page.evaluate((password) => {
                    try {
                        let root = document.querySelector('input[type="password"]');
                        if (root && root.value == password) {
                            return true;
                        }
                    } catch (error) { }

                    return false;
                }, password);

                if (success) {
                    break;
                }
            }
        } catch (error) { }
    }
}

async function getStatusLog(page) {
    try {
        await removeCaptha(page);

        let mDisconnect = await page.evaluate(() => {
            let root = document.querySelector(
                'mwc-dialog[class="disconnected-dialog yes-no-dialog"]'
            );
            if (root) {
                return true;
            }
            return false;
        });

        if (!mDisconnect) {
            const value = await page.evaluate(() => {
                let colab = document.querySelector("colab-connect-button");
                if (colab) {
                    let display = colab.shadowRoot.querySelector(
                        "#connect-button-resource-display"
                    );
                    if (display) {
                        let ram = display.querySelector(".ram");
                        if (ram) {
                            return ram.shadowRoot.querySelector(".label").innerText;
                        }
                    } else {
                        let connect = colab.shadowRoot.querySelector("#connect");
                        if (connect) {
                            return connect.innerText;
                        }
                    }
                }
                return null;
            });

            if (value && value == "Reconnect") {
                mDisconnect = true;
                let has = await exists(page, 'mwc-button[dialogaction="cancel"]');
                if (has) {
                    await page.click('mwc-button[dialogaction="cancel"]');
                }
            } else {
                mDisconnect = await page.evaluate(() => {
                    let root = document.querySelector('[aria-label="Run cell"]');
                    if (root) {
                        let status = root.shadowRoot.querySelector("#status");
                        if (status) {
                            return true;
                        }
                    }
                    return false;
                });
            }
        } else {
            let has = await exists(page, 'mwc-button[dialogaction="cancel"]');
            if (has) {
                await page.click('mwc-button[dialogaction="cancel"]');
            }
        }

        if (mDisconnect) {
            return "COMPLETED";
        } else {
            let data = await page.evaluate(() => {
                let root = document.querySelector("colab-static-output-renderer");
                if (root) {
                    return root.innerText;
                }
                return null;
            });

            if (data) {
                if (data.includes("★★★---START---★★★")) {
                    await page.evaluate(() => {
                        try {
                            let root = document.querySelector("colab-output-info");
                            if (root) {
                                let cancel = root.shadowRoot.querySelector("mwc-icon-button");
                                if (cancel) {
                                    cancel.click();
                                }
                            }
                        } catch (error) { }
                    });
                    return "START";
                }
            }
        }
    } catch (error) { }

    return "NULL";
}

async function updateServer() {
    let now = new Date().getTime();

    if (now > mUpdate) {
        mUpdate = now + 300000;
        await putAxios(
            BASE_URL + "status/" + NAME + "/" + SERVER + ".json",
            JSON.stringify({ online: parseInt(now / 1000) + 600 }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
    }
}

async function removeCaptha(page) {
    await page.evaluate(() => {
        let recapture = document.querySelector("colab-recaptcha-dialog");
        if (recapture) {
            let cancel = recapture.shadowRoot.querySelector("mwc-button");
            if (cancel) {
                cancel.click();
            }
        }
    });
}

async function saveCookies(page) {
    let cookie = await page.cookies();

    let cookies = [];

    for (let i = 0; i < cookie.length; i++) {
        let name = cookie[i]["name"];
        if (
            name == "SAPISID" ||
            name == "APISID" ||
            name == "SSID" ||
            name == "SID" ||
            name == "HSID"
        ) {
            cookies.push(cookie[i]);
        }
    }

    await putAxios(
        BASE_URL + NAME + "/" + SERVER + "/cookies.json",
        JSON.stringify(cookies),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );
}

async function checkConnected() {
    let timeout = 0;
    let connected = false;

    while (true) {
        await delay(1000);
        let block = await page.evaluate(() => {
            let root = document.querySelector(
                '[class="blocked-dialog confirm-dialog"]'
            );
            if (root) {
                return true;
            }
            return false;
        });

        if (block) {
            break;
        } else {
            const value = await page.evaluate(() => {
                let colab = document.querySelector("colab-connect-button");
                if (colab) {
                    let display = colab.shadowRoot.querySelector(
                        "#connect-button-resource-display"
                    );
                    if (display) {
                        let ram = display.querySelector(".ram");
                        if (ram) {
                            return ram.shadowRoot.querySelector(".label").innerText;
                        }
                    } else {
                        let connect = colab.shadowRoot.querySelector("#connect");
                        if (connect) {
                            return connect.innerText;
                        }
                    }
                }
                return null;
            });

            if (value) {
                timeout++;

                if (value != "Connect") {
                    connected = true;
                    break;
                }
            }

            if (timeout >= 8) {
                break;
            }
        }
    }

    return connected;
}

async function connectedList(page) {
    let list = null;

    while (true) {
        try {
            let pageUrl = await page.evaluate(() => window.location.href);

            if (pageUrl.startsWith("https://colab.research.google.com/")) {
                let body = await page.evaluate(() => document.body.innerText);
                if (body && body.includes("assignments")) {
                    try {
                        let temp = body.substring(body.indexOf("assignments"), body.length);
                        temp = temp.substring(temp.indexOf("["), temp.lastIndexOf("]") + 1);
                        list = JSON.parse(temp);
                        break;
                    } catch (error) {
                        list = [];
                        break;
                    }
                } else {
                    list = null;
                    break;
                }
            } else {
                list = null;
                break;
            }
        } catch (error) { }

        await delay(500);
    }

    return list;
}

async function getFatchID(page, url) {
    let id = null;

    while (true) {
        let data = await page.evaluate((url) => {
            return new Promise(function (resolve) {
                fetch(url, {
                    headers: {
                        accept: "*/*",
                        "accept-language": "en-US,en;q=0.9",
                        "sec-ch-ua": '"Not:A-Brand";v="99", "Chromium";v="112"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-colab-tunnel": "Google",
                    },
                    referrer: "https://colab.research.google.com/",
                    referrerPolicy: "origin",
                    body: null,
                    method: "GET",
                    mode: "cors",
                    credentials: "include",
                })
                    .then((response) => response.text())
                    .then((text) => {
                        resolve(JSON.parse(text));
                    })
                    .catch((error) => {
                        resolve(null);
                    });
            });
        }, url);

        if (data) {
            if (data.length > 0) {
                id = data[0]["id"];
            } else {
                id = null;
            }
            break;
        }
        await delay(1000);
    }

    return id;
}

async function deleteFatchID(page, url) {
    while (true) {
        let data = await page.evaluate((url) => {
            return new Promise(function (resolve) {
                fetch(url, {
                    headers: {
                        accept: "*/*",
                        "accept-language": "en-US,en;q=0.9",
                        "sec-ch-ua": '"Not:A-Brand";v="99", "Chromium";v="112"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-colab-tunnel": "Google",
                    },
                    referrer: "https://colab.research.google.com/",
                    referrerPolicy: "origin",
                    body: null,
                    method: "DELETE",
                    mode: "cors",
                    credentials: "include",
                })
                    .then((response) => {
                        resolve("Success");
                    })
                    .catch((error) => {
                        resolve(null);
                    });
            });
        }, url);

        if (data) {
            break;
        }
        await delay(1000);
    }
}

async function unassingFatch(page, url) {
    while (true) {
        let data = await page.evaluate((url) => {
            return new Promise(function (resolve) {
                fetch(url, {
                    headers: {
                        accept: "*/*",
                        "accept-language": "en-US,en;q=0.9",
                        "sec-ch-ua": '"Not:A-Brand";v="99", "Chromium";v="112"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-colab-tunnel": "Google",
                    },
                    referrer: "https://colab.research.google.com/",
                    referrerPolicy: "origin",
                    body: null,
                    method: "GET",
                    mode: "cors",
                    credentials: "include",
                })
                    .then((response) => response.text())
                    .then((text) => {
                        resolve(text);
                    })
                    .catch((error) => {
                        resolve(null);
                    });
            });
        }, url);

        if (data) {
            try {
                let split = data.split('"');
                if (split.length == 5) {
                    let check = await page.evaluate(
                        (url, token) => {
                            return new Promise(function (resolve) {
                                fetch(url, {
                                    headers: {
                                        accept: "*/*",
                                        "accept-language": "en-US,en;q=0.9",
                                        "sec-ch-ua": '"Not:A-Brand";v="99", "Chromium";v="112"',
                                        "sec-ch-ua-mobile": "?0",
                                        "sec-ch-ua-platform": '"Windows"',
                                        "sec-fetch-dest": "empty",
                                        "sec-fetch-mode": "cors",
                                        "sec-fetch-site": "same-origin",
                                        "x-colab-tunnel": "Google",
                                        "x-goog-colab-token": token,
                                    },
                                    referrer: "https://colab.research.google.com/",
                                    referrerPolicy: "origin",
                                    body: null,
                                    method: "POST",
                                    mode: "cors",
                                    credentials: "include",
                                })
                                    .then((response) => {
                                        resolve("Success");
                                    })
                                    .catch((error) => {
                                        resolve(null);
                                    });
                            });
                        },
                        url,
                        split[3]
                    );

                    if (check) {
                        break;
                    }
                }
            } catch (error) {
                break;
            }
        }
        await delay(500);
    }
}

async function waitForSelector(page, element, _timeout) {
    let timeout = 60;

    if (_timeout != null) {
        timeout = _timeout;
    }

    while (true) {
        timeout--;
        try {
            let data = await exists(page, element);
            if (data) {
                break;
            }
        } catch (error) { }

        if (timeout <= 0) {
            break;
        }
        await delay(500);
    }
}

async function exists(page, evement) {
    return await page.evaluate((evement) => {
        let root = document.querySelector(evement);
        if (root) {
            return true;
        }
        return false;
    }, evement);
}

async function saveBlockGmail(data, type) {
    try {
        await putAxios(
            BASE_URL + type + "/" + data["user"] + ".json",
            JSON.stringify({ pass: data["pass"], recovery: data["recovery"] }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
    } catch (error) { }
}

async function changeGmail() {
    let response = await getAxios(
        BASE_URL + 'backup.json?orderBy="$key"&limitToLast=1&print=pretty'
    );

    try {
        let data = {};
        for (let [key, value] of Object.entries(response.data)) {
            data = value;
            data["user"] = key;
        }

        try {
            await axios.delete(BASE_URL + "backup/" + data["user"] + ".json");
        } catch (error) { }

        await putAxios(
            BASE_URL + NAME + "/" + SERVER + "/data.json",
            JSON.stringify(data),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        return data;
    } catch (error) { }

    return null;
}

async function getAxios(url) {
    let loop = 0;
    let responce = null;
    while (true) {
        try {
            responce = await axios.get(url, {
                timeout: 10000,
            });
            break;
        } catch (error) {
            loop++;

            if (loop >= 5) {
                break;
            } else {
                await delay(3000);
            }
        }
    }
    return responce;
}

async function putAxios(url, body, data) {
    let loop = 0;
    let responce = null;
    while (true) {
        try {
            data.timeout = 10000;
            responce = await axios.put(url, body, data);
            break;
        } catch (error) {
            loop++;

            if (loop >= 5) {
                break;
            } else {
                await delay(3000);
            }
        }
    }
    return responce;
}

function getID(data) {
    let id = data.toString();
    if (id.length == 1) {
        return SYMBLE + "00" + data + SYMBLE;
    } else if (id.length == 2) {
        return SYMBLE + "0" + data + SYMBLE;
    }
    return SYMBLE + data + SYMBLE;
}

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}
