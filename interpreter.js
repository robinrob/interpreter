#!/usr/bin/env node

require(process.env.JS_LIB_HOME + '/log')


function parse(code) {
    // index used to keep track of where in code we are
    var token, symbol_table = {}

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
            s = Object.create(proto_token)
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
    symbol("END")
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


    function word(id) {
        var s = Object.create(proto_token)
        s.id = s.value = id
        return s
    }


    function block() {
        advance("{")
        var a = statements()
        advance("}")
        return a
    }


    function statements() {
        var a = []
        while (token.id !== "}" && token.id !== "END") {
            a.push(statement())
        }
        return a
    }


    function statement() {
        return advance(";")
    }


    function copy(prototype) {
        var copy = {}
        for (var i in prototype) {
            copy[i] = prototype[i]
        }
        return copy
    }


//    function advance(to_token) {
//        var tkn, index, next_char
//
//        if (to_token) {
//            tkn = word("")
//            while (tkn.id !== to_token) {
////                log("tkn.id: " + tkn.id)
////                log("to_token: " + to_token)
//                tkn = advance()
//            }
//        }
//        else {
//            index = 0
//            tkn = word(code.substr(index++, 1))
//            next_char = code.substr(index, 1)
//
//            while (!symbol_table[tkn.id] && !symbol_table[next_char] && index < code.length) {
//                tkn = word(tkn.id + code.substr(index++, 1))
//                next_char = code.substr(index, 1)
//            }
//        }
//        if (symbol_table[tkn.id]) {
//            tkn = symbol_table[tkn.id]
////            log("tkn.id: " + tkn.id)
//        }
//        else {
////            logo(tkn)
//        }
//        token = tkn
//        code = code.substr(index)
//        return tkn
//    }


    function advance(to_char) {
        var index = 0, str = "", this_char = code.substr(index++, 1)

        while (this_char !== to_char && index < code.length) {
            str += this_char
            this_char = code.substr(index++)
        }

        code = code.substr(index)

        return str
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


//    logo(symbol_table)


//    var js = ""

//    advance()
//    while (token.value !== "END") {
//        js += token.value
//        advance()
//    }
//    return js
    function js(statements) {
        js = ""
        for (var i in statements) {
            js += statements[i].value
        }
        return js
    }

    return js(statements())
}



log(parse('if;else;END'))