#!/usr/bin/env node


function parse(code) {
    // index used to keep track of where in code we are
    var token, index, symbol_table = {}


    var proto_token = {
        led: function () {
            this.error("Missing operator.")
        },

        nud: function () {
            this.error("Undefined.")
        },

        error: function (msg) {
            console.log(msg)
        },

        lbp: 0
    }

    function symbol(id, bp) {
        var s = symbol_table[id]

        var bp = bp || 0

        if (s) {
            if (bp >= s.lbp) {
                s.lbp = bp
            }
        } else {
            s = Object.create(token)
            s.id = s.value = id
            s.lbp = bp
            symbol_table[id] = s
        }

        return s
    }


    symbol(":")
    symbol(";")
    symbol(",")
    symbol(")")
    symbol("]")
    symbol("}")
    symbol("else")
    // used to represent end of program
    symbol("(end)")
    // used to represent any kind of word
    symbol("(word)")


    function infix(id, bp, led) {
        var s = symbol(id, bp)
        s.led = led || function (left) {
            this.first = left
            this.second = expression(bp)
            this.arity = "binary"
            return this
        }
        return s
    }


    infix("+")
    infix("-")
    infix("*")
    infix("/")
    infix("===")
    infix("!==")
    infix("<")
    infix("<=")
    infix(">")
    infix(">=")
    infix("?", 20, function (left) {
        this.first = left
        this.second = expression(0)
        advance(":")
        this.third = expression(0)
        this.arity = "ternary"
        return this
    })


    function infixr(id, bp, led) {
        var s = symbol(id, bp)
        s.led = led || function (left) {
            this.first = left
            this.second = expression(bp - 1)
            this.arity = "binary"
            return this
        }
        return s
    }


    function assignment(id) {
        return infixr(id, 10, function (left) {
            if (left.id !== "." &&
                left.id !== "[" &&
                left.arity !== "name") {
                left.error("Bad left-value.")
            }
            this.first = left
            this.second = expression(9)
            this.assignment = true
            this.arity = "binary"
            return this
        })
    }


    assignment("=")
    assignment("+=")
    assignment("-=")


    function prefix(id, nud) {
        var s = symbol(id)
        s.nud = nud || function () {
            this.first = expression(80)
            this.arity = "unary"
            return s
        }
    }

    prefix("+")
    prefix("-")
    prefix("!")
    prefix("typeof")


    function block() {
        advance("{")
        var a = statements()
        advance("}")
        return a
    }


    function statements() {
        var a = [], s
        while (token.id !== "}" && token.id !== "(end)") {
            a.push(statement())
        }
        return a
    }


    function statement() {
        // Read statement
    }


    function advance() {
        token = "something"
    }


    function stmt(id, f) {
        var s = symbol(id)
        s.fud = f
        return s
    }


    stmt("if", function () {
        advance('(')
        this.first = expression(0)
        advance(')')
        this.second = block()
        if (token.id === 'else') {
            advance('else')
            this.third = (token.id === 'if' ? statement() : block())
        }
        this.arity = "statement"
        return this
    })


    function expression(rbp) {
        var left, t = token
        advance()
        left = t.nud()
        while (rbp < token.lbp) {
            t = token
            advance()
            left = t.led(left)
        }
        return left
    }
}


parse('robin')