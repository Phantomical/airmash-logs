
use std::vec::Vec;
use std::collections::HashMap;
use std::mem;

use lexer::*;

#[derive(Clone, Debug)]
pub enum RecordValue<'a> {
	Str(&'a str),
	Int(i64),
	Num(f64),
	Array(Vec<RecordValue<'a>>)
}

#[derive(Debug)]
pub struct Record<'a> {
	pub tag: &'a str,
	pub entries: HashMap<&'a str, RecordValue<'a>>
}

#[derive(Debug)]
pub struct ParseError {
	pub message: String
}

impl ParseError {
	pub fn new(s: String) -> Self {
		Self { message: s }
	}
}

struct TokenIterator<'a, I>
	where I: Iterator<Item = Token<'a>>
{
	pub current: Token<'a>,
	pub next: Token<'a>,

	it: I
}

impl<'a, I> TokenIterator<'a, I> 
	where I: Iterator<Item = Token<'a>>
{
	pub fn new(it: I) -> Self {
		let mut t = Self {
			current: Token::EOL,
			next: Token::EOL,
			it
		};

		t.step();
		t.step();

		t
	}

	pub fn step(&mut self) {
		self.current = mem::replace(&mut self.next, Token::EOL);

		if let Some(tok) = self.it.next() {
			self.next = tok;
		}
		else {
			self.next = Token::EOL;
		}
	}
}

fn parse_string<'a>(s: &'a str) -> RecordValue<'a> {
	RecordValue::Str(s)
} 

fn parse_ident<'a, I>(it: &mut TokenIterator<'a, I>) -> Result<&'a str, ParseError>
	where I: Iterator<Item = Token<'a>>
{
	let val = try!(match it.current {
		Token::Ident(strval) => Ok(strval),
		_ => Err(ParseError::new(format!("Expected ident, found {:?}", it.current)))
	});

	it.step();

	return Ok(val);
}
fn parse_array<'a, I>(it: &mut TokenIterator<'a, I>) -> Result<Vec<RecordValue<'a>>, ParseError> 
	where I: Iterator<Item = Token<'a>>
{
	let mut values: Vec<RecordValue<'a>> = vec![];

	while it.current != Token::RBrace {
		values.push(try!(parse_value(it)));

		if it.current != Token::Comma && it.current != Token::RBrace {
			return Err(ParseError::new(format!("Found: {:?}", it.current)));
		}
		else if it.current == Token::Comma {
			it.step();
		}
	}

	it.step();
	return Ok(values);
}
fn parse_value<'a, I>(it: &mut TokenIterator<'a, I>) -> Result<RecordValue<'a>, ParseError>
	where I: Iterator<Item = Token<'a>>
{
	let tok = mem::replace(&mut it.current, Token::EOL);
	it.step();

	match tok {
		Token::Str(s) => Ok(parse_string(s)),
		Token::Num(v) => Ok(RecordValue::Num(v)),
		Token::LBrace => Ok(RecordValue::Array(try!(parse_array(it)))),
		Token::Int(v) => Ok(RecordValue::Int(v)),
		_ => Err(ParseError::new(format!("Found: {:?}", tok)))
	}
}
fn parse_entry<'a, I>(it: &mut TokenIterator<'a, I>) -> Result<(&'a str, RecordValue<'a>), ParseError>
	where I: Iterator<Item = Token<'a>>
{
	let name = try!(parse_ident(it));

	if it.current != Token::Colon {
		return Err(ParseError::new(format!("Found: {:?}", it.current)));
	}
	it.step();

	let value = try!(parse_value(it));

	return Ok((name, value));
}
fn parse_record<'a, I>(it: &mut TokenIterator<'a, I>) -> Result<Record<'a>, ParseError> 
	where I: Iterator<Item = Token<'a>>
{
	if it.current != Token::LBrace {
		return Err(ParseError::new(format!("Found: {:?}", it.current)));
	}
	it.step();

	let tag = try!(parse_ident(it));
	let mut entries = HashMap::new();

	while it.current == Token::Comma {
		it.step();
		let (name, value) = try!(parse_entry(it));

		entries.insert(name, value);
	}

	it.step();

	Ok(Record {
		tag,
		entries
	})

}

pub fn parse<'a>(s: &'a str) -> Result<Record<'a>, ParseError> {
	let mut it = TokenIterator::new(lex(s).into_iter());

	return parse_record(&mut it);
}