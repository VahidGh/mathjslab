/**
 * MATLAB®/Octave like syntax parser
 *
 * This file defines a parser for a subset of MATLAB®/Octave syntax.
 * Semantic actions is provided by Evaluator class defined in Evaluator.ts
 * file.
 *
 * The parser access methods in Evaluator class using EvaluatorPointer global
 * variable (global.EvaluatorPointer) defined in parser body.
 *
 * This code is build by Jison parser generator:
 * https://gerhobbelt.github.io/jison/
 *
 * This parser was coded based on the GNU Octave lexical analyzer and parser:
 * * https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/lex.ll
 * * https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/oct-parse.yy
 */

/* lexical scanner */
%lex
%options flex

D       [0-9]
D_      [0-9_]
S       [ \t]
NL      ((\n)|(\r)|(\r\n))
CCHAR   [#%]
IDENT   ([_a-zA-Z][_a-zA-Z0-9]*)
FQIDENT ({IDENT}({S}*\.{S}*{IDENT})*)

DECIMAL_DIGITS ({D}{D_}*)
EXPONENT       ([DdEe][\+\-]?{DECIMAL_DIGITS})
REAL_DECIMAL   ((({DECIMAL_DIGITS}\.?)|({DECIMAL_DIGITS}?\.{DECIMAL_DIGITS})){EXPONENT}?)
IMAG_DECIMAL   ({REAL_DECIMAL}[IiJj])
DECIMAL_NUMBER ({REAL_DECIMAL}[iIjJ]?)

SIZE_SUFFIX        ([su](8|16|32|64))
BINARY_BITS        (0[bB][01][01_]*)
BINARY_NUMBER      ({BINARY_BITS}|{BINARY_BITS}{SIZE_SUFFIX})
HEXADECIMAL_BITS   (0[xX][0-9a-fA-F][0-9a-fA-F_]*)
HEXADECIMAL_NUMBER ({HEXADECIMAL_BITS}|{HEXADECIMAL_BITS}{SIZE_SUFFIX})

ANY_EXCEPT_NL    [^\r\n]
ANY_INCLUDING_NL (.|{NL})

ANY_EXCEPT_S_NL [^\ \r\n]

STRING (\'[^\']*\'|\"[^\"]*\")

%s MATRIX_START
%x BLOCK_COMMENT_START
%x FQIDENT_AS_STRING

%%




{CCHAR}.*$        {
        /* Skip comment line tail. */
}




{DECIMAL_NUMBER}        {
        // console.log('NUMBER', previous_token, yylineno);
        previous_token = 'NUMBER';
        return 'NUMBER';
}




<FQIDENT_AS_STRING>{S}+        {
        /* skip whitespace */
}
<FQIDENT_AS_STRING>{CCHAR}.*$        {
        /* skip comment */
        this.popState();
}
<FQIDENT_AS_STRING>{NL}+        {
        /* skip newlines */
        this.popState();
}
<FQIDENT_AS_STRING><<EOF>>        {
        this.popState();
        previous_token = 'END_OF_INPUT';
        return 'END_OF_INPUT';
}
<FQIDENT_AS_STRING>{ANY_EXCEPT_S_NL}+       {
        previous_token = 'STRING';
        return 'STRING';
}




{FQIDENT}        {
    const ident = this.match.replace(/[ \t]/, '');
    let i = keywordsTable.indexOf(ident);
	if (i >= 0) {
		if (keywordsTable[i] === 'end') {
            if (paren_count > 0) {
                // console.log('ENDRANGE', previous_token);
                previous_token = 'ENDRANGE';
                return 'ENDRANGE';
            } else {
                // console.log('END', previous_token);
                previous_token = 'END';
                return 'END';
            }
		}
        else if (keywordsTable[i].substring(0,3) === 'end') {
            // console.log('END', previous_token);
            previous_token = 'END';
            return 'END';
        }
		else if (keywordsTable[i] === 'unwind_protect') {
            previous_token = 'UNWIND';
            return 'UNWIND';
		}
		else if (keywordsTable[i] === 'unwind_protect_cleanup') {
            previous_token = 'CLEANUP';
            return 'CLEANUP';
		}
		else {
            switch (keywordsTable[i]) {
                case 'if':
                    emit_nl = true;
                    break;
            }
            // console.log('IF', previous_token);
			previous_token = keywordsTable[i].toUpperCase();
            return previous_token;
		}
	}
	i = commandsTable.indexOf(ident);
	if (i >= 0) {
		this.pushState('FQIDENT_AS_STRING');
	}
    // console.log('NAME', previous_token);
	previous_token = 'NAME';
    return 'NAME';
}




{STRING}        {
        // console.log('STRING', previous_token);
        previous_token = 'STRING';
        return 'STRING';
}

^{S}*{CCHAR}\{{S}*{NL}        {
        this.pushState('BLOCK_COMMENT_START');
}
<BLOCK_COMMENT_START>^{S}*{CCHAR}\}{S}*{NL}        {
        this.popState();
}
<BLOCK_COMMENT_START>{ANY_EXCEPT_NL}*{NL}        {
        /* Skip block comment line. */
}




'['      {
        // console.log('[', previous_token);
        this.pushState('MATRIX_START');
        matrix_context.push('[');
        previous_token = '[';
        return '[';
}
<MATRIX_START>']'        {
        // console.log(']', previous_token);
        this.popState();
        matrix_context.pop();
        previous_token = ']';
        return ']';
}
<MATRIX_START>{S}+|'...'{ANY_EXCEPT_NL}*{NL}        {
    if (previous_token !== '[' && previous_token !== ',' && previous_token !== ';' && matrix_context[matrix_context.length - 1] !== '(') {
        // console.log(',S', previous_token);
        previous_token = ',';
        return ',';
    }
}
<MATRIX_START>{NL}        {
    if (previous_token !== '[' && previous_token !== ',' && previous_token !== ';' && matrix_context[matrix_context.length - 1] !== '(') {
        // console.log(',NL', previous_token);
        previous_token = ';';
        return ';';
    }
}
<MATRIX_START>','        {
        // console.log(',', previous_token);
        previous_token = ',';
        return ',';
}
<MATRIX_START>';'        {
        // console.log(';', previous_token);
        previous_token = ';';
        return ';';
}
<MATRIX_START>'('        {
        // console.log('(', previous_token);
        matrix_context.push('(');
        paren_count++;
        previous_token = '(';
        return '(';
}
<MATRIX_START>')'        {
        // console.log(')', previous_token);
        matrix_context.pop();
        paren_count--;
        previous_token = ')';
        return ')';
}




{S}+       {
        /* Skip whitespace. */
}

{NL}       {
        /* Skip line break if emit_nl is false, otherwise return '\n'. */
        if (emit_nl) {
            // console.log('NL', previous_token);
            emit_nl = false;
            previous_token = '\n';
            return '\n';
        }
}



\(        {
        paren_count++;
        previous_token = '(';
        return '(';
}
\)        {
        paren_count--;
        previous_token = ')';
        return ')';
}

'.*'|'./'|'.\\'|'.^'|'.**'|'**'|"'"|".'"|'<='|'=='|'!='|'~='|'>='|'&&'|'||'|'++'|'--'|'+='|'-='|'*='|'/='|'\\='|'.*='|'./='|'.\\='|'^='|'**='|'.^='|'.**='|'&='|'|='|[\+\-\*\/\^\=\,\;\:\\\&\|\<\>\~\!]          {
        /* Operators. */
        // console.log(this.match, previous_token);
        previous_token = this.match;
        return this.match;
}




<<EOF>>          {
        /* End of input. */
        // console.log('END_OF_INPUT', previous_token);
        previous_token = 'END_OF_INPUT';
        return 'END_OF_INPUT';
};
.             {
        /* Unrecognized input. */
        // console.log('INVALID', previous_token);
        previous_token = 'INVALID';
        return 'INVALID';
}




/lex

/**
 * operator associations and precedence
 * https://www.mathworks.com/help/matlab/matlab_prog/operator-precedence.html
 */
%right '=' '+=' '-=' '*=' '/=' '\\=' '^=' '.*=' './=' '.\\=' '.^=' '.**=' '|=' '&='
%left '||'
%left '&&'
%left '|'
%left '&'
%left '<' '<=' '==' '!=' '~=' '>=' '>'
%left ':'
%left '-' '+'
%left '*' '/' '\\' '.*' './' '.\\'
%right UNARY '~' '!'
%left POW '^' '**' '.^' '.**' "'" ".'"
%right '++' '--'
%left '('
%token INVALID

%{

global.EvaluatorPointer = null;

var previous_token;
var matrix_context = [];
var emit_nl = false;
var paren_count = 0;

/**
 * Language keywords
 */
const keywordsTable = [
	'global',
	'persistent',
	'if',
	'endif',
	'end',
	'elseif',
	'else',
	'switch',
	'endswitch',
	'case',
	'otherwise',
	'while',
	'endwhile',
	'do',
	'until',
	'for',
	'endfor',
	'parfor',
	'endparfor',
	'break',
	'continue',
	'return',
	'function',
	'endfunction',
	'try',
	'catch',
	'end_try_catch',
	'unwind_protect',
	'unwind_protect_cleanup',
	'end_unwind_protect',
	'classdef',
	'endclassdef',
	'enumeration',
	'endenumeration',
	'properties',
	'endproperties',
	'events',
	'endevents',
	'methods',
	'endmethods'
];

/**
 * Word-list commands
 */
global.commandsTable = [];

%}

// Non-terminal start symbol.
%start input

%% /* language grammar */

// ==============================
// Statements and statement lists
// ==============================

input
        : END_OF_INPUT
                {return null;}
        | simple_list END_OF_INPUT
                {return $1;}
        | parse_error
        ;

simple_list
        : opt_sep_no_nl
                {$$ = EvaluatorPointer.nodeListFirst();}
        | simple_list1 opt_sep_no_nl
                {$$ = $1;}
        ;

simple_list1
        : statement
                {$$ = EvaluatorPointer.nodeListFirst($1);}
        | simple_list1 sep_no_nl statement
                {$$ = EvaluatorPointer.nodeList($1,$3);}
        ;

opt_list
        : // empty
                {$$ = EvaluatorPointer.nodeListFirst();}
        | list
                {$$ = $1;}
        ;

list
        : list1 opt_sep
                {$$ = $1;}
        ;

list1
        : statement
                {$$ = EvaluatorPointer.nodeListFirst($1);}
        | list1 sep statement
                {$$ = EvaluatorPointer.nodeList($1,$3);}
        ;


statement
        : expression
        | command
        | word_list_cmd
        ;

// =================
// Word-list command
// =================

// These are not really like expressions since they can't appear on
// the RHS of an assignment.  But they are also not like commands (IF,
// WHILE, etc.

word_list_cmd
        : identifier word_list
                {$$ = EvaluatorPointer.nodeCmdWList($1,$2);}
        ;

word_list
        : string
                {$$ = EvaluatorPointer.nodeListFirst(EvaluatorPointer.removeQuotes($1));}
        | word_list string
                {$$ = EvaluatorPointer.nodeList($1,EvaluatorPointer.removeQuotes($2));}
        ;

// ===========
// Expressions
// ===========

identifier
        : NAME
                {$$ = EvaluatorPointer.nodeName($1);}
        ;

string
        : STRING
                {$$ = EvaluatorPointer.nodeString($1);}
        ;

number
        : NUMBER
                {$$ = EvaluatorPointer.nodeNumber($1);}
        ;

magic_end
        : ENDRANGE
                {$$ = EvaluatorPointer.nodeReserved('ENDRANGE');}
        ;

constant
        : number
        | string
        | magic_end
        ;

matrix
        : '[' ']'
                {$$ = EvaluatorPointer.tensor0x0();}
        | '[' matrix_rows ']'
                {$$ = $2;}
        ;

matrix_rows
        : matrix_row
                {$$ = EvaluatorPointer.nodeFirstRow($1);}
        | matrix_rows ';' matrix_row
                {$$ = EvaluatorPointer.nodeAppendRow($1,$3);}
        ;

matrix_row
        : // empty
                {$$ = null;}
        | ','
                {$$ = null;}
        | arg_list
                {$$ = $1;}
        | arg_list ','
                {$$ = $1;}
        | ',' arg_list
                {$$ = $2;}
        | ',' arg_list ','
                {$$ = $2;}
        ;

primary_expr
        : identifier
                {$$ = $1;}
        | constant
                {$$ = $1;}
        | matrix
                {$$ = $1;}
        | '(' expression ')'
                {$$ = EvaluatorPointer.nodeOp('()', $2);}
        ;

magic_colon
        : ':'
                {$$ = EvaluatorPointer.nodeReserved($1);}
        ;

magic_tilde
        : '~'
                {$$ = EvaluatorPointer.nodeReserved('<~>');}
        ;

arg_list
        : expression
                {$$ = EvaluatorPointer.nodeListFirst($1);}
        | magic_colon
                {$$ = EvaluatorPointer.nodeListFirst($1);}
        | magic_tilde
                {$$ = EvaluatorPointer.nodeListFirst($1);}
        | arg_list ',' magic_colon
                {$$ = EvaluatorPointer.nodeList($1,$3);}
        | arg_list ',' magic_tilde
                {$$ = EvaluatorPointer.nodeList($1,$3);}
        | arg_list ',' expression
                {$$ = EvaluatorPointer.nodeList($1,$3);}
        ;

oper_expr
        : primary_expr
                {$$ = $1;}
        | oper_expr '++'
                {$$ = EvaluatorPointer.nodeOp('_++', $1);}
        | oper_expr '--'
                {$$ = EvaluatorPointer.nodeOp('_--', $1);}
        | oper_expr '(' ')'
                {$$ = EvaluatorPointer.nodeArgExpr($1);}
        | oper_expr '(' arg_list ')'
                {$$ = EvaluatorPointer.nodeArgExpr($1,$3);}
        | oper_expr "'"
                {$$ = EvaluatorPointer.nodeOp($2,$1);}
        | oper_expr ".'"
                {$$ = EvaluatorPointer.nodeOp($2,$1);}
        | '++' oper_expr %prec UNARY
                {$$ = EvaluatorPointer.nodeOp('++_',$2);}
        | '--' oper_expr %prec UNARY
                {$$ = EvaluatorPointer.nodeOp('--_',$2);}
        | '!' oper_expr %prec UNARY
                {$$ = EvaluatorPointer.nodeOp($1,$2);}
        | '~' oper_expr %prec UNARY
                {$$ = EvaluatorPointer.nodeOp($1,$2);}
        | '+' oper_expr %prec UNARY
                {$$ = EvaluatorPointer.nodeOp('+_',$2);}
        | '-' oper_expr %prec UNARY
                {$$ = EvaluatorPointer.nodeOp('-_',$2);}
        | oper_expr '^' power_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '**' power_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '.^' power_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '.**' power_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '+' oper_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '-' oper_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '*' oper_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '.*' oper_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '/' oper_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr './' oper_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '\\' oper_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | oper_expr '.\\' oper_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        ;

power_expr
        : primary_expr
                {$$ = $1;}
        | power_expr '++'
                {$$ = EvaluatorPointer.nodeOp('_++',$1);}
        | power_expr '--'
                {$$ = EvaluatorPointer.nodeOp('_--',$1);}
        | power_expr '(' ')'
                {$$ = EvaluatorPointer.nodeArgExpr($1);}
        | power_expr '(' arg_list ')'
                {$$ = EvaluatorPointer.nodeArgExpr($1,$3);}
        | '++' power_expr %prec POW
                {$$ = EvaluatorPointer.nodeOp('++_',$2);}
        | '--' power_expr %prec POW
                {$$ = EvaluatorPointer.nodeOp('--_',$2);}
        | '!' power_expr %prec POW
                {$$ = EvaluatorPointer.nodeOp($1,$2);}
        | '~' power_expr %prec POW
                {$$ = EvaluatorPointer.nodeOp($1,$2);}
        | '+' power_expr %prec POW
                {$$ = EvaluatorPointer.nodeOp('+_',$2);}
        | '-' power_expr %prec POW
                {$$ = EvaluatorPointer.nodeOp('-_',$2);}
        ;

colon_expr
        : oper_expr ':' oper_expr
                {$$ = EvaluatorPointer.nodeRange($1,$3);}
        | oper_expr ':' oper_expr ':' oper_expr
                {$$ = EvaluatorPointer.nodeRange($1,$3,$5);}
        ;

simple_expr
        : oper_expr
                {$$ = $1;}
        | colon_expr
                {$$ = $1;}
        | simple_expr '<' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '<=' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '==' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '>=' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '>' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '!=' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '~=' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '&' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '|' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '&&' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '||' simple_expr
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        ;

assign_expr
        : simple_expr '=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '+=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '-=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '*=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '/=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '\\=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '^=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '**=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '.*=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr './=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '.\\=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '.^=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '.**=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '&=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        | simple_expr '|=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        ;

expression
        : simple_expr
        | assign_expr
        ;

// ================================================
// Commands, declarations, and function definitions
// ================================================

command
        : declaration
        | select_command
        | loop_command
        | jump_command
        | except_command
        | function
        | file
        ;

// ======================
// Declaration statements
// ======================

declaration
        : GLOBAL decl_init_list
        | PERSISTENT decl_init_list
        ;

decl_init_list
        : decl_elt
                {$$ = EvaluatorPointer.nodeListFirst($1);}
        | decl_init_list decl_elt
                {$$ = EvaluatorPointer.nodeList($1,$2);}
        ;

decl_elt
        : identifier
                {$$ = $1;}
        | identifier '=' expression
                {$$ = EvaluatorPointer.nodeOp($2,$1,$3);}
        ;

// ====================
// Selection statements
// ====================

select_command
        : if_command
        | switch_command
        ;

// ============
// If statement
// ============

if_command
        : IF if_cmd_list END
                {$$ = $2;}
        ;

if_cmd_list
        : if_cmd_list1
        | if_cmd_list1 else_clause
                {$$ = EvaluatorPointer.nodeIfAppendElse($1,$2);}
        ;

if_cmd_list1
        : expression stmt_begin opt_sep opt_list
                {$$ = EvaluatorPointer.nodeIfBegin($1,$4);}
        | if_cmd_list1 elseif_clause
                {$$ = EvaluatorPointer.nodeIfAppendElseIf($1,$2);}
        ;

elseif_clause
        : ELSEIF opt_sep expression stmt_begin opt_sep opt_list
                {$$ = EvaluatorPointer.nodeElseIf($3,$6);}
        ;

else_clause
        : ELSE opt_sep opt_list
                {$$ = EvaluatorPointer.nodeElse($3);}
        ;

// ================
// Switch statement
// ================

switch_command
        : SWITCH expression opt_sep case_list END
        ;

case_list
        : // empty
        | default_case
        | case_list1
        | case_list1 default_case
        ;

case_list1
        : switch_case
        | case_list1 switch_case
        ;

switch_case
        : CASE opt_sep expression stmt_begin opt_sep opt_list
        ;

default_case
        : OTHERWISE opt_sep opt_list
        ;

// =======
// Looping
// =======

loop_command
        : WHILE expression stmt_begin opt_sep opt_list END
        | DO opt_sep opt_list UNTIL expression
        | FOR simple_expr '=' expression stmt_begin opt_sep opt_list END
        | FOR '(' simple_expr '=' expression ')' opt_sep opt_list END
        | PARFOR simple_expr '=' expression stmt_begin opt_sep opt_list END
        | PARFOR '(' simple_expr '=' expression ',' expression ')' opt_sep opt_list END
        ;

// =======
// Jumping
// =======

jump_command
        : BREAK
        | CONTINUE
        | RETURN
        ;

// ==========
// Exceptions
// ==========

except_command
        : UNWIND opt_sep opt_list CLEANUP opt_sep opt_list END
        | TRY opt_sep opt_list CATCH opt_sep opt_list END
        | TRY opt_sep opt_list END
        ;

// =============
// Miscellaneous
// =============

stmt_begin
        : // empty
        ;

anon_fcn_begin
        : // empty
        ;

parse_error
        : INVALID
                {
                        EvaluatorPointer.exitStatus = EvaluatorPointer.response.LEX_ERROR;
                        throw new SyntaxError(`Invalid syntax at line ${yylineno+1}.`);
                }
        | error
                {
                        EvaluatorPointer.exitStatus = EvaluatorPointer.response.PARSER_ERROR;
                        throw new SyntaxError(`Parse error at line ${yylineno+1}.`);
                }
        ;

sep_no_nl
        : ','
        | ';'
        | sep_no_nl ','
        | sep_no_nl ';'
        ;

opt_sep_no_nl
        : // empty
        | sep_no_nl
        ;

opt_nl
        : // empty
        | nl
        ;

nl
        : '\n'
        | nl '\n'
        ;

sep
        : ','
        | ';'
        | '\n'
        | sep ','
        | sep ';'
        | sep '\n'
        ;

opt_sep
        : // empty
        | sep
        ;
