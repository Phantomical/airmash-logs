
use std::vec::Vec;

use regex::*;

#[derive(Debug, Clone, PartialEq)]
pub enum Token<'a> {
	LBrace,
	RBrace,
	Comma,
	Colon,
	Ident(&'a str),
	Num(f64),
	Str(&'a str),
	Int(i64),
	EOL
}

lazy_static! {
	static ref IDENT: Regex = Regex::new(r#"^[A-Za-z_][A-Za-z_0-9]*"#).unwrap();
	static ref NUM: Regex = Regex::new(r#"^-?[0-9]+\.[0-9]+"#).unwrap();
	static ref INT: Regex = Regex::new(r#"^-?[0-9]+"#).unwrap();
	static ref STR: Regex = Regex::new(r#"^"(\\\\|\\"|[^"])*""#).unwrap();
}

pub fn lex<'a>(s: &'a str) -> Vec<Token<'a>> {
	let mut tokens: Vec<Token<'a>> = vec![];
	let mut pos = 0;
	
	while pos < s.len() {
		let byte = s.bytes().nth(pos).unwrap();
		if byte < 128 {
			let tok = match byte as char {
				'[' => Some(Token::LBrace),
				']' => Some(Token::RBrace),
				',' => Some(Token::Comma),
				':' => Some(Token::Colon),
				_ => None
			};

			if tok.is_some() {
				tokens.push(tok.unwrap());
				pos += 1;
				continue;
			}
		}

		if let Some(mat) = IDENT.find(&s[pos..]) {
			tokens.push(Token::Ident(&s[pos+mat.start()..pos+mat.end()]));
			pos += mat.end();
		}
		else if let Some(mat) = NUM.find(&s[pos..]) {
			tokens.push(Token::Num(s[pos+mat.start()..pos+mat.end()].parse().unwrap()));
			pos += mat.end();
		}
		else if let Some(mat) = INT.find(&s[pos..]) {
			tokens.push(Token::Int(s[pos+mat.start()..pos+mat.end()].parse().unwrap()));
			pos += mat.end();
		}
		else if let Some(mat) = STR.find(&s[pos..]) {
			tokens.push(Token::Str(&s[pos+mat.start()+1..pos+mat.end()-1]));
			pos += mat.end();
		}
		else {
			pos += 1;
		}
	}

	tokens.push(Token::EOL);

	return tokens;
}
