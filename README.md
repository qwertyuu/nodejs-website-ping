# nodejs-website-ping

example use in powershell, to check if ChatGPT is available:
 `npx webping --url https://chat.openai.com/auth/login --expression 'contains(content,\"\"\"Log in\"\"\")' --wait_before_page_load 3000`

If you run test.js, it will start a never-responding server causing timeouts in webping. You can test this using: 

`npx webping -u http://localhost:3000 -e 'contains(responses,200)' -w 3000 -t 1000`