# pingweb

Tool to run a browser and try a page for a condition in a loop.

### Examples

example use in powershell, to check if ChatGPT is available:
 `npx pingweb --url https://chat.openai.com/auth/login --expression 'contains(content,"""Log in""")' --wait_before_page_load 3000 -h false`

Other example with query in page

Does the h1 element contain HTML string?

`npx pingweb -u "https://www.npmjs.com/package/node-html-parser" -e 'contains(str(query("""#readme h1""")),"""HTML""")' -w 1500 -h false`

Check for a value in a page, convert it to a number and do a comparison

`npx pingweb -u "https://www.soyoustart.com/ca/fr/serveurs-essential/" -e 'number(replace(innerText(nth(query(""".spanWithPrice"""), 0)),""",""","""."""))<40' -w 1000`

Get the response status of google.com

`npx pingweb -u "https://google.com/" -e 'status == 200' -w 1000`

### Test

If you run test.js, it will start a never-responding server causing timeouts in pingweb. You can test this using: 

`npx pingweb -u http://localhost:3000 -e 'contains(responses,200)' -w 3000 -t 1000`

### Future ideas

Make success and fail handler, so you can maybe call a webhook when the ping is a success or not