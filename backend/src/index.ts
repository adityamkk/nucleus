import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from the TypeScript backend!');
});

interface EvalPayload {
    payload: string
}

function parse(payload: string): number {
    const input = payload.replace(/\s+/g, "");
    let i = 0;

    function peek(): string | undefined {
        return input[i];
    }

    function consume(): string | undefined {
        return input[i++];
    }

    function match(str: string): boolean {
        if (input.slice(i, i + str.length) === str) {
            i += str.length;
            return true;
        }
        return false;
    }

    function parseExpression(): number {
        let left = parseTerm();

        while (peek() === "+" || peek() === "-") {
            const op = consume();
            const right = parseTerm();

            if (op === "+") left += right;
            else left -= right;
        }

        return left;
    }

    function parseTerm(): number {
        let left = parsePower();

        while (peek() === "*" || peek() === "/") {
            const op = consume();
            const right = parsePower();

            if (op === "*") left *= right;
            else left /= right;
        }

        return left;
    }

    function parsePower(): number {
        let left = parsePrimary();

        while (peek() === "^") {
            consume();
            const right = parsePrimary();
            left = Math.pow(left, right);
        }

        return left;
    }

    function parsePrimary(): number {
        if (peek() === "(") {
            consume();
            const value = parseExpression();
            if (consume() !== ")") {
                throw new Error("Missing closing parenthesis");
            }
            return value;
        }

        const funcs = ["sin", "cos", "tan", "log", "ln"];
        for (const f of funcs) {
            if (match(f)) {
                if (consume() !== "(") {
                    throw new Error("Expected '(' after function");
                }

                const arg = parseExpression();

                if (consume() !== ")") {
                    throw new Error("Missing closing parenthesis");
                }

                switch (f) {
                    case "sin": return Math.sin(arg);
                    case "cos": return Math.cos(arg);
                    case "tan": return Math.tan(arg);
                    case "log": return Math.log10(arg);
                    case "ln": return Math.log(arg);
                }
            }
        }

        if (match("pi")) return Math.PI;
        if (match("e")) return Math.E;

        const numMatch = input.slice(i).match(/^\d+(\.\d+)?/);
        if (numMatch) {
            i += numMatch[0].length;
            return parseFloat(numMatch[0]);
        }

        throw new Error(`Unexpected token at position ${i}`);
    }

    const result = parseExpression();

    if (i !== input.length) {
        throw new Error("Unexpected trailing input");
    }

    return result;
}

app.post('/evaluate', (req, res) => {
    const payload = req.body as EvalPayload;
    try {
        res.send(parse(payload.payload))
    } catch (error) {
        res.send("Error: " + error);
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
