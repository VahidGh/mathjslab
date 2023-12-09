parser grammar MathJSLabParser;

options { tokenVocab=MathJSLabLexer; }

@header {
    import * as AST from './AST';
}

/**
 * ## References
 * * https://www.mathworks.com/help/matlab/matlab_prog/operator-precedence.html
 */

input returns [node: AST.NodeInput]
    : EOF{
        localctx.node = null;
    }
    | simple_list EOF {
        localctx.node = localctx.simple_list().node;
    }
    ;

// Statements and statement lists

simple_list returns [node: AST.NodeInput]
    locals [i: number = 0]
    : sep_no_nl? statement {
        localctx.node = AST.nodeListFirst(localctx.statement(localctx.i).node);
    } (sep_no_nl statement{ localctx.i++; localctx.node = AST.appendNodeList(localctx.node, localctx.statement(localctx.i).node)} )* sep_no_nl?
    ;

list returns [node: AST.NodeInput]
    locals [i: number = 0]
    : statement {
        localctx.node = AST.nodeListFirst(localctx.statement(localctx.i).node);
    } (sep statement { localctx.i++; localctx.node = AST.appendNodeList(localctx.node, localctx.statement(localctx.i).node)} )* sep?
    ;

statement returns [node: AST.NodeInput]
    : expression {
        localctx.node = localctx.expression().node;
    }
    | command {
        localctx.node = localctx.command().node;
    }
    | word_list_cmd {
        localctx.node = localctx.word_list_cmd().node;
    }
    ;

// Word-list command
// These are not really like expressions since they can't appear on
// the RHS of an assignment. But they are also not like commands (IF,
// WHILE, etc.

word_list_cmd returns [node: AST.NodeInput]
    locals [i: number = 0]
    : identifier (string {
        if (localctx.i === 0) {
            localctx.node = AST.nodeListFirst(AST.removeQuotes(localctx.string_(localctx.i).node));
        } else {
            AST.appendNodeList(localctx.node, AST.removeQuotes(localctx.string_(localctx.i).node));
        }
        localctx.i++;
    })* {
        localctx.node = AST.nodeCmdWList(localctx.identifier().node, localctx.node);
    }
    ;

// Expressions

identifier returns [node: AST.NodeInput]
    : IDENTIFIER {
        localctx.node = AST.nodeIdentifier(localctx.IDENTIFIER().getText());
    }
    ;

string returns [node: AST.NodeInput]
    : STRING {
        localctx.node = AST.nodeString(localctx.STRING().getText());
    }
    ;

number returns [node: AST.NodeInput]
    : DECIMAL_NUMBER {
        localctx.node = AST.nodeNumber(localctx.DECIMAL_NUMBER().getText());
    }
    ;

magic_end returns [node: AST.NodeInput]
    : ENDRANGE {
        localctx.node = AST.nodeLiteral('ENDRANGE');
    }
    ;

constant returns [node: AST.NodeInput]
    : number {
        localctx.node = localctx.number_().node;
    }
    | string {
        localctx.node = localctx.string_().node
    }
    | magic_end {
        localctx.node = localctx.magic_end().node;
    }
    ;

matrix returns [node: AST.NodeInput]
    locals [i: number = 0]
    : LBRACKET RBRACKET {
        localctx.node = AST.emptyArray();
    }
    | LBRACKET matrix_row {
        localctx.node = AST.nodeFirstRow(localctx.matrix_row(localctx.i).node);
        localctx.i++;
    } (SEMICOLON matrix_row {
        localctx.node = AST.nodeAppendRow(localctx.node, localctx.matrix_row(localctx.i).node);
        localctx.i++;
    })* RBRACKET
    ;

matrix_row returns [node: AST.NodeInput]
    : COMMA {
        localctx.node = null;
    }
    | COMMA? arg_list COMMA? {
        localctx.node = localctx.arg_list().node;
    }
    ;

primary_expr returns [node: AST.NodeInput]
    : identifier {
        localctx.node = localctx.identifier().node;
    }
    | constant {
        localctx.node = localctx.constant().node;
    }
    | matrix {
        localctx.node = localctx.matrix().node;
    }
    | LPAREN expression RPAREN {
        localctx.node = AST.nodeOp('()', localctx.expression().node);
    }
    ;

magic_colon returns [node: AST.NodeInput]
    : COLON {
        localctx.node = AST.nodeLiteral(':');
    }
    ;

magic_tilde returns [node: AST.NodeInput]
    : TILDE {
        localctx.node = AST.nodeLiteral('<~>');
    }
    ;

arg_list returns [node: AST.NodeInput]
    : expression
        { localctx.node = AST.nodeListFirst(localctx.expression().node); }
    | magic_colon
        { localctx.node = AST.nodeListFirst(localctx.magic_colon().node); }
    | magic_tilde
        { localctx.node = AST.nodeListFirst(localctx.magic_tilde().node); }
    | arg_list COMMA magic_colon
        { localctx.node = AST.appendNodeList(localctx.arg_list().node, localctx.magic_colon().node)}
    | arg_list COMMA magic_tilde
        { localctx.node = AST.appendNodeList(localctx.arg_list().node, localctx.magic_tilde().node)}
    | arg_list COMMA expression
        { localctx.node = AST.appendNodeList(localctx.arg_list().node, localctx.expression().node)}
    ;

oper_expr returns [node: AST.NodeInput]
    : primary_expr {
        localctx.node = localctx.primary_expr().node;
    }
    | oper_expr op = (PLUS_PLUS | MINUS_MINUS) {
        localctx.node = AST.nodeOp('_' + localctx._op.text as AST.TOperator, localctx.oper_expr(0).node);
    }
    | oper_expr LPAREN RPAREN {
        localctx.node = AST.nodeArgExpr(localctx.oper_expr(0).node);
    }
    | oper_expr LPAREN arg_list RPAREN {
        localctx.node = AST.nodeArgExpr(localctx.oper_expr(0).node, localctx.arg_list().node);
    }
    | oper_expr op = (TRANSPOSE | HERMITIAN) {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.oper_expr(0).node);
    }
    | <assoc=right> oper_expr op = (POW | EPOW) power_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.oper_expr(0).node, localctx.power_expr().node);
    }
    | op = (PLUS | MINUS) oper_expr {
        localctx.node = AST.nodeOp(localctx._op.text + '_' as AST.TOperator, localctx.oper_expr(0).node);
    }
    | op = (TILDE | EXCLAMATION) oper_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.oper_expr(0).node);
    }
    | oper_expr op = (MUL | DIV | LEFTDIV | EMUL | EDIV | ELEFTDIV) oper_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
    }
    | oper_expr op = (PLUS | MINUS) oper_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.oper_expr(0).node, localctx.oper_expr(1).node);
    }
    ;

power_expr returns [node: AST.NodeInput]
    : primary_expr {
        localctx.node = localctx.primary_expr().node;
    }
    | power_expr op = (PLUS_PLUS | MINUS_MINUS) {
        localctx.node = AST.nodeOp('_' + localctx._op.text as AST.TOperator, localctx.power_expr().node);
    }
    | power_expr LPAREN RPAREN {
        localctx.node = AST.nodeArgExpr(localctx.power_expr().node);
    }
    | power_expr LPAREN arg_list RPAREN {
        localctx.node = AST.nodeArgExpr(localctx.power_expr().node, localctx.arg_list().node);
    }
    | op = (PLUS_PLUS | MINUS_MINUS) power_expr {
        localctx.node = AST.nodeOp(localctx._op.text + '_' as AST.TOperator, localctx.power_expr().node);
    }
    | op = (PLUS | MINUS | TILDE | EXCLAMATION) power_expr {
        localctx.node = AST.nodeOp(localctx._op.text + '_' as AST.TOperator, localctx.power_expr().node);
    }
    ;

colon_expr returns [node: AST.NodeInput]
    : oper_expr COLON oper_expr {
        localctx.node = AST.nodeRange(localctx.oper_expr(0).node, localctx.oper_expr(1).node);
    }
    | oper_expr COLON oper_expr COLON oper_expr {
        localctx.node = AST.nodeRange(localctx.oper_expr(0).node, localctx.oper_expr(1).node, localctx.oper_expr(2).node);
    }
    ;

simple_expr returns [node: AST.NodeInput]
    : oper_expr {
        localctx.node = localctx.oper_expr().node;
    }
    | colon_expr {
        localctx.node = localctx.colon_expr().node;
    }
    | simple_expr op = (EXPR_LT | EXPR_LE | EXPR_GT | EXPR_GE | EXPR_EQ | EXPR_NE) simple_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    | simple_expr op = EXPR_AND simple_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    | simple_expr op = EXPR_OR simple_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    | simple_expr op = EXPR_AND_AND simple_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    | simple_expr op = EXPR_OR_OR simple_expr {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.simple_expr(0).node, localctx.simple_expr(1).node);
    }
    ;

expression returns [node: AST.NodeInput]
    : simple_expr {
        localctx.node = localctx.simple_expr().node;
    }
    | simple_expr op = (EQ | ADD_EQ | SUB_EQ | MUL_EQ | EMUL_EQ | DIV_EQ | EDIV_EQ | LEFTDIV_EQ | ELEFTDIV_EQ | POW_EQ | EPOW_EQ | AND_EQ | OR_EQ) expression {
        localctx.node = AST.nodeOp(localctx._op.text as AST.TOperator, localctx.simple_expr().node, localctx.expression().node);
    }
    ;

// Commands, declarations, and function definitions

command returns [node: AST.NodeInput]
    : select_command {
        localctx.node = localctx.select_command().node;
    }
    ;

// Selection statements

select_command returns [node: AST.NodeInput]
    : if_command {
        localctx.node = localctx.if_command().node;
    }
    ;

// If statement

if_command returns [node: AST.NodeInput]
    : IF expression sep? list? elseif_clause* else_clause? (END | ENDIF)
    ;

elseif_clause returns [node: AST.NodeInput]
    : ELSEIF sep? expression sep? list?
    ;

else_clause returns [node: AST.NodeInput]
    : ELSE sep? list?
    ;

sep_no_nl
    : (COMMA | SEMICOLON)+
    ;

nl
    : NEWLINE+
    ;

sep
    : (COMMA | SEMICOLON | NEWLINE)+
    ;
