const { compileExpression } = require("filtrex");
var userAgent = require('user-agents');

function strlen(s) {
    return s.length;
}

function contains(a, b) {
    return a.includes(b);
}

function print(a) {
    console.log(a);
    return true;
}

class ExpressionExecutorStep {
    constructor({ expression }) {
        // Compile expression to executable function
        this.expression = compileExpression(expression, {
            extraFunctions: {
                strlen,
                contains,
                print,
            }
        });
    }

    async run(context) {
        let result = this.expression(context);
        let error = null;
        if (typeof result !== 'boolean') {
            error = result;
            result = null;
        }
        return {
            result,
            reason: error || (result ? "expression matched" : "expression did not match"),
        }
    }
}

class PageGetterStep {
    constructor(context) {
        context.page.setUserAgent(userAgent.random().toString());
        context.responses = [];
        context.page.on('response', response => {
            if (response.url() === context.url) {
                context.responses.push(response.status());
            }
        });
    }

    async run(context) {
        if (context.page.isClosed()) {
            throw new Error("Page was closed.");
        }
		try {
			context.response = await context.page.goto(context.url, { timeout: context.timeout });
		} catch (error) {
            return {
                result: false,
                reason: error.message,
            }
		}
		await new Promise((resolve => setTimeout(resolve, context.wait_before_page_load)));
        return {
            // this means to skip to next step.
            result: null,
            reason: null,
        }
    }

    async pingDone(context) {
        context.responses = [];
    }
}

class PageContentGetterStep {
    async run(context) {
        if (context.page.isClosed()) {
            throw new Error("Page was closed.");
        }
		try {
            context.content = await context.page.evaluate(() => {
                return document.querySelector("body").textContent;
            });
		} catch (error) {
            return {
                result: false,
                reason: error.message,
            }
		}
        return {
            // this means to skip to next step.
            result: null,
            error: null,
        }
    }
}

module.exports = {
    ExpressionExecutorStep,
    PageGetterStep,
    PageContentGetterStep,
};